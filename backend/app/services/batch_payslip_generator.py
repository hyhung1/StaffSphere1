"""
Batch pay slip generator service.
Generates multiple pay slip Excel files for all employees.
"""
import io
import zipfile
from typing import List, Dict, Any
from ..models.schemas import SelectEmployee
from .payslip_excel_generator import generate_payslip_excel


def calculate_employee_salary_data(employee: SelectEmployee) -> Dict[str, Any]:
    """
    Calculate complete salary data for an employee (mimics frontend calculation logic).
    
    Args:
        employee: Employee data from database
        
    Returns:
        Dictionary with all calculated salary values
    """
    # Extract employee values
    employee_no = employee.employeeNo
    name = employee.name
    salary = employee.salary
    bonus = employee.bonus
    allowance_tax = employee.allowanceTax
    ot15 = employee.ot15
    ot20 = employee.ot20
    ot30 = employee.ot30
    dependants = employee.dependants
    advance = employee.advance
    actual_days_worked = getattr(employee, 'actualDaysWorked', 20)  # Default to 20 if not provided
    total_workdays = getattr(employee, 'totalWorkdays', 20)  # Default to 20 if not provided
    
    # Calculate derived values using dynamic workdays
    aug_salary = round((salary / total_workdays) * actual_days_worked)
    overtime_pay_pit = int((aug_salary / 22 / 8) * (ot15 + ot20 + ot30))  # Math.floor equivalent
    personal_relief = 11000000  # Default value
    dependent_relief = 4400000 * dependants
    employee_insurance = salary * 0.105
    union_fee = min(salary * 0.005, 234000)
    heso_coeff = ot15 * 0.5 + ot20 + ot30 * 2
    overtime_pay_non_pit = round((aug_salary / 22 / 8) * heso_coeff)
    
    # A. Salary and Allowance = Day-work salary + Over Time + Allowance must pay PIT + Bonus
    total_overtime_pay = overtime_pay_pit + overtime_pay_non_pit
    total_salary = round(aug_salary + total_overtime_pay + allowance_tax + bonus)
    assessable_income = max(0, total_salary - (employee_insurance + personal_relief + dependent_relief))
    
    # Calculate progressive tax
    TAX_BRACKETS = [
        {"limit": 5000000, "rate": 0.05, "deduction": 0},
        {"limit": 10000000, "rate": 0.10, "deduction": 250000},
        {"limit": 18000000, "rate": 0.15, "deduction": 750000},
        {"limit": 32000000, "rate": 0.20, "deduction": 1650000},
        {"limit": 52000000, "rate": 0.25, "deduction": 3250000},
        {"limit": 80000000, "rate": 0.30, "deduction": 5850000},
        {"limit": float('inf'), "rate": 0.35, "deduction": 9850000},
    ]
    
    pit = 0
    for bracket in TAX_BRACKETS:
        if assessable_income <= bracket["limit"]:
            pit = assessable_income * bracket["rate"] - bracket["deduction"]
            break
    personal_income_tax = round(max(pit, 0))
    
    # Total OT hours calculation (matching frontend)
    total_ot_hours = round(ot15 + ot20 + ot30 + ot15 * 0.5 + ot20 + ot30 * 2)
    total_net_income = round(total_salary - personal_income_tax - employee_insurance - union_fee + overtime_pay_non_pit - advance)
    
    return {
        "employeeNo": employee_no,
        "name": name,
        "salary": salary,
        "bonus": bonus,
        "allowanceTax": allowance_tax,
        "ot15": ot15,
        "ot20": ot20,
        "ot30": ot30,
        "dependants": dependants,
        "advance": advance,
        "actualDaysWorked": actual_days_worked,
        "totalWorkdays": total_workdays,
        "augSalary": aug_salary,
        "overtimePayPIT": overtime_pay_pit,
        "totalSalary": total_salary,
        "personalRelief": personal_relief,
        "dependentRelief": dependent_relief,
        "assessableIncome": assessable_income,
        "personalIncomeTax": personal_income_tax,
        "employeeInsurance": employee_insurance,
        "unionFee": union_fee,
        "overtimePayNonPIT": overtime_pay_non_pit,
        "totalOTHours": total_ot_hours,
        "totalNetIncome": total_net_income,
    }


def generate_batch_payslip_zip(employees: List[SelectEmployee]) -> bytes:
    """
    Generate a ZIP file containing Excel pay slips for all employees.
    
    Args:
        employees: List of employees to generate pay slips for
        
    Returns:
        Bytes content of the ZIP file
    """
    if not employees:
        raise ValueError("No employees provided for batch generation")
    
    # Create ZIP buffer
    zip_buffer = io.BytesIO()
    
    with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
        for employee in employees:
            try:
                # Calculate salary data for this employee
                calculation_data = calculate_employee_salary_data(employee)
                
                # Generate Excel file for this employee
                excel_bytes = generate_payslip_excel(calculation_data)
                
                # Create safe filename
                import unicodedata
                import re
                ascii_name = unicodedata.normalize('NFKD', employee.name)
                ascii_name = ''.join(c for c in ascii_name if not unicodedata.combining(c))
                safe_name = re.sub(r'[^\w\s-]', '', ascii_name).strip()
                safe_name = re.sub(r'[-\s]+', '_', safe_name)
                filename = f"Payslip_{safe_name}_{employee.employeeNo}.xlsx"
                
                # Add Excel file to ZIP
                zip_file.writestr(filename, excel_bytes)
                
            except Exception as e:
                # Log error but continue with other employees
                print(f"Failed to generate pay slip for {employee.name} ({employee.employeeNo}): {str(e)}")
                continue
    
    zip_buffer.seek(0)
    return zip_buffer.getvalue()
