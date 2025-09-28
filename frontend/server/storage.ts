import { SalaryResult, SalaryInput, SelectEmployee, InsertEmployee } from "../shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Salary calculations
  saveSalaryCalculation(calculation: SalaryResult): Promise<SalaryResult>;
  getSalaryCalculation(id: string): Promise<SalaryResult | undefined>;
  getAllSalaryCalculations(): Promise<SalaryResult[]>;
  deleteSalaryCalculation(id: string): Promise<boolean>;
  
  // Employee management
  saveEmployee(employee: InsertEmployee): Promise<SelectEmployee>;
  getEmployee(id: string): Promise<SelectEmployee | undefined>;
  getAllEmployees(): Promise<SelectEmployee[]>;
  deleteEmployee(id: string): Promise<boolean>;
  updateEmployee(id: string, employee: Partial<InsertEmployee>): Promise<SelectEmployee | undefined>;
  
  // Export functionality
  exportCalculationsToJson(): Promise<SalaryResult[]>;
}

export class MemStorage implements IStorage {
  [x: string]: any;
  private calculations: Map<string, SalaryResult>;
  private employees: Map<string, SelectEmployee>;

  constructor() {
    this.calculations = new Map();
    this.employees = new Map();
    
    // Add initial sample employee with calculated values
    this.initializeSampleEmployee();
  }
  
  private initializeSampleEmployee() {
    // Sample values from the form
    const salary = 10000000;
    const bonus = 500000;
    const allowanceTax = 200000;
    const ot15 = 10;
    const ot20 = 5;
    const ot30 = 2;
    const dependants = 2;
    const advance = 0;
    
    // Calculate derived values
    const augSalary = Math.round((salary / 21) * 20);
    const overtimePayPIT = Math.floor((augSalary / 22 / 8) * (ot15 + ot20 + ot30));
    const totalSalary = Math.round(augSalary + bonus + allowanceTax + overtimePayPIT);
    const personalRelief = 11000000;
    const dependentRelief = 4400000 * dependants;
    const employeeInsurance = salary * 0.105;
    const unionFee = Math.min(salary * 0.005, 234000);
    const hesoCoeff = ot15 * 0.5 + ot20 + ot30 * 2;
    const overtimePayNonPIT = Math.round((augSalary / 22 / 8) * hesoCoeff);
    const assessableIncome = Math.max(0, totalSalary - (employeeInsurance + personalRelief + dependentRelief));
    
    // Calculate progressive tax
    const TAX_BRACKETS = [
      { limit: 5000000, rate: 0.05, deduction: 0 },
      { limit: 10000000, rate: 0.10, deduction: 250000 },
      { limit: 18000000, rate: 0.15, deduction: 750000 },
      { limit: 32000000, rate: 0.20, deduction: 1650000 },
      { limit: 52000000, rate: 0.25, deduction: 3250000 },
      { limit: 80000000, rate: 0.30, deduction: 5850000 },
      { limit: Infinity, rate: 0.35, deduction: 9850000 },
    ];
    
    let pit = 0;
    for (const { limit, rate, deduction } of TAX_BRACKETS) {
      if (assessableIncome <= limit) {
        pit = assessableIncome * rate - deduction;
        break;
      }
    }
    const personalIncomeTax = Math.round(Math.max(pit, 0));
    // Match the form's Total OT hours calculation
    const totalOTHours = Math.round(ot15 + ot20 + ot30 + ot15 * 0.5 + ot20 + ot30 * 2);
    const totalNetIncome = Math.round(totalSalary - personalIncomeTax - employeeInsurance - unionFee + overtimePayNonPIT - advance);
    
    const sampleEmployee: SelectEmployee = {
      id: "sample-001",
      employeeNo: "VIVN-0001",
      name: "Nguyễn Văn A",
      augSalary,
      totalOTHours,
      totalNetIncome,
      salary,
      bonus,
      allowanceTax,
      ot15,
      ot20,
      ot30,
      dependants,
      advance,
      overtimePayPIT,
      totalSalary,
      personalRelief,
      dependentRelief,
      assessableIncome,
      personalIncomeTax,
      employeeInsurance,
      unionFee,
      overtimePayNonPIT,
      calculatedAt: new Date().toISOString(),
    };
    
    this.employees.set(sampleEmployee.id, sampleEmployee);
  }

  async saveSalaryCalculation(calculation: SalaryResult): Promise<SalaryResult> {
    const id = randomUUID();
    const calculationWithId = {
      ...calculation,
      id,
      calculatedAt: new Date().toISOString(),
    };
    this.calculations.set(id, calculationWithId);
    return calculationWithId;
  }

  async getSalaryCalculation(id: string): Promise<SalaryResult | undefined> {
    return this.calculations.get(id);
  }

  async getAllSalaryCalculations(): Promise<SalaryResult[]> {
    return Array.from(this.calculations.values());
  }

  async deleteSalaryCalculation(id: string): Promise<boolean> {
    return this.calculations.delete(id);
  }

  async exportCalculationsToJson(): Promise<SalaryResult[]> {
    return this.getAllSalaryCalculations();
  }

  async saveEmployee(employee: InsertEmployee): Promise<SelectEmployee> {
    const id = randomUUID();
    const newEmployee: SelectEmployee = {
      ...employee,
      id,
    };
    this.employees.set(id, newEmployee);
    return newEmployee;
  }

  async getEmployee(id: string): Promise<SelectEmployee | undefined> {
    return this.employees.get(id);
  }

  async getAllEmployees(): Promise<SelectEmployee[]> {
    return Array.from(this.employees.values());
  }

  async deleteEmployee(id: string): Promise<boolean> {
    return this.employees.delete(id);
  }

  async updateEmployee(id: string, employee: Partial<InsertEmployee>): Promise<SelectEmployee | undefined> {
    const existing = this.employees.get(id);
    if (!existing) return undefined;
    
    const updated: SelectEmployee = {
      ...existing,
      ...employee,
    };
    this.employees.set(id, updated);
    return updated;
  }
}

export const storage = new MemStorage();
