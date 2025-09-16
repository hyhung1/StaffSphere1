from fastapi import FastAPI, HTTPException, Query, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Optional
import json
import pandas as pd
from datetime import datetime
import io
from openpyxl import Workbook

app = FastAPI(title="HR Employee Management API", version="1.0.0")

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API routes will be defined below, then mount static files last

class Employee(BaseModel):
    full_name: str
    dob: str
    age: float
    gender: str
    Id_number: str
    Issue_date: str = ""
    address: str
    current_address: str
    phone: str
    emergency_contact: str = ""
    education_level: str
    department: str
    join_date: str = ""
    position: str
    contract_id: str
    contract_type: str
    contract_sign_date: str
    contract_end_date: str = ""
    salary: int
    allowance: str = ""
    last_salary_adjustment: str
    tax_code: int
    dependent_count: str = ""
    social_insurance_number: int
    medical_insurance_hospital: str
    bank_account: int
    bank_name: str = ""
    pvi_care: str
    training_courses: str = ""
    training_skills: str

class EmployeeCreate(BaseModel):
    full_name: str
    dob: str
    gender: str
    Id_number: str
    address: str
    current_address: str
    phone: str
    education_level: str
    department: str
    position: str
    contract_type: str
    contract_sign_date: str
    salary: int
    tax_code: int
    social_insurance_number: int
    medical_insurance_hospital: str
    bank_account: int
    pvi_care: str = ""
    training_skills: str = ""

class EmployeeFilter(BaseModel):
    department: Optional[str] = None
    position: Optional[str] = None
    contract_type: Optional[str] = None
    gender: Optional[str] = None
    min_age: Optional[float] = None
    max_age: Optional[float] = None
    search: Optional[str] = None

# Load employee data
def load_employees():
    try:
        with open("nhan_vien.json", "r", encoding="utf-8") as f:
            data = json.load(f)
        return data
    except FileNotFoundError:
        return []

def save_employees(employees):
    with open("nhan_vien.json", "w", encoding="utf-8") as f:
        json.dump(employees, f, ensure_ascii=False, indent=2)

def calculate_age(dob_str):
    try:
        dob = datetime.fromisoformat(dob_str.replace("T00:00:00", ""))
        today = datetime.now()
        age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
        return float(age)
    except:
        return 0.0

@app.get("/api/")
def read_root():
    return {"message": "HR Employee Management API", "version": "1.0.0"}

@app.get("/employees", response_model=List[Employee])
def get_employees(
    department: Optional[str] = None,
    position: Optional[str] = None,
    contract_type: Optional[str] = None,
    gender: Optional[str] = None,
    min_age: Optional[float] = None,
    max_age: Optional[float] = None,
    search: Optional[str] = None
):
    employees = load_employees()
    
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
            
            
        # Age range filter
        emp_age = emp.get("age", 0)
        if min_age is not None and emp_age < min_age:
            continue
        if max_age is not None and emp_age > max_age:
            continue
            
        # Search filter (searches in name, phone, ID number, department)
        if search:
            search_lower = search.lower()
            searchable_fields = [
                emp.get("full_name", ""),
                emp.get("phone", ""),
                emp.get("Id_number", ""),
                emp.get("department", "")
            ]
            if not any(search_lower in str(field).lower() for field in searchable_fields):
                continue
        
        filtered_employees.append(emp)
    
    return filtered_employees

@app.get("/employees/{employee_id}")
def get_employee(employee_id: str):
    employees = load_employees()
    for emp in employees:
        if emp.get("Id_number") == employee_id:
            return emp
    raise HTTPException(status_code=404, detail="Employee not found")

