from fastapi import FastAPI, HTTPException, Query
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
    address: str
    current_address: str
    phone: str
    education_level: str
    department: str
    position: str
    contract_id: str
    contract_type: str
    contract_sign_date: str
    salary: int
    last_salary_adjustment: str
    tax_code: int
    social_insurance_number: int
    medical_insurance_hospital: str
    bank_account: int
    pvi_care: str
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
    min_salary: Optional[int] = None
    max_salary: Optional[int] = None
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

@app.get("/")
def read_root():
    return {"message": "HR Employee Management API", "version": "1.0.0"}

@app.get("/employees", response_model=List[Employee])
def get_employees(
    department: Optional[str] = None,
    position: Optional[str] = None,
    contract_type: Optional[str] = None,
    gender: Optional[str] = None,
    min_salary: Optional[int] = None,
    max_salary: Optional[int] = None,
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
            
        # Salary range filter
        emp_salary = emp.get("salary", 0)
        if min_salary is not None and emp_salary < min_salary:
            continue
        if max_salary is not None and emp_salary > max_salary:
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
    min_salary: Optional[int] = None,
    max_salary: Optional[int] = None,
    min_age: Optional[float] = None,
    max_age: Optional[float] = None,
    search: Optional[str] = None
):
    # Get filtered employees
    employees = get_employees(department, position, contract_type, gender, 
                             min_salary, max_salary, min_age, max_age, search)
    
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

# Mount the React build as static files (this must be last to not override API routes)
app.mount("/", StaticFiles(directory="../frontend/build", html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)