"""
FastAPI routes for salary calculation application.
Implements all endpoints matching the Express TypeScript backend.
"""
import csv
import io
import os
import json
from typing import List, Optional
import pandas as pd
from datetime import datetime
from openpyxl import Workbook

from fastapi import APIRouter, HTTPException, Response, UploadFile, File, Header
from fastapi.responses import StreamingResponse
from typing import Annotated

from ..models.schemas import (
    SalaryInput,
    SalaryResult,
    InsertEmployee,
    SelectEmployee,
    EmployeeUpdate,
    TaxBracket,
    EmployeeSphere,
    EmployeeCreate,
    EmployeeFilter
)
from ..services.calculator import calculate_salary
from ..services.excel_parser import parse_excel_file
from ..services.payslip_excel_generator import generate_payslip_excel
from ..services.batch_payslip_generator import generate_batch_payslip_zip
from ..services.excel_exporter import export_employees_to_excel
from ..services.employee_service import employee_service
from ..services.user_service import user_service
from ..services.encryption_service import encryption_service
from ..services.payroll_service import payroll_service
from ..storage.mem import storage
from pydantic import BaseModel, EmailStr

# Create router with /api prefix
router = APIRouter(prefix="/api")

# Vietnamese tax brackets for 2024 (for reference endpoint)
TAX_BRACKETS = [
    TaxBracket(limit=5_000_000, rate=0.05, deduction=0),
    TaxBracket(limit=10_000_000, rate=0.10, deduction=250_000),
    TaxBracket(limit=18_000_000, rate=0.15, deduction=750_000),
    TaxBracket(limit=32_000_000, rate=0.20, deduction=1_650_000),
    TaxBracket(limit=52_000_000, rate=0.25, deduction=3_250_000),
    TaxBracket(limit=80_000_000, rate=0.30, deduction=5_850_000),
    TaxBracket(limit=999_999_999_999, rate=0.35, deduction=9_850_000),  # Max value instead of inf
]


# ============ Salary Calculation Endpoints ============

@router.post("/salary/calculate", response_model=SalaryResult)
async def calculate_salary_endpoint(input_data: SalaryInput):
    """
    Calculate salary based on Vietnamese tax laws and regulations.
    
    Args:
        input_data: Salary calculation input with employee information
        
    Returns:
        SalaryResult with all calculated components
        
    Raises:
        HTTPException: If validation fails
    """
    try:
        # Calculate salary using the service
        result = calculate_salary(input_data)
        
        # Save calculation to storage
        storage.addCalculation(result)
        
        return result
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail={"message": "Invalid input data", "errors": [str(e)]}
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={"message": "Failed to calculate salary", "errors": [str(e)]}
        )


@router.get("/salary/calculations", response_model=List[SalaryResult])
async def get_all_calculations():
    """
    Get all stored salary calculations.
    
    Returns:
        List of all salary calculation results
    """
    try:
        calculations = storage.getCalculations()
        return calculations
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={"message": "Failed to retrieve calculations", "errors": [str(e)]}
        )


@router.get("/salary/export")
async def export_calculations_csv():
    """
    Export all salary calculations as CSV file.
    
    Returns:
        CSV file with salary calculation data
    """
    try:
        # Get all employees from storage
        employees = storage.getEmployees()
        
        if not employees:
            # Return empty CSV with headers only
            output = io.StringIO()
            writer = csv.writer(output)
            writer.writerow(["Employee No", "Name", "Aug's Salary", "Total OT Hours", "Total Net Income"])
            output.seek(0)
            
            return StreamingResponse(
                io.BytesIO(output.getvalue().encode('utf-8-sig')),
                media_type='text/csv',
                headers={
                    'Content-Disposition': 'attachment; filename="salary_calculations.csv"'
                }
            )
        
        # Create CSV in memory
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Write headers
        writer.writerow(["Employee No", "Name", "Aug's Salary", "Total OT Hours", "Total Net Income"])
        
        # Write employee data
        for employee in employees:
            writer.writerow([
                employee.employeeNo,
                employee.name,
                employee.augSalary,
                employee.totalOTHours,
                employee.totalNetIncome
            ])
        
        # Reset stream position
        output.seek(0)
        
        # Return CSV response with UTF-8 BOM for Excel compatibility
        return StreamingResponse(
            io.BytesIO(output.getvalue().encode('utf-8-sig')),
            media_type='text/csv',
            headers={
                'Content-Disposition': 'attachment; filename="salary_calculations.csv"'
            }
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={"message": "Failed to export calculations", "errors": [str(e)]}
        )


@router.get("/salary/tax-brackets", response_model=List[TaxBracket])
async def get_tax_brackets():
    """
    Get Vietnamese tax brackets for reference.
    
    Returns:
        List of tax brackets with limits, rates, and deductions
    """
    return TAX_BRACKETS


# ============ Payroll Employee Management Endpoints (User-Specific Encrypted Storage) ============

@router.get("/payroll/employees", response_model=List[SelectEmployee])
async def get_payroll_employees(
    x_username: Annotated[str | None, Header()] = None,
    x_password: Annotated[str | None, Header()] = None
):
    """
    Get all employees from payroll storage for authenticated user.
    
    Returns:
        List of all payroll employees for the authenticated user
    """
    if not x_username or not x_password:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    try:
        employees = payroll_service.load_payroll_employees(x_username, x_password)
        # Convert dict to SelectEmployee models
        return [SelectEmployee(**emp) for emp in employees]
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={"message": "Failed to retrieve payroll employees", "errors": [str(e)]}
        )


