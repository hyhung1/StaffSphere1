import React, { useState, useEffect } from 'react';
import { ExpandMore, ExpandLess } from '@mui/icons-material';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  MenuItem,
  Select,
  FormControl,
  Chip,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  ToggleButton,
  ToggleButtonGroup,
  Collapse,
  Dialog,
  DialogTitle,
  DialogContent,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import axios from 'axios';

interface Employee {
  full_name: string;
  dob: string;
  age: number;
  gender: string;
  Id_number: string;
  Issue_date?: string;
  address: string;
  current_address: string;
  phone: string;
  emergency_contact?: string;
  education_level: string;
  department: string;
  join_date?: string;
  position: string;
  contract_id: string;
  contract_type: string;
  contract_sign_date: string;
  contract_end_date?: string;
  salary: number;
  allowance?: string;
  last_salary_adjustment: string;
  tax_code: number;
  dependent_count?: string;
  social_insurance_number: number;
  medical_insurance_hospital: string;
  bank_account: number;
  bank_name?: string;
  pvi_care: string;
  training_courses?: string;
  training_skills: string;
}

const EmployeeDashboard: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'cards' | 'compact'>('compact');
  const [expandedEmployees, setExpandedEmployees] = useState<Set<string>>(new Set());
  const [visibleSalaries, setVisibleSalaries] = useState<Set<string>>(new Set());
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [departmentDialogOpen, setDepartmentDialogOpen] = useState(false);
  const [selectedEmployees, setSelectedEmployees] = useState<Employee[]>([]);
  const [filters, setFilters] = useState({
    department: '',
    position: '',
    contract_type: '',
    gender: '',
  });
  
  const [filterOptions, setFilterOptions] = useState({
    positions: [],
    departments: [],
    genders: [],
    contract_types: []
  });

  const API_BASE_URL = process.env.REACT_APP_API_URL || '';

  useEffect(() => {
    fetchEmployees();
    fetchFilterOptions();
  }, []);

  // Realtime filtering - trigger when search term or filters change
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(0);
      fetchEmployees();
    }, 300); // 300ms debounce to avoid too many API calls

    return () => clearTimeout(timer);
  }, [searchTerm, filters]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (filters.department) params.append('department', filters.department);
      if (filters.position) params.append('position', filters.position);
      if (filters.contract_type) params.append('contract_type', filters.contract_type);
      if (filters.gender) params.append('gender', filters.gender);

      const response = await axios.get(`${API_BASE_URL}/employees?${params.toString()}`);
      setEmployees(response.data);
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFilterOptions = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/filter-options`);
      setFilterOptions(response.data);
    } catch (error) {
      console.error('Error fetching filter options:', error);
    }
  };

  // Remove handleSearch since we now have realtime filtering

  const clearFilters = () => {
    setSearchTerm('');
    setFilters({
      department: '',
      position: '',
      contract_type: '',
      gender: '',
    });
    setPage(0);
    // fetchEmployees will be called automatically by useEffect
  };

  const exportData = async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const response = await axios.get(`${API_BASE_URL}/export/excel?${params.toString()}`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'employees.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  };

  const importData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      await axios.post(`${API_BASE_URL}/import/excel`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      fetchEmployees(); // Refresh the data after import
    } catch (error) {
      console.error('Error importing data:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const formatDate = (dateString: string | undefined | null, reverse: boolean = false) => {
    if (!dateString) return '-';
    if (dateString === 'Không thời hạn') return 'Không thời hạn';
    
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    if (reverse) {
      return `${day}/${month}/${year}`;
    }
    return `${month}/${day}/${year}`;
  };

  const handleExpandEmployee = (employeeId: string) => {
    const newExpanded = new Set(expandedEmployees);
    if (newExpanded.has(employeeId)) {
      newExpanded.delete(employeeId);
    } else {
      newExpanded.add(employeeId);
    }
    setExpandedEmployees(newExpanded);
  };

  const toggleSalaryVisibility = (employeeId: string) => {
    const newVisible = new Set(visibleSalaries);
    if (newVisible.has(employeeId)) {
      newVisible.delete(employeeId);
    } else {
      newVisible.add(employeeId);
    }
    setVisibleSalaries(newVisible);
  };

  const handleViewChange = (event: React.MouseEvent<HTMLElement>, newView: 'table' | 'cards' | 'compact') => {
    if (newView !== null) {
      setViewMode(newView);
    }
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Calculate paginated employees
  const paginatedEmployees = employees.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  // Group employees by department
  const groupEmployeesByDepartment = () => {
    const groups: Record<string, Employee[]> = {};

    // Initialize groups for all departments
    employees.forEach(emp => {
      if (!groups[emp.department]) {
        groups[emp.department] = [];
      }
      groups[emp.department].push(emp);
    });

    return groups;
  };


  // Card View Component with Network Diagram
  const renderCardView = () => {
    const departmentGroups = groupEmployeesByDepartment();

    return (
      <>
        <Box sx={{ 
          width: '100%', 
          height: '600px', 
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <svg width="800" height="600" style={{ border: '1px solid #e0e0e0', borderRadius: '8px', backgroundColor: '#fafafa' }}>
            {/* Draw lines from center to departments - 6 departments in circle */}
            <line x1="400" y1="300" x2="400" y2="100" stroke="#cccccc" strokeWidth="2" />
            <line x1="400" y1="300" x2="550" y2="150" stroke="#cccccc" strokeWidth="2" />
            <line x1="400" y1="300" x2="550" y2="450" stroke="#cccccc" strokeWidth="2" />
            <line x1="400" y1="300" x2="400" y2="500" stroke="#cccccc" strokeWidth="2" />
            <line x1="400" y1="300" x2="250" y2="450" stroke="#cccccc" strokeWidth="2" />
            <line x1="400" y1="300" x2="250" y2="150" stroke="#cccccc" strokeWidth="2" />
            
            {/* Center VIVN node */}
            <g>
              <circle cx="400" cy="300" r="40" fill="#1976d2" />
              <text x="400" y="305" textAnchor="middle" fill="white" fontSize="18" fontWeight="bold">
                VIVN
              </text>
            </g>

            {/* Sales - Top */}
            <g 
              style={{ cursor: 'pointer' }} 
              onClick={() => {
                setSelectedDepartment('Sales');
                setSelectedEmployees(departmentGroups['Sales'] || []);
                setDepartmentDialogOpen(true);
              }}
            >
              <circle cx="400" cy="100" r="35" fill="#4caf50" />
              <text x="400" y="95" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">
                Sales
              </text>
              <text x="400" y="110" textAnchor="middle" fill="white" fontSize="12">
                ({departmentGroups['Sales']?.length || 0})
              </text>
            </g>

            {/* Engineering - Top Right */}
            <g 
              style={{ cursor: 'pointer' }} 
              onClick={() => {
                setSelectedDepartment('Engineering');
                setSelectedEmployees(departmentGroups['Engineering'] || []);
                setDepartmentDialogOpen(true);
              }}
            >
              <circle cx="550" cy="150" r="35" fill="#ff9800" />
              <text x="550" y="145" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">
                Engineering
              </text>
              <text x="550" y="160" textAnchor="middle" fill="white" fontSize="12">
                ({departmentGroups['Engineering']?.length || 0})
              </text>
            </g>

            {/* Commissioning - Right */}
            <g 
              style={{ cursor: 'pointer' }} 
              onClick={() => {
                setSelectedDepartment('Commissioning');
                setSelectedEmployees(departmentGroups['Commissioning'] || []);
                setDepartmentDialogOpen(true);
              }}
            >
              <circle cx="550" cy="450" r="35" fill="#2196f3" />
              <text x="550" y="445" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">
                Commissioning
              </text>
              <text x="550" y="460" textAnchor="middle" fill="white" fontSize="12">
                ({departmentGroups['Commissioning']?.length || 0})
              </text>
            </g>

            {/* Back office - Bottom */}
            <g 
              style={{ cursor: 'pointer' }} 
              onClick={() => {
                setSelectedDepartment('Back office');
                setSelectedEmployees(departmentGroups['Back office'] || []);
                setDepartmentDialogOpen(true);
              }}
            >
              <circle cx="400" cy="500" r="35" fill="#9c27b0" />
              <text x="400" y="495" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">
                Back office
              </text>
              <text x="400" y="510" textAnchor="middle" fill="white" fontSize="12">
                ({departmentGroups['Back office']?.length || 0})
              </text>
            </g>

            {/* Contract - Bottom Left */}
            <g 
              style={{ cursor: 'pointer' }} 
              onClick={() => {
                setSelectedDepartment('Contract');
                setSelectedEmployees(departmentGroups['Contract'] || []);
                setDepartmentDialogOpen(true);
              }}
            >
              <circle cx="250" cy="450" r="35" fill="#f44336" />
              <text x="250" y="445" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">
                Contract
              </text>
              <text x="250" y="460" textAnchor="middle" fill="white" fontSize="12">
                ({departmentGroups['Contract']?.length || 0})
              </text>
            </g>

            {/* Drafter - Top Left */}
            <g 
              style={{ cursor: 'pointer' }} 
              onClick={() => {
                setSelectedDepartment('Drafter');
                setSelectedEmployees(departmentGroups['Drafter'] || []);
                setDepartmentDialogOpen(true);
              }}
            >
              <circle cx="250" cy="150" r="35" fill="#607d8b" />
              <text x="250" y="145" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">
                Drafter
              </text>
              <text x="250" y="160" textAnchor="middle" fill="white" fontSize="12">
                ({departmentGroups['Drafter']?.length || 0})
              </text>
            </g>

          </svg>
        </Box>

        {/* Department Employees Dialog */}
        <Dialog
          open={departmentDialogOpen}
          onClose={() => setDepartmentDialogOpen(false)}
          maxWidth="xl"
          fullWidth
          PaperProps={{
            sx: { 
              maxHeight: '85vh',
              width: 'auto',
              maxWidth: '88vw'
            }
          }}
        >
          <DialogTitle>
            <Typography variant="h6">{selectedDepartment} Department Employees</Typography>
          </DialogTitle>
          <DialogContent dividers>
            <Grid container spacing={1}>
              {selectedEmployees.map((employee: Employee) => (
                <Grid item xs={12} sm={6} md={3} lg={3} key={employee.Id_number}>
                  <Card sx={{ height: 'auto', minHeight: '200px' }}>
                    <CardContent sx={{ p: 2 }}>
                      {/* Row 1: Name - Department */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Typography variant="h6" sx={{ fontSize: '16px', fontWeight: 600, flex: 1, mr: 1 }}>
                          {employee.full_name}
                        </Typography>
                        <Typography variant="body2" sx={{ fontSize: '14px', color: 'primary.main', fontWeight: 500 }}>
                          {employee.department}
                        </Typography>
                      </Box>

                      {/* Row 2: ID - Position */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="body2" sx={{ fontSize: '14px', color: 'text.secondary' }}>
                          ID: {employee.Id_number}
                        </Typography>
                        <Typography variant="body2" sx={{ fontSize: '14px', color: 'text.primary' }}>
                          {employee.position}
                        </Typography>
                      </Box>

                      {/* Row 3: DOB - Gender */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="body2" sx={{ fontSize: '14px', color: 'text.primary' }}>
                          DOB: {formatDate(employee.dob, true)?.replace(/\//g, '-')}
                        </Typography>
                        <Typography variant="body2" sx={{ fontSize: '14px', color: 'text.primary' }}>
                          {employee.gender}
                        </Typography>
                      </Box>

                      {/* Row 4: Tax Code - Contact */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="body2" sx={{ fontSize: '14px', color: 'text.secondary' }}>
                          Tax Code: {employee.tax_code}
                        </Typography>
                        <Typography variant="body2" sx={{ fontSize: '14px', color: 'text.secondary' }}>
                          {employee.phone}
                        </Typography>
                      </Box>

                      {/* Row 5: Join Date - Address */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ fontSize: '14px', color: 'text.secondary' }}>
                          Joined: {employee.join_date || 'N/A'}
                        </Typography>
                        <Typography variant="body2" sx={{ fontSize: '14px', color: 'text.secondary', maxWidth: '60%', textAlign: 'right' }}>
                          {employee.current_address || employee.address || 'No address'}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </DialogContent>
        </Dialog>
      </>
    );
  };

  // Compact Table View Component
  const renderCompactView = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell><Typography variant="subtitle2" fontWeight="bold">Employee</Typography></TableCell>
            <TableCell><Typography variant="subtitle2" fontWeight="bold">Gender</Typography></TableCell>
            <TableCell><Typography variant="subtitle2" fontWeight="bold">DOB</Typography></TableCell>
            <TableCell><Typography variant="subtitle2" fontWeight="bold">Position</Typography></TableCell>
            <TableCell><Typography variant="subtitle2" fontWeight="bold">Department</Typography></TableCell>
            <TableCell><Typography variant="subtitle2" fontWeight="bold">Contact</Typography></TableCell>
            <TableCell><Typography variant="subtitle2" fontWeight="bold">ID Number</Typography></TableCell>
            <TableCell><Typography variant="subtitle2" fontWeight="bold">Current Address</Typography></TableCell>
            <TableCell><Typography variant="subtitle2" fontWeight="bold">Address</Typography></TableCell>
            <TableCell><Typography variant="subtitle2" fontWeight="bold">Tax Code</Typography></TableCell>
            <TableCell sx={{ width: 50 }}></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {paginatedEmployees.map((employee: Employee) => (
            <React.Fragment key={employee.Id_number}>
              <TableRow>
                <TableCell>
                  <Box>
                    <Typography variant="body2" fontWeight="bold">
                      {employee.full_name}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {employee.gender}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {formatDate(employee.dob, true)}
                  </Typography>
                </TableCell>
                <TableCell sx={{ maxWidth: 200 }}>
                  <Typography variant="body2" sx={{ wordWrap: 'break-word' }}>
                    {employee.position}
                  </Typography>
                </TableCell>
                <TableCell sx={{ maxWidth: 150 }}>
                  <Typography variant="body2" sx={{ wordWrap: 'break-word' }}>
                    {employee.department}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{employee.phone}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{employee.Id_number}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ wordWrap: 'break-word', maxWidth: 200 }}>
                    {employee.current_address}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ wordWrap: 'break-word', maxWidth: 200 }}>
                    {employee.address}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ wordWrap: 'break-word', maxWidth: 150 }}>
                    {employee.tax_code}
                  </Typography>
                </TableCell>
                <TableCell sx={{ width: 50, textAlign: 'center' }}>
                  <Button 
                    size="small" 
                    onClick={() => handleExpandEmployee(employee.Id_number)}
                    sx={{ 
                      minWidth: 'auto', 
                      p: 0.25,
                      width: 30,
                      height: 30
                    }}
                  >
                    {expandedEmployees.has(employee.Id_number) ? <ExpandLess /> : <ExpandMore />}
                  </Button>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={11}>
                  <Collapse in={expandedEmployees.has(employee.Id_number)} timeout="auto" unmountOnExit>
                    <Box sx={{ margin: 1 }}>
                      <Typography variant="h6" gutterBottom component="div">
                        Complete Details
                      </Typography>
                      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 2, fontSize: '0.875rem' }}>
                        <Box>
                          <Box sx={{ mb: 0.75 }}>
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Salary:</Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                                {visibleSalaries.has(employee.Id_number) 
                                  ? formatCurrency(employee.salary) 
                                  : '••••••••••'}
                              </Typography>
                              <IconButton
                                size="small"
                                onClick={() => toggleSalaryVisibility(employee.Id_number)}
                                sx={{ p: 0, width: 18, height: 18 }}
                              >
                                <Typography variant="body2" sx={{ fontSize: 11 }}>
                                  {visibleSalaries.has(employee.Id_number) ? '👁⃠' : '👁'}
                                </Typography>
                              </IconButton>
                            </Box>
                          </Box>
                          <Box sx={{ mb: 0.75 }}>
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.75rem', fontWeight: 'bold' }}>ID Issue Date:</Typography>
                            <Typography variant="body2" sx={{ fontSize: '0.875rem', wordWrap: 'break-word', whiteSpace: 'normal' }}>{formatDate(employee.Issue_date)}</Typography>
                          </Box>
                          <Box sx={{ mb: 0.75 }}>
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Join Date:</Typography>
                            <Typography variant="body2" sx={{ fontSize: '0.875rem', wordWrap: 'break-word', whiteSpace: 'normal' }}>{formatDate(employee.join_date)}</Typography>
                          </Box>
                        </Box>
                        
                        <Box>
                          <Box sx={{ mb: 0.75 }}>
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Contract ID:</Typography>
                            <Typography variant="body2" sx={{ fontSize: '0.875rem', wordWrap: 'break-word', whiteSpace: 'normal' }}>{employee.contract_id || '-'}</Typography>
                          </Box>
                          <Box sx={{ mb: 0.75 }}>
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Education:</Typography>
                            <Typography variant="body2" sx={{ fontSize: '0.875rem', wordWrap: 'break-word', whiteSpace: 'normal' }}>{employee.education_level || '-'}</Typography>
                          </Box>
                          <Box sx={{ mb: 0.75 }}>
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Bank Account:</Typography>
                            <Typography variant="body2" sx={{ fontSize: '0.875rem', wordWrap: 'break-word', whiteSpace: 'normal' }}>{employee.bank_account || '-'}</Typography>
                          </Box>
                        </Box>
                        
                        <Box>
                          <Box sx={{ mb: 0.75 }}>
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Contract Type:</Typography>
                            <Chip 
                              label={employee.contract_type} 
                              size="small" 
                              color={employee.contract_type === 'Không thời hạn' ? 'success' : 'default'}
                              sx={{ height: 20, fontSize: '0.75rem' }}
                            />
                          </Box>
                          <Box sx={{ mb: 0.75 }}>
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Social Insurance Number:</Typography>
                            <Typography variant="body2" sx={{ fontSize: '0.875rem', wordWrap: 'break-word', whiteSpace: 'normal' }}>{employee.social_insurance_number || '-'}</Typography>
                          </Box>
                          <Box sx={{ mb: 0.75 }}>
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Bank Name:</Typography>
                            <Typography variant="body2" sx={{ fontSize: '0.875rem', wordWrap: 'break-word', whiteSpace: 'normal' }}>{employee.bank_name || '-'}</Typography>
                          </Box>
                        </Box>
                        
                        <Box>
                          <Box sx={{ mb: 0.75 }}>
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Contract Sign Date:</Typography>
                            <Typography variant="body2" sx={{ fontSize: '0.875rem', wordWrap: 'break-word', whiteSpace: 'normal' }}>{formatDate(employee.contract_sign_date)}</Typography>
                          </Box>
                          <Box sx={{ mb: 0.75 }}>
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Emergency Contact:</Typography>
                            <Typography variant="body2" sx={{ fontSize: '0.875rem', wordWrap: 'break-word', whiteSpace: 'normal' }}>{employee.emergency_contact || '-'}</Typography>
                          </Box>
                          <Box sx={{ mb: 0.75 }}>
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.75rem', fontWeight: 'bold' }}>PVI Care:</Typography>
                            {employee.pvi_care ? (
                              <Chip 
                                label="Yes" 
                                size="small" 
                                color="info"
                                sx={{ height: 20, fontSize: '0.75rem' }}
                              />
                            ) : (
                              <Typography variant="body2" sx={{ fontSize: '0.875rem', wordWrap: 'break-word', whiteSpace: 'normal' }}>-</Typography>
                            )}
                          </Box>
                        </Box>
                        
                        <Box>
                          <Box sx={{ mb: 0.75 }}>
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Contract End Date:</Typography>
                            <Typography variant="body2" sx={{ fontSize: '0.875rem', wordWrap: 'break-word', whiteSpace: 'normal' }}>{employee.contract_end_date || '-'}</Typography>
                          </Box>
                          <Box sx={{ mb: 0.75 }}>
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Dependent Count:</Typography>
                            <Typography variant="body2" sx={{ fontSize: '0.875rem', wordWrap: 'break-word', whiteSpace: 'normal' }}>{employee.dependent_count || '-'}</Typography>
                          </Box>
                          <Box sx={{ mb: 0.75 }}>
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Medical Insurance:</Typography>
                            <Typography variant="body2" sx={{ fontSize: '0.875rem', wordWrap: 'break-word', whiteSpace: 'normal' }}>{employee.medical_insurance_hospital || '-'}</Typography>
                          </Box>
                        </Box>
                        
                        <Box>
                          <Box sx={{ mb: 0.75 }}>
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Last Salary Adjustment:</Typography>
                            <Typography variant="body2" sx={{ fontSize: '0.875rem', wordWrap: 'break-word', whiteSpace: 'normal' }}>{formatDate(employee.last_salary_adjustment, true)}</Typography>
                          </Box>
                          <Box sx={{ mb: 0.75 }}>
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Allowance:</Typography>
                            <Typography variant="body2" sx={{ fontSize: '0.875rem', wordWrap: 'break-word', whiteSpace: 'normal' }}>{employee.allowance || '-'}</Typography>
                          </Box>
                          <Box sx={{ mb: 0.75 }}>
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Training Skills:</Typography>
                            <Typography variant="body2" sx={{ fontSize: '0.875rem', wordWrap: 'break-word', whiteSpace: 'normal' }}>{employee.training_skills || '-'}</Typography>
                          </Box>
                        </Box>
                      </Box>
                    </Box>
                  </Collapse>
                </TableCell>
              </TableRow>
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  return (
    <Box>
      {/* View Mode Selector and Search/Filter Section */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        {viewMode !== 'cards' && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 600 }}>
              🔍 Search & Filter
            </Typography>
          </Box>
        )}

        {viewMode !== 'cards' && (
          <>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3.5}>
            <TextField
              fullWidth
              label="Search employee name"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Employee name..."
              size="small"
            />
          </Grid>
          <Grid item xs={6} md={2}>
            <FormControl fullWidth size="small">
              <Select
                value={filters.position}
                onChange={(e) => setFilters({ ...filters, position: e.target.value })}
                displayEmpty
                renderValue={(selected) => {
                  if (!selected) {
                    return <em style={{ color: '#999' }}>Position</em>;
                  }
                  return selected === '' ? 'All Positions' : selected;
                }}
              >
                <MenuItem value="">All Positions</MenuItem>
                {filterOptions.positions.map((position) => (
                  <MenuItem key={position} value={position}>
                    {position}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} md={2}>
            <FormControl fullWidth size="small">
              <Select
                value={filters.department}
                onChange={(e) => setFilters({ ...filters, department: e.target.value })}
                displayEmpty
                renderValue={(selected) => {
                  if (!selected) {
                    return <em style={{ color: '#999' }}>Department</em>;
                  }
                  return selected === '' ? 'All Departments' : selected;
                }}
              >
                <MenuItem value="">All Departments</MenuItem>
                {filterOptions.departments.map((department) => (
                  <MenuItem key={department} value={department}>
                    {department}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} md={1.5}>
            <FormControl fullWidth size="small">
              <Select
                value={filters.gender}
                onChange={(e) => setFilters({ ...filters, gender: e.target.value })}
                displayEmpty
                renderValue={(selected) => {
                  if (!selected) {
                    return <em style={{ color: '#999' }}>Gender</em>;
                  }
                  return selected === '' ? 'All Genders' : selected;
                }}
              >
                <MenuItem value="">All Genders</MenuItem>
                {filterOptions.genders.map((gender) => (
                  <MenuItem key={gender} value={gender}>
                    {gender}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={1.5}>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button variant="outlined" onClick={clearFilters} size="small">
                Clear
              </Button>
            </Box>
          </Grid>
        </Grid>
          </>
        )}
      </Paper>


      {/* Actions */}
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 600 }}>
            Employee List ({employees.length} records)
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="contained"
              color="secondary"
              onClick={exportData}
              sx={{ 
                fontWeight: 600,
                borderRadius: 2,
                px: 3,
                py: 1.2,
                boxShadow: '0px 2px 4px 0px rgba(0, 0, 0, 0.1)',
                '&:hover': {
                  boxShadow: '0px 4px 8px 0px rgba(0, 0, 0, 0.15)',
                  transform: 'translateY(-1px)'
                }
              }}
            >
              📥 Export Excel
            </Button>
            <Button
              variant="contained"
              component="label"
              color="info"
              sx={{ 
                fontWeight: 600,
                borderRadius: 2,
                px: 3,
                py: 1.2,
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: '0px 4px 8px 0px rgba(0, 0, 0, 0.15)',
                  transform: 'translateY(-1px)'
                }
              }}
            >
              📤 Upload Excel
              <input
                type="file"
                hidden
                accept=".xlsx,.xls"
                onChange={importData}
              />
            </Button>
            <Button
              variant="contained"
              color="primary"
              sx={{ 
                fontWeight: 600,
                borderRadius: 2,
                px: 3,
                py: 1.2,
                boxShadow: '0px 2px 4px 0px rgba(0, 0, 0, 0.1)',
                '&:hover': {
                  boxShadow: '0px 4px 8px 0px rgba(0, 0, 0, 0.15)',
                  transform: 'translateY(-1px)'
                }
              }}
            >
              ➕ Add Employee
            </Button>
          </Box>
        </Box>
        <ToggleButtonGroup
          value={viewMode}
          exclusive
          onChange={handleViewChange}
          size="small"
        >
          <ToggleButton value="compact" sx={{ fontWeight: 600 }}>📋 Compact</ToggleButton>
          <ToggleButton value="cards" sx={{ fontWeight: 600 }}>🎴 Cards</ToggleButton>
          <ToggleButton value="table" sx={{ fontWeight: 600 }}>📊 Full Table</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Employee Display */}
      {viewMode === 'cards' && renderCardView()}
      {viewMode === 'compact' && renderCompactView()}
      {viewMode === 'table' && (
        <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
          <Table sx={{ minWidth: 3800, tableLayout: 'auto' }}>
            <TableHead>
              <TableRow>
                <TableCell><Typography variant="subtitle2" fontWeight="bold">Full Name</Typography></TableCell>
                <TableCell><Typography variant="subtitle2" fontWeight="bold">DOB</Typography></TableCell>
                <TableCell><Typography variant="subtitle2" fontWeight="bold">Gender</Typography></TableCell>
                <TableCell><Typography variant="subtitle2" fontWeight="bold">ID Number</Typography></TableCell>
                <TableCell><Typography variant="subtitle2" fontWeight="bold">ID Issue Date</Typography></TableCell>
                <TableCell><Typography variant="subtitle2" fontWeight="bold">Address</Typography></TableCell>
                <TableCell><Typography variant="subtitle2" fontWeight="bold">Current Address</Typography></TableCell>
                <TableCell><Typography variant="subtitle2" fontWeight="bold">Phone</Typography></TableCell>
                <TableCell><Typography variant="subtitle2" fontWeight="bold">Emergency Contact</Typography></TableCell>
                <TableCell><Typography variant="subtitle2" fontWeight="bold">Education Level</Typography></TableCell>
                <TableCell><Typography variant="subtitle2" fontWeight="bold">Department</Typography></TableCell>
                <TableCell><Typography variant="subtitle2" fontWeight="bold">Join Date</Typography></TableCell>
                <TableCell><Typography variant="subtitle2" fontWeight="bold">Position</Typography></TableCell>
                <TableCell><Typography variant="subtitle2" fontWeight="bold">Contract ID</Typography></TableCell>
                <TableCell><Typography variant="subtitle2" fontWeight="bold">Contract Type</Typography></TableCell>
                <TableCell><Typography variant="subtitle2" fontWeight="bold">Contract Sign Date</Typography></TableCell>
                <TableCell><Typography variant="subtitle2" fontWeight="bold">Contract End Date</Typography></TableCell>
                <TableCell><Typography variant="subtitle2" fontWeight="bold">Salary</Typography></TableCell>
                <TableCell><Typography variant="subtitle2" fontWeight="bold">Allowance</Typography></TableCell>
                <TableCell><Typography variant="subtitle2" fontWeight="bold">Last Salary Adjustment</Typography></TableCell>
                <TableCell><Typography variant="subtitle2" fontWeight="bold">Education</Typography></TableCell>
                <TableCell><Typography variant="subtitle2" fontWeight="bold">Dependent Count</Typography></TableCell>
                <TableCell><Typography variant="subtitle2" fontWeight="bold">Social Insurance Number</Typography></TableCell>
                <TableCell><Typography variant="subtitle2" fontWeight="bold">Medical Insurance Hospital</Typography></TableCell>
                <TableCell><Typography variant="subtitle2" fontWeight="bold">Bank Account</Typography></TableCell>
                <TableCell><Typography variant="subtitle2" fontWeight="bold">Bank Name</Typography></TableCell>
                <TableCell><Typography variant="subtitle2" fontWeight="bold">PVI Care</Typography></TableCell>
                <TableCell><Typography variant="subtitle2" fontWeight="bold">Training Courses</Typography></TableCell>
                <TableCell><Typography variant="subtitle2" fontWeight="bold">Training Skills</Typography></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedEmployees.map((employee: Employee) => (
                <TableRow key={employee.Id_number} hover>
                  <TableCell sx={{ minWidth: 200 }}>
                    <Typography variant="body2" sx={{ wordWrap: 'break-word', whiteSpace: 'normal' }}>
                      {employee.full_name}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ minWidth: 120 }}>
                    <Typography variant="body2">
                      {formatDate(employee.dob, true)}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ minWidth: 80 }}>
                    <Typography variant="body2">
                      {employee.gender}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ minWidth: 130 }}>
                    <Typography variant="body2">
                      {employee.Id_number}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ minWidth: 120 }}>
                    <Typography variant="body2">
                      {formatDate(employee.Issue_date)}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ minWidth: 250 }}>
                    <Typography variant="body2" sx={{ wordWrap: 'break-word', whiteSpace: 'normal' }}>
                      {employee.address}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ minWidth: 250 }}>
                    <Typography variant="body2" sx={{ wordWrap: 'break-word', whiteSpace: 'normal' }}>
                      {employee.current_address}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ minWidth: 120 }}>
                    <Typography variant="body2">
                      {employee.phone}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ minWidth: 150 }}>
                    <Typography variant="body2" sx={{ wordWrap: 'break-word', whiteSpace: 'normal' }}>
                      {employee.emergency_contact || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ minWidth: 200 }}>
                    <Typography variant="body2" sx={{ wordWrap: 'break-word', whiteSpace: 'normal' }}>
                      {employee.education_level}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ minWidth: 150 }}>
                    <Typography variant="body2" sx={{ wordWrap: 'break-word', whiteSpace: 'normal' }}>
                      {employee.department}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ minWidth: 120 }}>
                    <Typography variant="body2">
                      {formatDate(employee.join_date)}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ minWidth: 200 }}>
                    <Typography variant="body2" sx={{ wordWrap: 'break-word', whiteSpace: 'normal' }}>
                      {employee.position}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ minWidth: 180 }}>
                    <Typography variant="body2" sx={{ wordWrap: 'break-word', whiteSpace: 'normal' }}>
                      {employee.contract_id}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ minWidth: 150 }}>
                    <Typography variant="body2" sx={{ wordWrap: 'break-word', whiteSpace: 'normal' }}>
                      {employee.contract_type}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ minWidth: 140 }}>
                    <Typography variant="body2">
                      {formatDate(employee.contract_sign_date)}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ minWidth: 140 }}>
                    <Typography variant="body2">
                      {formatDate(employee.contract_end_date)}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ minWidth: 120 }}>
                    <Typography variant="body2">
                      {formatCurrency(employee.salary)}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ minWidth: 120 }}>
                    <Typography variant="body2" sx={{ wordWrap: 'break-word', whiteSpace: 'normal' }}>
                      {employee.allowance || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ minWidth: 140 }}>
                    <Typography variant="body2">
                      {formatDate(employee.last_salary_adjustment, true)}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ minWidth: 120 }}>
                    <Typography variant="body2">
                      {employee.education_level}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ minWidth: 120 }}>
                    <Typography variant="body2">
                      {employee.dependent_count || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ minWidth: 150 }}>
                    <Typography variant="body2">
                      {employee.social_insurance_number}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ minWidth: 200 }}>
                    <Typography variant="body2" sx={{ wordWrap: 'break-word', whiteSpace: 'normal' }}>
                      {employee.medical_insurance_hospital}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ minWidth: 150 }}>
                    <Typography variant="body2">
                      {employee.bank_account}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ minWidth: 150 }}>
                    <Typography variant="body2" sx={{ wordWrap: 'break-word', whiteSpace: 'normal' }}>
                      {employee.bank_name || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ minWidth: 100 }}>
                    <Typography variant="body2">
                      {employee.pvi_care}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ minWidth: 200 }}>
                    <Typography variant="body2" sx={{ wordWrap: 'break-word', whiteSpace: 'normal' }}>
                      {employee.training_courses || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ minWidth: 200 }}>
                    <Typography variant="body2" sx={{ wordWrap: 'break-word', whiteSpace: 'normal' }}>
                      {employee.training_skills}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Pagination */}
      {viewMode !== 'cards' && (
        <Paper sx={{ mt: 2 }}>
          <TablePagination
            rowsPerPageOptions={[20, 60, 100]}
            component="div"
            count={employees.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Paper>
      )}
    </Box>
  );
};

export default EmployeeDashboard;