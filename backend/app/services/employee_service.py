import os
import json
from typing import List, Dict, Any

class EmployeeService:
    """Service class for employee data management."""
    
    def __init__(self):
        self.base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        self.json_path = os.path.join(self.base_dir, "storage", "nhan_vien.json")
    
    def load_employees(self) -> List[Dict[str, Any]]:
        """Load employee data from JSON file."""
        try:
            print(f"Loading employees from: {self.json_path}")
            with open(self.json_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            return data
        except FileNotFoundError:
            print(f"Employee data file not found at: {self.json_path}")
            return []
        except json.JSONDecodeError as e:
            print(f"Error parsing JSON file: {e}")
            return []
    
    def save_employees(self, employees: List[Dict[str, Any]]) -> bool:
        """Save employee data to JSON file."""
        try:
            with open(self.json_path, "w", encoding="utf-8") as f:
                json.dump(employees, f, ensure_ascii=False, indent=2)
            return True
        except Exception as e:
            print(f"Error saving employees: {e}")
            return False
    
    def get_employee_by_id(self, employee_id: str) -> Dict[str, Any] | None:
        """Get a specific employee by ID."""
        employees = self.load_employees()
        for employee in employees:
            if employee.get("employeeNo") == employee_id:
                return employee
        return None
    
    def add_employee(self, employee_data: Dict[str, Any]) -> bool:
        """Add a new employee."""
        employees = self.load_employees()
        employees.append(employee_data)
        return self.save_employees(employees)
    
    def update_employee(self, employee_id: str, updated_data: Dict[str, Any]) -> bool:
        """Update an existing employee."""
        employees = self.load_employees()
        for i, employee in enumerate(employees):
            if employee.get("employeeNo") == employee_id:
                employees[i] = {**employee, **updated_data}
                return self.save_employees(employees)
        return False
    
    def delete_employee(self, employee_id: str) -> bool:
        """Delete an employee by ID."""
        employees = self.load_employees()
        employees = [emp for emp in employees if emp.get("employeeNo") != employee_id]
        return self.save_employees(employees)

# Create a singleton instance
employee_service = EmployeeService()
