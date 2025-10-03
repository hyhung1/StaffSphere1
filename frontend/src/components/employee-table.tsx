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
import { Snackbar, Alert, Dialog as MuiDialog, DialogTitle as MuiDialogTitle, DialogContent as MuiDialogContent, DialogActions as MuiDialogActions, Button as MuiButton, Pagination, Box as MuiBox } from "@mui/material";

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
  const [snackbar, setSnackbar] = useState<{open: boolean; message: string; severity: 'success' | 'error' | 'info'}>({
    open: false,
    message: '',
    severity: 'success'
  });
  const [confirmResetDialogOpen, setConfirmResetDialogOpen] = useState(false);
  const [summaryPage, setSummaryPage] = useState(0);
  const [summaryRowsPerPage, setSummaryRowsPerPage] = useState(12);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<{id: string; name: string} | null>(null);

  // Handle sidebar visibility when summary dialog opens/closes
  const handleSummaryDialogChange = (open: boolean) => {
    setSummaryDialogOpen(open);
    
    // Reset pagination when opening the dialog
    if (open) {
      setSummaryPage(0);
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
  
  const { data: employees = [], isLoading } = useQuery<SelectEmployee[]>({
    queryKey: ["/api/payroll/employees", currentUsername], // Include username in cache key
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/payroll/employees");
      if (!res.ok) throw new Error("Failed to fetch employees");
      return res.json();
    },
  });

  const deleteEmployee = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/payroll/employees/${id}`);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payroll/employees", currentUsername] });
      setSnackbar({
        open: true,
        message: '✅ Employee deleted successfully!',
        severity: 'success'
      });
    },
    onError: () => {
      setSnackbar({
        open: true,
        message: '❌ Failed to delete employee. Please try again.',
        severity: 'error'
      });
    },
  });

  // Handle delete employee - show confirmation dialog
  const handleDeleteEmployee = (employeeId: string, employeeName: string) => {
    setEmployeeToDelete({ id: employeeId, name: employeeName });
    setDeleteDialogOpen(true);
  };

  // Confirm and execute delete
  const confirmDeleteEmployee = () => {
    if (!employeeToDelete) return;
    
    deleteEmployee.mutate(employeeToDelete.id);
    setDeleteDialogOpen(false);
    setEmployeeToDelete(null);
  };

  // Helper function to check if default employee exists and hasn't been modified
  const checkDefaultEmployeeExists = () => {
    const DEFAULT_NAME = "Nguyễn Văn A";
    const DEFAULT_EMPLOYEE_NO = "VIVN-99999";
    
    return employees.some(
      (emp) => emp.name === DEFAULT_NAME && emp.employeeNo === DEFAULT_EMPLOYEE_NO
    );
  };

  const addCurrentAsEmployee = useMutation({
    mutationFn: async () => {
      const DEFAULT_NAME = "Nguyễn Văn A";
      const DEFAULT_EMPLOYEE_NO = "VIVN-99999";
      
      // Check if default employee already exists
      if (checkDefaultEmployeeExists()) {
        throw new Error("Default employee already exists. Please modify it before adding a new one.");
      }
      
      // Create default employee with standard values
      const defaultEmployee = {
        employeeNo: DEFAULT_EMPLOYEE_NO,
        name: DEFAULT_NAME,
        salary: 10000000,
        bonus: 0,
        allowanceTax: 200000,
        ot15: 10,
        ot20: 5,
        ot30: 2,
        dependants: 2,
        advance: 0,
        actualDaysWorked: 20,
        totalWorkdays: 20,
        // Calculate derived values
        augSalary: 10000000,
        overtimePayPIT: Math.floor((10000000 / 22 / 8) * (10 + 5 + 2)),
        personalRelief: 11000000,
        dependentRelief: 4400000 * 2,
        employeeInsurance: 10000000 * 0.105,
        unionFee: Math.min(10000000 * 0.005, 234000),
        companyInsurance: 10000000 * 0.175,
        overtimePayNonPIT: Math.round((10000000 / 22 / 8) * (10 * 0.5 + 5 + 2 * 2)),
        heSo: 10 * 0.5 + 5 + 2 * 2,
        totalOTHours: 10 + 5 + 2,
        calculatedAt: new Date().toISOString(),
      };
      
      // Calculate totalSalary
      const totalOverTimePay = defaultEmployee.overtimePayPIT + defaultEmployee.overtimePayNonPIT;
      defaultEmployee.augSalary = Math.round((defaultEmployee.salary / defaultEmployee.totalWorkdays) * defaultEmployee.actualDaysWorked);
      const totalSalaryCalc = Math.round(defaultEmployee.augSalary + totalOverTimePay + defaultEmployee.allowanceTax);
      
      // Calculate assessableIncome
      const assessableIncome = Math.max(0, totalSalaryCalc - defaultEmployee.personalRelief - defaultEmployee.dependentRelief - defaultEmployee.employeeInsurance);
      
      // Calculate PIT
      let personalIncomeTax = 0;
      if (assessableIncome <= 5000000) {
        personalIncomeTax = assessableIncome * 0.05;
      } else if (assessableIncome <= 10000000) {
        personalIncomeTax = assessableIncome * 0.10 - 250000;
      } else if (assessableIncome <= 18000000) {
        personalIncomeTax = assessableIncome * 0.15 - 750000;
      } else if (assessableIncome <= 32000000) {
        personalIncomeTax = assessableIncome * 0.20 - 1650000;
      } else if (assessableIncome <= 52000000) {
        personalIncomeTax = assessableIncome * 0.25 - 3250000;
      } else if (assessableIncome <= 80000000) {
        personalIncomeTax = assessableIncome * 0.30 - 5850000;
      } else {
        personalIncomeTax = assessableIncome * 0.35 - 9850000;
      }
      personalIncomeTax = Math.round(personalIncomeTax);
      
      // Calculate totalNetIncome
      const totalNetIncome = Math.round(totalSalaryCalc - defaultEmployee.employeeInsurance - defaultEmployee.unionFee - personalIncomeTax - defaultEmployee.advance);
      
      // Add calculated values to defaultEmployee
      const finalEmployee = {
        ...defaultEmployee,
        totalSalary: totalSalaryCalc,
        assessableIncome: assessableIncome,
        personalIncomeTax: personalIncomeTax,
        totalNetIncome: totalNetIncome,
      };
      
      const res = await apiRequest("POST", "/api/payroll/employees", finalEmployee);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payroll/employees", currentUsername] });
      toast({
        title: "Success",
        description: "Default employee 'Nguyễn Văn A' added successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add employee",
        variant: "destructive",
      });
    },
  });

  const clearAllEmployees = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", "/api/payroll/employees");
      if (!res.ok) {
        throw new Error('Failed to clear employees');
      }
      return res.json();
    },
    onSuccess: async (data) => {
      // STEP 1: Clear the current selection FIRST to reset the form
      if (onSelectEmployee) {
        onSelectEmployee(null as any);
      }
      
      // STEP 2: Wait a moment for the form to clear
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // STEP 3: Remove all queries from cache and refetch
      queryClient.removeQueries({ queryKey: ["/api/payroll/employees", currentUsername] });
      await queryClient.refetchQueries({ queryKey: ["/api/payroll/employees", currentUsername] });
      
      // STEP 4: Wait for refetch to complete and data to settle
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // STEP 5: Get the updated employee list and select the default employee
      const updatedEmployees = queryClient.getQueryData<SelectEmployee[]>(["/api/payroll/employees"]);
      
      console.log('Updated employees after reset:', updatedEmployees);
      
      if (updatedEmployees && updatedEmployees.length > 0 && onSelectEmployee) {
        // Create a fresh copy to ensure React detects the change
        const defaultEmployee = { ...updatedEmployees[0] };
        console.log('Selecting default employee:', defaultEmployee);
        
        // Wait a tiny bit more, then select
        await new Promise(resolve => setTimeout(resolve, 50));
        onSelectEmployee(defaultEmployee);
        
        // Force another tiny delay and trigger click simulation if needed
        await new Promise(resolve => setTimeout(resolve, 100));
        console.log('Selection should be complete now');
      }
      
      setSnackbar({
        open: true,
        message: `✅ Reset Successful! Cleared ${data.deleted || 0} employees. Form reset to default.`,
        severity: 'success'
      });
    },
    onError: (error) => {
      console.error('Clear employees error:', error);
      setSnackbar({
        open: true,
        message: '❌ Failed to reset employees. Please try again.',
        severity: 'error'
      });
    },
  });

  const updateCurrentEmployee = useMutation({
    mutationFn: async (employeeId: string) => {
      if (!currentCalculation) {
        throw new Error("No calculation available");
      }
      const res = await apiRequest("PATCH", `/api/payroll/employees/${employeeId}`, currentCalculation);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payroll/employees", currentUsername] });
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
      const response = await apiRequest('POST', '/api/payroll/employees/upload-excel', formData);
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
      queryClient.invalidateQueries({ queryKey: ["/api/payroll/employees", currentUsername] });
      
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

  // Download complete payroll (payslips + payroll Excel in one ZIP)
  const handleExportExcel = async () => {
    if (employees.length === 0) {
      toast({
        title: "Error", 
        description: "No employees found to generate payroll",
        variant: "destructive",
      });
      return;
    }

    let currentToast: { dismiss: () => void } | null = null;

    try {
      // Save any pending changes before downloading
      currentToast = toast({
        title: "Preparing Payroll",
        description: "Saving changes and generating payroll package...",
      });
      
      try {
        await savePendingChanges();
        // Wait a bit for the backend to process the update
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error('Failed to save pending changes before download:', error);
      }

      // Dismiss previous toast and show generating toast
      currentToast.dismiss();
      currentToast = toast({
        title: "Generating Payroll",
        description: `Creating complete payroll package for ${employees.length} employee${employees.length > 1 ? 's' : ''}...`,
      });

      const response = await apiRequest('GET', '/api/payroll/download-complete');
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('No employees to export');
        }
        throw new Error('Failed to generate payroll');
      }
      
      // Get the blob from the response
      const blob = await response.blob();
      
      // Create a download link and trigger it
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Extract filename from Content-Disposition header or use default
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'Complete_Payroll.zip';
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
      
      // Dismiss generating toast and show success
      if (currentToast) {
        currentToast.dismiss();
      }
      toast({
        title: "Download Successful",
        description: `Downloaded complete payroll package with ${employees.length} payslip${employees.length > 1 ? 's' : ''} and payroll data`,
      });
    } catch (error) {
      // Dismiss current toast if it exists and show error
      if (currentToast) {
        currentToast.dismiss();
      }
      
      toast({
        title: "Download Failed",
        description: error instanceof Error ? error.message : "Failed to download payroll",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("vi-VN", {
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return value.toLocaleString("vi-VN", { maximumFractionDigits: 2 });
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Dialog open={summaryDialogOpen} onOpenChange={handleSummaryDialogChange}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    if (employees.length === 0) {
                      toast({
                        title: "Error", 
                        description: "No employees found to show summary",
                        variant: "destructive",
                      });
                    } else {
                      // Save any pending changes before opening summary
                      try {
                        await savePendingChanges();
                      } catch (error) {
                        console.error('Failed to save pending changes before opening summary:', error);
                      }
                      handleSummaryDialogChange(true);
                    }
                  }}
                  data-testid="button-summary"
                >
                  <List className="mr-2 h-4 w-4" />
                  Summary
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[95vw] max-h-[85vh] overflow-hidden flex flex-col [&>button]:hidden p-4 pt-10">
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
                        {employees
                          .slice(summaryPage * summaryRowsPerPage, summaryPage * summaryRowsPerPage + summaryRowsPerPage)
                          .map((employee) => {
                          // Use values from currentCalculation (employee section) when available, otherwise use stored employee data
                          // This ensures the summary shows exactly what the employee section calculated
                          const isCurrentEmployee = currentCalculation && employee.employeeNo === currentCalculation.employeeNo;
                          
                          return (
                            <TableRow key={employee.id}>
                              <TableCell className="text-center font-medium border-r-2 border-gray-300">
                                {isCurrentEmployee ? currentCalculation.name : employee.name}
                              </TableCell>
                              <TableCell className="text-center border-r-2 border-gray-300">
                                {formatCurrency(isCurrentEmployee ? currentCalculation.salary : employee.salary)}
                              </TableCell>
                              <TableCell className="text-center border-r-2 border-gray-300">
                                {formatCurrency(isCurrentEmployee ? currentCalculation.augSalary : employee.augSalary)}
                              </TableCell>
                              <TableCell className="text-center border-r-2 border-gray-300">
                                {formatCurrency(isCurrentEmployee ? currentCalculation.allowanceTax : employee.allowanceTax)}
                              </TableCell>
                              <TableCell className="text-center border-r-2 border-gray-300">
                                {formatCurrency(isCurrentEmployee ? currentCalculation.totalSalary : employee.totalSalary)}
                              </TableCell>
                              <TableCell className="text-center border-r-2 border-gray-300">
                                {formatCurrency(isCurrentEmployee ? currentCalculation.personalRelief : employee.personalRelief)}
                              </TableCell>
                              <TableCell className="text-center border-r-2 border-gray-300">
                                {formatCurrency(isCurrentEmployee ? currentCalculation.dependentRelief : employee.dependentRelief)}
                              </TableCell>
                              <TableCell className="text-center border-r-2 border-gray-300">
                                {formatCurrency(isCurrentEmployee ? currentCalculation.personalIncomeTax : employee.personalIncomeTax)}
                              </TableCell>
                              <TableCell className="text-center border-r-2 border-gray-300">
                                {formatNumber(isCurrentEmployee ? currentCalculation.totalOTHours : employee.totalOTHours)}
                              </TableCell>
                              <TableCell className="text-center border-r-2 border-gray-300">
                                {formatCurrency(isCurrentEmployee ? currentCalculation.companyInsurance : employee.companyInsurance)}
                              </TableCell>
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
                {/* Pagination Controls */}
                <MuiBox sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 2, gap: 2 }}>
                  <Pagination 
                    count={Math.ceil(employees.length / summaryRowsPerPage)} 
                    page={summaryPage + 1}
                    onChange={(event, value) => setSummaryPage(value - 1)}
                    color="primary"
                    size="large"
                    showFirstButton
                    showLastButton
                  />
                  <span className="text-sm text-gray-600">
                    Showing {summaryPage * summaryRowsPerPage + 1}-{Math.min((summaryPage + 1) * summaryRowsPerPage, employees.length)} of {employees.length}
                  </span>
                </MuiBox>
              </DialogContent>
            </Dialog>
            <Button
              size="sm"
              variant="outline"
              onClick={handleUploadExcel}
              disabled={uploading}
              data-testid="button-upload-excel"
              title={uploading ? 'Uploading...' : 'Upload Excel'}
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload Excel
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleExportExcel}
              data-testid="button-export-excel"
              title="Download Payroll & Payslip"
            >
              <Download className="mr-2 h-4 w-4" />
              Download Payroll & Payslip
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setConfirmResetDialogOpen(true)}
              disabled={clearAllEmployees.isPending}
              data-testid="button-reset"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset
            </Button>
          </div>
          <div className="flex items-center space-x-2">
            {currentCalculation && (
              <>
                {isLoading && (
                  <Badge variant="secondary" data-testid="status-loading">
                    <UserPlus className="mr-1 h-3 w-3" />
                    Loading...
                  </Badge>
                )}
                {!isLoading && existingEmployee && autoUpdateStatus === 'saved' && (
                  <Badge variant="default" data-testid="status-saved">
                    <Check className="mr-1 h-3 w-3" />
                    Auto-saved
                  </Badge>
                )}
                {!isLoading && existingEmployee && autoUpdateStatus === 'error' && (
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
              </>
            )}
            <Button
              size="icon"
              onClick={() => {
                  addCurrentAsEmployee.mutate();
              }}
              disabled={checkDefaultEmployeeExists() || addCurrentAsEmployee.isPending}
              data-testid="button-add-employee"
              title="Add Default Employee (Nguyễn Văn A)"
            >
              <UserPlus className="h-4 w-4" />
            </Button>
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
                        className={`group relative cursor-pointer transition-all duration-200 px-1.5 py-2 ml-2 rounded-lg border-2 shadow-sm hover:shadow-md transform hover:scale-[1.01] mr-2 ${
                          isBeingEdited 
                            ? 'border-primary bg-blue-50 shadow-md ring-2 ring-primary/20' 
                            : 'border-slate-200 bg-slate-50 hover:border-primary/40 hover:bg-blue-50/50'
                        }`}
                      >
                        <div className="text-center" onClick={() => handleEmployeeClick(employee)}>
                          <div className="text-[13px] font-semibold text-slate-700 truncate mb-0.5" title={employee.employeeNo}>
                            {employee.employeeNo}
                          </div>
                          <div className="text-[11px] font-bold text-slate-500 leading-tight break-words" title={displayData.name}>
                            {displayData.name}
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteEmployee(employee.id, employee.name);
                          }}
                          className="absolute top-1 right-1 p-1 rounded-full bg-red-500 hover:bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                          title="Delete employee"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
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
      
      {/* Professional Snackbar Notification */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={4000} 
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{ mt: 1 }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          variant="filled"
          sx={{ 
            width: '100%',
            fontSize: '0.95rem',
            fontWeight: 500,
            boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.15)',
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
      
      {/* Professional Reset Confirmation Dialog */}
      <MuiDialog
        open={confirmResetDialogOpen}
        onClose={() => setConfirmResetDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.15)',
          }
        }}
      >
        <MuiDialogTitle sx={{ fontWeight: 600, fontSize: '1.25rem', pb: 1 }}>
          ⚠️ Confirm Reset
        </MuiDialogTitle>
        <MuiDialogContent>
          <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: 1.6 }}>
            Are you sure you want to reset? This will clear all uploaded employees and reset to default values.
          </p>
        </MuiDialogContent>
        <MuiDialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <MuiButton 
            onClick={() => setConfirmResetDialogOpen(false)}
            variant="outlined"
            sx={{ 
              textTransform: 'none',
              fontWeight: 500,
            }}
          >
            Cancel
          </MuiButton>
          <MuiButton 
            onClick={() => {
              setConfirmResetDialogOpen(false);
              clearAllEmployees.mutate();
            }}
            variant="contained"
            color="error"
            sx={{ 
              textTransform: 'none',
              fontWeight: 600,
            }}
          >
            Reset
          </MuiButton>
        </MuiDialogActions>
      </MuiDialog>

      {/* Professional Delete Confirmation Dialog */}
      <MuiDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.15)',
          }
        }}
      >
        <MuiDialogTitle sx={{ fontWeight: 600, fontSize: '1.25rem', pb: 1 }}>
          ⚠️ Confirm Deletion
        </MuiDialogTitle>
        <MuiDialogContent>
          <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: 1.6 }}>
            Are you sure you want to delete employee <strong>"{employeeToDelete?.name}"</strong>? This action cannot be undone.
          </p>
        </MuiDialogContent>
        <MuiDialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <MuiButton 
            onClick={() => {
              setDeleteDialogOpen(false);
              setEmployeeToDelete(null);
            }}
            variant="outlined"
            sx={{ 
              textTransform: 'none',
              fontWeight: 500,
            }}
          >
            Cancel
          </MuiButton>
          <MuiButton 
            onClick={confirmDeleteEmployee}
            variant="contained"
            color="error"
            sx={{ 
              textTransform: 'none',
              fontWeight: 600,
            }}
          >
            Delete
          </MuiButton>
        </MuiDialogActions>
      </MuiDialog>
    </Card>
  );
}