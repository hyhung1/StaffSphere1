import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { BarChart3, Download, List, Percent, PlusCircle, MinusCircle, Shield } from "lucide-react";
import { SalaryResult } from "../../shared/schema";
import { formatCurrencyWithUnit, formatCurrency, formatNumber, TAX_BRACKETS, downloadJsonFile } from "./lib/salary-calculator";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "./lib/queryClient";
import { useToast } from "./hooks/use-toast";

interface SalaryResultsProps {
  result: SalaryResult | null;
}

export function SalaryResults({ result }: SalaryResultsProps) {
  const { toast } = useToast();

  const exportMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("GET", "/api/salary/export");
      return response.json();
    },
    onSuccess: (data) => {
      downloadJsonFile(data, 'salary_calculations.json');
      toast({
        title: "Export Successful",
        description: "Salary calculations have been exported to JSON file.",
      });
    },
    onError: () => {
      toast({
        variant: "destructive", 
        title: "Export Failed",
        description: "Failed to export calculations. Please try again.",
      });
    },
  });

  const handleExport = () => {
    exportMutation.mutate();
  };

  if (!result || !result.totalNetIncome) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-12 text-center">
            <BarChart3 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground mb-2">
              No Calculation Yet
            </h3>
            <p className="text-sm text-muted-foreground">
              Enter employee details and click "Calculate Salary" to see results here.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <CardHeader className="border-b border-border flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center text-xl">
              <BarChart3 className="text-primary mr-3 h-5 w-5" />
              Salary Calculation Results
            </CardTitle>
          </div>
          <Button
            onClick={handleExport}
            disabled={exportMutation.isPending}
            variant="outline"
            size="sm"
            data-testid="button-export"
          >
            <Download className="mr-2 h-4 w-4" />
            {exportMutation.isPending ? "Exporting..." : "Export JSON"}
          </Button>
        </CardHeader>
        
        <CardContent className="p-6">
          {/* Net Income Highlight */}
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-6 mb-6">
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Total Net Income
              </p>
              <p className="text-3xl font-bold text-primary mt-2" data-testid="text-net-income">
                {formatCurrencyWithUnit(result.totalNetIncome)}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                After all deductions and taxes
              </p>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-lg text-primary mb-2">💰</div>
              <p className="text-sm text-muted-foreground">Total Salary</p>
              <p className="text-lg font-semibold text-foreground" data-testid="text-total-salary">
                {formatCurrency(result.totalSalary)}
              </p>
            </div>
            
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-lg text-destructive mb-2">🧾</div>
              <p className="text-sm text-muted-foreground">Total Tax</p>
              <p className="text-lg font-semibold text-foreground" data-testid="text-total-tax">
                {formatCurrency(result.personalIncomeTax)}
              </p>
            </div>
            
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-lg text-accent mb-2">🛡️</div>
              <p className="text-sm text-muted-foreground">Insurance</p>
              <p className="text-lg font-semibold text-foreground" data-testid="text-insurance">
                {formatCurrency(result.employeeInsurance)}
              </p>
            </div>
            
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-lg text-primary mb-2">⏰</div>
              <p className="text-sm text-muted-foreground">OT Hours</p>
              <p className="text-lg font-semibold text-foreground" data-testid="text-ot-hours">
                {formatNumber(result.totalOTHours)}
              </p>
            </div>

            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-lg text-orange-500 mb-2">📊</div>
              <p className="text-sm text-muted-foreground">He so</p>
              <p className="text-lg font-semibold text-foreground" data-testid="text-he-so">
                {formatNumber(result.hesoCoeff.toFixed(1))}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Breakdown */}
      <Card>
        <CardHeader className="border-b border-border">
          <CardTitle className="flex items-center text-lg">
            <List className="text-primary mr-3 h-5 w-5" />
            Detailed Breakdown
          </CardTitle>
        </CardHeader>
        
        <CardContent className="p-6">
          {/* Income Section */}
          <div className="mb-6">
            <h4 className="font-medium text-foreground mb-3 flex items-center">
              <PlusCircle className="text-green-500 mr-2 h-4 w-4" />
              Income
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-2 border-b border-border/50">
                <span className="text-muted-foreground">August Salary (20/21 days)</span>
                <span className="font-medium" data-testid="text-aug-salary">
                  {formatCurrencyWithUnit(result.augSalary)}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/50">
                <span className="text-muted-foreground">Bonus</span>
                <span className="font-medium" data-testid="text-bonus">
                  {formatCurrencyWithUnit(result.bonus)}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/50">
                <span className="text-muted-foreground">Taxable Allowance</span>
                <span className="font-medium" data-testid="text-allowance">
                  {formatCurrencyWithUnit(result.allowanceTax)}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/50">
                <span className="text-muted-foreground">Overtime Pay (Taxable)</span>
                <span className="font-medium" data-testid="text-overtime-taxable">
                  {formatCurrencyWithUnit(result.overtimePayPIT)}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/50">
                <span className="text-muted-foreground">Overtime Pay (Non-taxable)</span>
                <span className="font-medium" data-testid="text-overtime-non-taxable">
                  {formatCurrencyWithUnit(result.overtimePayNonPIT)}
                </span>
              </div>
            </div>
          </div>

          {/* Deductions Section */}
          <div className="mb-6">
            <h4 className="font-medium text-foreground mb-3 flex items-center">
              <MinusCircle className="text-red-500 mr-2 h-4 w-4" />
              Deductions
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-2 border-b border-border/50">
                <span className="text-muted-foreground">Personal Income Tax</span>
                <span className="font-medium text-red-600" data-testid="text-personal-tax">
                  {formatCurrencyWithUnit(result.personalIncomeTax)}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/50">
                <span className="text-muted-foreground">Insurance - Employee's pay (10.5%)</span>
                <span className="font-medium text-red-600" data-testid="text-employee-insurance">
                  {formatCurrencyWithUnit(result.employeeInsurance)}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/50">
                <span className="text-muted-foreground">Union Fee</span>
                <span className="font-medium text-red-600" data-testid="text-union-fee">
                  {formatCurrencyWithUnit(result.unionFee)}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/50">
                <span className="text-muted-foreground">Advance Payment</span>
                <span className="font-medium text-red-600" data-testid="text-advance">
                  {formatCurrencyWithUnit(result.advance)}
                </span>
              </div>
            </div>
          </div>

          {/* Tax Relief Section */}
          <div>
            <h4 className="font-medium text-foreground mb-3 flex items-center">
              <Shield className="text-blue-500 mr-2 h-4 w-4" />
              Tax Relief
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-2 border-b border-border/50">
                <span className="text-muted-foreground">Personal Relief</span>
                <span className="font-medium text-blue-600" data-testid="text-personal-relief">
                  {formatCurrencyWithUnit(result.personalRelief)}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/50">
                <span className="text-muted-foreground">
                  Dependent Relief ({result.dependants} dependents)
                </span>
                <span className="font-medium text-blue-600" data-testid="text-dependent-relief">
                  {formatCurrencyWithUnit(result.dependentRelief)}
                </span>
              </div>
              <div className="flex justify-between py-2 font-medium">
                <span className="text-foreground">Assessable Income</span>
                <span data-testid="text-assessable-income">
                  {formatCurrencyWithUnit(result.assessableIncome)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tax Brackets Reference */}
      <Card>
        <CardHeader className="border-b border-border">
          <CardTitle className="flex items-center text-lg">
            <Percent className="text-primary mr-3 h-5 w-5" />
            Vietnam Tax Brackets (2024)
          </CardTitle>
        </CardHeader>
        
        <CardContent className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 text-muted-foreground font-medium">
                    Taxable Income (VND)
                  </th>
                  <th className="text-right py-2 text-muted-foreground font-medium">
                    Tax Rate
                  </th>
                </tr>
              </thead>
              <tbody className="text-foreground">
                {TAX_BRACKETS.map((bracket, index) => (
                  <tr key={index} className="border-b border-border/50">
                    <td className="py-2" data-testid={`tax-bracket-range-${index}`}>
                      {bracket.range}
                    </td>
                    <td className="text-right py-2" data-testid={`tax-bracket-rate-${index}`}>
                      {bracket.rate}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