@router.post("/payroll/employees", response_model=SelectEmployee, status_code=201)
async def create_payroll_employee(
    employee_data: InsertEmployee,
    x_username: Annotated[str | None, Header()] = None,
    x_password: Annotated[str | None, Header()] = None
):
    """
    Create a new employee in payroll storage for authenticated user.
    
    Args:
        employee_data: Employee data to save
        
    Returns:
        Created employee with generated ID
        
    Raises:
        HTTPException: If validation fails
    """
    if not x_username or not x_password:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    try:
        import uuid
        # Generate unique ID
        employee_id = uuid.uuid4().hex
        new_employee_dict = {
            "id": employee_id,
            **employee_data.model_dump()
        }
        
        # Save to user-specific encrypted storage
        success = payroll_service.add_payroll_employee(x_username, x_password, new_employee_dict)
        if not success:
            raise HTTPException(status_code=500, detail="Failed to save employee")
        
        return SelectEmployee(**new_employee_dict)
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail={"message": "Invalid employee data", "errors": [str(e)]}
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={"message": "Failed to create employee", "errors": [str(e)]}
        )


@router.get("/payroll/employees/export-excel")
async def export_payroll_employees_excel(
    x_username: Annotated[str | None, Header()] = None,
    x_password: Annotated[str | None, Header()] = None
):
    """
    Export all payroll employees as Excel file for authenticated user.
    
    Returns:
        Excel file with all employee data formatted for Vietnamese salary calculations
    """
    from datetime import datetime
    
    if not x_username or not x_password:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    try:
        # Get all employees from user-specific payroll storage
        employees_dict = payroll_service.load_payroll_employees(x_username, x_password)
        
        if not employees_dict:
            raise HTTPException(
                status_code=404,
                detail={"message": "No employees to export"}
            )
        
        # Convert to SelectEmployee models
        employees = [SelectEmployee(**emp) for emp in employees_dict]
        
        # Generate Excel file
        excel_content = export_employees_to_excel(employees)
        
        # Create filename with date only
        date_str = datetime.now().strftime("%Y%m%d")
        filename = f"Payroll_{date_str}.xlsx"
        
        # Return Excel file as streaming response (no local saving)
        return StreamingResponse(
            io.BytesIO(excel_content),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={
                "Content-Disposition": f"attachment; filename={filename}"
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={"message": f"Failed to export employees to Excel: {str(e)}"}
        )


@router.get("/payroll/employees/export-json")
async def export_payroll_employees_json(
    x_username: Annotated[str | None, Header()] = None,
    x_password: Annotated[str | None, Header()] = None
):
    """
    Export all payroll employees as JSON for authenticated user.
    
    Returns:
        JSON file with all employee data formatted for Vietnamese salary calculations
    """
    import json
    from datetime import datetime
    
    if not x_username or not x_password:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    try:
        # Get all employees from user-specific payroll storage
        employees_dict = payroll_service.load_payroll_employees(x_username, x_password)
        
        if not employees_dict:
            return {
                "success": False,
                "message": "No employees to export",
                "data": []
            }
        
        # Convert to SelectEmployee models
        employees = [SelectEmployee(**emp) for emp in employees_dict]
        
        # Format each employee in the Vietnamese salary format
        formatted_employees = []
        for emp in employees:
            formatted_emp = {
                "No.": emp.employeeNo,
                "Name": emp.name,
                "Salary": emp.salary,
                "Aug's salary": emp.augSalary,
                "Bonus": emp.bonus,
                "Allowance tính thuế": emp.allowanceTax,
                "Over time Pay PIT": emp.overtimePayPIT,
                "Total Salary": emp.totalSalary,
                "Dependants": emp.dependants,
                "Personal relief": emp.personalRelief,
                "Dependent relief": emp.dependentRelief,
                "Assessable income": emp.assessableIncome,
                "thu nhập ko tính thuế (PIT)": 0,  # This field is not in our model
                "Personal Income tax": emp.personalIncomeTax,
                "Insurance contribution - Company's pay (21.5%)": emp.companyInsurance,
                "Insurance contribution - Employee' s pay (10,5%)": emp.employeeInsurance,
                "Đoàn phí": emp.unionFee,
                "Over time none pay PIT": emp.overtimePayNonPIT,
                "Trừ Adv": emp.advance,
                "Total Net Income": emp.totalNetIncome,
                "He so": emp.heSo,
                "OT ( 1.5 % )": emp.ot15,
                "OT( 2.0%)": emp.ot20,
                "OT( 3.0%)": emp.ot30,
                "Total OT hours": emp.totalOTHours
            }
            formatted_employees.append(formatted_emp)
        
        # Return the JSON data for download (no local saving)
        date_str = datetime.now().strftime("%Y%m%d")
        filename = f"Payroll_{date_str}.json"
        return {
            "success": True,
            "message": f"Exported {len(employees)} employees",
            "filename": filename,
            "data": formatted_employees
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={"message": f"Failed to export employees: {str(e)}"}
        )


@router.get("/payroll/employees/{employee_id}", response_model=SelectEmployee)
async def get_payroll_employee(
    employee_id: str,
    x_username: Annotated[str | None, Header()] = None,
    x_password: Annotated[str | None, Header()] = None
):
    """
    Get a single payroll employee by ID for authenticated user.
    
    Args:
        employee_id: The employee ID to lookup
        
    Returns:
        Employee data if found
        
    Raises:
        HTTPException: If employee not found
    """
    if not x_username or not x_password:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    employee_dict = payroll_service.get_payroll_employee_by_id(x_username, x_password, employee_id)
    if not employee_dict:
        raise HTTPException(
            status_code=404,
            detail={"message": "Employee not found"}
        )
    return SelectEmployee(**employee_dict)


@router.patch("/payroll/employees/bulk-update")
async def bulk_update_payroll_employees(
    bulk_data: dict,
    x_username: Annotated[str | None, Header()] = None,
    x_password: Annotated[str | None, Header()] = None
):
    """
    Update a specific field for all payroll employees of authenticated user.
    
    Args:
        bulk_data: Dictionary containing 'field' and 'value' to update
        
    Returns:
        Success status with count of updated employees
        
    Raises:
        HTTPException: If invalid field or update fails
    """
    if not x_username or not x_password:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    try:
        field = bulk_data.get('field')
        value = bulk_data.get('value')
        
        if not field or value is None:
            raise HTTPException(
                status_code=400,
                detail={"message": "Missing field or value in request"}
            )
        
        # Allowed fields for bulk update
        allowed_fields = ['bonus', 'personalRelief', 'dependentRelief', 'allowanceTax']
        if field not in allowed_fields:
            raise HTTPException(
                status_code=400,
                detail={"message": f"Field '{field}' is not allowed for bulk update"}
            )
        
        # Get all employees for this user
        employees_dict = payroll_service.load_payroll_employees(x_username, x_password)
        updated_employees = []
        updated_count = 0
        
        # Update each employee with the new field value
        for employee_dict in employees_dict:
            # Convert to SelectEmployee model
            employee = SelectEmployee(**employee_dict)
            
            # Update the field
            employee_dict[field] = value
            
            # Create calculation input from updated data
            calc_input = SalaryInput(
                employeeNo=employee.employeeNo,
                name=employee.name,
                salary=employee.salary,
                bonus=employee_dict.get('bonus', employee.bonus),
                allowanceTax=employee_dict.get('allowanceTax', employee.allowanceTax),
                ot15=employee.ot15,
                ot20=employee.ot20,
                ot30=employee.ot30,
                dependants=employee.dependants,
                advance=employee.advance,
                personalRelief=employee_dict.get('personalRelief', employee.personalRelief),
                dependentRelief=employee_dict.get('dependentRelief', employee.dependentRelief)
            )
            
            # Calculate the new result
            result = calculate_salary(calc_input)
            
            # Convert result to dict and keep the ID
            updated_emp_dict = result.model_dump()
            updated_emp_dict['id'] = employee_dict['id']
            updated_employees.append(updated_emp_dict)
            updated_count += 1
        
        # Save all updated employees
        payroll_service.save_payroll_employees(x_username, x_password, updated_employees)
        
        return {
            "success": True,
            "message": f"Successfully updated {field} for {updated_count} employees",
            "updatedCount": updated_count
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={"message": f"Failed to bulk update employees: {str(e)}"}
        )


@router.patch("/payroll/employees/{employee_id}", response_model=SelectEmployee)
async def update_payroll_employee(
    employee_id: str,
    update_data: EmployeeUpdate,
    x_username: Annotated[str | None, Header()] = None,
    x_password: Annotated[str | None, Header()] = None
):
    """
    Update payroll employee with partial data for authenticated user.
    
    Args:
        employee_id: The employee ID to update
        update_data: Partial employee data to update
        
    Returns:
        Updated employee data
        
    Raises:
        HTTPException: If employee not found or validation fails
    """
    if not x_username or not x_password:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    try:
        # Get existing employee
        employee_dict = payroll_service.get_payroll_employee_by_id(x_username, x_password, employee_id)
        if not employee_dict:
            raise HTTPException(
                status_code=404,
                detail={"message": "Employee not found"}
            )
        
        # Update with partial data
        update_dict = update_data.model_dump(exclude_none=True)
        employee_dict.update(update_dict)
        
        # Update in storage
        success = payroll_service.update_payroll_employee(x_username, x_password, employee_id, employee_dict)
        if not success:
            raise HTTPException(
                status_code=404,
                detail={"message": "Employee not found"}
            )
        
        return SelectEmployee(**employee_dict)
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail={"message": "Invalid employee data", "errors": [str(e)]}
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={"message": "Failed to update employee", "errors": [str(e)]}
        )


