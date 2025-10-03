"""
Memory storage implementation for salary calculation application.
Replicates the functionality of TypeScript MemStorage from server/storage.ts
"""
import uuid
import json
import os
from typing import Dict, List, Optional
from datetime import datetime

from ..models.schemas import (
    InsertEmployee,
    SelectEmployee,
    EmployeeUpdate,
    SalaryResult
)


class MemStorage:
    """Memory storage implementation for salary calculations and employee data"""
    
    def __init__(self):
        """Initialize storage with empty dictionaries and seed data"""
        self.employees: Dict[str, SelectEmployee] = {}
        self.calculations: List[SalaryResult] = []
        
        # Initialize with sample seed data
        self._initialize_sample_employees()
    
    def _initialize_sample_employees(self):
        """Initialize storage with sample employee from JSON file"""
        # Load sample data from JSON file
        json_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), 'sample_info.json')
        
        try:
            with open(json_path, 'r', encoding='utf-8') as f:
                sample_info = json.load(f)
        except FileNotFoundError:
            print(f"Warning: {json_path} not found, using default values")
            sample_info = {
                "salary": 10000000,
                "bonus": 500000,
                "dependants": 1,
                "personalRelief": 11000000,
                "dependentRelief": 4400000,
                "ot15": 10,
                "ot20": 5,
                "ot30": 2,
                "allowanceTax": 200000,
                "advance": 0
            }
        except json.JSONDecodeError as e:
            print(f"Warning: Error parsing {json_path}: {e}, using default values")
            sample_info = {
                "salary": 10000000,
                "bonus": 500000,
                "dependants": 1,
                "personalRelief": 11000000,
                "dependentRelief": 4400000,
                "ot15": 10,
                "ot20": 5,
                "ot30": 2,
                "allowanceTax": 200000,
                "advance": 0
            }
        
        # Create sample employee with loaded data
        sample_data = [
            {
                "employeeNo": "VIVN-0001",
                "name": "Huỳnh Nguyễn Minh Hoàng",
                "salary": 10000000,
                "bonus": 0,
                "allowanceTax": 200000,
                "ot15": 10,
                "ot20": 5,
                "ot30": 2,
                "dependants": 2,
                "advance": 0,
            }
        ]
        
        for i, data in enumerate(sample_data, 1):
            # Calculate derived values
            aug_salary = round((data["salary"] / 21) * 20)
            overtime_pay_pit = int((aug_salary / 22 / 8) * (data["ot15"] + data["ot20"] + data["ot30"]))
            total_salary = round(aug_salary + data["bonus"] + data["allowanceTax"] + overtime_pay_pit)
            
            personal_relief = 11000000
            dependent_relief = 4400000 * data["dependants"]
            company_insurance = data["salary"] * 0.215  # Company pays 21.5%
            employee_insurance = data["salary"] * 0.105
            union_fee = min(data["salary"] * 0.005, 234000)
            
            he_so = data["ot15"] * 0.5 + data["ot20"] + data["ot30"] * 2
            overtime_pay_non_pit = round((aug_salary / 22 / 8) * he_so)
            
            assessable_income = max(0, total_salary - (employee_insurance + personal_relief + dependent_relief))
            
            # Calculate progressive tax using tax brackets
            tax_brackets = [
                {"limit": 5000000, "rate": 0.05, "deduction": 0},
                {"limit": 10000000, "rate": 0.10, "deduction": 250000},
                {"limit": 18000000, "rate": 0.15, "deduction": 750000},
                {"limit": 32000000, "rate": 0.20, "deduction": 1650000},
                {"limit": 52000000, "rate": 0.25, "deduction": 3250000},
                {"limit": 80000000, "rate": 0.30, "deduction": 5850000},
                {"limit": float('inf'), "rate": 0.35, "deduction": 9850000},
            ]
            
            personal_income_tax = 0
            for bracket in tax_brackets:
                if assessable_income <= bracket["limit"]:
                    personal_income_tax = assessable_income * bracket["rate"] - bracket["deduction"]
                    break
            personal_income_tax = round(max(personal_income_tax, 0))
            
            # Calculate total OT hours (matching the form's calculation)
            total_ot_hours = round(data["ot15"] + data["ot20"] + data["ot30"] + he_so)
            
            total_net_income = round(total_salary - personal_income_tax - employee_insurance - 
                                   union_fee + overtime_pay_non_pit - data["advance"])
            
            # Create employee with all calculated fields
            employee = SelectEmployee(
                id=f"sample-{i:03d}",
                employeeNo=data["employeeNo"],
                name=data["name"],
                augSalary=aug_salary,
                totalOTHours=total_ot_hours,
                totalNetIncome=total_net_income,
                salary=data["salary"],
                bonus=data["bonus"],
                allowanceTax=data["allowanceTax"],
                ot15=data["ot15"],
                ot20=data["ot20"],
                ot30=data["ot30"],
                dependants=data["dependants"],
                advance=data["advance"],
                actualDaysWorked=20,
                totalWorkdays=20,
                overtimePayPIT=overtime_pay_pit,
                totalSalary=total_salary,
                personalRelief=personal_relief,
                dependentRelief=dependent_relief,
                assessableIncome=assessable_income,
                personalIncomeTax=personal_income_tax,
                companyInsurance=company_insurance,
                employeeInsurance=employee_insurance,
                unionFee=union_fee,
                overtimePayNonPIT=overtime_pay_non_pit,
                heSo=he_so,
                calculatedAt=datetime.now().isoformat()
            )
            
            self.employees[employee.id] = employee
    
    # Employee management methods
    def addEmployee(self, employee: InsertEmployee) -> SelectEmployee:
        """Add a new employee to storage"""
        employee_id = uuid.uuid4().hex
        new_employee = SelectEmployee(
            id=employee_id,
            **employee.model_dump()
        )
        self.employees[employee_id] = new_employee
        return new_employee
    
    def getEmployees(self) -> List[SelectEmployee]:
        """Get all employees"""
        return list(self.employees.values())
    
    def getEmployee(self, employee_id: str) -> Optional[SelectEmployee]:
        """Get employee by ID"""
        return self.employees.get(employee_id)
    
    def updateEmployee(self, employee_id: str, data: EmployeeUpdate) -> Optional[SelectEmployee]:
        """Update employee (partial update)"""
        existing = self.employees.get(employee_id)
        if not existing:
            return None
        
        # Only update fields that are provided (not None)
        update_data = data.model_dump(exclude_none=True)
        
        # Create updated employee by merging existing data with updates
        updated_dict = existing.model_dump()
        updated_dict.update(update_data)
        
        updated_employee = SelectEmployee(**updated_dict)
        self.employees[employee_id] = updated_employee
        return updated_employee
    
    def deleteEmployee(self, employee_id: str) -> bool:
        """Delete employee by ID"""
        if employee_id in self.employees:
            del self.employees[employee_id]
            return True
        return False
    
    def clearAllEmployees(self, reinitialize: bool = True) -> int:
        """Clear all employees from storage. 
        
        Args:
            reinitialize: If True, re-initialize with default employee. If False, leave empty.
            
        Returns:
            Count of deleted employees.
        """
        count = len(self.employees)
        self.employees.clear()
        # Re-initialize with default employee if requested (for Reset functionality)
        if reinitialize:
            self._initialize_sample_employees()
        return count
    
    # Calculation management methods
    def addCalculation(self, result: SalaryResult) -> None:
        """Add a new salary calculation result"""
        self.calculations.append(result)
    
    def getCalculations(self) -> List[SalaryResult]:
        """Get all salary calculations"""
        return self.calculations
    
    def getCalculation(self, index: int) -> Optional[SalaryResult]:
        """Get calculation by index (treating as ID for list-based storage)"""
        try:
            idx = int(index)
            if 0 <= idx < len(self.calculations):
                return self.calculations[idx]
        except (ValueError, IndexError):
            pass
        return None
    
    def clearAll(self) -> None:
        """Clear all data from storage"""
        self.employees.clear()
        self.calculations.clear()
        
        # Re-initialize sample employees after clearing
        self._initialize_sample_employees()


# Create singleton instance
storage = MemStorage()