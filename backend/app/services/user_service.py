"""
User account management service for authentication and password recovery
"""
import os
import json
import hashlib
import base64
from typing import Optional, Dict, Any, List
from datetime import datetime
from cryptography.fernet import Fernet
from .encryption_service import encryption_service


class UserService:
    """Service for managing user accounts with encrypted PII"""
    
    def __init__(self):
        self.base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        self.users_file = os.path.join(self.base_dir, "storage", "user_accounts.json")
        
        # System-level encryption key for username/email (not user-specific)
        # In production, this should be in environment variable
        self.system_key = self._get_or_create_system_key()
        self.cipher = Fernet(self.system_key)
    
    def _get_or_create_system_key(self) -> bytes:
        """Get or create system-level encryption key"""
        key_file = os.path.join(self.base_dir, "storage", ".system_key")
        
        if os.path.exists(key_file):
            with open(key_file, 'rb') as f:
                return f.read()
        else:
            # Generate new key
            key = Fernet.generate_key()
            with open(key_file, 'wb') as f:
                f.write(key)
            # Make file read-only
            try:
                os.chmod(key_file, 0o400)  # Read-only for owner
            except Exception:
                pass  # Windows may not support chmod
            return key
    
    def _encrypt_field(self, value: str) -> str:
        """Encrypt a field value for storage"""
        encrypted = self.cipher.encrypt(value.encode('utf-8'))
        return base64.b64encode(encrypted).decode('utf-8')
    
    def _decrypt_field(self, encrypted_value: str) -> str:
        """Decrypt a field value from storage"""
        try:
            encrypted_bytes = base64.b64decode(encrypted_value)
            decrypted = self.cipher.decrypt(encrypted_bytes)
            return decrypted.decode('utf-8')
        except Exception as e:
            print(f"Error decrypting field: {e}")
            return ""
    
    def _hash_password(self, password: str, salt: bytes = None) -> tuple[str, str]:
        """
        Hash password using PBKDF2-HMAC-SHA256
        Returns: (hashed_password_base64, salt_base64)
        """
        if salt is None:
            salt = os.urandom(32)  # 32 bytes salt
        
        # Use PBKDF2 with 100,000 iterations (same as encryption service)
        pwd_hash = hashlib.pbkdf2_hmac(
            'sha256',
            password.encode('utf-8'),
            salt,
            100000  # iterations
        )
        
        # Return base64 encoded strings for JSON storage
        return (
            base64.b64encode(pwd_hash).decode('utf-8'),
            base64.b64encode(salt).decode('utf-8')
        )
    
    def _verify_password(self, password: str, hashed_password: str, salt: str) -> bool:
        """
        Verify password against stored hash
        """
        try:
            # Decode salt from base64
            salt_bytes = base64.b64decode(salt)
            
            # Hash the provided password with the stored salt
            new_hash, _ = self._hash_password(password, salt_bytes)
            
            # Compare hashes
            return new_hash == hashed_password
        except Exception as e:
            print(f"Error verifying password: {e}")
            return False
    
    def _load_users(self, decrypt_pii: bool = True) -> List[Dict[str, Any]]:
        """
        Load all user accounts
        If decrypt_pii=True, decrypts username and email for use in code
        """
        try:
            if os.path.exists(self.users_file):
                with open(self.users_file, 'r', encoding='utf-8') as f:
                    users = json.load(f)
                
                if decrypt_pii:
                    # Decrypt username and email for each user
                    for user in users:
                        if 'username_encrypted' in user:
                            user['username'] = self._decrypt_field(user['username_encrypted'])
                        if 'email_encrypted' in user:
                            user['email'] = self._decrypt_field(user['email_encrypted'])
                
                return users
            return []
        except Exception as e:
            print(f"Error loading users: {e}")
            return []
    
    def _save_users(self, users: List[Dict[str, Any]]) -> bool:
        """
        Save user accounts with encrypted PII
        Encrypts username and email before saving
        """
        try:
            # Create a deep copy to avoid modifying the original
            users_to_save = []
            
            for user in users:
                user_copy = user.copy()
                
                # Encrypt username if present
                if 'username' in user_copy:
                    user_copy['username_encrypted'] = self._encrypt_field(user_copy['username'])
                    del user_copy['username']  # Remove plain text
                
                # Encrypt email if present
                if 'email' in user_copy:
                    user_copy['email_encrypted'] = self._encrypt_field(user_copy['email'])
                    del user_copy['email']  # Remove plain text
                
                users_to_save.append(user_copy)
            
            with open(self.users_file, 'w', encoding='utf-8') as f:
                json.dump(users_to_save, f, ensure_ascii=False, indent=2)
            return True
        except Exception as e:
            print(f"Error saving users: {e}")
            return False
    
    def register_user(self, username: str, password: str, email: str, full_name: str) -> Dict[str, Any]:
        """
        Register a new user with hashed password
        Returns: {"success": bool, "message": str, "user": dict}
        """
        users = self._load_users()
        
        # Check if username already exists
        if any(u['username'] == username for u in users):
            return {
                "success": False,
                "message": "Username already exists",
                "user": None
            }
        
        # Check if email already exists
        if any(u['email'] == email for u in users):
            return {
                "success": False,
                "message": "Email already registered",
                "user": None
            }
        
        # Hash the password
        hashed_password, salt = self._hash_password(password)
        
        # Create new user with hashed password
        new_user = {
            "id": str(len(users) + 1),
            "username": username,
            "password_hash": hashed_password,  # Hashed password
            "password_salt": salt,  # Salt for verification
            "email": email,
            "fullName": full_name,
            "role": "User",
            "createdAt": datetime.now().isoformat()
        }
        
        # Remove old 'password' field if migrating
        if 'password' in new_user:
            del new_user['password']
        
        users.append(new_user)
        
        if self._save_users(users):
            # Initialize empty encrypted database for new user
            try:
                encryption_service.encrypt_data(username, password, data=[])
                print(f"Created empty encrypted database for user: {username}")
            except Exception as e:
                print(f"Warning: Failed to create encrypted database for {username}: {e}")
            
            return {
                "success": True,
                "message": "User registered successfully",
                "user": {
                    "id": new_user["id"],
                    "username": new_user["username"],
                    "email": new_user["email"],
                    "fullName": new_user["fullName"],
                    "role": new_user["role"]
                }
            }
        else:
            return {
                "success": False,
                "message": "Failed to save user",
                "user": None
            }
    
    def authenticate_user(self, username: str, password: str) -> Optional[Dict[str, Any]]:
        """
        Authenticate user with username and password
        Supports both hashed passwords (new) and plain text (legacy, for migration)
        Returns user info if successful, None otherwise
        """
        users = self._load_users()
        
        for user in users:
            if user['username'] != username:
                continue
            
            # Check if user has hashed password (new format)
            if 'password_hash' in user and 'password_salt' in user:
                # Verify hashed password
                if self._verify_password(password, user['password_hash'], user['password_salt']):
                    return {
                        "id": user["id"],
                        "username": user["username"],
                        "email": user["email"],
                        "fullName": user["fullName"],
                        "role": user.get("role", "User")
                    }
            # Legacy: Check plain text password (for backward compatibility)
            elif 'password' in user and user['password'] == password:
                print(f"⚠️ Warning: User '{username}' still using plain text password. Consider migrating.")
                return {
                    "id": user["id"],
                    "username": user["username"],
                    "email": user["email"],
                    "fullName": user["fullName"],
                    "role": user.get("role", "User")
                }
        
        return None
    
    def recover_password(self, email: str, username: str) -> Dict[str, Any]:
        """
        Recover password by verifying email and username
        Note: With hashed passwords, we can only return the password for legacy plain-text accounts.
        For hashed passwords, this returns a message that password recovery is not available.
        Returns: {"success": bool, "message": str, "credentials": dict}
        """
        users = self._load_users()
        
        for user in users:
            if user['email'] == email and user['username'] == username:
                # Check if user has hashed password (new format)
                if 'password_hash' in user:
                    return {
                        "success": True,
                        "message": "Account found. Your password is securely hashed and cannot be recovered. Please contact your administrator for password reset.",
                        "credentials": {
                            "username": user["username"],
                            "password": "***HASHED***",  # Cannot show hashed password
                            "email": user["email"],
                            "fullName": user["fullName"],
                            "note": "Password is securely hashed and cannot be displayed"
                        }
                    }
                # Legacy: Return plain text password if still stored (for migration period)
                elif 'password' in user:
                    print(f"⚠️ Warning: Returning plain text password for '{username}'. Migrate this user!")
                    return {
                        "success": True,
                        "message": "Account found",
                        "credentials": {
                            "username": user["username"],
                            "password": user["password"],
                            "email": user["email"],
                            "fullName": user["fullName"]
                        }
                    }
        
        return {
            "success": False,
            "message": "No account found with the provided email and username",
            "credentials": None
        }
    
    def get_user_by_username(self, username: str) -> Optional[Dict[str, Any]]:
        """Get user information by username"""
        users = self._load_users()
        
        for user in users:
            if user['username'] == username:
                return {
                    "id": user["id"],
                    "username": user["username"],
                    "email": user["email"],
                    "fullName": user["fullName"],
                    "role": user.get("role", "User")
                }
        
        return None
    
    def reset_user_password(self, username: str, new_password: str) -> Dict[str, Any]:
        """
        Reset a user's password (admin function)
        Returns: {"success": bool, "message": str}
        """
        users = self._load_users()
        
        for user in users:
            if user['username'] == username:
                # Hash the new password
                hashed_password, salt = self._hash_password(new_password)
                
                # Update user with new hashed password
                user['password_hash'] = hashed_password
                user['password_salt'] = salt
                
                # Remove old password field if it exists
                if 'password' in user:
                    del user['password']
                
                if self._save_users(users):
                    print(f"[OK] Password reset for user: {username}")
                    return {
                        "success": True,
                        "message": f"Password successfully reset for user '{username}'",
                        "username": username
                    }
                else:
                    return {
                        "success": False,
                        "message": "Failed to save updated password"
                    }
        
        return {
            "success": False,
            "message": f"User '{username}' not found"
        }
    
    def change_password(self, username: str, old_password: str, new_password: str) -> Dict[str, Any]:
        """
        Change user's own password (requires current password)
        Returns: {"success": bool, "message": str}
        """
        # First authenticate with old password
        user = self.authenticate_user(username, old_password)
        if not user:
            return {
                "success": False,
                "message": "Current password is incorrect"
            }
        
        # Now reset to new password
        return self.reset_user_password(username, new_password)
    
    def migrate_passwords_to_hashed(self) -> Dict[str, Any]:
        """
        Migrate all plain text passwords to hashed passwords
        Also encrypts username and email for PII protection
        This is a one-time migration function
        Returns: {"success": bool, "message": str, "migrated_count": int}
        """
        users = self._load_users(decrypt_pii=True)  # Load with decrypted PII
        migrated_count = 0
        
        for user in users:
            # Check if user still has plain text password
            if 'password' in user and 'password_hash' not in user:
                plain_password = user['password']
                
                # Hash the password
                hashed_password, salt = self._hash_password(plain_password)
                
                # Update user with hashed password
                user['password_hash'] = hashed_password
                user['password_salt'] = salt
                
                # Remove plain text password
                del user['password']
                
                migrated_count += 1
                print(f"[OK] Migrated password for user: {user.get('username', 'Unknown')}")
        
        # Save will automatically encrypt username and email
        if migrated_count > 0 or any('username' in u and 'username_encrypted' not in u for u in users):
            if self._save_users(users):
                return {
                    "success": True,
                    "message": f"Successfully migrated {migrated_count} user(s) to hashed passwords and encrypted PII",
                    "migrated_count": migrated_count
                }
            else:
                return {
                    "success": False,
                    "message": "Failed to save migrated users",
                    "migrated_count": 0
                }
        else:
            return {
                "success": True,
                "message": "No users need migration. All passwords are already hashed and PII encrypted.",
                "migrated_count": 0
            }


# Create singleton instance
user_service = UserService()

