import { useState, useEffect, useCallback, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { Edit } from "lucide-react";
import { salaryInputSchema, type SalaryInput, type SelectEmployee } from "../../shared/schema";
import { formatNumber, formatNumberWithVND, parseFormattedNumber } from "./lib/salary-calculator";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "./lib/queryClient";
import { useToast } from "./hooks/use-toast";

interface SalaryFormProps {
  onCalculationChange?: (result: any) => void;
  selectedEmployee?: SelectEmployee | null;
}

export interface SalaryFormRef {
  reset: () => void;
}

export function SalaryForm({ onCalculationChange, selectedEmployee }: SalaryFormProps) {
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [rawInputValues, setRawInputValues] = useState<Record<string, string>>({});
  const [, forceUpdate] = useState({});
  const [actualDaysWorked, setActualDaysWorked] = useState<number>(20);
  const [totalWorkdays, setTotalWorkdays] = useState<number>(20);
  const { toast } = useToast();
  
  // Get current username for cache key to prevent data leakage between users
  const getCurrentUsername = () => {
    const currentUserStr = localStorage.getItem('currentUser');
    if (currentUserStr) {
      try {
        const currentUser = JSON.parse(currentUserStr);
        return currentUser.username || 'anonymous';
      } catch (error) {
        return 'anonymous';
      }
    }
    return 'anonymous';
  };
  
  const currentUsername = getCurrentUsername();
  
  // Mutation to bulk update a field for all employees
  const bulkUpdateField = useMutation({
    mutationFn: async ({ field, value }: { field: string; value: number }) => {
      const res = await apiRequest("PATCH", "/api/payroll/employees/bulk-update", { field, value });
      return res.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/payroll/employees", currentUsername] });
      toast({
        title: "Success",
        description: `Updated ${variables.field} for all employees`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update all employees",
        variant: "destructive",
      });
    },
  });

  const emptyValues = useMemo(() => ({
    employeeNo: "",
    name: "",
    salary: 0,
    bonus: 0,
    allowanceTax: 0,
    ot15: 0,
    ot20: 0,
    ot30: 0,
    dependants: 0,
    advance: 0,
  }), []);

  const form = useForm<SalaryInput>({
    resolver: zodResolver(salaryInputSchema),
    defaultValues: {
      employeeNo: "VIVN-0001",
      name: "Huỳnh Nguyễn Minh Hoàng",
      salary: 10000000,
      bonus: 0,
      allowanceTax: 200000,
      ot15: 10,
      ot20: 5,
      ot30: 2,
      dependants: 2,
      advance: 0,
    },
  });

  // Watch all form values and calculate results in real-time
  const watchedValues = form.watch();
  
  // Force re-render when salary or other key values change
  useEffect(() => {
    forceUpdate({});
  }, [watchedValues.salary, watchedValues.bonus, watchedValues.allowanceTax, watchedValues.personalRelief, watchedValues.dependentRelief, watchedValues.dependants, actualDaysWorked, totalWorkdays]);
  
  // Populate form when an employee is selected
  useEffect(() => {
    console.log('selectedEmployee changed:', selectedEmployee);
    if (selectedEmployee) {
      form.setValue("employeeNo", selectedEmployee.employeeNo || "");
      form.setValue("name", selectedEmployee.name || "");
      form.setValue("salary", selectedEmployee.salary || 0);
      form.setValue("bonus", selectedEmployee.bonus || 0);
      form.setValue("allowanceTax", selectedEmployee.allowanceTax || 0);
      form.setValue("ot15", selectedEmployee.ot15 || 0);
      form.setValue("ot20", selectedEmployee.ot20 || 0);
      form.setValue("ot30", selectedEmployee.ot30 || 0);
      form.setValue("dependants", selectedEmployee.dependants || 0);
      form.setValue("advance", selectedEmployee.advance || 0);
      form.setValue("personalRelief", selectedEmployee.personalRelief || 11000000);
      form.setValue("dependentRelief", selectedEmployee.dependentRelief !== undefined ? selectedEmployee.dependentRelief : 4400000 * (selectedEmployee.dependants || 0));
      
      // Set actualDaysWorked and totalWorkdays if available
      if (selectedEmployee.actualDaysWorked !== undefined) {
        setActualDaysWorked(selectedEmployee.actualDaysWorked);
      } else {
        setActualDaysWorked(20);
      }
      if (selectedEmployee.totalWorkdays !== undefined) {
        setTotalWorkdays(selectedEmployee.totalWorkdays);
      } else {
        setTotalWorkdays(20);
      }
      
      // Clear focused fields and raw inputs to ensure proper display
      setFocusedField(null);
      setRawInputValues({});
      
      console.log('Form updated with employee:', selectedEmployee.employeeNo, selectedEmployee.name);
    } else {
      // When no employee is selected, reset to default values
      console.log('No employee selected, resetting to defaults');
      form.reset({
        employeeNo: "VIVN-0001",
        name: "Huỳnh Nguyễn Minh Hoàng",
        salary: 10000000,
        bonus: 0,
        allowanceTax: 200000,
        ot15: 10,
        ot20: 5,
        ot30: 2,
        dependants: 2,
        advance: 0,
      });
      setActualDaysWorked(20);
      setTotalWorkdays(20);
      setFocusedField(null);
      setRawInputValues({});
    }
  }, [selectedEmployee, form]);
  
  useEffect(() => {
    if (!onCalculationChange) return;
    
    // Get all values with defaults
    const employeeNo = watchedValues.employeeNo || "";
    const name = watchedValues.name || "";
    const salary = watchedValues.salary || 0;
    const bonus = watchedValues.bonus || 0;
    const allowanceTax = watchedValues.allowanceTax || 0;
    const ot15 = watchedValues.ot15 || 0;
    const ot20 = watchedValues.ot20 || 0;
    const ot30 = watchedValues.ot30 || 0;
    const dependants = watchedValues.dependants || 0;
    const advance = watchedValues.advance || 0;
    
    // Calculate all derived values
    const augSalary = Math.round((salary / totalWorkdays) * actualDaysWorked);
    const overtimePayPIT = Math.floor((augSalary / 22 / 8) * (ot15 + ot20 + ot30));
    const personalRelief = watchedValues.personalRelief || 11000000;
    const dependentRelief = watchedValues.dependentRelief !== undefined ? watchedValues.dependentRelief : 4400000 * dependants;
    const employeeInsurance = salary * 0.105;
    const unionFee = Math.min(salary * 0.005, 234000);
    const hesoCoeff = ot15 * 0.5 + ot20 + ot30 * 2;
    const overtimePayNonPIT = Math.round((augSalary / 22 / 8) * hesoCoeff);
    
    // A. Salary and Allowance = Day-work salary + Over Time + Allowance must pay PIT (excluding bonus)
    const totalOverTimePay = overtimePayPIT + overtimePayNonPIT;
    const totalSalary = Math.round(augSalary + totalOverTimePay + allowanceTax);
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
    const totalNetIncome = Math.round(totalSalary - personalIncomeTax - employeeInsurance - unionFee - advance);
    
    // Pass the calculated result to parent
    onCalculationChange({
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
      augSalary,
      overtimePayPIT,
      totalSalary,
      personalRelief,
      dependentRelief,
      assessableIncome,
      personalIncomeTax,
      employeeInsurance,
      unionFee,
      overtimePayNonPIT,
      totalOTHours,
      totalNetIncome,
      actualDaysWorked,
      totalWorkdays,
      calculatedAt: new Date().toISOString(),
    });
  }, [watchedValues, onCalculationChange, actualDaysWorked, totalWorkdays]);
  
  // Helper function for handling Enter key press
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>, fieldName: string) => {
    if (e.key === 'Enter') {
      // Trigger the same logic as onBlur - commit the current value
      setFocusedField(null);
      setRawInputValues(prev => ({ ...prev, [fieldName]: "" }));
      e.currentTarget.blur(); // Remove focus from the input
    }
  }, []);

  // Helper function for handling formatted number input with cursor position management
  const handleFormattedNumberChange = useCallback((
    e: React.ChangeEvent<HTMLInputElement>, 
    fieldName: string
  ) => {
    const input = e.target;
    const value = input.value;
    const cursorPosition = input.selectionStart || 0;
    
    // Count digits before cursor
    let digitsBefore = 0;
    for (let i = 0; i < cursorPosition; i++) {
      if (/\d/.test(value[i])) {
        digitsBefore++;
      }
    }
    
    // Parse and update the value
    const parsedValue = parseFormattedNumber(value);
    form.setValue(fieldName as any, parsedValue, { shouldValidate: true });
    
    // Restore cursor position after React updates the DOM
    setTimeout(() => {
      const formattedValue = formatNumber(parsedValue);
      let newPosition = 0;
      let digitsCount = 0;
      
      // Find position after counting the same number of digits
      for (let i = 0; i < formattedValue.length; i++) {
        if (/\d/.test(formattedValue[i])) {
          digitsCount++;
          if (digitsCount === digitsBefore) {
            newPosition = i + 1;
            break;
          }
        }
        if (digitsCount < digitsBefore) {
          newPosition = i + 1;
        }
      }
      
      // If we've processed all digits and haven't reached digitsBefore, position at end
      if (digitsCount < digitsBefore) {
        newPosition = formattedValue.length;
      }
      
      input.setSelectionRange(newPosition, newPosition);
    }, 0);
  }, [form]);




  return (
    <Card className="w-full max-w-[44rem] h-full flex flex-col">
      <CardContent className="p-6 pt-2 flex-1 overflow-auto">
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-14 pb-3 border-b-2">
            <div className="space-y-1.5">
              <Label htmlFor="employeeNo" className="text-xs font-medium text-muted-foreground">Employee No</Label>
              <Input
                id="employeeNo"
                data-testid="input-employee-no"
                {...form.register("employeeNo")}
                className="w-[68%] h-9 text-[16rem] font-semibold"
              />
              {form.formState.errors.employeeNo && (
                <p className="text-sm text-red-500">{form.formState.errors.employeeNo.message}</p>
              )}
            </div>
            
            <div className="space-y-1.5 -ml-12">
              <Label htmlFor="name" className="text-xs font-medium text-muted-foreground">Full Name</Label>
              <Input
                id="name"
                data-testid="input-employee-name"
                {...form.register("name")}
                className="w-[100%] h-9 text-[16rem] font-semibold"
              />
              {form.formState.errors.name && (
                <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
              )}
            </div>
            
            <div className="space-y-1.5 ml-6">
              <Label htmlFor="advance" className="text-xs font-medium text-muted-foreground">Adv</Label>
              <Input
                id="advance"
                type="text"
                value={
                  focusedField === "advance"
                    ? rawInputValues.advance || form.watch("advance")?.toString() || ""
                    : formatNumberWithVND(form.watch("advance") || 0)
                }
                onChange={(e) => {
                  const inputValue = e.target.value;
                  setRawInputValues(prev => ({ ...prev, advance: inputValue }));
                  const value = parseFormattedNumber(inputValue);
                  form.setValue("advance", value, { shouldValidate: true });
                }}
                onFocus={() => {
                  setFocusedField("advance");
                  if (!rawInputValues.advance && form.watch("advance")) {
                    setRawInputValues(prev => ({ ...prev, advance: form.watch("advance").toString() }));
                  }
                }}
                onBlur={() => {
                  setFocusedField(null);
                  setRawInputValues(prev => ({ ...prev, advance: "" }));
                }}
                onKeyDown={(e) => handleKeyDown(e, "advance")}
                data-testid="input-advance"
                className="w-[72%] h-9 text-[16rem] font-semibold"
              />
            </div>
          </div>

          {/* Salary Components */}
          <div className="space-y-4 ml-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end -ml-6">
              <div className="flex items-center">
                <h3 className="font-medium text-card-foreground border-l-4 border-primary pl-3">
                  Basic Information:
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">Present days:</span>
                <Input
                  id="actualDaysWorked"
                  type="number"
                  value={actualDaysWorked}
                  onChange={(e) => setActualDaysWorked(Number(e.target.value) || 20)}
                  className="w-16 h-8 text-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">Total workdays:</span>
                <Input
                  id="totalWorkday"
                  type="number"
                  value={totalWorkdays}
                  onChange={(e) => setTotalWorkdays(Number(e.target.value) || 20)}
                  className="w-16 h-8 text-sm"
                />
              </div>
            </div>
            
            {/* First row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 -ml-6">
              <div className="space-y-1">
                <Label htmlFor="salary" className=" h-[40px] flex items-center">Salary (VND)</Label>
                <Input
                  id="salary"
                  type="text"
                  data-testid="input-base-salary"
                  value={
                    focusedField === "salary"
                      ? rawInputValues.salary || form.watch("salary")?.toString() || ""
                      : (form.watch("salary") || form.watch("salary") === 0 ? formatNumberWithVND(form.watch("salary")) : "")
                  }
                  onChange={(e) => {
                    const inputValue = e.target.value;
                    // Store the raw input value (including zeros)
                    setRawInputValues(prev => ({ ...prev, salary: inputValue }));
                    // Parse and save the numeric value
                    const value = parseFormattedNumber(inputValue);
                    form.setValue("salary", value, { shouldValidate: true });
                  }}
                  onFocus={() => {
                    setFocusedField("salary");
                    // Initialize raw value if not set
                    if (!rawInputValues.salary && form.watch("salary")) {
                      setRawInputValues(prev => ({ ...prev, salary: form.watch("salary").toString() }));
                    }
                  }}
                  onBlur={() => {
                    setFocusedField(null);
                    // Clear raw value on blur
                    setRawInputValues(prev => ({ ...prev, salary: "" }));
                  }}
                  onKeyDown={(e) => handleKeyDown(e, "salary")}
                  className="w-[62%]"
                />
                {form.formState.errors.salary && (
                  <p className="text-sm text-red-500">{form.formState.errors.salary.message}</p>
                )}
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="augSalary" className=" h-[40px] flex items-center">Actual Salary</Label>
                <Input
                  id="augSalary"
                  type="text"
                  data-testid="input-aug-salary"
                  value={formatNumberWithVND(Math.round((form.watch("salary") || 0) / totalWorkdays * actualDaysWorked))}
                  readOnly
                  className="w-[62%]"
                />
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center gap-2 h-[40px]">
                  <Label htmlFor="bonus" className="block">Bonus</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => {
                      const value = form.watch("bonus");
                      if (value !== undefined && value !== null) {
                        bulkUpdateField.mutate({ field: "bonus", value });
                      }
                    }}
                    title="Apply to all employees"
                  >
                    <img src="../../public/apply-all-icon.png" alt="Apply to all" className="h-4 w-4" />
                  </Button>
                </div>
                <Input
                  id="bonus"
                  type="text"
                  data-testid="input-bonus"
                  value={
                    focusedField === "bonus" 
                      ? rawInputValues.bonus || form.watch("bonus")?.toString() || ""
                      : (form.watch("bonus") || form.watch("bonus") === 0 ? formatNumberWithVND(form.watch("bonus")) : "")
                  }
                  onChange={(e) => {
                    const inputValue = e.target.value;
                    // Store the raw input value (including zeros)
                    setRawInputValues(prev => ({ ...prev, bonus: inputValue }));
                    // Parse and save the numeric value
                    const value = parseFormattedNumber(inputValue);
                    form.setValue("bonus", value, { shouldValidate: true });
                  }}
                  onFocus={() => {
                    setFocusedField("bonus");
                    // Initialize raw value if not set
                    if (!rawInputValues.bonus && form.watch("bonus")) {
                      setRawInputValues(prev => ({ ...prev, bonus: form.watch("bonus").toString() }));
                    }
                  }}
                  onBlur={() => {
                    setFocusedField(null);
                    // Clear raw value on blur
                    setRawInputValues(prev => ({ ...prev, bonus: "" }));
                  }}
                  onKeyDown={(e) => handleKeyDown(e, "bonus")}
                  className="w-[62%]"
                />
                {form.formState.errors.bonus && (
                  <p className="text-sm text-red-500">{form.formState.errors.bonus.message}</p>
                )}
              </div>
            </div>
            
            {/* Second row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 -ml-6">
              <div className="space-y-1">
                <Label htmlFor="dependants" className=" h-[40px] flex items-center">Dependants</Label>
                <Input
                  id="dependants"
                  type="number"
                  min="0"
                  data-testid="input-dependents"
                  {...form.register("dependants", { valueAsNumber: true })}
                  onKeyDown={(e) => handleKeyDown(e, "dependants")}
                  className="w-[62%]"
                />
                {form.formState.errors.dependants && (
                  <p className="text-sm text-red-500">{form.formState.errors.dependants.message}</p>
                )}
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center gap-2 h-[40px]">
                  <Label htmlFor="dependentRelief" className="block">Dependent relief</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => {
                      const value = form.watch("dependentRelief") !== undefined ? 
                        form.watch("dependentRelief") || 0 : 
                        4400000 * (form.watch("dependants") || 0);
                      bulkUpdateField.mutate({ field: "dependentRelief", value });
                    }}
                    title="Apply to all employees"
                  >
                    <img src="../../public/apply-all-icon.png" alt="Apply to all" className="h-4 w-4" />
                  </Button>
                </div>
                <Input
                  id="dependentRelief"
                  type="text"
                  data-testid="input-dependent-relief"
                  value={
                    focusedField === "dependentRelief"
                      ? rawInputValues.dependentRelief || (form.watch("dependentRelief") !== undefined ? form.watch("dependentRelief")?.toString() : (4400000 * (form.watch("dependants") || 0)).toString()) || ""
                      : (form.watch("dependentRelief") !== undefined ? formatNumberWithVND(form.watch("dependentRelief") || 0) : formatNumberWithVND(4400000 * (form.watch("dependants") || 0)))
                  }
                  onChange={(e) => {
                    const inputValue = e.target.value;
                    setRawInputValues(prev => ({ ...prev, dependentRelief: inputValue }));
                    const value = parseFormattedNumber(inputValue);
                    form.setValue("dependentRelief", value, { shouldValidate: true });
                  }}
                  onFocus={() => {
                    setFocusedField("dependentRelief");
                    const value = form.watch("dependentRelief") !== undefined ? form.watch("dependentRelief") : 4400000 * (form.watch("dependants") || 0);
                    if (!rawInputValues.dependentRelief && value) {
                      setRawInputValues(prev => ({ ...prev, dependentRelief: value.toString() }));
                    }
                    if (value && !form.watch("dependentRelief")) {
                      form.setValue("dependentRelief", value);
                    }
                  }}
                  onBlur={() => {
                    setFocusedField(null);
                    setRawInputValues(prev => ({ ...prev, dependentRelief: "" }));
                  }}
                  onKeyDown={(e) => handleKeyDown(e, "dependentRelief")}
                  className="w-[62%]"
                />
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center gap-2 h-[40px]">
                  <Label htmlFor="personalRelief" className="block">Personal relief</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => {
                      const value = form.watch("personalRelief") || 11000000;
                      bulkUpdateField.mutate({ field: "personalRelief", value });
                    }}
                    title="Apply to all employees"
                  >
                    <img src="../../public/apply-all-icon.png" alt="Apply to all" className="h-4 w-4" />
                  </Button>
                </div>
                <Input
                  id="personalRelief"
                  type="text"
                  data-testid="input-personal-relief"
                  value={
                    focusedField === "personalRelief"
                      ? rawInputValues.personalRelief || (form.watch("personalRelief") || 11000000)?.toString() || ""
                      : formatNumberWithVND(form.watch("personalRelief") || 11000000)
                  }
                  onChange={(e) => {
                    const inputValue = e.target.value;
                    setRawInputValues(prev => ({ ...prev, personalRelief: inputValue }));
                    const value = parseFormattedNumber(inputValue);
                    form.setValue("personalRelief", value, { shouldValidate: true });
                  }}
                  onFocus={() => {
                    setFocusedField("personalRelief");
                    if (!rawInputValues.personalRelief && form.watch("personalRelief")) {
                      setRawInputValues(prev => ({ ...prev, personalRelief: (form.watch("personalRelief") || 11000000).toString() }));
                    }
                  }}
                  onBlur={() => {
                    setFocusedField(null);
                    setRawInputValues(prev => ({ ...prev, personalRelief: "" }));
                  }}
                  onKeyDown={(e) => handleKeyDown(e, "personalRelief")}
                  className="w-[62%]"
                />
              </div>
            </div>
            
            {/* Third row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 -ml-6">
              <div className="space-y-1">
                <Label htmlFor="insuranceCompany" className=" h-[40px] leading-tight flex items-end pb-1">Insurance - Company's pay (21.5%)</Label>
                <Input
                  id="insuranceCompany"
                  type="text"
                  data-testid="input-insurance-company"
                  value={(() => {
                    const augSalary = Math.round((form.watch("salary") || 0) / totalWorkdays * actualDaysWorked);
                    return formatNumberWithVND(augSalary * 0.215);
                  })()}
                  readOnly
                  className="w-[62%]"
                />
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="insuranceEmployee" className=" h-[40px] leading-tight flex items-end pb-1">Insurance - Employee's pay (10.5%)</Label>
                <Input
                  id="insuranceEmployee"
                  type="text"
                  data-testid="input-insurance-employee"
                  value={formatNumberWithVND((form.watch("salary") || 0) * 0.105)}
                  readOnly
                  className="w-[62%]"
                />
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="pitNonTaxableIncome" className="block leading-tight text-sm">thu nhập ko tính thuế<br />(PIT)</Label>
                <Input
                  id="pitNonTaxableIncome"
                  type="text"
                  data-testid="input-pit-non-taxable-income"
                  value={(() => {
                    const personalRelief = form.watch("personalRelief") || 11000000;
                    const dependentRelief = form.watch("dependentRelief") !== undefined ? form.watch("dependentRelief") || 0 : 4400000 * (form.watch("dependants") || 0);
                    const insuranceEmployee = (form.watch("salary") || 0) * 0.105;
                    return formatNumberWithVND(personalRelief + dependentRelief + insuranceEmployee);
                  })()}
                  readOnly
                  className="w-[62%]"
                />
              </div>
            </div>
          </div>

          {/* Overtime Hours */}
          <div className="space-y-2">
            <h3 className="font-medium text-card-foreground border-l-4 border-primary pl-3">
              Overtime Information:
            </h3>
            
            {/* First row: OT15, OT20, OT30, Total OT hours */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="space-y-1">
                <Label htmlFor="ot15" className=" h-[40px] flex items-end pb-1">OT (1.5%)</Label>
                <Input
                  id="ot15"
                  type="number"
                  step="0.5"
                  min="0"
                  data-testid="input-ot-15"
                  {...form.register("ot15", { valueAsNumber: true })}
                  onKeyDown={(e) => handleKeyDown(e, "ot15")}
                  className="w-[52%]"
                />
                {form.formState.errors.ot15 && (
                  <p className="text-sm text-red-500">{form.formState.errors.ot15.message}</p>
                )}
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="ot20" className=" h-[40px] flex items-end pb-1">OT (2.0%)</Label>
                <Input
                  id="ot20"
                  type="number"
                  step="0.5"
                  min="0"
                  data-testid="input-ot-20"
                  {...form.register("ot20", { valueAsNumber: true })}
                  onKeyDown={(e) => handleKeyDown(e, "ot20")}
                  className="w-[52%]"
                />
                {form.formState.errors.ot20 && (
                  <p className="text-sm text-red-500">{form.formState.errors.ot20.message}</p>
                )}
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="ot30" className=" h-[40px] flex items-end pb-1">OT (3.0%)</Label>
                <Input
                  id="ot30"
                  type="number"
                  step="0.5"
                  min="0"
                  data-testid="input-ot-30"
                  {...form.register("ot30", { valueAsNumber: true })}
                  onKeyDown={(e) => handleKeyDown(e, "ot30")}
                  className="w-[52%]"
                />
                {form.formState.errors.ot30 && (
                  <p className="text-sm text-red-500">{form.formState.errors.ot30.message}</p>
                )}
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="totalOTHours" className=" h-[40px] flex items-end pb-1">Total OT hours</Label>
                <Input
                  id="totalOTHours"
                  type="text"
                  data-testid="input-total-ot-hours"
                  value={formatNumber(Math.round((form.watch("ot15") || 0) + (form.watch("ot20") || 0) + (form.watch("ot30") || 0) + (form.watch("ot15") || 0) * 0.5 + (form.watch("ot20") || 0) + (form.watch("ot30") || 0) * 2))}
                  readOnly
                  className="w-[52%]"
                />
              </div>
            </div>
            
            {/* Second row: Allowance, OT none pay PIT, OT pay PIT, Total Salary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2 h-[40px]">
                  <Label htmlFor="allowanceTax" className="block">Allowance</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => {
                      const value = form.watch("allowanceTax") || 0;
                      bulkUpdateField.mutate({ field: "allowanceTax", value });
                    }}
                    title="Apply to all employees"
                  >
                    <img src="../../public/apply-all-icon.png" alt="Apply to all" className="h-4 w-4" />
                  </Button>
                </div>
                <Input
                  id="allowanceTax"
                  type="text"
                  data-testid="input-allowance-tax"
                  value={
                    focusedField === "allowanceTax"
                      ? rawInputValues.allowanceTax || form.watch("allowanceTax")?.toString() || ""
                      : formatNumberWithVND(form.watch("allowanceTax") || 0)
                  }
                  onChange={(e) => {
                    const inputValue = e.target.value;
                    setRawInputValues(prev => ({ ...prev, allowanceTax: inputValue }));
                    const value = parseFormattedNumber(inputValue);
                    form.setValue("allowanceTax", value, { shouldValidate: true });
                  }}
                  onFocus={() => {
                    setFocusedField("allowanceTax");
                    if (!rawInputValues.allowanceTax && form.watch("allowanceTax")) {
                      setRawInputValues(prev => ({ ...prev, allowanceTax: form.watch("allowanceTax").toString() }));
                    }
                  }}
                  onBlur={() => {
                    setFocusedField(null);
                    setRawInputValues(prev => ({ ...prev, allowanceTax: "" }));
                  }}
                  onKeyDown={(e) => handleKeyDown(e, "allowanceTax")}
                  className="w-[82%]"
                />
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="overtimeNonePayPIT" className=" h-[40px] flex items-center">OT none pay PIT</Label>
                <Input
                  id="overtimeNonePayPIT"
                  type="text"
                  data-testid="input-overtime-none-pay-pit"
                  value={(() => {
                    const augSalary = Math.round((form.watch("salary") || 0) / totalWorkdays * actualDaysWorked);
                    const ot15 = form.watch("ot15") || 0;
                    const ot20 = form.watch("ot20") || 0;
                    const ot30 = form.watch("ot30") || 0;
                    return formatNumberWithVND(Math.round((augSalary / 22 / 8) * (ot15 * 0.5 + ot20 + ot30 * 2)));
                  })()}
                  readOnly
                  className="w-[82%]"
                />
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="overtimePayPIT" className=" h-[40px] flex items-center">OT pay PIT</Label>
                <Input
                  id="overtimePayPIT"
                  type="text"
                  data-testid="input-overtime-pay-pit"
                  value={(() => {
                    const augSalary = Math.round((form.watch("salary") || 0) / totalWorkdays * actualDaysWorked);
                    const ot15 = form.watch("ot15") || 0;
                    const ot20 = form.watch("ot20") || 0;
                    const ot30 = form.watch("ot30") || 0;
                    return formatNumberWithVND(Math.floor((augSalary / 22 / 8) * (ot15 + ot20 + ot30)));
                  })()}
                  readOnly
                  className="w-[82%]"
                />
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="totalSalary" className=" h-[40px] flex items-center">Total Salary</Label>
                <Input
                  id="totalSalary"
                  type="text"
                  data-testid="input-total-salary"
                  value={(() => {
                    const augSalary = form.watch("augSalary") !== undefined ? form.watch("augSalary") || 0 : Math.round((form.watch("salary") || 0) / totalWorkdays * actualDaysWorked);
                    const bonus = form.watch("bonus") || 0;
                    const allowanceTax = form.watch("allowanceTax") || 0;
                    const ot15 = form.watch("ot15") || 0;
                    const ot20 = form.watch("ot20") || 0;
                    const ot30 = form.watch("ot30") || 0;
                    const otPayPit = Math.floor((augSalary / 22 / 8) * (ot15 + ot20 + ot30));
                    return formatNumberWithVND(Math.round(augSalary + bonus + allowanceTax + otPayPit));
                  })()}
                  readOnly
                  className="w-[85%]"
                />
              </div>
            </div>
          </div>



          {/* After Tax */}
          <div className="space-y-4">
            <h3 className="font-medium text-card-foreground border-l-4 border-primary pl-3">
              After Tax:
            </h3>
            
            {/* Row: Đoàn phí, Assessable income, Personal Income tax, Total Net Income */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="space-y-1">
                <Label htmlFor="doanPhi" className="block min-h-[24px]">Đoàn phí</Label>
                <Input
                  id="doanPhi"
                  type="text"
                  value={(() => {
                    const salary = form.watch("salary") || 0;
                    return formatNumberWithVND(Math.min(salary * 0.005, 234000));
                  })()}
                  readOnly
                  data-testid="input-doan-phi"
                  className="w-[77%]"
                />
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="assessableIncome" className="block min-h-[24px]">Assessable income</Label>
                <Input
                  id="assessableIncome"
                  type="text"
                  value={(() => {
                    const augSalary = form.watch("augSalary") !== undefined ? form.watch("augSalary") || 0 : Math.round((form.watch("salary") || 0) / totalWorkdays * actualDaysWorked);
                    const bonus = form.watch("bonus") || 0;
                    const allowanceTax = form.watch("allowanceTax") || 0;
                    const ot15 = form.watch("ot15") || 0;
                    const ot20 = form.watch("ot20") || 0;
                    const ot30 = form.watch("ot30") || 0;
                    const otPayPit = Math.floor((augSalary / 22 / 8) * (ot15 + ot20 + ot30));
                    const totalSalary = Math.round(augSalary + bonus + allowanceTax + otPayPit);
                    
                    const personalRelief = form.watch("personalRelief") || 11000000;
                    const dependentRelief = form.watch("dependentRelief") !== undefined ? form.watch("dependentRelief") || 0 : 4400000 * (form.watch("dependants") || 0);
                    const insuranceEmployee = (form.watch("salary") || 0) * 0.105;
                    
                    return formatNumberWithVND(Math.max(0, totalSalary - (insuranceEmployee + personalRelief + dependentRelief)));
                  })()}
                  readOnly
                  data-testid="input-assessable-income"
                  className="w-[77%]"
                />
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="personalIncomeTax" className="block min-h-[24px]">Personal Income tax</Label>
                <Input
                  id="personalIncomeTax"
                  type="text"
                  value={(() => {
                    const augSalary = form.watch("augSalary") !== undefined ? form.watch("augSalary") || 0 : Math.round((form.watch("salary") || 0) / totalWorkdays * actualDaysWorked);
                    const bonus = form.watch("bonus") || 0;
                    const allowanceTax = form.watch("allowanceTax") || 0;
                    const ot15 = form.watch("ot15") || 0;
                    const ot20 = form.watch("ot20") || 0;
                    const ot30 = form.watch("ot30") || 0;
                    const otPayPit = Math.floor((augSalary / 22 / 8) * (ot15 + ot20 + ot30));
                    const totalSalary = Math.round(augSalary + bonus + allowanceTax + otPayPit);
                    
                    const personalRelief = form.watch("personalRelief") || 11000000;
                    const dependentRelief = form.watch("dependentRelief") !== undefined ? form.watch("dependentRelief") || 0 : 4400000 * (form.watch("dependants") || 0);
                    const insuranceEmployee = (form.watch("salary") || 0) * 0.105;
                    
                    const taxableIncome = Math.max(0, totalSalary - (insuranceEmployee + personalRelief + dependentRelief));
                    
                    // Progressive tax calculation
                    const brackets = [
                      [5000000, 0.05, 0],
                      [10000000, 0.10, 250000],
                      [18000000, 0.15, 750000],
                      [32000000, 0.20, 1650000],
                      [52000000, 0.25, 3250000],
                      [80000000, 0.30, 5850000],
                      [Infinity, 0.35, 9850000]
                    ];
                    
                    let pit = 0;
                    for (const [limit, rate, deduction] of brackets) {
                      if (taxableIncome <= limit) {
                        pit = taxableIncome * rate - deduction;
                        break;
                      }
                    }
                    
                    return formatNumberWithVND(Math.round(Math.max(pit, 0)));
                  })()}
                  readOnly
                  data-testid="input-personal-income-tax"
                  className="w-[77%]"
                />
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="totalNetIncome" className="block min-h-[24px]">Total Net Income</Label>
                <Input
                  id="totalNetIncome"
                  type="text"
                  value={(() => {
                    // Use the same calculation logic as the main useEffect to ensure consistency
                    const salary = watchedValues.salary || 0;
                    const bonus = watchedValues.bonus || 0;
                    const allowanceTax = watchedValues.allowanceTax || 0;
                    const ot15 = watchedValues.ot15 || 0;
                    const ot20 = watchedValues.ot20 || 0;
                    const ot30 = watchedValues.ot30 || 0;
                    const dependants = watchedValues.dependants || 0;
                    const advance = watchedValues.advance || 0;
                    
                    // Calculate all derived values using the same logic as main calculation
                    const augSalary = Math.round((salary / totalWorkdays) * actualDaysWorked);
                    const overtimePayPIT = Math.floor((augSalary / 22 / 8) * (ot15 + ot20 + ot30));
                    const personalRelief = watchedValues.personalRelief || 11000000;
                    const dependentRelief = watchedValues.dependentRelief !== undefined ? watchedValues.dependentRelief : 4400000 * dependants;
                    const employeeInsurance = salary * 0.105;
                    const unionFee = Math.min(salary * 0.005, 234000);
                    const hesoCoeff = ot15 * 0.5 + ot20 + ot30 * 2;
                    const overtimePayNonPIT = Math.round((augSalary / 22 / 8) * hesoCoeff);
                    
                    // Calculate totalSalary to match section B (includes both taxable and non-taxable overtime, excluding bonus)
                    const totalOverTimePay = overtimePayPIT + overtimePayNonPIT;
                    const totalSalary = Math.round(augSalary + totalOverTimePay + allowanceTax);
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
                    
                    // Total Net Income = B - F - D - D.6 - G (matches employee section display)
                    return formatNumberWithVND(Math.round(totalSalary - personalIncomeTax - employeeInsurance - unionFee - advance));
                  })()}
                  readOnly
                  data-testid="input-total-net-income"
                  className="w-[77%] bg-muted/50"
                />
              </div>
            </div>
          </div>

        </div>
      </CardContent>
    </Card>
  );
}