@router.delete("/payroll/employees/{employee_id}", status_code=204)
async def delete_payroll_employee(
    employee_id: str,
    x_username: Annotated[str | None, Header()] = None,
    x_password: Annotated[str | None, Header()] = None
):
    """
    Delete a payroll employee by ID for authenticated user.
    
    Args:
        employee_id: The employee ID to delete
        
    Returns:
        Empty response with 204 status on success
        
    Raises:
        HTTPException: If employee not found
    """
    if not x_username or not x_password:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    try:
        success = payroll_service.delete_payroll_employee(x_username, x_password, employee_id)
        if not success:
            raise HTTPException(
                status_code=404,
                detail={"message": "Employee not found"}
            )
        # Return 204 No Content on successful deletion
        return Response(status_code=204)
    except HTTPException:
        raise
    except Exception as e:
        if "not found" in str(e).lower():
            raise HTTPException(
                status_code=404,
                detail={"message": "Employee not found"}
            )
        raise HTTPException(
            status_code=500,
            detail={"message": "Failed to delete employee", "errors": [str(e)]}
        )


@router.delete("/payroll/employees", status_code=200)
async def clear_all_payroll_employees(
    x_username: Annotated[str | None, Header()] = None,
    x_password: Annotated[str | None, Header()] = None
):
    """
    Clear all payroll employees for authenticated user.
    
    Returns:
        Number of employees deleted
        
    Raises:
        HTTPException: If deletion fails
    """
    if not x_username or not x_password:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    try:
        deleted_count = payroll_service.clear_all_payroll_employees(x_username, x_password)
        return {
            "success": True,
            "message": f"Successfully cleared {deleted_count} payroll employees",
            "deleted": deleted_count
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={"message": "Failed to clear employees", "errors": [str(e)]}
        )


