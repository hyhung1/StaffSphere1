"""
Pydantic models that mirror TypeScript schemas from shared/schema.ts.
Maintains exact JSON compatibility with the frontend using camelCase field names.
"""
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field, field_validator


class Employee(BaseModel):
    """Employee information model"""
    id: Optional[str] = None
    employeeNo: str = Field(..., min_length=1, description="Employee number is required")
    name: str = Field(..., min_length=1, description="Employee name is required")
    
    @field_validator('employeeNo')
    @classmethod
    def validate_employee_no(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Employee number is required")
        return v
    
    @field_validator('name')
    @classmethod
    def validate_name(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Employee name is required")
        return v


class SalaryInput(BaseModel):
    """Salary calculation input model"""
    # Required fields
    employeeNo: str = Field(..., min_length=1, description="Employee number is required")
    name: str = Field(..., min_length=1, description="Employee name is required")
    salary: float = Field(..., ge=0, description="Base salary must be positive")
    
    # Fields with defaults
    bonus: float = Field(default=0, ge=0, description="Bonus must be positive")
    allowanceTax: float = Field(default=0, ge=0, description="Allowance must be positive")
    ot15: float = Field(default=0, ge=0, description="OT 1.5x hours must be positive")
    ot20: float = Field(default=0, ge=0, description="OT 2.0x hours must be positive")
    ot30: float = Field(default=0, ge=0, description="OT 3.0x hours must be positive")
    dependants: float = Field(default=0, ge=0, description="Dependents must be positive")
    advance: float = Field(default=0, ge=0, description="Advance payment must be positive")
    actualDaysWorked: float = Field(default=20, ge=1, description="Actual days worked must be positive")
    totalWorkdays: float = Field(default=20, ge=1, description="Total workdays must be positive")
    
    # Additional editable fields (optional) - Frontend may send these from form
    augSalary: Optional[float] = Field(default=None)
    insuranceEmployee: Optional[float] = Field(default=None)
    personalRelief: Optional[float] = Field(default=None)
    dependentRelief: Optional[float] = Field(default=None)
    pitNonTaxableIncome: Optional[float] = Field(default=None)
    totalOTHours: Optional[float] = Field(default=None)
    overtimeNonePayPIT: Optional[float] = Field(default=None)
    overtimePayPIT: Optional[float] = Field(default=None)
    totalSalary: Optional[float] = Field(default=None)
    assessableIncome: Optional[float] = Field(default=None)
    personalIncomeTax: Optional[float] = Field(default=None)
    truAdv: Optional[float] = Field(default=None)
    doanPhi: Optional[float] = Field(default=None)
    totalNetIncome: Optional[float] = Field(default=None)
    
    @field_validator('employeeNo')
    @classmethod
    def validate_employee_no(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Employee number is required")
        return v
    
    @field_validator('name')
    @classmethod
    def validate_name(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Employee name is required")
        return v
    
    @field_validator('salary')
    @classmethod
    def validate_salary(cls, v: float) -> float:
        if v is not None and v < 0:
            raise ValueError("Base salary must be positive")
        return v
    
    @field_validator('bonus')
    @classmethod
    def validate_bonus(cls, v: float) -> float:
        if v is not None and v < 0:
            raise ValueError("Bonus must be positive")
        return v if v is not None else 0
    
    @field_validator('allowanceTax')
    @classmethod
    def validate_allowance_tax(cls, v: float) -> float:
        if v is not None and v < 0:
            raise ValueError("Allowance must be positive")
        return v if v is not None else 0
    
    @field_validator('ot15')
    @classmethod
    def validate_ot15(cls, v: float) -> float:
        if v is not None and v < 0:
            raise ValueError("OT 1.5x hours must be positive")
        return v if v is not None else 0
    
    @field_validator('ot20')
    @classmethod
    def validate_ot20(cls, v: float) -> float:
        if v is not None and v < 0:
            raise ValueError("OT 2.0x hours must be positive")
        return v if v is not None else 0
    
    @field_validator('ot30')
    @classmethod
    def validate_ot30(cls, v: float) -> float:
        if v is not None and v < 0:
            raise ValueError("OT 3.0x hours must be positive")
        return v if v is not None else 0
    
    @field_validator('dependants')
    @classmethod
    def validate_dependants(cls, v: float) -> float:
        if v is not None and v < 0:
            raise ValueError("Dependents must be positive")
        return v if v is not None else 0
    
    @field_validator('advance')
    @classmethod
    def validate_advance(cls, v: float) -> float:
        if v is not None and v < 0:
            raise ValueError("Advance payment must be positive")
        return v if v is not None else 0


class SalaryResult(BaseModel):
    """Salary calculation result model"""
    # Input fields
    employeeNo: str
    name: str
    salary: float
    bonus: float
    allowanceTax: float
    ot15: float
    ot20: float
    ot30: float
    dependants: float
    advance: float
    actualDaysWorked: float
    totalWorkdays: float
    
    # Calculated fields
    augSalary: float
    overtimePayPIT: float
    totalSalary: float
    personalRelief: float
    dependentRelief: float
    assessableIncome: float
    personalIncomeTax: float
    companyInsurance: float
    employeeInsurance: float
    unionFee: float
    overtimePayNonPIT: float
    heSo: float
    totalOTHours: float
    totalNetIncome: float
    
    # Timestamps (stored as ISO string for JSON compatibility)
    calculatedAt: str


class InsertEmployee(BaseModel):
    """Schema for inserting employees (excludes id field)"""
    employeeNo: str
    name: str
    augSalary: float  # "Aug's Salary" field
    totalOTHours: float  # Total overtime hours
    totalNetIncome: float  # Total net income
    salary: float
    bonus: float
    allowanceTax: float
    ot15: float
    ot20: float
    ot30: float
    dependants: float
    advance: float
    actualDaysWorked: float
    totalWorkdays: float
    overtimePayPIT: float
    totalSalary: float
    personalRelief: float
    dependentRelief: float
    assessableIncome: float
    personalIncomeTax: float
    companyInsurance: float
    employeeInsurance: float
    unionFee: float
    overtimePayNonPIT: float
    heSo: float
    calculatedAt: str


class SelectEmployee(BaseModel):
    """Schema for selecting employees (includes id field)"""
    id: str
    employeeNo: str
    name: str
    augSalary: float  # "Aug's Salary" field
    totalOTHours: float  # Total overtime hours
    totalNetIncome: float  # Total net income
    salary: float
    bonus: float
    allowanceTax: float
    ot15: float
    ot20: float
    ot30: float
    dependants: float
    advance: float
    actualDaysWorked: float
    totalWorkdays: float
    overtimePayPIT: float
    totalSalary: float
    personalRelief: float
    dependentRelief: float
    assessableIncome: float
    personalIncomeTax: float
    companyInsurance: float
    employeeInsurance: float
    unionFee: float
    overtimePayNonPIT: float
    heSo: float
    calculatedAt: str


class EmployeeUpdate(BaseModel):
    """Schema for updating employees (all fields optional for PATCH operations)"""
    employeeNo: Optional[str] = None
    name: Optional[str] = None
    augSalary: Optional[float] = None
    totalOTHours: Optional[float] = None
    totalNetIncome: Optional[float] = None
    salary: Optional[float] = None
    bonus: Optional[float] = None
    allowanceTax: Optional[float] = None
    ot15: Optional[float] = None
    ot20: Optional[float] = None
    ot30: Optional[float] = None
    dependants: Optional[float] = None
    advance: Optional[float] = None
    actualDaysWorked: Optional[float] = None
    totalWorkdays: Optional[float] = None
    overtimePayPIT: Optional[float] = None
    totalSalary: Optional[float] = None
    personalRelief: Optional[float] = None
    dependentRelief: Optional[float] = None
    assessableIncome: Optional[float] = None
    personalIncomeTax: Optional[float] = None
    companyInsurance: Optional[float] = None
    employeeInsurance: Optional[float] = None
    unionFee: Optional[float] = None
    overtimePayNonPIT: Optional[float] = None
    heSo: Optional[float] = None
    calculatedAt: Optional[str] = None


class TaxBracket(BaseModel):
    """Tax bracket model for reference"""
    limit: float
    rate: float
    deduction: float

class EmployeeSphere(BaseModel):
    full_name: str
    dob: str
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
    search: Optional[str] = None