import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { salaryInputSchema, insertEmployeeSchema, type SalaryInput, type SalaryResult } from "../shared/schema";
import multer from "multer";
import ExcelJS from "exceljs";
import { ZodError } from "zod";

// Vietnamese tax brackets (quick deduction method)
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

  const personalRelief = 11_000_000;
  const dependentReliefRate = 4_400_000;

  const augSalary = (salary / 21) * 20;
  const overtimePayPIT = Math.floor((augSalary / 22 / 8) * (ot15 + ot20 + ot30));
  const totalSalary = Math.round(augSalary + bonus + allowanceTax + overtimePayPIT);

  const dependentRelief = dependentReliefRate * dependants;
  const employeeInsurance = salary * 0.105;
  const unionFee = Math.min(salary * 0.005, 234_000);
  const hesoCoeff = ot15 * 0.5 + ot20 + ot30 * 2;
  const overtimePayNonPIT = Math.round((augSalary / 22 / 8) * hesoCoeff);

  const assessableIncome = Math.max(0, totalSalary - (employeeInsurance + personalRelief + dependentRelief));

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

const upload = multer({ storage: multer.memoryStorage() });

export async function registerRoutes(app: Express): Promise<Server> {
  // ---------------- Salary Endpoints (still under /api) ----------------

  app.post("/api/salary/calculate", async (req, res) => {
    try {
      const validatedInput = salaryInputSchema.parse(req.body);
      const result = calculateSalary(validatedInput);
      const savedResult = await storage.saveSalaryCalculation(result);
      res.json(savedResult);
    } catch (error: any) {
      if (error instanceof ZodError) {
        res.status(400).json({ message: "Invalid input data", errors: error.errors });
      } else {
        res.status(400).json({ message: error.message });
      }
    }
  });

  app.get("/api/salary/calculations", async (req, res) => {
    try {
      const calculations = await storage.getAllSalaryCalculations();
      res.json(calculations);
    } catch {
      res.status(500).json({ message: "Failed to retrieve calculations" });
    }
  });

  app.get("/api/salary/export", async (req, res) => {
    try {
      const calculations = await storage.exportCalculationsToJson();
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Content-Disposition", "attachment; filename=\"salary_calculations.json\"");
      res.json(calculations);
    } catch {
      res.status(500).json({ message: "Failed to export calculations" });
    }
  });

  app.get("/api/salary/tax-brackets", (req, res) => {
    res.json(TAX_BRACKETS);
  });

  // ---------------- Employee Endpoints (no /api prefix) ----------------

  app.get("/employees", async (req: Request, res: Response) => {
    try {
      const filters = {
        search: req.query.search as string,
        department: req.query.department as string,
        position: req.query.position as string,
        contract_type: req.query.contract_type as string,
        gender: req.query.gender as string,
        min_age: req.query.min_age ? parseInt(req.query.min_age as string) : undefined,
        max_age: req.query.max_age ? parseInt(req.query.max_age as string) : undefined,
      };
      const employees = await storage.getAllEmployees(filters);
      res.json(employees);
    } catch {
      res.status(500).json({ message: "Failed to retrieve employees" });
    }
  });

  app.post("/employees", async (req, res) => {
    try {
      const validatedEmployee = insertEmployeeSchema.parse(req.body);
      const savedEmployee = await storage.saveEmployee(validatedEmployee);
      res.json(savedEmployee);
    } catch (error: any) {
      if (error instanceof ZodError) {
        res.status(400).json({ message: "Invalid employee data", errors: error.errors });
      } else {
        res.status(400).json({ message: error.message });
      }
    }
  });

  app.delete("/employees/:id", async (req, res) => {
    try {
      const success = await storage.deleteEmployee(req.params.id);
      if (success) {
        res.status(204).send();
      } else {
        res.status(404).json({ message: "Employee not found" });
      }
    } catch {
      res.status(500).json({ message: "Failed to delete employee" });
    }
  });

  app.patch("/employees/:id", async (req, res) => {
    try {
      const partialEmployee = insertEmployeeSchema.partial().parse(req.body);
      const updatedEmployee = await storage.updateEmployee(req.params.id, partialEmployee);
      if (updatedEmployee) {
        res.json(updatedEmployee);
      } else {
        res.status(404).json({ message: "Employee not found" });
      }
    } catch (error: any) {
      if (error instanceof ZodError) {
        res.status(400).json({ message: "Invalid employee data", errors: error.errors });
      } else {
        res.status(400).json({ message: error.message });
      }
    }
  });

  // ---------------- Filters & Options ----------------
  app.get("/filter-options", async (req: Request, res: Response) => {
    try {
      const allEmployees = await storage.getAllEmployees();
      const departments = [...new Set(allEmployees.map(emp => emp.department))].filter(Boolean);
      const positions = [...new Set(allEmployees.map(emp => emp.position))].filter(Boolean);
      const genders = [...new Set(allEmployees.map(emp => emp.gender))].filter(Boolean);
      const contract_types = [...new Set(allEmployees.map(emp => emp.contract_type))].filter(Boolean);

      res.json({ departments, positions, genders, contract_types });
    } catch {
      res.status(500).json({ message: "Failed to retrieve filter options" });
    }
  });

  // ---------------- Excel Export & Import ----------------
  app.get("/export/excel", async (req: Request, res: Response) => {
    try {
      const filters = {
        search: req.query.search as string,
        department: req.query.department as string,
        position: req.query.position as string,
        contract_type: req.query.contract_type as string,
        gender: req.query.gender as string,
        min_age: req.query.min_age ? parseInt(req.query.min_age as string) : undefined,
        max_age: req.query.max_age ? parseInt(req.query.max_age as string) : undefined,
      };
      const employees = await storage.getAllEmployees(filters);

      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("Employees");

      if (employees.length > 0) {
        const headers = Object.keys(employees[0]);
        sheet.addRow(headers);
        employees.forEach(emp => sheet.addRow(Object.values(emp)));
      }

      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", "attachment; filename=employees.xlsx");
      await workbook.xlsx.write(res);
      res.end();
    } catch {
      res.status(500).json({ message: "Failed to export employees" });
    }
  });

  app.post("/import/excel", upload.single("file"), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(req.file.buffer);
      const sheet = workbook.getWorksheet(1);
      const employees: any[] = [];

      const headers = sheet.getRow(1).values as string[];
      sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        if (rowNumber > 1) {
          const employee: Record<string, any> = {};
          headers.forEach((header, idx) => {
            if (header) employee[header] = row.getCell(idx).value;
          });
          const validated = insertEmployeeSchema.parse(employee);
          employees.push(validated);
        }
      });

      await storage.bulkSaveEmployees(employees);
      res.json({ message: "Import successful", count: employees.length });
    } catch (error: any) {
      if (error instanceof ZodError) {
        res.status(400).json({ message: "Invalid Excel data", errors: error.errors });
      } else {
        res.status(400).json({ message: error.message });
      }
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