@router.post("/payroll/employees/upload-excel")
async def upload_payroll_excel_file(
    file: UploadFile = File(...),
    x_username: Annotated[str | None, Header()] = None,
    x_password: Annotated[str | None, Header()] = None
):
    """
    Upload an Excel file to import multiple employees for authenticated user.
    
    Args:
        file: Excel file containing employee data
        
    Returns:
        List of created employees and any errors
        
    Raises:
        HTTPException: If file is invalid or processing fails
    """
    # Check authentication
    if not x_username or not x_password:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    # Validate file extension
    if not file.filename or not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(
            status_code=400,
            detail={"message": "Invalid file type. Please upload an Excel file (.xlsx or .xls)"}
        )
    
    try:
        # Read file content
        content = await file.read()
        
        # Parse Excel file
        employee_data_list = parse_excel_file(content)
        
        if not employee_data_list:
            raise HTTPException(
                status_code=400,
                detail={"message": "No valid employee data found in the Excel file"}
            )
        
        # Load existing payroll employees for this user
        existing_employees = payroll_service.load_payroll_employees(x_username, x_password)
        deleted_count = len(existing_employees)
        
        # Process each employee from Excel
        created_employees = []
        errors = []
        
        for idx, employee_data in enumerate(employee_data_list):
            try:
                import uuid
                # First, create SalaryInput from the employee data to calculate results
                salary_input = SalaryInput(**employee_data)
                
                # Calculate salary to get all the computed fields
                calculated_result = calculate_salary(salary_input)
                
                # Convert to employee dict format with ID
                employee_dict = {
                    "id": uuid.uuid4().hex,
                    **calculated_result.model_dump()
                }
                
                created_employees.append(employee_dict)
                
            except Exception as e:
                errors.append({
                    "row": idx + 1,
                    "employeeNo": employee_data.get("employeeNo", "Unknown"),
                    "name": employee_data.get("name", "Unknown"),
                    "error": str(e)
                })
        
        # Replace all payroll employees with the new import (clear and add new)
        payroll_service.save_payroll_employees(x_username, x_password, created_employees)
        
        # Return result summary
        return {
            "success": True,
            "message": f"Cleared {deleted_count} existing employees. Successfully imported {len(created_employees)} new employees",
            "imported": len(created_employees),
            "failed": len(errors),
            "deleted": deleted_count,
            "employees": created_employees,
            "errors": errors
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={"message": f"Failed to process Excel file: {str(e)}"}
        )


@router.post("/payslip/download-excel")
async def download_payslip_excel(calculation_data: dict):
    """
    Generate and download a personalized pay slip Excel file.
    
    Args:
        calculation_data: Dictionary containing all calculation values from frontend
        
    Returns:
        Excel file as StreamingResponse
        
    Raises:
        HTTPException: If generation fails
    """
    try:
        # Generate the Excel file
        excel_bytes = generate_payslip_excel(calculation_data)
        
        # Get employee name for filename, with fallback
        employee_name = calculation_data.get('name', 'Employee')
        
        # Create ASCII-safe filename for compatibility
        import unicodedata
        import re
        
        # Convert Vietnamese characters to ASCII equivalents
        ascii_name = unicodedata.normalize('NFKD', employee_name)
        ascii_name = ''.join(c for c in ascii_name if not unicodedata.combining(c))
        # Clean filename - keep only alphanumeric, spaces, hyphens, underscores
        safe_name = re.sub(r'[^\w\s-]', '', ascii_name).strip()
        safe_name = re.sub(r'[-\s]+', '_', safe_name)
        filename = f"Payslip_{safe_name}.xlsx"
        
        # Create proper Content-Disposition header with both ASCII and UTF-8 versions
        from urllib.parse import quote
        
        # ASCII filename for old browsers
        ascii_header = f'attachment; filename="{filename}"'
        
        # UTF-8 filename for modern browsers (RFC 5987)
        utf8_filename = f"Payslip_{employee_name}.xlsx"
        utf8_encoded = quote(utf8_filename.encode('utf-8'))
        utf8_header = f"filename*=UTF-8''{utf8_encoded}"
        
        # Combine both for maximum compatibility
        content_disposition = f"{ascii_header}; {utf8_header}"
        
        # Create a streaming response
        def generate():
            yield excel_bytes
            
        response = StreamingResponse(
            generate(),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": content_disposition}
        )
        return response
        
    except FileNotFoundError as e:
        raise HTTPException(
            status_code=500,
            detail={"message": f"Template file not found: {str(e)}"}
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={"message": f"Failed to generate pay slip: {str(e)}"}
        )


@router.get("/payslips/download-all-excel")
async def download_all_payslips_excel(
    x_username: Annotated[str | None, Header()] = None,
    x_password: Annotated[str | None, Header()] = None
):
    """
    Generate and download a ZIP file containing Excel pay slips for all employees of authenticated user.
    
    Returns:
        ZIP file containing individual Excel pay slips for each employee
        
    Raises:
        HTTPException: If generation fails or no employees found
    """
    if not x_username or not x_password:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    try:
        # Get all employees for this user
        employees_dict = payroll_service.load_payroll_employees(x_username, x_password)
        
        if not employees_dict:
            raise HTTPException(
                status_code=404,
                detail={"message": "No employees found to generate pay slips"}
            )
        
        # Convert to SelectEmployee models
        employees = [SelectEmployee(**emp) for emp in employees_dict]
        
        # Generate ZIP file with all pay slips
        zip_bytes = generate_batch_payslip_zip(employees)
        
        if not zip_bytes:
            raise HTTPException(
                status_code=500,
                detail={"message": "Failed to generate any pay slip files"}
            )
        
        # Create filename with current date
        from datetime import datetime
        current_date = datetime.now().strftime("%Y%m%d")
        filename = f"All_Payslips_{current_date}.zip"
        
        # Return ZIP file as download
        def generate():
            yield zip_bytes
            
        return StreamingResponse(
            generate(),
            media_type="application/zip",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={"message": f"Failed to generate pay slips: {str(e)}"}
        )

