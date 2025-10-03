"""
Pay slip Excel file generator.
Creates personalized pay slip Excel files using the Payslip_sample.xlsx template.
"""
import io
import os
from pathlib import Path
from typing import Dict, Any
from openpyxl import load_workbook
from openpyxl.worksheet.worksheet import Worksheet
import logging
from datetime import datetime

logger = logging.getLogger(__name__)


def generate_payslip_excel(calculation_data: Dict[str, Any]) -> bytes:
    """
    Generate a personalized pay slip Excel file using the template.
    
    Args:
        calculation_data: Dictionary containing all the calculation values from frontend
        
    Returns:
        Bytes content of the Excel file
    """
    try:
        logger.info(f"Starting payslip generation for employee: {calculation_data.get('name', 'Unknown')}")
        
        # Path to the template file - relative to this file's location
        # This file is at: backend/app/services/payslip_excel_generator.py
        # Template is at: backend/templates/Payslip_sample.xlsx
        current_file_dir = Path(__file__).parent  # app/services/
        backend_dir = current_file_dir.parent.parent  # backend/
        template_path = backend_dir / "templates" / "Payslip_sample.xlsx"
        
        logger.info(f"Current file directory: {current_file_dir}")
        logger.info(f"Backend directory: {backend_dir}")
        logger.info(f"Looking for template at: {template_path.absolute()}")
        
        if not template_path.exists():
            logger.error(f"Template file not found at: {template_path.absolute()}")
            # Try alternative paths for debugging
            alt_path1 = Path(os.getcwd()) / "backend" / "templates" / "Payslip_sample.xlsx"
            alt_path2 = Path(os.getcwd()) / "templates" / "Payslip_sample.xlsx"
            logger.error(f"Alternative path 1 exists: {alt_path1.exists()} - {alt_path1.absolute()}")
            logger.error(f"Alternative path 2 exists: {alt_path2.exists()} - {alt_path2.absolute()}")
            raise FileNotFoundError(f"Template file not found: {template_path}")
            
        logger.info("Template file found, loading workbook...")
    except Exception as e:
        logger.error(f"Error in payslip generation setup: {str(e)}")
        raise
    
    # Load the template workbook
    try:
        workbook = load_workbook(template_path)
        worksheet: Worksheet = workbook.active
    except Exception as e:
        logger.error(f"Failed to load workbook: {str(e)}")
        raise
    
    # Extract values from calculation data with defaults
    employee_no = calculation_data.get('employeeNo', '')
    name = calculation_data.get('name', '')
    dependants = calculation_data.get('dependants', 0)
    aug_salary = calculation_data.get('augSalary', 0)  # Day-work salary
    total_salary = calculation_data.get('totalSalary', 0)  # A. Salary and Allowance
    allowance_tax = calculation_data.get('allowanceTax', 0)  # Allowance must pay PIT
    bonus = calculation_data.get('bonus', 0)
    personal_relief = calculation_data.get('personalRelief', 0)
    dependent_relief = calculation_data.get('dependentRelief', 0)
    employee_insurance = calculation_data.get('employeeInsurance', 0)  # D. Insurance contribution
    union_fee = calculation_data.get('unionFee', 0)  # Đoàn phí
    assessable_income = calculation_data.get('assessableIncome', 0)  # E. Assessable income
    personal_income_tax = calculation_data.get('personalIncomeTax', 0)  # F. Personal income tax
    advance = calculation_data.get('advance', 0)  # Trừ Adv
    total_net_income = calculation_data.get('totalNetIncome', 0)  # Net income
    total_ot_hours = calculation_data.get('totalOTHours', 0)  # Total OT hours
    
    # Calculate overtime pay (combined): OT none pay PIT + OT pay PIT
    overtime_pay_pit = calculation_data.get('overtimePayPIT', 0)  # OT pay PIT
    overtime_pay_non_pit = calculation_data.get('overtimePayNonPIT', 0)  # OT none pay PIT
    combined_overtime_pay = overtime_pay_non_pit + overtime_pay_pit  # Over Time = OT none pay PIT + OT pay PIT
    
    # Calculate tax deductions (C. Tax deductions)
    tax_deductions = personal_relief + dependent_relief
    
    # Fill in the Excel cells with values (preserving formatting)
    # Based on the mapping provided by the user
    
    # Employee information
    worksheet['D2'] = employee_no  # employee ID
    worksheet['D3'] = name  # full name
    worksheet['D4'] = dependants  # dependants
    worksheet['D11'] = total_ot_hours  # Total OT hours
    
    # Date information - using the same format as PaySlip component
    # JavaScript equivalent: currentDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }).replace(' ', '-')
    current_date = datetime.now()
    month_year = current_date.strftime("%b-%y")  # Sep-25 format, same as PaySlip
    worksheet['I2'] = month_year  # Current month-year (same format as PaySlip display)
    
    # Income section
    worksheet['G7'] = total_salary  # A. Salary and Allowance (value only, preserve formatting)
    worksheet['I8'] = aug_salary  # Day-work salary
    # G11 - Do not fill any values (as requested)
    worksheet['I11'] = combined_overtime_pay  # Over Time (OT none pay PIT + OT pay PIT)
    worksheet['I12'] = allowance_tax  # Allowance must pay PIT
    worksheet['I13'] = bonus  # Bonus
    worksheet['G24'] = total_salary  # B. Total income (same as A. Salary and Allowance)
    
    # Tax deductions section
    worksheet['G32'] = tax_deductions  # C. Tax deductions
    worksheet['I33'] = personal_relief  # Personal relief
    worksheet['I34'] = dependent_relief  # Dependent relief
    
    # Insurance and deductions
    worksheet['G36'] = employee_insurance  # D. Insurance contribution
    worksheet['G37'] = union_fee  # Đoàn phí
    worksheet['G38'] = assessable_income  # E. Assessable income
    worksheet['G40'] = personal_income_tax  # F. Personal income tax
    worksheet['G41'] = advance  # Trừ Adv
    worksheet['G42'] = total_net_income  # net income
    
    # Save to bytes buffer
    logger.info("Saving workbook to bytes buffer...")
    try:
        output_buffer = io.BytesIO()
        workbook.save(output_buffer)
        output_buffer.seek(0)
        
        result_bytes = output_buffer.getvalue()
        logger.info(f"Generated Excel file successfully, size: {len(result_bytes)} bytes")
        
        return result_bytes
    except Exception as e:
        logger.error(f"Failed to save workbook: {str(e)}")
        raise
