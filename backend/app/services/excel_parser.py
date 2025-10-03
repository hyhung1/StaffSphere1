"""
Excel file parser for employee data import.
Based on the reference abc.py implementation.
"""
import pandas as pd
import io
from typing import List, Dict, Any


def parse_excel_file(file_content: bytes) -> List[Dict[str, Any]]:
    """
    Parse Excel file and extract employee data.
    
    Args:
        file_content: The Excel file content as bytes
    
    Returns:
        List of employee dictionaries ready for database insertion
    """
    # Read Excel file from bytes
    df = pd.read_excel(io.BytesIO(file_content))
    
    # Normalize column headers: merge consecutive spaces and strip (following abc.py pattern)
    df.columns = (
        df.columns.astype(str)
                  .str.replace(r"\s+", " ", regex=True)
                  .str.strip()
    )
    
    # List to store parsed employees
    employees = []
    
    # Process each row
    for idx, row in df.iterrows():
        # Convert idx to int for use in string formatting
        row_num = int(idx) + 1 if isinstance(idx, (int, float)) else 1
        
        # Helper function to safely get values from row
        def safe_get(row, *keys, default=None):
            """Try multiple column names and return the first non-null value."""
            for key in keys:
                value = row.get(key)
                if value is not None and str(value).strip() and str(value) != 'nan':
                    return value
            return default
        
        # Extract only the required fields from Excel row (following abc.py pattern)
        # Map Excel columns to our employee model, handling variations in column names
        employee_data = {
            "employeeNo": str(safe_get(row, "No.", "No", "Employee No", "Employee No.", default=f"EMP-{row_num:03d}")),
            "name": str(safe_get(row, "Name", "Name ", "Employee Name", "Full Name", default=f"Employee {row_num}")),
            "salary": float(safe_get(row, "Salary", "Salary ", "Base Salary", "Basic Salary", default=0) or 0),
            "bonus": float(safe_get(row, "Bonus", "Bonus ", "Bonuses", default=0) or 0),
            "allowanceTax": float(safe_get(row, "Allowance tính thuế", "Allowance", "Allowance Tax", default=0) or 0),
            "ot15": float(safe_get(row, "OT ( 1.5 % )", "OT(1.5%)", "OT 1.5", "OT15", default=0) or 0),
            "ot20": float(safe_get(row, "OT( 2.0%)", "OT(2.0%)", "OT 2.0", "OT20", default=0) or 0),
            "ot30": float(safe_get(row, "OT( 3.0%)", "OT( 3.0%) ", "OT(3.0%)", "OT 3.0", "OT30", default=0) or 0),
            "dependants": float(safe_get(row, "Dependants", "Dependents", "Number of Dependants", default=0) or 0),
            "advance": float(safe_get(row, "Trừ Adv", "Advance", "Adv", "Advances", default=0) or 0),
            # Additional fields from Excel that should be extracted (as per abc.py)
            "personalRelief": float(safe_get(row, "Personal relief", "Personal \nrelief", default=11000000) or 0),
            "dependentRelief": float(safe_get(row, "Dependent relief", "Dependent \nrelief", default=0) or 0),
            # New fields for company insurance and He so coefficient
            "companyInsurance": float(safe_get(row, "Insurance contribution - Company's pay (21.5%)", 
                                              "Company Insurance", "Company's Insurance", default=0) or 0),
            "heSo": float(safe_get(row, "He so", "Heso", "He So", default=0) or 0)
        }
        
        # Add to list if we have at least a name
        if employee_data["name"] and employee_data["name"] != "nan":
            employees.append(employee_data)
    
    return employees