@router.get("/payroll/download-complete")
async def download_complete_payroll(
    x_username: Annotated[str | None, Header()] = None,
    x_password: Annotated[str | None, Header()] = None
):
    """
    Generate and download a ZIP file containing both:
    - All payslips as Excel files
    - Payroll data as Excel file
    
    For authenticated user only.
    
    Returns:
        ZIP file containing payslips folder and payroll Excel file
        
    Raises:
        HTTPException: If generation fails or no employees found
    """
    import zipfile
    from datetime import datetime
    
    if not x_username or not x_password:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    try:
        # Get all employees for this user
        employees_dict = payroll_service.load_payroll_employees(x_username, x_password)
        
        if not employees_dict:
            raise HTTPException(
                status_code=404,
                detail={"message": "No employees found"}
            )
        
        # Convert to SelectEmployee models
        employees = [SelectEmployee(**emp) for emp in employees_dict]
        
        if not employees:
            raise HTTPException(
                status_code=404,
                detail={"message": "No employees found"}
            )
        
        # Create a BytesIO object to hold the ZIP file
        zip_buffer = io.BytesIO()
        
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            # 1. Add all payslips to the ZIP
            for employee in employees:
                try:
                    # Convert employee to dict for payslip generation
                    employee_dict = employee.model_dump()
                    
                    # Generate payslip Excel for this employee
                    payslip_bytes = generate_payslip_excel(employee_dict)
                    
                    # Create safe filename
                    import unicodedata
                    import re
                    employee_name = employee.name
                    ascii_name = unicodedata.normalize('NFKD', employee_name)
                    ascii_name = ''.join(c for c in ascii_name if not unicodedata.combining(c))
                    safe_name = re.sub(r'[^\w\s-]', '', ascii_name).strip()
                    safe_name = re.sub(r'[-\s]+', '_', safe_name)
                    
                    # Add to ZIP in payslips folder
                    zip_file.writestr(
                        f"Payslips/Payslip_{safe_name}.xlsx",
                        payslip_bytes
                    )
                except Exception as e:
                    # Log error but continue with other payslips
                    print(f"Error generating payslip for {employee.name}: {str(e)}")
                    continue
            
            # 2. Add payroll Excel to the ZIP
            payroll_bytes = export_employees_to_excel(employees)
            date_str = datetime.now().strftime("%Y%m%d")
            zip_file.writestr(
                f"Payroll_{date_str}.xlsx",
                payroll_bytes
            )
        
        # Get the ZIP file bytes
        zip_buffer.seek(0)
        zip_bytes = zip_buffer.read()
        
        # Create filename with current date
        current_date = datetime.now().strftime("%Y%m%d")
        filename = f"Complete_Payroll_{current_date}.zip"
        
        # Return ZIP file as download
        def generate():
            yield zip_bytes
            
        return StreamingResponse(
            generate(),
            media_type="application/zip",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={"message": f"Failed to generate complete payroll: {str(e)}"}
        )


# ============ Dashboard Employee Management Endpoints (nhan_vien.json) ============

@router.get("/employees", response_model=List[EmployeeSphere])
def get_employees(
    department: Optional[str] = None,
    position: Optional[str] = None,
    contract_type: Optional[str] = None,
    gender: Optional[str] = None,
    search: Optional[str] = None,
    min_age: Optional[int] = None,
    max_age: Optional[int] = None,
    x_username: Annotated[str | None, Header()] = None,
    x_password: Annotated[str | None, Header()] = None
):
    """Get employees for the authenticated user."""
    # Get auth from headers
    if not x_username or not x_password:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    employees = employee_service.load_employees(x_username, x_password)
    
    # Helper function to calculate age from DOB
    def calculate_age(dob_str):
        if not dob_str:
            return None
        try:
            from datetime import datetime
            dob = datetime.strptime(dob_str, '%Y-%m-%d')
            today = datetime.now()
            age = today.year - dob.year
            if today.month < dob.month or (today.month == dob.month and today.day < dob.day):
                age -= 1
            return age
        except (ValueError, TypeError):
            return None
    
    
    # Apply filters
    filtered_employees = []
    for emp in employees:
        # Department filter
        if department and emp.get("department", "").lower() != department.lower():
            continue
        
        # Position filter
        if position and position.lower() not in emp.get("position", "").lower():
            continue
            
        # Contract type filter
        if contract_type and emp.get("contract_type", "").lower() != contract_type.lower():
            continue
            
        # Gender filter
        if gender and emp.get("gender", "").lower() != gender.lower():
            continue
            
            
        # Search filter (searches in employee name only)
        if search:
            search_lower = search.lower()
            emp_name = emp.get("full_name", "").lower()
            if search_lower not in emp_name:
                continue
        
        # Age filters
        if min_age is not None or max_age is not None:
            emp_age = calculate_age(emp.get("dob"))
            if emp_age is None:
                continue  # Skip employees with invalid DOB
            
            if min_age is not None and emp_age < min_age:
                continue
                
            if max_age is not None and emp_age > max_age:
                continue
        
        filtered_employees.append(emp)
    
    return filtered_employees

@router.get("/employees/{employee_id}")
def get_employee(
    employee_id: str,
    x_username: Annotated[str | None, Header()] = None,
    x_password: Annotated[str | None, Header()] = None
):
    """Get specific employee for authenticated user."""
    if not x_username or not x_password:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    employees = employee_service.load_employees(x_username, x_password)
    for emp in employees:
        if emp.get("Id_number") == employee_id:
            return emp
    raise HTTPException(status_code=404, detail="Employee not found")

