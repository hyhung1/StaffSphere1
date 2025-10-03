import os
import json
from typing import List, Dict, Any, Optional
from .encryption_service import encryption_service

class EmployeeService:
    """Service class for employee data management with per-user encryption."""
    
    def __init__(self):
        self.base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        self.storage_dir = os.path.join(self.base_dir, "storage")
    
    def load_employees(self, username: str, password: str) -> List[Dict[str, Any]]:
        """Load employee data for a specific user (decrypted)."""
        try:
            print(f"Loading employees for user: {username}")
            employees = encryption_service.decrypt_data(username, password)
            if employees is None:
                print(f"No encrypted data found for user: {username}")
                return []
            return employees
        except Exception as e:
            print(f"Error loading employees for {username}: {e}")
            return []
    
    def save_employees(self, username: str, password: str, employees: List[Dict[str, Any]]) -> bool:
        """Save employee data for a specific user (encrypted)."""
        try:
            print(f"Saving {len(employees)} employees for user: {username}")
            success = encryption_service.save_encrypted_data(username, employees, password)
            if success:
                print(f"Successfully saved employees for {username}")
            return success
        except Exception as e:
            print(f"Error saving employees for {username}: {e}")
            return False
    
    def get_employee_by_id(self, username: str, password: str, employee_id: str) -> Optional[Dict[str, Any]]:
        """Get a specific employee by ID for a user."""
        employees = self.load_employees(username, password)
        for employee in employees:
            if employee.get("employeeNo") == employee_id:
                return employee
        return None
    
    def add_employee(self, username: str, password: str, employee_data: Dict[str, Any]) -> bool:
        """Add a new employee for a user."""
        employees = self.load_employees(username, password)
        employees.append(employee_data)
        return self.save_employees(username, password, employees)
    
    def update_employee(self, username: str, password: str, employee_id: str, updated_data: Dict[str, Any]) -> bool:
        """Update an existing employee for a user."""
        employees = self.load_employees(username, password)
        for i, employee in enumerate(employees):
            if employee.get("employeeNo") == employee_id:
                employees[i] = {**employee, **updated_data}
                return self.save_employees(username, password, employees)
        return False
    
    def delete_employee(self, username: str, password: str, employee_id: str) -> bool:
        """Delete an employee by ID for a user."""
        employees = self.load_employees(username, password)
        employees = [emp for emp in employees if emp.get("employeeNo") != employee_id]
        return self.save_employees(username, password, employees)

# Create a singleton instance
employee_service = EmployeeService()
