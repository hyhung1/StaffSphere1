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

  const handleEmployeeSelect = (employee: SelectEmployee) => {
    // Set the selected employee data which will be passed to the form
    setSelectedEmployeeData(employee);
  };

  const handleClearResults = () => {
    setCurrentResult(null); // Only clear results, don't trigger form reset
  };

  return (
    <div className="w-full h-full ">
      <div className="grid grid-cols-1 xl:grid-cols-[40%_60%] gap-3">
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