@router.post("/employees", response_model=EmployeeSphere)
def create_employee(
    employee: EmployeeCreate,
    x_username: Annotated[str | None, Header()] = None,
    x_password: Annotated[str | None, Header()] = None
):
    """Create employee for authenticated user."""
    if not x_username or not x_password:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    employees = employee_service.load_employees(x_username, x_password)
    
    # Check if employee with same ID already exists
    for emp in employees:
        if emp.get("Id_number") == employee.Id_number:
            raise HTTPException(status_code=400, detail="Employee with this ID already exists")
    
    # Generate contract ID (simple implementation)
    contract_id = f"{len(employees)+1:02d}-{datetime.now().strftime('%m%Y')}/HĐLĐ/KXĐ"
    
    # Create new employee
    new_employee = {
        "full_name": employee.full_name,
        "dob": employee.dob,
        "gender": employee.gender,
        "Id_number": employee.Id_number,
        "address": employee.address,
        "current_address": employee.current_address,
        "phone": employee.phone,
        "education_level": employee.education_level,
        "department": employee.department,
        "position": employee.position,
        "contract_id": contract_id,
        "contract_type": employee.contract_type,
        "contract_sign_date": employee.contract_sign_date,
        "salary": employee.salary,
        "last_salary_adjustment": employee.contract_sign_date,
        "tax_code": employee.tax_code,
        "social_insurance_number": employee.social_insurance_number,
        "medical_insurance_hospital": employee.medical_insurance_hospital,
        "bank_account": employee.bank_account,
        "pvi_care": employee.pvi_care,
        "training_skills": employee.training_skills
    }
    
    employees.append(new_employee)
    employee_service.save_employees(x_username, x_password, employees)
    
    return new_employee

@router.put("/employees/{employee_id}")
def update_employee(
    employee_id: str,
    employee: EmployeeCreate,
    x_username: Annotated[str | None, Header()] = None,
    x_password: Annotated[str | None, Header()] = None
):
    """Update employee for authenticated user."""
    if not x_username or not x_password:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    employees = employee_service.load_employees(x_username, x_password)
    
    for i, emp in enumerate(employees):
        if emp.get("Id_number") == employee_id:
            # Update employee data
            employees[i].update({
                "full_name": employee.full_name,
                "dob": employee.dob,
                "gender": employee.gender,
                "address": employee.address,
                "current_address": employee.current_address,
                "phone": employee.phone,
                "education_level": employee.education_level,
                "department": employee.department,
                "position": employee.position,
                "contract_type": employee.contract_type,
                "contract_sign_date": employee.contract_sign_date,
                "salary": employee.salary,
                "tax_code": employee.tax_code,
                "social_insurance_number": employee.social_insurance_number,
                "medical_insurance_hospital": employee.medical_insurance_hospital,
                "bank_account": employee.bank_account,
                "pvi_care": employee.pvi_care,
                "training_skills": employee.training_skills
            })
            
            employee_service.save_employees(x_username, x_password, employees)
            return employees[i]
    
    raise HTTPException(status_code=404, detail="Employee not found")

@router.delete("/employees/{employee_id}")
def delete_employee(
    employee_id: str,
    x_username: Annotated[str | None, Header()] = None,
    x_password: Annotated[str | None, Header()] = None
):
    """Delete an employee for authenticated user."""
    if not x_username or not x_password:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    try:
        employees = employee_service.load_employees(x_username, x_password)
        
        # Find and remove the employee
        initial_count = len(employees)
        employees = [emp for emp in employees if emp.get("Id_number") != employee_id]
        
        if len(employees) == initial_count:
            # No employee was removed
            raise HTTPException(status_code=404, detail="Employee not found")
        
        # Save the updated list
        success = employee_service.save_employees(x_username, x_password, employees)
        if not success:
            raise HTTPException(status_code=500, detail="Failed to save changes")
        
        return {"message": "Employee deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting employee: {str(e)}")

@router.get("/filter-options")
def get_filter_options(
    x_username: Annotated[str | None, Header()] = None,
    x_password: Annotated[str | None, Header()] = None
):
    """Get unique values for dropdown filter options for authenticated user"""
    if not x_username or not x_password:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    employees = employee_service.load_employees(x_username, x_password)
    
    if not employees:
        return {
            "positions": [],
            "departments": [],
            "genders": [],
            "contract_types": []
        }
    
    # Extract unique values for each field
    positions = set()
    departments = set()
    genders = set()
    contract_types = set()
    
    for emp in employees:
        # Add non-empty values to sets
        if emp.get("position") and emp["position"].strip():
            positions.add(emp["position"].strip())
        
        if emp.get("department") and emp["department"].strip():
            departments.add(emp["department"].strip())
        
        if emp.get("gender") and emp["gender"].strip():
            genders.add(emp["gender"].strip())
        
        if emp.get("contract_type") and emp["contract_type"].strip():
            contract_types.add(emp["contract_type"].strip())
    
    # Convert to sorted lists
    return {
        "positions": sorted(list(positions)),
        "departments": sorted(list(departments)),
        "genders": sorted(list(genders)),
        "contract_types": sorted(list(contract_types))
    }

@router.get("/statistics")
def get_statistics(
    x_username: Annotated[str | None, Header()] = None,
    x_password: Annotated[str | None, Header()] = None
):
    """Get statistics for authenticated user's employees."""
    if not x_username or not x_password:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    employees = employee_service.load_employees(x_username, x_password)
    
    if not employees:
        return {
            "total_employees": 0,
            "departments": {},
            "positions": {},
            "contract_types": {},
            "average_salary": 0,
            "salary_ranges": {}
        }
    
    df = pd.DataFrame(employees)
    
    # Department distribution
    dept_counts = df['department'].value_counts().to_dict()
    
    # Position distribution
    position_counts = df['position'].value_counts().to_dict()
    
    # Contract type distribution
    contract_counts = df['contract_type'].value_counts().to_dict()
    
    # Salary statistics
    avg_salary = df['salary'].mean()
    
    # Salary ranges
    salary_ranges = {
        "0-10M": len(df[df['salary'] < 10000000]),
        "10M-20M": len(df[(df['salary'] >= 10000000) & (df['salary'] < 20000000)]),
        "20M-30M": len(df[(df['salary'] >= 20000000) & (df['salary'] < 30000000)]),
        "30M+": len(df[df['salary'] >= 30000000])
    }
    
    return {
        "total_employees": len(employees),
        "departments": dept_counts,
        "positions": position_counts,
        "contract_types": contract_counts,
        "average_salary": int(avg_salary),
        "salary_ranges": salary_ranges
    }

