import { z } from "zod";
import { pgTable, text, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

// Employee information schema
export const employeeSchema = z.object({
  id: z.string().optional(),
  employeeNo: z.string().min(1, "Employee number is required"),
  name: z.string().min(1, "Employee name is required"),
});

// Salary calculation input schema
export const salaryInputSchema = z.object({
  employeeNo: z.string().min(1, "Employee number is required"),
  name: z.string().min(1, "Employee name is required"),
  salary: z.number().min(0, "Base salary must be positive"),
  bonus: z.number().min(0, "Bonus must be positive").default(0),
  allowanceTax: z.number().min(0, "Allowance must be positive").default(0),
  ot15: z.number().min(0, "OT 1.5x hours must be positive").default(0),
  ot20: z.number().min(0, "OT 2.0x hours must be positive").default(0),
  ot30: z.number().min(0, "OT 3.0x hours must be positive").default(0),
  dependants: z.number().min(0, "Dependents must be positive").default(0),
  advance: z.number().min(0, "Advance payment must be positive").default(0),
  
  // Additional editable fields
  augSalary: z.number().min(0).optional(),
  insuranceEmployee: z.number().min(0).optional(),
  personalRelief: z.number().min(0).optional(),
  dependentRelief: z.number().min(0).optional(),
  pitNonTaxableIncome: z.number().min(0).optional(),
  totalOTHours: z.number().min(0).optional(),
  overtimeNonePayPIT: z.number().min(0).optional(),
  overtimePayPIT: z.number().min(0).optional(),
  totalSalary: z.number().min(0).optional(),
  assessableIncome: z.number().min(0).optional(),
  personalIncomeTax: z.number().min(0).optional(),
  truAdv: z.number().min(0).optional(),
  doanPhi: z.number().min(0).optional(),
  totalNetIncome: z.number().min(0).optional(),
});

// Salary calculation result schema
export const salaryResultSchema = z.object({
  // Input fields
  employeeNo: z.string(),
  name: z.string(),
  salary: z.number(),
  bonus: z.number(),
  allowanceTax: z.number(),
  ot15: z.number(),
  ot20: z.number(),
  ot30: z.number(),
  dependants: z.number(),
  advance: z.number(),
  
  // Calculated fields
  augSalary: z.number(),
  overtimePayPIT: z.number(),
  totalSalary: z.number(),
  personalRelief: z.number(),
  dependentRelief: z.number(),
  assessableIncome: z.number(),
  personalIncomeTax: z.number(),
  companyInsurance: z.number(),
  employeeInsurance: z.number(),
  unionFee: z.number(),
  overtimePayNonPIT: z.number(),
  heSo: z.number(),
  totalOTHours: z.number(),
  totalNetIncome: z.number(),
  
  // Timestamps
  calculatedAt: z.string(),
});

export type SalaryInput = z.infer<typeof salaryInputSchema>;
export type SalaryResult = z.infer<typeof salaryResultSchema>;
export type Employee = z.infer<typeof employeeSchema>;

// Employee table for storing calculated salary records
export const employees = pgTable("employees", {
  id: text("id").primaryKey(),
  employeeNo: text("employee_no").notNull(),
  name: text("name").notNull(),
  augSalary: real("aug_salary").notNull(), // "Aug's Salary" field
  totalOTHours: real("total_ot_hours").notNull(), // Total overtime hours
  totalNetIncome: real("total_net_income").notNull(), // Total net income
  salary: real("salary").notNull(),
  bonus: real("bonus").notNull(),
  allowanceTax: real("allowance_tax").notNull(),
  ot15: real("ot_15").notNull(),
  ot20: real("ot_20").notNull(),
  ot30: real("ot_30").notNull(),
  dependants: real("dependants").notNull(),
  advance: real("advance").notNull(),
  overtimePayPIT: real("overtime_pay_pit").notNull(),
  totalSalary: real("total_salary").notNull(),
  personalRelief: real("personal_relief").notNull(),
  dependentRelief: real("dependent_relief").notNull(),
  assessableIncome: real("assessable_income").notNull(),
  personalIncomeTax: real("personal_income_tax").notNull(),
  companyInsurance: real("company_insurance").notNull(),
  employeeInsurance: real("employee_insurance").notNull(),
  unionFee: real("union_fee").notNull(),
  overtimePayNonPIT: real("overtime_pay_non_pit").notNull(),
  heSo: real("he_so").notNull(),
  calculatedAt: timestamp("calculated_at", { mode: "string" }).notNull(),
});

// Schema for inserting employees
export const insertEmployeeSchema = createInsertSchema(employees).omit({ id: true });
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type SelectEmployee = typeof employees.$inferSelect;

// Tax bracket type for reference
export type TaxBracket = {
  limit: number;
  rate: number;
  deduction: number;
};
