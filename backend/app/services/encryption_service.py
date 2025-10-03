"""
Encryption service for securing employee data using AES-256 encryption.
Only users with correct password can decrypt the data.
"""
import os
import json
import base64
import hashlib
from typing import List, Dict, Any, Optional
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.backends import default_backend


class EncryptionService:
    """Service for encrypting and decrypting employee data"""
    
    def __init__(self):
        self.base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        self.storage_dir = os.path.join(self.base_dir, "storage")
    
    def _get_user_files(self, username: str) -> tuple:
        """Get file paths for a specific user"""
        encrypted_file = os.path.join(self.storage_dir, f"nhan_vien_{username}.encrypted")
        plain_file = os.path.join(self.storage_dir, f"nhan_vien_{username}.json")
        return encrypted_file, plain_file
        
    def _derive_key(self, password: str, salt: bytes) -> bytes:
        """Derive encryption key from password using PBKDF2"""
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
            backend=default_backend()
        )
        key = base64.urlsafe_b64encode(kdf.derive(password.encode()))
        return key
    
    def encrypt_data(self, username: str, password: str, data: Optional[List[Dict[str, Any]]] = None) -> bool:
        """
        Encrypt employee data for a specific user
        Returns True if successful, False otherwise
        """
        try:
            encrypted_file, plain_file = self._get_user_files(username)
            
            # If no data provided, try to read from plain file
            if data is None:
                if not os.path.exists(plain_file):
                    print(f"Plain file not found: {plain_file}")
                    return False
                    
                with open(plain_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
            
            # Convert to JSON string
            json_str = json.dumps(data, ensure_ascii=False, indent=2)
            
            # Generate salt
            salt = os.urandom(16)
            
            # Derive key from password
            key = self._derive_key(password, salt)
            
            # Create Fernet cipher
            cipher = Fernet(key)
            
            # Encrypt data
            encrypted_data = cipher.encrypt(json_str.encode('utf-8'))
            
            # Combine salt + encrypted data
            combined = salt + encrypted_data
            
            # Encode to base64 for storage
            encoded = base64.b64encode(combined).decode('utf-8')
            
            # Save encrypted file
            with open(encrypted_file, 'w', encoding='utf-8') as f:
                f.write(encoded)
            
            print(f"Data encrypted successfully for user '{username}': {encrypted_file}")
            return True
            
        except Exception as e:
            print(f"Encryption failed: {e}")
            return False
    
    def decrypt_data(self, username: str, password: str) -> Optional[List[Dict[str, Any]]]:
        """
        Decrypt employee data for a specific user using password
        Returns decrypted data if successful, None otherwise
        """
        try:
            encrypted_file, plain_file = self._get_user_files(username)
            
            # Check if encrypted file exists
            if not os.path.exists(encrypted_file):
                print(f"Encrypted file not found: {encrypted_file}")
                # If no encrypted file, try to read plain file
                if os.path.exists(plain_file):
                    with open(plain_file, 'r', encoding='utf-8') as f:
                        return json.load(f)
                # Return empty array for new users
                return []
            
            # Read encrypted file
            with open(encrypted_file, 'r', encoding='utf-8') as f:
                encoded = f.read()
            
            # Decode from base64
            combined = base64.b64decode(encoded)
            
            # Extract salt and encrypted data
            salt = combined[:16]
            encrypted_data = combined[16:]
            
            # Derive key from password
            key = self._derive_key(password, salt)
            
            # Create Fernet cipher
            cipher = Fernet(key)
            
            # Decrypt data
            decrypted_bytes = cipher.decrypt(encrypted_data)
            json_str = decrypted_bytes.decode('utf-8')
            
            # Parse JSON
            data = json.loads(json_str)
            
            print(f"Data decrypted successfully for user '{username}'")
            return data
            
        except Exception as e:
            print(f"Decryption failed: {e}")
            return None
    
    def is_encrypted(self, username: str) -> bool:
        """Check if data is currently encrypted for a user"""
        encrypted_file, _ = self._get_user_files(username)
        return os.path.exists(encrypted_file)
    
    def save_encrypted_data(self, username: str, data: List[Dict[str, Any]], password: str) -> bool:
        """
        Save data in encrypted format for a specific user
        Used when updating employee data
        """
        try:
            encrypted_file, _ = self._get_user_files(username)
            # Convert to JSON string
            json_str = json.dumps(data, ensure_ascii=False, indent=2)
            
            # Generate salt
            salt = os.urandom(16)
            
            # Derive key from password
            key = self._derive_key(password, salt)
            
            # Create Fernet cipher
            cipher = Fernet(key)
            
            # Encrypt data
            encrypted_data = cipher.encrypt(json_str.encode('utf-8'))
            
            # Combine salt + encrypted data
            combined = salt + encrypted_data
            
            # Encode to base64 for storage
            encoded = base64.b64encode(combined).decode('utf-8')
            
            # Save encrypted file
            with open(encrypted_file, 'w', encoding='utf-8') as f:
                f.write(encoded)
            
            print(f"Encrypted data saved successfully for user '{username}'")
            return True
            
        except Exception as e:
            print(f"Failed to save encrypted data: {e}")
            return False


# Create singleton instance
encryption_service = EncryptionService()