@router.get("/export/csv")
def export_csv(
    department: Optional[str] = None,
    position: Optional[str] = None,
    contract_type: Optional[str] = None,
    gender: Optional[str] = None,
    search: Optional[str] = None,
    min_age: Optional[int] = None,
    max_age: Optional[int] = None,
    x_username: Annotated[str | None, Header()] = None,
    x_password: Annotated[str | None, Header()] = None
):
    """Export employees to CSV for authenticated user."""
    # Get filtered employees with authentication
    employees = get_employees(department, position, contract_type, gender, 
                             search, min_age, max_age, x_username, x_password)
    
    if not employees:
        raise HTTPException(status_code=404, detail="No employees found with the given filters")
    
    # Convert to DataFrame and CSV
    df = pd.DataFrame(employees)
    csv_buffer = io.StringIO()
    df.to_csv(csv_buffer, index=False, encoding='utf-8')
    
    # Return as streaming response
    csv_content = csv_buffer.getvalue()
    return StreamingResponse(
        io.StringIO(csv_content),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=employees.csv"}
    )

@router.get("/export/excel")
def export_excel(
    department: Optional[str] = None,
    position: Optional[str] = None,
    contract_type: Optional[str] = None,
    gender: Optional[str] = None,
    search: Optional[str] = None,
    min_age: Optional[int] = None,
    max_age: Optional[int] = None,
    x_username: Annotated[str | None, Header()] = None,
    x_password: Annotated[str | None, Header()] = None
):
    """Export employees to Excel for authenticated user."""
    # Get filtered employees with authentication
    employees = get_employees(department, position, contract_type, gender, 
                             search, min_age, max_age, x_username, x_password)
    
    if not employees:
        raise HTTPException(status_code=404, detail="No employees found with the given filters")
    
    # Convert to DataFrame and Excel
    df = pd.DataFrame(employees)
    excel_buffer = io.BytesIO()
    
    # Write to Excel with openpyxl engine
    df.to_excel(excel_buffer, sheet_name='Employees', index=False, engine='openpyxl')
    
    excel_buffer.seek(0)
    
    # Return as streaming response
    return StreamingResponse(
        excel_buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=employees.xlsx"}
    )

@router.post("/import/excel")
async def import_excel(
    file: UploadFile = File(...),
    x_username: Annotated[str | None, Header()] = None,
    x_password: Annotated[str | None, Header()] = None
):
    """Import employee data from Excel for authenticated user."""
    # Check authentication
    if not x_username or not x_password:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    if not file.filename or not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="Only Excel files are allowed")
    
    try:
        # Read the Excel file with string data types for ID-like fields
        contents = await file.read()
        
        # Specify dtype for columns that should be strings to preserve leading zeros
        dtype_mapping = {
            'CMND/CCCD': str,
            'Số điện thoại': str,
            'Số liên hệ khi khẩn cấp': str,
            'MST TNCN': str,
            'Số BHXH': str,
            'TK NGÂN HÀNG ': str,
            'Số người phụ thuộc': str
        }
        
        df = pd.read_excel(io.BytesIO(contents), dtype=dtype_mapping)
        
        # Field mapping from Vietnamese to English
        field_mapping = {
            'ID': 'id',
            'Họ và tên': 'full_name',
            'Ngày sinh': 'dob',
            'Giới tính': 'gender',
            'CMND/CCCD': 'Id_number',
            'Ngày cấp ': 'Issue_date',
            'Địa chỉ thường trú': 'address',
            'địa chỉ hiện tại ': 'current_address',
            'Số điện thoại': 'phone',
            'Số liên hệ khi khẩn cấp': 'emergency_contact',
            'Trình độ học vấn': 'education_level',
            'Ngày vào công ty': 'join_date',
            'Thuộc bộ phận': 'department',
            'Chức vụ': 'position',
            'HĐLĐ': 'contract_id',
            'Loại HĐLĐ': 'contract_type',
            'Ngày kí HĐLĐ': 'contract_sign_date',
            'Ngày hết hạn HĐLĐ': 'contract_end_date',
            'Lương': 'salary',
            'Trợ cấp': 'allowance',
            'Thời gian điều chỉnh lương gần nhất': 'last_salary_adjustment',
            'MST TNCN': 'tax_code',
            'Số người phụ thuộc': 'dependent_count',
            'Số BHXH': 'social_insurance_number',
            'Bệnh viện đăng ký KCB': 'medical_insurance_hospital',
            'TK NGÂN HÀNG ': 'bank_account',
            'TÊN NGÂN HÀNG': 'bank_name',
            'PVI Care': 'pvi_care',
            'Các khóa đào tạo đã tham gia': 'training_courses',
            'Các khóa đào tạo kỹ năng': 'training_skills'
        }
        
        # Rename columns to English
        df = df.rename(columns=field_mapping)
        
        # Process each row
        new_employees = []
        for _, row in df.iterrows():
            employee = {}
            for field in field_mapping.values():
                value = row.get(field)
                
                # Handle NaN values
                if pd.isna(value):
                    value = ""
                # Handle datetime values
                elif hasattr(value, 'strftime'):
                    value = value.strftime('%Y-%m-%d')
                # Handle numeric values
                elif isinstance(value, (int, float)):
                    # Keep salary as integer
                    if field == 'salary':
                        value = int(value)
                    # Convert numeric fields to string without decimals if they're whole numbers
                    elif field in ['id', 'tax_code', 'social_insurance_number', 'bank_account', 'Id_number', 'phone']:
                        # Remove .0 from floats that are actually integers
                        if isinstance(value, float) and value.is_integer():
                            value = str(int(value))
                        else:
                            value = str(value)
                    else:
                        value = str(value)
                else:
                    value = str(value).strip()
                
                # Remove .0 from string values that end with it (for emergency contact, dependent count, etc.)
                if isinstance(value, str) and value.endswith('.0'):
                    value = value[:-2]
                
                # Add leading zeros for phone numbers (Vietnamese phone numbers should be 10 digits)
                if field in ['phone', 'emergency_contact'] and value and value != "":
                    value_str = str(value)
                    # Remove any decimal points
                    if '.' in value_str:
                        value_str = value_str.split('.')[0]
                    # Add leading zero if it's a 9-digit phone number
                    if len(value_str) == 9:
                        value_str = '0' + value_str
                    value = value_str
                
                # Add leading zeros for ID numbers if needed (Vietnamese CMND/CCCD are typically 9 or 12 digits)
                if field == 'Id_number' and value and value != "":
                    value_str = str(value)
                    # Remove any decimal points
                    if '.' in value_str:
                        value_str = value_str.split('.')[0]
                    # Add leading zero if it's an 11-digit ID that should be 12
                    if len(value_str) == 11:
                        value_str = '0' + value_str
                    value = value_str
                
                # Special handling for PVI Care - more robust
                if field == 'pvi_care':
                    if value and str(value).lower() in ['x', 'có', 'co', 'yes', '1', 'true']:
                        value = "Có"
                    elif not value or str(value).lower() in ['', 'không', 'khong', 'no', '0', 'false']:
                        value = "Không"
                    else:
                        value = ""
                
                employee[field] = value
            
            new_employees.append(employee)

        # Save to user-specific encrypted file
        success = employee_service.save_employees(x_username, x_password, new_employees)
        
        if not success:
            raise HTTPException(status_code=500, detail="Failed to save imported employees")
        
        return {"message": f"Successfully imported {len(new_employees)} employees", "count": len(new_employees)}
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error processing file: {str(e)}")


