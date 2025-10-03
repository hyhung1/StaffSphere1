import { useState } from "react";
import { SalaryForm } from "../salary-form";
import { EmployeeTable } from "../employee-table";
import { SalaryResult, SelectEmployee } from "../../../shared/schema";

export default function SalaryCalculator() {
  const [currentResult, setCurrentResult] = useState<SalaryResult | null>(null);
  const [selectedEmployeeData, setSelectedEmployeeData] = useState<SelectEmployee | null>(null);

  const handleCalculationComplete = (result: SalaryResult) => {
    setCurrentResult(result);
  };

  const handleEmployeeSelect = (employee: SelectEmployee | null) => {
    // Set the selected employee data which will be passed to the form
    console.log('handleEmployeeSelect called with:', employee);
    setSelectedEmployeeData(employee);
  };

  const handleClearResults = () => {
    setCurrentResult(null); // Only clear results, don't trigger form reset
  };

  return (
    <div className="w-full h-[calc(100vh-6rem)]">
      <div className="grid grid-cols-1 xl:grid-cols-[44%_56%] gap-2 h-full">
          {/* Input Form Section */}
          <SalaryForm 
            onCalculationChange={handleCalculationComplete}
            selectedEmployee={selectedEmployeeData}
          />

          {/* Employee Table Section */}
          <EmployeeTable 
            currentCalculation={currentResult} 
            onSelectEmployee={handleEmployeeSelect}
          />
        </div>
      </div>
  );
}
