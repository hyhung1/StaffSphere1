import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { salaryInputSchema, insertEmployeeSchema, type SalaryInput, type SalaryResult } from "@shared/schema";

// Vietnamese tax brackets for 2024
const TAX_BRACKETS = [
  { limit: 5_000_000, rate: 0.05, deduction: 0 },
  { limit: 10_000_000, rate: 0.10, deduction: 250_000 },
  { limit: 18_000_000, rate: 0.15, deduction: 750_000 },
  { limit: 32_000_000, rate: 0.20, deduction: 1_650_000 },
  { limit: 52_000_000, rate: 0.25, deduction: 3_250_000 },
  { limit: 80_000_000, rate: 0.30, deduction: 5_850_000 },
  { limit: Infinity, rate: 0.35, deduction: 9_850_000 },
];

function calculateSalary(input: SalaryInput): SalaryResult {
  const {
    employeeNo,
    name,
    salary,
    bonus,
    allowanceTax,
    ot15,
    ot20,
    ot30,
    dependants,
    advance,
  } = input;

  // Constants
  const personalRelief = 11_000_000;
  const dependentReliefRate = 4_400_000;

  // Calculations based on Python logic
  const augSalary = (salary / 21) * 20;
  const overtimePayPIT = Math.floor((augSalary / 22 / 8) * (ot15 + ot20 + ot30));
  const totalSalary = Math.round(augSalary + bonus + allowanceTax + overtimePayPIT);
  const dependentRelief = dependentReliefRate * dependants;
  const employeeInsurance = salary * 0.105;
  const unionFee = Math.min(salary * 0.005, 234_000);
  const hesoCoeff = ot15 * 0.5 + ot20 + ot30 * 2;
  const overtimePayNonPIT = Math.round((augSalary / 22 / 8) * hesoCoeff);
  const assessableIncome = Math.max(0, totalSalary - (employeeInsurance + personalRelief + dependentRelief));

  // Calculate progressive tax
  let personalIncomeTax = 0;
  for (const bracket of TAX_BRACKETS) {
    if (assessableIncome <= bracket.limit) {
      personalIncomeTax = assessableIncome * bracket.rate - bracket.deduction;
      break;
    }
  }
  personalIncomeTax = Math.round(Math.max(personalIncomeTax, 0));

  const totalNetIncome = Math.round(
    totalSalary - personalIncomeTax - employeeInsurance - unionFee + overtimePayNonPIT - advance
  );

  const totalOTHours = ot15 + ot20 + ot30;

  return {
    employeeNo,
    name,
    salary,
    bonus,
    allowanceTax,
    ot15,
    ot20,
    ot30,
    dependants,
    advance,
    augSalary: Math.round(augSalary),
    overtimePayPIT,
    totalSalary,
    personalRelief,
    dependentRelief,
    assessableIncome,
    personalIncomeTax,
    employeeInsurance,
    unionFee,
    overtimePayNonPIT,
    hesoCoeff,
    totalOTHours,
    totalNetIncome,
    calculatedAt: new Date().toISOString(),
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Calculate salary endpoint
  app.post("/api/salary/calculate", async (req, res) => {
    try {
      const validatedInput = salaryInputSchema.parse(req.body);
      const result = calculateSalary(validatedInput);
      const savedResult = await storage.saveSalaryCalculation(result);
      res.json(savedResult);
    } catch (error: any) {
      res.status(400).json({ 
        message: "Invalid input data", 
        errors: error.errors || [error.message] 
      });
    }
  });

  // Get all calculations
  app.get("/api/salary/calculations", async (req, res) => {
    try {
      const calculations = await storage.getAllSalaryCalculations();
      res.json(calculations);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to retrieve calculations" });
    }
  });

  // Export calculations to JSON
  app.get("/api/salary/export", async (req, res) => {
    try {
      const calculations = await storage.exportCalculationsToJson();
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename="salary_calculations.json"');
      res.json(calculations);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to export calculations" });
    }
  });

  // Get tax brackets (for reference)
  app.get("/api/salary/tax-brackets", (req, res) => {
    res.json(TAX_BRACKETS);
  });

  // Employee management endpoints
  
  // Get all employees
  app.get("/api/employees", async (req, res) => {
    try {
      const employees = await storage.getAllEmployees();
      res.json(employees);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to retrieve employees" });
    }
  });

  // Create new employee from calculation
  app.post("/api/employees", async (req, res) => {
    try {
      const validatedEmployee = insertEmployeeSchema.parse(req.body);
      const savedEmployee = await storage.saveEmployee(validatedEmployee);
      res.json(savedEmployee);
    } catch (error: any) {
      res.status(400).json({ 
        message: "Invalid employee data", 
        errors: error.errors || [error.message] 
      });
    }
  });

  // Delete employee
  app.delete("/api/employees/:id", async (req, res) => {
    try {
      const success = await storage.deleteEmployee(req.params.id);
      if (success) {
        res.status(204).send();
      } else {
        res.status(404).json({ message: "Employee not found" });
      }
    } catch (error: any) {
      res.status(500).json({ message: "Failed to delete employee" });
    }
  });

  // Update employee
  app.patch("/api/employees/:id", async (req, res) => {
    try {
      const partialEmployee = insertEmployeeSchema.partial().parse(req.body);
      const updatedEmployee = await storage.updateEmployee(req.params.id, partialEmployee);
      if (updatedEmployee) {
        res.json(updatedEmployee);
      } else {
        res.status(404).json({ message: "Employee not found" });
      }
    } catch (error: any) {
      res.status(400).json({ 
        message: "Invalid employee data", 
        errors: error.errors || [error.message] 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
