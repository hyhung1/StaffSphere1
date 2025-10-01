import { useQuery, useMutation } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { SelectEmployee } from "../../shared/schema";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Trash2, Users, UserPlus, Check, AlertTriangle, RotateCcw, Upload, Download, FileDown, List } from "lucide-react";
import { useToast } from "./hooks/use-toast";
import { queryClient, apiRequest } from "./lib/queryClient";
import { ScrollArea } from "./ui/scroll-area";
import { Input } from "./ui/input";
import { PaySlip } from "./payslip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";

interface EmployeeTableProps {
  onAddEmployee?: () => void;
  currentCalculation?: any;
  onSelectEmployee?: (employee: SelectEmployee) => void;
}

export function EmployeeTable({ onAddEmployee, currentCalculation, onSelectEmployee }: EmployeeTableProps) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [summaryDialogOpen, setSummaryDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle sidebar visibility when summary dialog opens/closes
  const handleSummaryDialogChange = (open: boolean) => {
    setSummaryDialogOpen(open);
    
    // Hide/show sidebar by adding/removing CSS class to body
    if (open) {
      document.body.classList.add('hide-sidebar');
    } else {
      document.body.classList.remove('hide-sidebar');
    }
  };

  // Add CSS to hide sidebar when component mounts, clean up when unmounts
  useEffect(() => {
    // Add CSS rule to hide sidebar
    const style = document.createElement('style');
    style.textContent = `
      .hide-sidebar .MuiDrawer-root {
        display: none !important;
      }
      .hide-sidebar main {
        width: 100% !important;
        margin-left: 0 !important;
        padding-left: 1rem !important;
      }
    `;
    document.head.appendChild(style);

    // Cleanup function to remove CSS and class when component unmounts
    return () => {
      document.head.removeChild(style);
      document.body.classList.remove('hide-sidebar');
    };
  }, []);

  // Additional cleanup when dialog state changes to ensure sidebar is always shown when dialog closes
  useEffect(() => {
    if (!summaryDialogOpen) {
      document.body.classList.remove('hide-sidebar');
    }
  }, [summaryDialogOpen]);
  
  const { data: employees = [], isLoading } = useQuery<SelectEmployee[]>({
    queryKey: ["/api/employees"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/employees");
      if (!res.ok) throw new Error("Failed to fetch employees");
      return res.json();
    },
  });

  const deleteEmployee = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/employees/${id}`);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      toast({
        title: "Success",
        description: "Employee deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete employee",
        variant: "destructive",
      });
    },
  });

  const addCurrentAsEmployee = useMutation({
    mutationFn: async () => {
      if (!currentCalculation) {
        throw new Error("No calculation available");
      }
      const res = await apiRequest("POST", "/api/employees", currentCalculation);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      toast({
        title: "Success",
        description: "Employee added successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add employee",
        variant: "destructive",
      });
    },
  });

  const updateCurrentEmployee = useMutation({
    mutationFn: async (employeeId: string) => {
      if (!currentCalculation) {
        throw new Error("No calculation available");
      }
      const res = await apiRequest("PATCH", `/api/employees/${employeeId}`, currentCalculation);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      setAutoUpdateStatus('saved');
      // Reset to idle after 2 seconds
      setTimeout(() => setAutoUpdateStatus('idle'), 2000);
      
      // Check if there are newer changes to save after successful save
      if (existingEmployee) {
        const latestPendingHash = pendingHashRef.current[existingEmployee.employeeNo];
        const lastSavedHash = lastSyncedHashRef.current[existingEmployee.employeeNo];
        if (latestPendingHash && latestPendingHash !== lastSavedHash) {
          // Schedule save for newer changes
          scheduleSave(existingEmployee.id, existingEmployee.employeeNo, latestPendingHash);
        }
      }
    },
    onError: () => {
      setAutoUpdateStatus('error');
      // Show error toast for manual retries only
      if (lastTriggerRef.current === 'manual') {
        toast({
          title: "Error",
          description: "Failed to update employee",
          variant: "destructive",
        });
      }
    },
  });

  // Check if current calculation matches an existing employee
  const existingEmployee = currentCalculation
    ? employees.find(emp => emp.employeeNo === currentCalculation.employeeNo)
    : null;

  // Auto-update state management
  const lastSyncedHashRef = useRef<Record<string, string>>({});
  const pendingHashRef = useRef<Record<string, string>>({});
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [autoUpdateStatus, setAutoUpdateStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const lastTriggerRef = useRef<'auto' | 'manual'>('auto');
  
  // Create hash from calculation data (excluding volatile fields)
  const createCalculationHash = (calc: any) => {
    const { calculatedAt, id, ...stableFields } = calc;
    return JSON.stringify(stableFields);
  };
  
  // Helper function to schedule a save
  const scheduleSave = (employeeId: string, employeeNo: string, hashToSave: string) => {
    lastTriggerRef.current = 'auto';
    setAutoUpdateStatus('saving');
    
    debounceTimerRef.current = setTimeout(() => {
      // Call the mutation
      updateCurrentEmployee.mutate(employeeId);
      // Update the hash we're attempting to save
      lastSyncedHashRef.current[employeeNo] = hashToSave;
    }, 800); // 800ms debounce
  };
  
  // Auto-update effect for existing employees
  useEffect(() => {
    // Clear any existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // Only auto-update if:
    // 1. Not loading
    // 2. Current calculation exists
    // 3. Existing employee found
    // 4. Not in error state (to prevent infinite retries)
    if (isLoading || !currentCalculation || !existingEmployee || autoUpdateStatus === 'error') {
      return;
    }
    
    const currentHash = createCalculationHash(currentCalculation);
    const lastHash = lastSyncedHashRef.current[existingEmployee.employeeNo];
    
    // Always track the latest hash
    pendingHashRef.current[existingEmployee.employeeNo] = currentHash;
    
    // Initialize baseline on first encounter by comparing with server data
    if (lastHash === undefined) {
      // Create hash from existing employee data for comparison
      const serverHash = createCalculationHash({
        employeeNo: existingEmployee.employeeNo,
        name: existingEmployee.name,
        salary: existingEmployee.salary,
        bonus: existingEmployee.bonus,
        allowanceTax: existingEmployee.allowanceTax,
        ot15: existingEmployee.ot15,
        ot20: existingEmployee.ot20,
        ot30: existingEmployee.ot30,
        dependants: existingEmployee.dependants,
        advance: existingEmployee.advance
      });
      
      lastSyncedHashRef.current[existingEmployee.employeeNo] = serverHash;
      
      // If current form differs from server data, schedule an update
      if (currentHash !== serverHash && !updateCurrentEmployee.isPending) {
        scheduleSave(existingEmployee.id, existingEmployee.employeeNo, currentHash);
      }
      return;
    }
    
    // Only update if hash has changed and not currently saving
    if (currentHash !== lastHash && !updateCurrentEmployee.isPending) {
      scheduleSave(existingEmployee.id, existingEmployee.employeeNo, currentHash);
    }
    
    // Cleanup timer on unmount or dependency change
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [currentCalculation, existingEmployee, isLoading, updateCurrentEmployee.isPending, autoUpdateStatus]);
  
  // Manual retry function
  const retryUpdate = () => {
    if (currentCalculation && existingEmployee) {
      const currentHash = createCalculationHash(currentCalculation);
      lastTriggerRef.current = 'manual';
      setAutoUpdateStatus('saving');
      lastSyncedHashRef.current[existingEmployee.employeeNo] = currentHash;
      pendingHashRef.current[existingEmployee.employeeNo] = currentHash;
      
      updateCurrentEmployee.mutate(existingEmployee.id);
    }
  };
  
  // Function to save pending changes immediately
  const savePendingChanges = async () => {
    // Clear any pending debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    
    // Check if there are pending changes to save
    if (currentCalculation && existingEmployee) {
      const currentHash = createCalculationHash(currentCalculation);
      const lastHash = lastSyncedHashRef.current[existingEmployee.employeeNo];
      
      // Only save if there are actual changes
      if (currentHash !== lastHash) {
        lastTriggerRef.current = 'manual';
        setAutoUpdateStatus('saving');
        lastSyncedHashRef.current[existingEmployee.employeeNo] = currentHash;
        pendingHashRef.current[existingEmployee.employeeNo] = currentHash;
        
        // Wait for the save to complete
        await updateCurrentEmployee.mutateAsync(existingEmployee.id);
      }
    }
  };
  
  // Handle employee row click with save before switching
  const handleEmployeeClick = async (employee: SelectEmployee) => {
    try {
      // Save any pending changes for the current employee before switching
      await savePendingChanges();
    } catch (error) {
      // Even if save fails, we still want to allow switching
      console.error('Failed to save pending changes:', error);
    }
    
    // Now switch to the new employee
    onSelectEmployee?.(employee);
  };

  // Excel upload function
  const handleUploadExcel = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast({
        title: "Invalid File",
        description: "Please upload an Excel file (.xlsx or .xls)",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await apiRequest('POST', '/api/employees/upload-excel', formData);
      // Note: apiRequest throws for non-ok responses, so if we get here, it succeeded

      // Check if response has content before parsing JSON
      let result;
      const contentLength = response.headers.get('content-length');
      const contentType = response.headers.get('content-type');
      
      if (contentLength && contentLength !== '0' && contentType?.includes('application/json')) {
        result = await response.json();
      } else {
        // Empty response or non-JSON response
        result = { success: !response.ok, message: response.statusText };
      }

      if (!response.ok) {
        throw new Error(result.detail?.message || 'Upload failed');
      }

      // Upload successful - no popup dialog needed
      
      // Refresh employee list
      //queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      
      // Show toast with complete information
      const toastDescription = result.deleted > 0 
        ? `Cleared ${result.deleted} existing employees. Imported ${result.imported} new employees.`
        : `Imported ${result.imported} employees`;
      
      toast({
        title: "Upload Successful",
        description: toastDescription,
      });
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload Excel file",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      // Reset the file input
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  // Excel export function (exports to actual Excel file)
  const handleExportExcel = async () => {
    try {
      const response = await apiRequest('GET', '/api/employees/export-excel');
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('No employees to export');
        }
        throw new Error('Failed to export data');
      }
      
      // Get the blob from the response
      const blob = await response.blob();
      
      // Create a download link and trigger it
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Extract filename from Content-Disposition header or use default
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'salary_export.xlsx';
      if (contentDisposition) {
        const match = contentDisposition.match(/filename=(.+)/);
        if (match && match[1]) {
          filename = match[1].replace(/"/g, '');
        }
      }
      
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      // Get employee count for toast message
      const employeeCount = employees.length;
      
      toast({
        title: "Export Successful",
        description: `Exported ${employeeCount} employees to ${filename}`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : "Failed to export data",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return value.toLocaleString("vi-VN", { maximumFractionDigits: 2 });
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3 pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Dialog open={summaryDialogOpen} onOpenChange={handleSummaryDialogChange}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (employees.length === 0) {
                      toast({
                        title: "Error", 
                        description: "No employees found to show summary",
                        variant: "destructive",
                      });
                    } else {
                      handleSummaryDialogChange(true);
                    }
                  }}
                  data-testid="button-summary"
                >
                  <List className="mr-2 h-4 w-4" />
                  Summary
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[95vw] max-h-[85vh] overflow-hidden flex flex-col">
                <DialogHeader>
                  <DialogTitle>Employee Salary Summary</DialogTitle>
                </DialogHeader>
                <ScrollArea className="flex-1 pr-4">
                  <div className="overflow-x-auto">
                    <Table className="border-collapse">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-[150px] text-center font-bold border-r-2 border-gray-300">Name</TableHead>
                          <TableHead className="min-w-[120px] text-center font-bold border-r-2 border-gray-300">Salary</TableHead>
                          <TableHead className="min-w-[120px] text-center font-bold border-r-2 border-gray-300">Actual Salary</TableHead>
                          <TableHead className="min-w-[120px] text-center font-bold border-r-2 border-gray-300">Allowance</TableHead>
                          <TableHead className="min-w-[120px] text-center font-bold border-r-2 border-gray-300">Total Salary</TableHead>
                          <TableHead className="min-w-[120px] text-center font-bold border-r-2 border-gray-300">Personal relief</TableHead>
                          <TableHead className="min-w-[120px] text-center font-bold border-r-2 border-gray-300">Dependent relief</TableHead>
                          <TableHead className="min-w-[120px] text-center font-bold border-r-2 border-gray-300">Personal Income tax</TableHead>
                          <TableHead className="min-w-[77px] text-center font-bold border-r-2 border-gray-300">Total OT hours</TableHead>
                          <TableHead className="min-w-[180px] text-center font-bold border-r-2 border-gray-300">Insurance - Company's pay (21.5%)</TableHead>
                          <TableHead className="min-w-[180px] text-center font-bold border-r-2 border-gray-300">Insurance - Employee's pay (10.5%)</TableHead>
                          <TableHead className="min-w-[77px] text-center font-bold border-r-2 border-gray-300">Đoàn phí</TableHead>
                          <TableHead className="min-w-[150px] text-center font-bold">Total Net Income</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {employees.map((employee) => {
                          // Use values from currentCalculation (employee section) when available, otherwise use stored employee data
                          // This ensures the summary shows exactly what the employee section calculated
                          const isCurrentEmployee = currentCalculation && employee.employeeNo === currentCalculation.employeeNo;
                          
                          return (
                            <TableRow key={employee.id}>
                              <TableCell className="text-center font-medium border-r-2 border-gray-300">{employee.name}</TableCell>
                              <TableCell className="text-center border-r-2 border-gray-300">{formatCurrency(employee.salary)}</TableCell>
                              <TableCell className="text-center border-r-2 border-gray-300">
                                {formatCurrency(isCurrentEmployee ? currentCalculation.augSalary : employee.augSalary)}
                              </TableCell>
                              <TableCell className="text-center border-r-2 border-gray-300">{formatCurrency(employee.allowanceTax)}</TableCell>
                              <TableCell className="text-center border-r-2 border-gray-300">
                                {formatCurrency(isCurrentEmployee ? currentCalculation.totalSalary : employee.totalSalary)}
                              </TableCell>
                              <TableCell className="text-center border-r-2 border-gray-300">{formatCurrency(employee.personalRelief)}</TableCell>
                              <TableCell className="text-center border-r-2 border-gray-300">{formatCurrency(employee.dependentRelief)}</TableCell>
                              <TableCell className="text-center border-r-2 border-gray-300">
                                {formatCurrency(isCurrentEmployee ? currentCalculation.personalIncomeTax : employee.personalIncomeTax)}
                              </TableCell>
                              <TableCell className="text-center border-r-2 border-gray-300">{formatNumber(employee.totalOTHours)}</TableCell>
                              <TableCell className="text-center border-r-2 border-gray-300">{formatCurrency(employee.companyInsurance)}</TableCell>
                              <TableCell className="text-center border-r-2 border-gray-300">
                                {formatCurrency(isCurrentEmployee ? currentCalculation.employeeInsurance : employee.employeeInsurance)}
                              </TableCell>
                              <TableCell className="text-center border-r-2 border-gray-300">
                                {formatCurrency(isCurrentEmployee ? currentCalculation.unionFee : employee.unionFee)}
                              </TableCell>
                              <TableCell className="text-center font-semibold">
                                {formatCurrency(isCurrentEmployee ? currentCalculation.totalNetIncome : employee.totalNetIncome)}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </ScrollArea>
              </DialogContent>
            </Dialog>
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                if (employees.length === 0) {
                  toast({
                    title: "Error", 
                    description: "No employees found to generate pay slips",
                    variant: "destructive",
                  });
                  return;
                }
                
                try {
                  toast({
                    title: "Generating Pay Slips",
                    description: `Creating ${employees.length} pay slip${employees.length > 1 ? 's' : ''}...`,
                  });
                  
                  const response = await fetch("/api/payslips/download-all-excel", {
                    method: "GET",
                  });
                  
                  if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
                  }
                  
                  // Get the blob and create download
                  const blob = await response.blob();
                  const url = window.URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  
                  // Get filename from Content-Disposition header or use default
                  const contentDisposition = response.headers.get('content-disposition');
                  let filename = 'All_Payslips.zip';
                  if (contentDisposition) {
                    const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
                    if (filenameMatch) {
                      filename = filenameMatch[1].replace(/['"]/g, '');
                    }
                  }
                  
                  link.download = filename;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  window.URL.revokeObjectURL(url);
                  
                  toast({
                    title: "Success",
                    description: `Downloaded ${employees.length} pay slip${employees.length > 1 ? 's' : ''} as ZIP file`,
                  });
                } catch (error) {
                  console.error('Batch download failed:', error);
                  
                  // Get more specific error information
                  let errorMessage = "Failed to download pay slips";
                  if (error instanceof Error) {
                    errorMessage = error.message;
                  }
                  
                  toast({
                    title: "Error",
                    description: errorMessage,
                    variant: "destructive",
                  });
                }
              }}
              data-testid="button-download-payslip"
            >
              <FileDown className="mr-2 h-4 w-4" />
              Download Pay Slip
            </Button>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleUploadExcel}
              disabled={uploading}
              data-testid="button-upload-excel"
            >
              <Upload className="mr-2 h-4 w-4" />
              {uploading ? 'Uploading...' : 'Upload Payroll'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleExportExcel}
              data-testid="button-export-excel"
            >
              <Download className="mr-2 h-4 w-4" />
              Download Payroll
            </Button>
            {currentCalculation && (
              isLoading ? (
                <Badge variant="secondary" data-testid="status-loading">
                  <UserPlus className="mr-1 h-3 w-3" />
                  Loading...
                </Badge>
              ) : existingEmployee ? (
                <div className="flex items-center space-x-2">
                  {autoUpdateStatus === 'saved' && (
                    <Badge variant="default" data-testid="status-saved">
                      <Check className="mr-1 h-3 w-3" />
                      Auto-saved
                    </Badge>
                  )}
                  {autoUpdateStatus === 'error' && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={retryUpdate}
                      data-testid="button-retry"
                    >
                      <AlertTriangle className="mr-1 h-3 w-3" />
                      Retry
                    </Button>
                  )}
                </div>
              ) : (
                <Button
                  size="sm"
                  onClick={() => addCurrentAsEmployee.mutate()}
                  disabled={addCurrentAsEmployee.isPending}
                  data-testid="button-add-employee"
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add Current
                </Button>
              )
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden pt-0">
        {/* 81%-19% Split Layout */}
        <div className="flex h-[calc(100vh-12.3rem)]">
          {/* 81% PaySlip Display */}
          <div className="w-[81%] bg-white relative overflow-y-auto overflow-x-hidden">
            <PaySlip currentCalculation={currentCalculation} />
          </div>
          
          {/* 19% Employee List */}
          <div className="w-[19%] border-l">
            <ScrollArea className="h-full">
              {isLoading ? (
                <div className="text-center text-muted-foreground py-8">
                  <div className="text-xs">Loading...</div>
                </div>
              ) : employees.length === 0 ? (
                <div className="text-center text-muted-foreground py-8 px-2">
                  <Users className="h-6 w-6 mx-auto mb-2 text-muted-foreground/50" />
                  <p className="text-xs">No employees</p>
                  <p className="text-xs mt-1">Add salary to list</p>
                </div>
              ) : (
                <div className="space-y-2 pl-1 pr-0 py-1">
                  {employees.map((employee) => {
                    // If this employee is being edited, show current form values
                    const isBeingEdited = currentCalculation && 
                      employee.employeeNo === currentCalculation.employeeNo;
                    
                    const displayData = isBeingEdited && currentCalculation ? 
                      currentCalculation : employee;
                    
                    return (
                      <div
                        key={employee.id}
                        data-testid={`row-employee-${employee.id}`}
                        className={`cursor-pointer transition-all duration-200 px-1.5 py-1.5 ml-2 rounded-lg border-2 shadow-sm hover:shadow-md transform hover:scale-[1.01] mr-0 ${
                          isBeingEdited 
                            ? 'border-primary bg-blue-50 shadow-md ring-2 ring-primary/20' 
                            : 'border-slate-200 bg-slate-50 hover:border-primary/40 hover:bg-blue-50/50'
                        }`}
                        onClick={() => handleEmployeeClick(employee)}
                      >
                        <div className="text-center">
                          <div className="text-[13px] font-semibold text-slate-700 truncate mb-0.5" title={employee.employeeNo}>
                            {employee.employeeNo}
                          </div>
                          <div className="text-[11px] font-bold text-slate-500 truncate leading-relaxed" title={displayData.name}>
                            {displayData.name}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </CardContent>
      
      {/* Hidden file input for Excel upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
    </Card>
  );
}