import os
import json
from typing import List, Dict, Any, Optional
from .encryption_service import encryption_service

class PayrollService:
    """Service class for payroll data management with per-user encryption."""
    
    def __init__(self):
        self.base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        self.storage_dir = os.path.join(self.base_dir, "storage")
    
    def _get_user_files(self, username: str) -> tuple:
        """Get file paths for a specific user's payroll data"""
        encrypted_file = os.path.join(self.storage_dir, f"payroll_{username}.encrypted")
        plain_file = os.path.join(self.storage_dir, f"payroll_{username}.json")
        return encrypted_file, plain_file
    
    def load_payroll_employees(self, username: str, password: str) -> List[Dict[str, Any]]:
        """Load payroll employee data for a specific user (decrypted)."""
        try:
            import base64
            from cryptography.hazmat.primitives import hashes
            from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
            from cryptography.hazmat.backends import default_backend
            from cryptography.fernet import Fernet
            
            print(f"Loading payroll employees for user: {username}")
            
            # Try to decrypt from encrypted file
            encrypted_file, plain_file = self._get_user_files(username)
            
            if os.path.exists(encrypted_file):
                # Read encrypted file
                with open(encrypted_file, 'r', encoding='utf-8') as f:
                    encoded = f.read()
                
                # Decode from base64
                combined = base64.b64decode(encoded)
                
                # Extract salt and encrypted data
                salt = combined[:16]
                encrypted_data = combined[16:]
                
                # Derive key from password
                kdf = PBKDF2HMAC(
                    algorithm=hashes.SHA256(),
                    length=32,
                    salt=salt,
                    iterations=100000,
                    backend=default_backend()
                )
                key = base64.urlsafe_b64encode(kdf.derive(password.encode()))
                
                # Create Fernet cipher
                cipher = Fernet(key)
                
                # Decrypt data
                decrypted_bytes = cipher.decrypt(encrypted_data)
                json_str = decrypted_bytes.decode('utf-8')
                
                # Parse JSON
                employees = json.loads(json_str)
                print(f"Decrypted {len(employees)} payroll employees for user: {username}")
                return employees
            elif os.path.exists(plain_file):
                # Fallback to plain file if exists
                with open(plain_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            else:
                # Return empty list for new users
                print(f"No payroll data found for user: {username}, returning empty list")
                return []
        except Exception as e:
            print(f"Error loading payroll employees for {username}: {e}")
            return []
    
    def save_payroll_employees(self, username: str, password: str, employees: List[Dict[str, Any]]) -> bool:
        """Save payroll employee data for a specific user (encrypted)."""
        try:
            print(f"Saving {len(employees)} payroll employees for user: {username}")
            encrypted_file, _ = self._get_user_files(username)
            
            # Convert to JSON string
            json_str = json.dumps(employees, ensure_ascii=False, indent=2)
            
            # Generate salt
            import base64
            salt = os.urandom(16)
            
            # Derive key from password
            from cryptography.hazmat.primitives import hashes
            from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
            from cryptography.hazmat.backends import default_backend
            from cryptography.fernet import Fernet
            
            kdf = PBKDF2HMAC(
                algorithm=hashes.SHA256(),
                length=32,
                salt=salt,
                iterations=100000,
                backend=default_backend()
            )
            key = base64.urlsafe_b64encode(kdf.derive(password.encode()))
            
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
            
            print(f"Payroll data encrypted and saved successfully for user '{username}'")
            return True
            
        except Exception as e:
            print(f"Error saving payroll employees for {username}: {e}")
            return False
    
    def get_payroll_employee_by_id(self, username: str, password: str, employee_id: str) -> Optional[Dict[str, Any]]:
        """Get a specific payroll employee by ID for a user."""
        employees = self.load_payroll_employees(username, password)
        for employee in employees:
            if employee.get("id") == employee_id:
                return employee
        return None
    
    def add_payroll_employee(self, username: str, password: str, employee_data: Dict[str, Any]) -> bool:
        """Add a new payroll employee for a user."""
        employees = self.load_payroll_employees(username, password)
        employees.append(employee_data)
        return self.save_payroll_employees(username, password, employees)
    
    def update_payroll_employee(self, username: str, password: str, employee_id: str, updated_data: Dict[str, Any]) -> bool:
        """Update an existing payroll employee for a user."""
        employees = self.load_payroll_employees(username, password)
        for i, employee in enumerate(employees):
            if employee.get("id") == employee_id:
                employees[i] = {**employee, **updated_data}
                return self.save_payroll_employees(username, password, employees)
        return False
    
    def delete_payroll_employee(self, username: str, password: str, employee_id: str) -> bool:
        """Delete a payroll employee by ID for a user."""
        employees = self.load_payroll_employees(username, password)
        initial_count = len(employees)
        employees = [emp for emp in employees if emp.get("id") != employee_id]
        if len(employees) < initial_count:
            return self.save_payroll_employees(username, password, employees)
        return False
    
    def clear_all_payroll_employees(self, username: str, password: str) -> int:
        """Clear all payroll employees for a user."""
        employees = self.load_payroll_employees(username, password)
        count = len(employees)
        self.save_payroll_employees(username, password, [])
        return count

# Create a singleton instance
payroll_service = PayrollService()