# ============= User Management Routes =============

class UserRegister(BaseModel):
    username: str
    password: str
    email: EmailStr
    fullName: str

class UserLogin(BaseModel):
    username: str
    password: str

class PasswordRecovery(BaseModel):
    email: EmailStr
    username: str

class AuthenticatedRequest(BaseModel):
    username: str
    password: str

class PasswordReset(BaseModel):
    username: str
    new_password: str

class PasswordChange(BaseModel):
    username: str
    old_password: str
    new_password: str

# Helper function to get auth from headers
def get_auth_from_headers(
    x_username: Annotated[str | None, Header()] = None,
    x_password: Annotated[str | None, Header()] = None
) -> tuple:
    """Extract username and password from request headers"""
    if not x_username or not x_password:
        raise HTTPException(
            status_code=401,
            detail="Authentication required. Please provide X-Username and X-Password headers."
        )
    return x_username, x_password


@router.post("/auth/register")
def register_user(user_data: UserRegister):
    """Register a new user account"""
    result = user_service.register_user(
        username=user_data.username,
        password=user_data.password,
        email=user_data.email,
        full_name=user_data.fullName
    )
    
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
    
    return result


@router.post("/auth/login")
def login_user(credentials: UserLogin):
    """Authenticate user and return user info"""
    user = user_service.authenticate_user(
        username=credentials.username,
        password=credentials.password
    )
    
    if not user:
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    # Try to decrypt employee data with user's password
    employee_data = encryption_service.decrypt_data(credentials.username, credentials.password)
    
    return {
        "success": True,
        "user": user,
        "hasEncryptedData": employee_data is not None,
        "employeeCount": len(employee_data) if employee_data else 0
    }


@router.post("/auth/recover-password")
def recover_password(recovery_data: PasswordRecovery):
    """Recover password using email and username"""
    result = user_service.recover_password(
        email=recovery_data.email,
        username=recovery_data.username
    )
    
    if not result["success"]:
        raise HTTPException(status_code=404, detail=result["message"])
    
    return result


@router.post("/auth/encrypt-data")
def encrypt_employee_data(credentials: UserLogin):
    """Encrypt employee data with user's password"""
    # First verify user credentials
    user = user_service.authenticate_user(
        username=credentials.username,
        password=credentials.password
    )
    
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Encrypt the data for this specific user
    success = encryption_service.encrypt_data(credentials.username, credentials.password)
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to encrypt data")
    
    return {
        "success": True,
        "message": "Employee data encrypted successfully"
    }


@router.post("/auth/decrypt-data")
def decrypt_employee_data(credentials: UserLogin):
    """Decrypt employee data with user's password"""
    # Try to decrypt data for this specific user
    employee_data = encryption_service.decrypt_data(credentials.username, credentials.password)
    
    if employee_data is None:
        raise HTTPException(status_code=401, detail="Failed to decrypt data. Wrong password or no encrypted data found.")
    
    return {
        "success": True,
        "data": employee_data
    }


@router.post("/auth/migrate-passwords")
def migrate_passwords_to_hashed():
    """
    Migrate all plain text passwords to hashed passwords
    This is a one-time migration endpoint for security upgrade
    """
    result = user_service.migrate_passwords_to_hashed()
    
    if not result["success"]:
        raise HTTPException(status_code=500, detail=result["message"])
    
    return result


@router.post("/auth/reset-password")
def reset_password(reset_data: PasswordReset):
    """
    Reset a user's password (admin function)
    No authentication required - use carefully or add admin auth
    """
    result = user_service.reset_user_password(
        username=reset_data.username,
        new_password=reset_data.new_password
    )
    
    if not result["success"]:
        raise HTTPException(status_code=404, detail=result["message"])
    
    return result


@router.post("/auth/change-password")
def change_password(change_data: PasswordChange):
    """
    Change user's own password (requires current password)
    """
    result = user_service.change_password(
        username=change_data.username,
        old_password=change_data.old_password,
        new_password=change_data.new_password
    )
    
    if not result["success"]:
        raise HTTPException(status_code=401, detail=result["message"])
    
    return result