@app.post("/employees", response_model=Employee)
def create_employee(employee: EmployeeCreate):
    employees = load_employees()
    
    # Check if employee with same ID already exists
    for emp in employees:
        if emp.get("Id_number") == employee.Id_number:
            raise HTTPException(status_code=400, detail="Employee with this ID already exists")
    
    # Generate contract ID (simple implementation)
    contract_id = f"{len(employees)+1:02d}-{datetime.now().strftime('%m%Y')}/HĐLĐ/KXĐ"
    
    # Calculate age
    age = calculate_age(employee.dob)
    
    # Create new employee
    new_employee = {
        "full_name": employee.full_name,
        "dob": employee.dob,
        "age": age,
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
    save_employees(employees)
    
    return new_employee

@app.put("/employees/{employee_id}")
def update_employee(employee_id: str, employee: EmployeeCreate):
    employees = load_employees()
    
    for i, emp in enumerate(employees):
        if emp.get("Id_number") == employee_id:
            # Update age
            age = calculate_age(employee.dob)
            
            # Update employee data
            employees[i].update({
                "full_name": employee.full_name,
                "dob": employee.dob,
                "age": age,
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
            
            save_employees(employees)
            return employees[i]
    
    raise HTTPException(status_code=404, detail="Employee not found")

@app.delete("/employees/{employee_id}")
def delete_employee(employee_id: str):
    employees = load_employees()
    
    for i, emp in enumerate(employees):
        if emp.get("Id_number") == employee_id:
            deleted_employee = employees.pop(i)
            save_employees(employees)
            return {"message": "Employee deleted successfully", "employee": deleted_employee}
    
    raise HTTPException(status_code=404, detail="Employee not found")

@app.get("/statistics")
def get_statistics():
    employees = load_employees()
    
    if not employees:
        return {
            "total_employees": 0,
            "departments": {},
            "positions": {},
            "contract_types": {},
            "average_salary": 0,
            "salary_ranges": {},
            "age_distribution": {}
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
    
    # Age distribution
    age_ranges = {
        "20-30": len(df[(df['age'] >= 20) & (df['age'] < 30)]),
        "30-40": len(df[(df['age'] >= 30) & (df['age'] < 40)]),
        "40-50": len(df[(df['age'] >= 40) & (df['age'] < 50)]),
        "50+": len(df[df['age'] >= 50])
    }
    
    return {
        "total_employees": len(employees),
        "departments": dept_counts,
        "positions": position_counts,
        "contract_types": contract_counts,
        "average_salary": int(avg_salary),
        "salary_ranges": salary_ranges,
        "age_distribution": age_ranges
    }

@app.get("/export/csv")
def export_csv(
    department: Optional[str] = None,
    position: Optional[str] = None,
    contract_type: Optional[str] = None,
    gender: Optional[str] = None,
    min_age: Optional[float] = None,
    max_age: Optional[float] = None,
    search: Optional[str] = None
):
    # Get filtered employees
    employees = get_employees(department, position, contract_type, gender, 
                             min_age, max_age, search)
    
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

@app.get("/export/excel")
def export_excel(
    department: Optional[str] = None,
    position: Optional[str] = None,
    contract_type: Optional[str] = None,
    gender: Optional[str] = None,
    min_age: Optional[float] = None,
    max_age: Optional[float] = None,
    search: Optional[str] = None
):
    # Get filtered employees
    employees = get_employees(department, position, contract_type, gender, 
                             min_age, max_age, search)
    
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

@app.post("/import/excel")
async def import_excel(file: UploadFile = File(...)):
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
            'Số tuổi': 'age',
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
                    # Keep salary as integer, age as float
                    if field == 'salary':
                        value = int(value)
                    elif field == 'age':
                        value = float(value)
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
        
        # Load existing employees
        with open('nhan_vien.json', 'r', encoding='utf-8') as f:
            existing_employees = json.load(f)
        
        # Replace existing data with new import (not append)
        # This ensures we have a fresh dataset from the Excel
        with open('nhan_vien.json', 'w', encoding='utf-8') as f:
            json.dump(new_employees, f, ensure_ascii=False, indent=2)
        
        return {"message": f"Successfully imported {len(new_employees)} employees", "count": len(new_employees)}
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error processing file: {str(e)}")

# Mount the React build as static files (this must be last to not override API routes)
app.mount("/", StaticFiles(directory="../frontend/build", html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)