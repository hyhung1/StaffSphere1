"""
Salary calculation service that matches the JavaScript implementation.
Uses custom rounding to match JavaScript Math.round() behavior.
"""
from typing import Union
from datetime import datetime
from ..models.schemas import SalaryInput, SalaryResult


# Vietnamese tax brackets for 2024
TAX_BRACKETS = [
    {"limit": 5_000_000, "rate": 0.05, "deduction": 0},
    {"limit": 10_000_000, "rate": 0.10, "deduction": 250_000},
    {"limit": 18_000_000, "rate": 0.15, "deduction": 750_000},
    {"limit": 32_000_000, "rate": 0.20, "deduction": 1_650_000},
    {"limit": 52_000_000, "rate": 0.25, "deduction": 3_250_000},
    {"limit": 80_000_000, "rate": 0.30, "deduction": 5_850_000},
    {"limit": float('inf'), "rate": 0.35, "deduction": 9_850_000},
]


def js_round(x: Union[int, float]) -> int:
    """
    Replicate JavaScript's Math.round() behavior.
    JavaScript rounds 0.5 up to the nearest integer.
    """
    if x >= 0:
        return int(x + 0.5)
    else:
        # For negative numbers, JavaScript rounds -2.5 to -2
        return int(x - 0.5) if x != int(x) else int(x)


def js_floor(x: Union[int, float]) -> int:
    """
    Replicate JavaScript's Math.floor() behavior.
    Returns the largest integer less than or equal to x.
    """
    return int(x) if x >= 0 or x == int(x) else int(x) - 1


def calculate_salary(input_data: SalaryInput) -> SalaryResult:
    """
    Calculate salary based on Vietnamese tax laws and regulations.
    
    Args:
        input_data: SalaryInput model with employee salary information
        
    Returns:
        SalaryResult model with calculated salary components
    """
    # Extract input values
    employee_no = input_data.employeeNo
    name = input_data.name
    salary = input_data.salary
    bonus = input_data.bonus
    allowance_tax = input_data.allowanceTax
    ot15 = input_data.ot15
    ot20 = input_data.ot20
    ot30 = input_data.ot30
    dependants = input_data.dependants
    advance = input_data.advance
    actual_days_worked = getattr(input_data, 'actualDaysWorked', 20)  # Default to 20 if not provided
    total_workdays = getattr(input_data, 'totalWorkdays', 20)  # Default to 20 if not provided
    
    # Constants
    personal_relief = 11_000_000
    dependent_relief_rate = 4_400_000
    
    # Calculations using dynamic workdays
    aug_salary = (salary / total_workdays) * actual_days_worked
    overtime_pay_pit = js_floor((aug_salary / 22 / 8) * (ot15 + ot20 + ot30))
    total_salary = js_round(aug_salary + bonus + allowance_tax + overtime_pay_pit)
    dependent_relief = dependent_relief_rate * dependants
    company_insurance = salary * 0.215  # Company pays 21.5%
    employee_insurance = salary * 0.105
    union_fee = min(salary * 0.005, 234_000)
    he_so = ot15 * 0.5 + ot20 + ot30 * 2  # He so coefficient
    overtime_pay_non_pit = js_round((aug_salary / 22 / 8) * he_so)
    assessable_income = max(0, total_salary - (employee_insurance + personal_relief + dependent_relief))
    
    # Calculate progressive tax
    personal_income_tax = 0
    for bracket in TAX_BRACKETS:
        if assessable_income <= bracket["limit"]:
            personal_income_tax = assessable_income * bracket["rate"] - bracket["deduction"]
            break
    personal_income_tax = js_round(max(personal_income_tax, 0))
    
    total_net_income = js_round(
        total_salary - personal_income_tax - employee_insurance - union_fee + overtime_pay_non_pit - advance
    )
    
    # Correct formula: ot15 + ot20 + ot30 + ot15*0.5 + ot20 + ot30*2
    # Which equals: ot15*1.5 + ot20*2 + ot30*3
    # Or using he_so: ot15 + ot20 + ot30 + he_so
    total_ot_hours = ot15 + ot20 + ot30 + he_so
    
    return SalaryResult(
        employeeNo=employee_no,
        name=name,
        salary=salary,
        bonus=bonus,
        allowanceTax=allowance_tax,
        ot15=ot15,
        ot20=ot20,
        ot30=ot30,
        dependants=dependants,
        advance=advance,
        actualDaysWorked=actual_days_worked,
        totalWorkdays=total_workdays,
        augSalary=js_round(aug_salary),
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
        totalOTHours=total_ot_hours,
        totalNetIncome=total_net_income,
        calculatedAt=datetime.utcnow().isoformat() + "Z",
    )