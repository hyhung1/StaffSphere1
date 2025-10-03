import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { ExpandMore, ExpandLess, DeleteOutline, Edit } from '@mui/icons-material';
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
  Collapse,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import axios from 'axios';
import { getAuthHeaders } from '../lib/auth-headers';

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

type SalaryInput = {
  employeeNo: string;
  name: string;
  salary: number;
  bonus: number;
  allowanceTax: number;
  ot15: number;
  ot20: number;
  ot30: number;
  dependants: number;
  advance: number;
};

const EmployeeDashboard: React.FC = () => {
  const location = useLocation();
  
  // Get view mode from URL parameters
  const getViewModeFromURL = (): 'cards' | 'compact' => {
    const searchParams = new URLSearchParams(location.search);
    const viewParam = searchParams.get('view');
    return viewParam === 'compact' ? 'compact' : 'cards';
  };

  const [employees, setEmployees] = useState<Employee[]>([]); // Filtered employees for Dashboard
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]); // All employees for Company Overview
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'compact'>(getViewModeFromURL());
  const [expandedEmployees, setExpandedEmployees] = useState<Set<string>>(new Set());
  const [visibleSalaries, setVisibleSalaries] = useState<Set<string>>(new Set());
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [departmentDialogOpen, setDepartmentDialogOpen] = useState(false);
  const [selectedEmployees, setSelectedEmployees] = useState<Employee[]>([]);
  const [showDepartments, setShowDepartments] = useState(true);
  const [filters, setFilters] = useState({
    department: '',
    position: '',
    contract_type: '',
    gender: '',
    min_age: '',
    max_age: '',
  });
  
  const [filterOptions, setFilterOptions] = useState({
    positions: [],
    departments: [],
    genders: [],
    contract_types: []
  });

  const API_BASE_URL = ''; // Rely on Vite proxy to route to http://localhost:3200

  useEffect(() => {
    fetchAllEmployees(); // Always fetch all employees for Company Overview
    fetchFilteredEmployees(); // Fetch filtered employees for Dashboard
    fetchFilterOptions();
  }, []);

  // Realtime filtering - trigger when search term or filters change (only for Dashboard)
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(0);
      fetchFilteredEmployees();
    }, 300); // 300ms debounce to avoid too many API calls

    return () => clearTimeout(timer);
  }, [searchTerm, filters]);

  // Update view mode when URL changes
  useEffect(() => {
    setViewMode(getViewModeFromURL());
  }, [location.search]);

  // Animation effect for organizational chart
  useEffect(() => {
    if (viewMode === 'cards') {
      // Reset animation
      setShowDepartments(false);
      
      // Show departments after 0.5s delay
      const timer = setTimeout(() => {
        setShowDepartments(true);
      }, 500);

      return () => clearTimeout(timer);
    } else {
      // Ensure departments are visible for other views
      setShowDepartments(true);
    }
  }, [viewMode]);

  // Ensure chart shows on initial load
  useEffect(() => {
    if (allEmployees.length > 0 && viewMode === 'cards') {
      setShowDepartments(true);
    }
  }, [allEmployees, viewMode]);

  const fetchAllEmployees = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/employees`, {
        headers: getAuthHeaders()
      });
      setAllEmployees(response.data);
    } catch (error) {
      console.error('Error fetching all employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFilteredEmployees = async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (filters.department) params.append('department', filters.department);
      if (filters.position) params.append('position', filters.position);
      if (filters.contract_type) params.append('contract_type', filters.contract_type);
      if (filters.gender) params.append('gender', filters.gender);
      if (filters.min_age) params.append('min_age', filters.min_age);
      if (filters.max_age) params.append('max_age', filters.max_age);

      const response = await axios.get(`/api/employees?${params.toString()}`, {
        headers: getAuthHeaders()
      });
      setEmployees(response.data);
    } catch (error) {
      console.error('Error fetching filtered employees:', error);
    }
  };

  const fetchFilterOptions = async () => {
    try {
      const response = await axios.get(`/api/filter-options`, {
        headers: getAuthHeaders()
      });
      setFilterOptions(response.data);
    } catch (error) {
      console.error('Error fetching filter options:', error);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilters({
      department: '',
      position: '',
      contract_type: '',
      gender: '',
      min_age: '',
      max_age: '',
    });
    setPage(0);
  };

  const exportData = async () => {
    try {
      // Export ALL employees without any filters
      // This ensures the full employee list is downloaded regardless of active filters
      const response = await axios.get(`/api/export/excel`, {
        responseType: 'blob',
        headers: getAuthHeaders()
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'vivn_employees.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      // Show success message
      setSnackbar({
        open: true,
        message: `✅ Successfully exported ${allEmployees.length} employees to Excel!`,
        severity: 'success'
      });
    } catch (error) {
      console.error('Error exporting data:', error);
      setSnackbar({
        open: true,
        message: '❌ Failed to export data. Please try again.',
        severity: 'error'
      });
    }
  };

  const importData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const authHeaders = getAuthHeaders();
      const response = await axios.post(`/api/import/excel`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...authHeaders
        },
      });
      
      fetchAllEmployees();
      fetchFilteredEmployees();
      
      // Show success notification
      const count = response.data?.count || 'all';
      setSnackbar({
        open: true,
        message: `✅ Successfully imported ${count} employees from Excel file!`,
        severity: 'success'
      });
      
      // Reset the file input
      event.target.value = '';
    } catch (error: any) {
      console.error('Error importing data:', error);
      const errorMessage = error.response?.data?.detail || 'Failed to import Excel file. Please check the file format and try again.';
      setSnackbar({
        open: true,
        message: `❌ ${errorMessage}`,
        severity: 'error'
      });
      
      // Reset the file input
      event.target.value = '';
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

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getCurrentEmployees = () => {
    return viewMode === 'cards' ? allEmployees : employees;
  };

  const paginatedEmployees = getCurrentEmployees().slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const groupEmployeesByDepartment = () => {
    const groups: Record<string, Employee[]> = {};
    const currentEmployees = getCurrentEmployees();

    currentEmployees.forEach(emp => {
      if (!groups[emp.department]) {
        groups[emp.department] = [];
      }
      groups[emp.department].push(emp);
    });

    return groups;
  };

  const renderCardView = () => {
    const departmentGroups = groupEmployeesByDepartment();

    return (
      <>
        <Grid container spacing={2} sx={{ pl: 0, ml: -1, mr: 0 }}>
          <Grid item xs={12} lg={7} sx={{ pl: 0, ml: 0 }}>
            <Box sx={{ 
              width: '100%', 
              minHeight: '600px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, #1A365D 0%, #2C5282 50%, #1A365D 100%)',
              borderRadius: 4,
              p: 3,
              boxShadow: '0 8px 32px rgba(44, 82, 130, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'radial-gradient(circle at 20% 50%, rgba(44, 82, 130, 0.2) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)',
                pointerEvents: 'none'
              }
            }}>
              <Box sx={{ 
                position: 'relative',
                width: '100%',
                maxWidth: '900px',
                height: '600px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                <svg 
                  width="100%" 
                  height="100%" 
                  viewBox="0 0 900 600" 
                  preserveAspectRatio="xMidYMid meet"
                  style={{ 
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '16px',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    backdropFilter: 'blur(10px)',
                    position: 'relative',
                    zIndex: 1
                  }}
                >
                  <style>
                    {`
                      .dept-animation {
                        opacity: ${showDepartments ? 1 : 0};
                        transition: opacity 0.8s ease-in-out;
                      }
                      .line-animation {
                        opacity: ${showDepartments ? 1 : 0};
                        transition: opacity 0.8s ease-in-out;
                      }
                    `}
                  </style>
                  <defs>
                    <linearGradient id="modernLineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8"/>
                      <stop offset="50%" stopColor="#a7f3d0" stopOpacity="1.0"/>
                      <stop offset="100%" stopColor="#ffffff" stopOpacity="0.8"/>
                    </linearGradient>
                    <radialGradient id="modernCenterGradient" cx="50%" cy="50%">
                      <stop offset="0%" stopColor="#ffffff"/>
                      <stop offset="50%" stopColor="#f0f9ff"/>
                      <stop offset="100%" stopColor="#e0f2fe"/>
                    </radialGradient>
                    <filter id="glow">
                      <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                      <feMerge> 
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                    <filter id="dropshadow" x="-50%" y="-50%" width="200%" height="200%">
                      <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#000000" floodOpacity="0.1"/>
                    </filter>
                  </defs>

                  <g strokeWidth="8" opacity="0.9">
                    <path d="M 450 265 L 450 60" stroke="rgba(255,255,255,0.9)" fill="none" strokeLinecap="round" strokeWidth="8" strokeDasharray="12,6">
                      <animate attributeName="stroke-dashoffset" values="0;18;0" dur="3s" repeatCount="indefinite"/>
                    </path>
                    <path d="M 450 365 L 450 570" stroke="rgba(255,255,255,0.9)" fill="none" strokeLinecap="round" strokeWidth="8" strokeDasharray="12,6">
                      <animate attributeName="stroke-dashoffset" values="0;18;0" dur="3s" repeatCount="indefinite"/>
                    </path>
                    <line x1="503" y1="262" x2="720" y2="180" stroke="url(#modernLineGradient)" strokeLinecap="round" strokeWidth="8" strokeDasharray="12,6">
                      <animate attributeName="stroke-dashoffset" values="0;18;0" dur="3s" repeatCount="indefinite"/>
                    </line>
                    <line x1="503" y1="368" x2="720" y2="420" stroke="url(#modernLineGradient)" strokeLinecap="round" strokeWidth="8" strokeDasharray="12,6">
                      <animate attributeName="stroke-dashoffset" values="0;18;0" dur="3s" repeatCount="indefinite"/>
                    </line>
                    <line x1="397" y1="368" x2="180" y2="420" stroke="url(#modernLineGradient)" strokeLinecap="round" strokeWidth="8" strokeDasharray="12,6">
                      <animate attributeName="stroke-dashoffset" values="0;18;0" dur="3s" repeatCount="indefinite"/>
                    </line>
                    <line x1="397" y1="262" x2="180" y2="180" stroke="url(#modernLineGradient)" strokeLinecap="round" strokeWidth="8" strokeDasharray="12,6">
                      <animate attributeName="stroke-dashoffset" values="0;18;0" dur="3s" repeatCount="indefinite"/>
                    </line>
                  </g>

                  <g transform="translate(450, 315)">
                    <circle 
                      cx="0" 
                      cy="0" 
                      r="110"
                      fill="none"
                      stroke="rgba(255,255,255,0.3)"
                      strokeWidth="3"
                      strokeDasharray="25,8"
                      opacity="0.6"
                    >
                      <animateTransform
                        attributeName="transform"
                        type="rotate"
                        values="0;360"
                        dur="20s"
                        repeatCount="indefinite"/>
                    </circle>
                    <circle
                      cx="0"
                      cy="0"
                      r="95"
                      fill="url(#modernCenterGradient)"
                      filter="url(#dropshadow)"
                      stroke="rgba(255,255,255,0.8)"
                      strokeWidth="4"
                    />
                    <circle
                      cx="0"
                      cy="0"
                      r="88"
                      fill="none"
                      stroke="rgba(0,0,0,0.1)"
                      strokeWidth="2"
                    />
                    <image 
                      x="-50"
                      y="-50"
                      width="100"
                      height="100"
                      href="/logo.png"
                      style={{ filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.3))' }}
                    />
                  </g>

                  <g 
                    className="dept-animation"
                    style={{ cursor: 'pointer' }} 
                    onClick={() => {
                      setSelectedDepartment('Sales');
                      setSelectedEmployees(departmentGroups['Sales'] || []);
                      setDepartmentDialogOpen(true);
                    }}
                    transform="translate(450, 60)"
                  >
                    <rect 
                      x="-90"
                      y="-40"
                      width="180"
                      height="80"
                      rx="20"
                      fill="url(#salesGradient)"
                      filter="url(#dropshadow)"
                      stroke="rgba(255,255,255,0.3)"
                      strokeWidth="2"
                    />
                    <rect 
                      x="-88"
                      y="-38"
                      width="176"
                      height="35"
                      rx="18"
                      fill="rgba(255,255,255,0.2)" 
                    />
                    <text x="0" y="-10" textAnchor="middle" fill="white" fontSize="22" fontWeight="700" fontFamily="Poppins">
                      Sales
                    </text>
                    <text x="0" y="21" textAnchor="middle" fill="rgba(255,255,255,0.9)" fontSize="22" fontWeight="500">
                      ({departmentGroups['Sales']?.length || 0})
                    </text>
                  </g>
                  <defs>
                    <linearGradient id="salesGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#38A169"/>
                      <stop offset="100%" stopColor="#2F855A"/>
                    </linearGradient>
                  </defs>

                  <g 
                    className="dept-animation"
                    style={{ cursor: 'pointer' }} 
                    onClick={() => {
                      setSelectedDepartment('Engineering');
                      setSelectedEmployees(departmentGroups['Engineering'] || []);
                      setDepartmentDialogOpen(true);
                    }}
                    transform="translate(720, 180)"
                  >
                    <rect 
                      x="-100"
                      y="-40"
                      width="200"
                      height="80"
                      rx="20"
                      fill="url(#engineeringGradient)"
                      filter="url(#dropshadow)"
                      stroke="rgba(255,255,255,0.3)"
                      strokeWidth="2"
                    />
                    <rect 
                      x="-98"
                      y="-38"
                      width="196"
                      height="35"
                      rx="18"
                      fill="rgba(255,255,255,0.2)" 
                    />
                    <text x="0" y="-10" textAnchor="middle" fill="white" fontSize="22" fontWeight="700" fontFamily="Poppins">
                      Engineering
                    </text>
                    <text x="0" y="21" textAnchor="middle" fill="rgba(255,255,255,0.9)" fontSize="22" fontWeight="500">
                      ({departmentGroups['Engineering']?.length || 0})
                    </text>
                  </g>
                  <defs>
                    <linearGradient id="engineeringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#D69E2E"/>
                      <stop offset="100%" stopColor="#B7791F"/>
                    </linearGradient>
                  </defs>

                  <g 
                    className="dept-animation"
                    style={{ cursor: 'pointer' }} 
                    onClick={() => {
                      setSelectedDepartment('Commissioning');
                      setSelectedEmployees(departmentGroups['Commissioning'] || []);
                      setDepartmentDialogOpen(true);
                    }}
                    transform="translate(720, 420)"
                  >
                    <rect 
                      x="-110"
                      y="-40"
                      width="220"
                      height="80"
                      rx="20"
                      fill="url(#commissioningGradient)"
                      filter="url(#dropshadow)"
                      stroke="rgba(255,255,255,0.3)"
                      strokeWidth="2"
                    />
                    <rect 
                      x="-108"
                      y="-38"
                      width="216"
                      height="35"
                      rx="18"
                      fill="rgba(255,255,255,0.2)" 
                    />
                    <text x="0" y="-10" textAnchor="middle" fill="white" fontSize="22" fontWeight="700" fontFamily="Poppins">
                      Commissioning
                    </text>
                    <text x="0" y="21" textAnchor="middle" fill="rgba(255,255,255,0.9)" fontSize="22" fontWeight="500">
                      ({departmentGroups['Commissioning']?.length || 0})
                    </text>
                  </g>
                  <defs>
                    <linearGradient id="commissioningGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#3182CE"/>
                      <stop offset="100%" stopColor="#2C5282"/>
                    </linearGradient>
                  </defs>

                  <g 
                    className="dept-animation"
                    style={{ cursor: 'pointer' }} 
                    onClick={() => {
                      setSelectedDepartment('Back office');
                      setSelectedEmployees(departmentGroups['Back office'] || []);
                      setDepartmentDialogOpen(true);
                    }}
                    transform="translate(450, 570)"
                  >
                    <rect 
                      x="-100"
                      y="-40"
                      width="200"
                      height="80"
                      rx="20"
                      fill="url(#backofficeGradient)"
                      filter="url(#dropshadow)"
                      stroke="rgba(255,255,255,0.3)"
                      strokeWidth="2"
                    />
                    <rect 
                      x="-98"
                      y="-38"
                      width="196"
                      height="35"
                      rx="18"
                      fill="rgba(255,255,255,0.2)" 
                    />
                    <text x="0" y="-10" textAnchor="middle" fill="white" fontSize="22" fontWeight="700" fontFamily="Poppins">
                      Back Office
                    </text>
                    <text x="0" y="21" textAnchor="middle" fill="rgba(255,255,255,0.9)" fontSize="22" fontWeight="500">
                      ({departmentGroups['Back office']?.length || 0})
                    </text>
                  </g>
                  <defs>
                    <linearGradient id="backofficeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#805AD5"/>
                      <stop offset="100%" stopColor="#553C9A"/>
                    </linearGradient>
                  </defs>

                  <g 
                    className="dept-animation"
                    style={{ cursor: 'pointer' }} 
                    onClick={() => {
                      setSelectedDepartment('Contract');
                      setSelectedEmployees(departmentGroups['Contract'] || []);
                      setDepartmentDialogOpen(true);
                    }}
                    transform="translate(180, 420)"
                  >
                    <rect 
                      x="-90"
                      y="-40"
                      width="180"
                      height="80"
                      rx="20"
                      fill="url(#contractGradient)"
                      filter="url(#dropshadow)"
                      stroke="rgba(255,255,255,0.3)"
                      strokeWidth="2"
                    />
                    <rect 
                      x="-88"
                      y="-38"
                      width="176"
                      height="35"
                      rx="18"
                      fill="rgba(255,255,255,0.2)" 
                    />
                    <text x="0" y="-10" textAnchor="middle" fill="white" fontSize="22" fontWeight="700" fontFamily="Poppins">
                      Contract
                    </text>
                    <text x="0" y="21" textAnchor="middle" fill="rgba(255,255,255,0.9)" fontSize="22" fontWeight="500">
                      ({departmentGroups['Contract']?.length || 0})
                    </text>
                  </g>
                  <defs>
                    <linearGradient id="contractGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#E53E3E"/>
                      <stop offset="100%" stopColor="#C53030"/>
                    </linearGradient>
                  </defs>

                  <g 
                    className="dept-animation"
                    style={{ cursor: 'pointer' }} 
                    onClick={() => {
                      setSelectedDepartment('Drafter');
                      setSelectedEmployees(departmentGroups['Drafter'] || []);
                      setDepartmentDialogOpen(true);
                    }}
                    transform="translate(180, 180)"
                  >
                    <rect 
                      x="-90"
                      y="-40"
                      width="180"
                      height="80"
                      rx="20"
                      fill="url(#drafterGradient)"
                      filter="url(#dropshadow)"
                      stroke="rgba(255,255,255,0.3)"
                      strokeWidth="2"
                    />
                    <rect 
                      x="-88"
                      y="-38"
                      width="176"
                      height="35"
                      rx="18"
                      fill="rgba(255,255,255,0.2)" 
                    />
                    <text x="0" y="-10" textAnchor="middle" fill="white" fontSize="22" fontWeight="700" fontFamily="Poppins">
                      Drafter
                    </text>
                    <text x="0" y="21" textAnchor="middle" fill="rgba(255,255,255,0.9)" fontSize="22" fontWeight="500">
                      ({departmentGroups['Drafter']?.length || 0})
                    </text>
                  </g>
                  <defs>
                    <linearGradient id="drafterGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#319795"/>
                      <stop offset="100%" stopColor="#2C7A7B"/>
                    </linearGradient>
                  </defs>
                </svg>
              </Box>
            </Box>
          </Grid>
          
          <Grid item xs={12} lg={5}>
            <Box sx={{ 
              width: '100%', 
              minHeight: '600px',
              display: 'flex',
              flexDirection: 'column',
              background: 'linear-gradient(135deg, #2C5282 0%, #1A365D 100%)',
              borderRadius: 3,
              p: 3,
              boxShadow: '0 4px 16px rgba(44,82,130,0.2)',
              border: '1px solid rgba(44,82,130,0.3)',
              gap: 1.5
            }}>
              <Typography variant="h6" sx={{ 
                color: 'white', 
                mb: 1.5, 
                textAlign: 'center',
                fontWeight: 600,
                fontSize: '1.1rem'
              }}>
                📊 Company Statistics Dashboard
              </Typography>

              <Grid container spacing={2} sx={{ mb: 1.5 }}>
                <Grid item xs={6}>
                  <Paper sx={{ p: 1.5, textAlign: 'center', bgcolor: 'primary.main', color: 'white' }}>
                    <Typography variant="h5" sx={{ fontWeight: 700, fontSize: '1.5rem' }}>
                      {allEmployees.length}
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                      Total Employees
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
                  <Paper sx={{ p: 1.5, textAlign: 'center', bgcolor: 'success.main', color: 'white' }}>
                    <Typography variant="h5" sx={{ fontWeight: 700, fontSize: '1.5rem' }}>
                      {(() => {
                        const uniqueDepartments = new Set(allEmployees.map(emp => emp.department));
                        return uniqueDepartments.size;
                      })()}
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                      Departments
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Paper sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.1)', height: '450px', border: '1px solid rgba(255,255,255,0.2)' }}>
                    <Typography variant="subtitle1" sx={{ mb: 1.5, fontWeight: 600, fontSize: '1rem', color: 'white' }}>
                      📋 Employment Details
                    </Typography>
                    {(() => {
                      const genderStats = allEmployees.reduce((acc, emp) => {
                        acc[emp.gender] = (acc[emp.gender] || 0) + 1;
                        return acc;
                      }, {} as Record<string, number>);
                      const educationStats = allEmployees.reduce((acc, emp) => {
                        acc[emp.education_level] = (acc[emp.education_level] || 0) + 1;
                        return acc;
                      }, {} as Record<string, number>);
                      return (
                        <>
                          <Typography variant="body2" sx={{ fontSize: '0.9rem', mb: 0.8, fontWeight: 500, color: 'white' }}>Gender Distribution:</Typography>
                          {Object.entries(genderStats).map(([gender, count]) => (
                            <Box key={gender} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.8 }}>
                              <Typography variant="body2" sx={{ fontSize: '0.9rem', color: 'white' }}>
                                {gender === 'Nam' ? '♂️ Male' : '♀️ Female'}
                              </Typography>
                              <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.9rem', color: 'white' }}>
                                {count} ({Math.round((count / allEmployees.length) * 100)}%)
                              </Typography>
                            </Box>
                          ))}
                          <Typography variant="body2" sx={{ fontSize: '0.9rem', mt: 2.5, mb: 0.8, fontWeight: 500, color: 'white' }}>Education Levels:</Typography>
                          {Object.entries(educationStats)
                            .sort(([,a], [,b]) => b - a)
                            .slice(0, 5)
                            .map(([education, count]) => (
                            <Box key={education} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.8 }}>
                              <Typography variant="body2" sx={{ fontSize: '0.9rem', maxWidth: '65%', color: 'white' }} noWrap>
                                {education}
                              </Typography>
                              <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.9rem', color: 'white' }}>
                                {count} ({Math.round((count / allEmployees.length) * 100)}%)
                              </Typography>
                            </Box>
                          ))}
                        </>
                      );
                    })()}
                  </Paper>
                </Grid>

                <Grid item xs={6}>
                  <Paper sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.1)', height: '450px', border: '1px solid rgba(255,255,255,0.2)' }}>
                    <Typography variant="subtitle1" sx={{ mb: 1.5, fontWeight: 600, fontSize: '1rem', color: 'white' }}>
                      🏢 Department Size
                    </Typography>
                    {(() => {
                      const deptStats = allEmployees.reduce((acc, emp) => {
                        acc[emp.department] = (acc[emp.department] || 0) + 1;
                        return acc;
                      }, {} as Record<string, number>);
                      const contractStats = allEmployees.reduce((acc, emp) => {
                        acc[emp.contract_type] = (acc[emp.contract_type] || 0) + 1;
                        return acc;
                      }, {} as Record<string, number>);
                      return (
                        <>
                          {Object.entries(deptStats)
                            .sort(([,a], [,b]) => b - a)
                            .map(([dept, count]) => (
                            <Box key={dept} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.8 }}>
                              <Typography variant="body2" sx={{ fontSize: '0.9rem', maxWidth: '60%', color: 'white' }} noWrap>
                                {dept}
                              </Typography>
                              <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.9rem', color: 'white' }}>
                                {count} ({Math.round((count / allEmployees.length) * 100)}%)
                              </Typography>
                            </Box>
                          ))}
                          <Typography variant="body2" sx={{ fontSize: '0.9rem', mt: 2.5, mb: 0.8, fontWeight: 500, color: 'white' }}>Contract Types:</Typography>
                          {Object.entries(contractStats).map(([type, count]) => (
                            <Box key={type} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.8 }}>
                              <Typography variant="body2" sx={{ fontSize: '0.9rem', maxWidth: '65%', color: 'white' }} noWrap>
                                {type === 'Không thời hạn' ? 'Permanent' : 'Fixed-term'}
                              </Typography>
                              <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.9rem', color: 'white' }}>
                                {count}
                              </Typography>
                            </Box>
                          ))}
                        </>
                      );
                    })()}
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          </Grid>
        </Grid>

        <Dialog
          open={departmentDialogOpen}
          onClose={() => setDepartmentDialogOpen(false)}
          maxWidth="xl"
          fullWidth
          PaperProps={{
            sx: { 
              maxHeight: '85vh',
              width: 'auto',
              maxWidth: selectedDepartment === 'Contract' ? '95vw' : (selectedDepartment === 'Back office' || selectedDepartment === 'Commissioning') ? '92vw' : '88vw'
            }
          }}
        >
          <DialogTitle>
            <Typography variant="h6">{selectedDepartment} Department Employees</Typography>
          </DialogTitle>
          <DialogContent dividers>
            <Grid container spacing={selectedDepartment === 'Contract' ? 4 : (selectedDepartment === 'Back office' || selectedDepartment === 'Commissioning') ? 3 : 2}>
              {selectedEmployees.map((employee: Employee) => (
                <Grid item xs={12} sm={6} md={selectedDepartment === 'Contract' ? 6 : 4} lg={selectedDepartment === 'Contract' ? 6 : (selectedDepartment === 'Back office' || selectedDepartment === 'Commissioning') ? 4 : 3} key={employee.Id_number}>
                  <Card sx={{ height: 'auto', minHeight: '200px' }}>
                    <CardContent sx={{ p: selectedDepartment === 'Contract' ? 4 : (selectedDepartment === 'Back office' || selectedDepartment === 'Commissioning') ? 2.5 : 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Typography variant="h6" sx={{ fontSize: '17px', fontWeight: 600, flex: 1, mr: 1 }}>
                          {employee.full_name}
                        </Typography>
                        <Typography variant="body2" sx={{ fontSize: '14px', color: 'primary.main', fontWeight: 500 }}>
                          {employee.department}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, gap: 3 }}>
                        <Typography variant="body2" sx={{ fontSize: '14px', color: 'text.secondary', whiteSpace: 'nowrap' }}>
                          <strong>ID:</strong> {employee.Id_number}
                        </Typography>
                        <Typography variant="body2" sx={{ fontSize: '14px', color: 'text.primary', textAlign: 'right' }}>
                          <strong>Position:</strong> {employee.position}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, gap: 3 }}>
                        <Typography variant="body2" sx={{ fontSize: '14px', color: 'text.primary', whiteSpace: 'nowrap' }}>
                          <strong>DOB:</strong> {formatDate(employee.dob, true)?.replace(/\//g, '-')}
                        </Typography>
                        <Typography variant="body2" sx={{ fontSize: '14px', color: 'text.primary', textAlign: 'right' }}>
                          <strong>Gender:</strong> {employee.gender}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, gap: 3 }}>
                        <Typography variant="body2" sx={{ fontSize: '14px', color: 'text.secondary', whiteSpace: 'nowrap' }}>
                          <strong>Tax Code:</strong> {employee.tax_code}
                        </Typography>
                        <Typography variant="body2" sx={{ fontSize: '14px', color: 'text.secondary', textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <strong>Phone:</strong> {employee.phone}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="body2" sx={{ fontSize: '14px', color: 'text.secondary' }}>
                          <strong>Joined:</strong> {employee.join_date || 'N/A'}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" sx={{ fontSize: '14px', color: 'text.secondary', lineHeight: 1.4 }}>
                          <strong>Address:</strong> <span style={{ fontStyle: 'italic' }}>{employee.current_address || employee.address || 'No address'}</span>
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

  const calculateAge = (dobString: string) => {
    if (!dobString) return 'N/A';
    
    const dob = new Date(dobString);
    const today = new Date();
    
    if (isNaN(dob.getTime())) return 'N/A';
    
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    
    return age.toString();
  };

  const renderCompactView = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell sx={{ width: 50 }}></TableCell>
            <TableCell><Typography variant="subtitle2" fontWeight="bold">Employee</Typography></TableCell>
            <TableCell><Typography variant="subtitle2" fontWeight="bold">Age</Typography></TableCell>
            <TableCell><Typography variant="subtitle2" fontWeight="bold">Gender</Typography></TableCell>
            <TableCell><Typography variant="subtitle2" fontWeight="bold">DOB</Typography></TableCell>
            <TableCell><Typography variant="subtitle2" fontWeight="bold">Position</Typography></TableCell>
            <TableCell><Typography variant="subtitle2" fontWeight="bold">Department</Typography></TableCell>
            <TableCell><Typography variant="subtitle2" fontWeight="bold">Contact</Typography></TableCell>
            <TableCell><Typography variant="subtitle2" fontWeight="bold">ID Number</Typography></TableCell>
            <TableCell><Typography variant="subtitle2" fontWeight="bold">Current Address</Typography></TableCell>
            <TableCell><Typography variant="subtitle2" fontWeight="bold">Permanent Address</Typography></TableCell>
            <TableCell><Typography variant="subtitle2" fontWeight="bold">Tax Code</Typography></TableCell>
            <TableCell sx={{ width: 50 }}><Typography variant="subtitle2" fontWeight="bold">Actions</Typography></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {paginatedEmployees.map((employee: Employee) => (
            <React.Fragment key={employee.Id_number}>
              <TableRow>
                <TableCell sx={{ width: 50, textAlign: 'center' }}>
                  <IconButton 
                    size="small" 
                    onClick={() => handleExpandEmployee(employee.Id_number)}
                    sx={{ 
                      width: 32,
                      height: 32,
                      backgroundColor: expandedEmployees.has(employee.Id_number) ? 'primary.main' : 'rgba(0, 0, 0, 0.04)',
                      color: expandedEmployees.has(employee.Id_number) ? 'white' : 'rgba(0, 0, 0, 0.54)',
                      '&:hover': {
                        backgroundColor: expandedEmployees.has(employee.Id_number) ? 'primary.dark' : 'rgba(0, 0, 0, 0.08)',
                        transform: 'scale(1.05)',
                      },
                      transition: 'all 0.2s ease',
                      boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.12)',
                    }}
                    title={expandedEmployees.has(employee.Id_number) ? "Collapse details" : "Expand details"}
                  >
                    {expandedEmployees.has(employee.Id_number) ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
                  </IconButton>
                </TableCell>
                <TableCell>
                  <Box>
                    <Typography variant="body2" fontWeight="bold">
                      {employee.full_name}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {calculateAge(employee.dob)}
                  </Typography>
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
                <TableCell sx={{ width: 80, textAlign: 'center' }}>
                  <IconButton 
                    size="small" 
                    color="primary"
                    onClick={() => handleEditEmployee(employee)}
                    sx={{ 
                      p: 0.5,
                      mr: 0.5,
                      '&:hover': {
                        backgroundColor: 'primary.light',
                        color: 'white'
                      }
                    }}
                    title="Edit Employee"
                  >
                    <Edit fontSize="small" />
                  </IconButton>
                  <IconButton 
                    size="small" 
                    color="error"
                    onClick={() => handleDeleteEmployee(employee.Id_number, employee.full_name)}
                    sx={{ 
                      p: 0.5,
                      '&:hover': {
                        backgroundColor: 'error.light',
                        color: 'white'
                      }
                    }}
                    title="Delete Employee"
                  >
                    <DeleteOutline fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={13}>
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

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newEmployee, setNewEmployee] = useState<Partial<Employee>>({});
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Partial<Employee>>({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<{id: string; name: string} | null>(null);
  const [snackbar, setSnackbar] = useState<{open: boolean; message: string; severity: 'success' | 'error' | 'info'}>({
    open: false,
    message: '',
    severity: 'success'
  });

  const handleUseSample = () => {
    // Get a random employee from the current list
    if (allEmployees.length === 0) {
      setSnackbar({
        open: true,
        message: '⚠️ No sample data available',
        severity: 'info'
      });
      return;
    }
    
    const randomIndex = Math.floor(Math.random() * allEmployees.length);
    const sampleEmployee = allEmployees[randomIndex];
    
    // Fill the form with sample data (including original ID - user must change it to save)
    setNewEmployee({
      full_name: sampleEmployee.full_name,
      dob: sampleEmployee.dob,
      age: sampleEmployee.age,
      gender: sampleEmployee.gender,
      Id_number: sampleEmployee.Id_number, // Use original ID - will trigger duplicate check
      Issue_date: sampleEmployee.Issue_date,
      address: sampleEmployee.address,
      current_address: sampleEmployee.current_address,
      phone: sampleEmployee.phone,
      emergency_contact: sampleEmployee.emergency_contact,
      education_level: sampleEmployee.education_level,
      department: sampleEmployee.department,
      join_date: sampleEmployee.join_date,
      position: sampleEmployee.position,
      contract_type: sampleEmployee.contract_type,
      contract_sign_date: sampleEmployee.contract_sign_date,
      contract_end_date: sampleEmployee.contract_end_date,
      salary: sampleEmployee.salary,
      allowance: sampleEmployee.allowance,
      last_salary_adjustment: sampleEmployee.last_salary_adjustment,
      tax_code: sampleEmployee.tax_code,
      dependent_count: sampleEmployee.dependent_count,
      social_insurance_number: sampleEmployee.social_insurance_number,
      medical_insurance_hospital: sampleEmployee.medical_insurance_hospital,
      bank_account: sampleEmployee.bank_account,
      bank_name: sampleEmployee.bank_name,
      pvi_care: sampleEmployee.pvi_care,
      training_courses: sampleEmployee.training_courses,
      training_skills: sampleEmployee.training_skills
    });
    
    // Show a helpful message
    setSnackbar({
      open: true,
      message: 'ℹ️ Sample data loaded! Remember to change the ID Number before saving to avoid duplicates.',
      severity: 'info'
    });
  };

  const handleDeleteEmployee = (employeeId: string, employeeName: string) => {
    setEmployeeToDelete({ id: employeeId, name: employeeName });
    setDeleteDialogOpen(true);
  };

  const confirmDeleteEmployee = async () => {
    if (!employeeToDelete) return;

    try {
      await axios.delete(`/api/employees/${employeeToDelete.id}`, {
        headers: getAuthHeaders()
      });
      
      // Close dialog and reset state
      setDeleteDialogOpen(false);
      setEmployeeToDelete(null);
      
      // Refresh the employee list
      fetchAllEmployees();
      fetchFilteredEmployees();
      
      // Show success message
      setSnackbar({
        open: true,
        message: `✅ Employee "${employeeToDelete.name}" deleted successfully!`,
        severity: 'success'
      });
    } catch (error: any) {
      console.error('Error deleting employee:', error);
      const errorMessage = error.response?.data?.detail || 'Failed to delete employee.';
      setSnackbar({
        open: true,
        message: `❌ ${errorMessage}`,
        severity: 'error'
      });
      setDeleteDialogOpen(false);
      setEmployeeToDelete(null);
    }
  };

  const handleEditEmployee = (employee: Employee) => {
    setEditingEmployee(employee);
    setEditDialogOpen(true);
  };

  const handleUpdateEmployee = async () => {
    try {
      // Validate required fields
      if (!editingEmployee.full_name || !editingEmployee.Id_number || !editingEmployee.dob) {
        setSnackbar({
          open: true,
          message: '⚠️ Please fill in all required fields: Full Name, ID Number, and Date of Birth',
          severity: 'error'
        });
        return;
      }

      // Create employee data matching EmployeeCreate schema
      const employeeData = {
        full_name: editingEmployee.full_name,
        dob: editingEmployee.dob,
        gender: editingEmployee.gender || 'Nam',
        Id_number: editingEmployee.Id_number,
        address: editingEmployee.address || '',
        current_address: editingEmployee.current_address || editingEmployee.address || '',
        phone: editingEmployee.phone || '',
        education_level: editingEmployee.education_level || '',
        department: editingEmployee.department || '',
        position: editingEmployee.position || '',
        contract_type: editingEmployee.contract_type || 'Có thời hạn 1 năm',
        contract_sign_date: editingEmployee.contract_sign_date || new Date().toISOString().split('T')[0],
        salary: editingEmployee.salary || 0,
        tax_code: parseInt(editingEmployee.tax_code?.toString() || '0'),
        social_insurance_number: parseInt(editingEmployee.social_insurance_number?.toString() || '0'),
        medical_insurance_hospital: editingEmployee.medical_insurance_hospital || '',
        bank_account: parseInt(editingEmployee.bank_account?.toString() || '0'),
        pvi_care: editingEmployee.pvi_care || 'Không',
        training_skills: editingEmployee.training_skills || ''
      };

      await axios.put(`/api/employees/${editingEmployee.Id_number}`, employeeData, {
        headers: getAuthHeaders()
      });
      
      // Refresh the employee list
      fetchAllEmployees();
      fetchFilteredEmployees();
      
      // Reset form and close dialog
      setEditingEmployee({});
      setEditDialogOpen(false);
      
      // Show success message
      setSnackbar({
        open: true,
        message: `✅ Employee "${editingEmployee.full_name}" updated successfully!`,
        severity: 'success'
      });
    } catch (error: any) {
      console.error('Error updating employee:', error);
      const errorMessage = error.response?.data?.detail || 'Failed to update employee. Please check all fields and try again.';
      setSnackbar({
        open: true,
        message: `❌ ${errorMessage}`,
        severity: 'error'
      });
    }
  };

  const handleAddEmployee = async () => {
    try {
      // Validate required fields
      if (!newEmployee.full_name || !newEmployee.Id_number || !newEmployee.dob) {
        setSnackbar({
          open: true,
          message: '⚠️ Please fill in all required fields: Full Name, ID Number, and Date of Birth',
          severity: 'error'
        });
        return;
      }

      // Check if employee with same ID already exists
      const isDuplicate = allEmployees.some(emp => emp.Id_number === newEmployee.Id_number);
      if (isDuplicate) {
        setSnackbar({
          open: true,
          message: `⚠️ Employee with ID Number "${newEmployee.Id_number}" already exists! Please use a different ID number.`,
          severity: 'error'
        });
        return;
      }

      // Create employee data matching EmployeeCreate schema
      const employeeData = {
        full_name: newEmployee.full_name,
        dob: newEmployee.dob,
        gender: newEmployee.gender || 'Nam',
        Id_number: newEmployee.Id_number,
        address: newEmployee.address || '',
        current_address: newEmployee.current_address || newEmployee.address || '',
        phone: newEmployee.phone || '',
        education_level: newEmployee.education_level || '',
        department: newEmployee.department || '',
        position: newEmployee.position || '',
        contract_type: newEmployee.contract_type || 'Có thời hạn 1 năm',
        contract_sign_date: newEmployee.contract_sign_date || new Date().toISOString().split('T')[0],
        salary: newEmployee.salary || 0,
        tax_code: parseInt(newEmployee.tax_code?.toString() || '0'),
        social_insurance_number: parseInt(newEmployee.social_insurance_number?.toString() || '0'),
        medical_insurance_hospital: newEmployee.medical_insurance_hospital || '',
        bank_account: parseInt(newEmployee.bank_account?.toString() || '0'),
        pvi_care: newEmployee.pvi_care || 'Không',
        training_skills: newEmployee.training_skills || ''
      };

      await axios.post(`/api/employees`, employeeData, {
        headers: getAuthHeaders()
      });
      
      // Refresh the employee list
      fetchAllEmployees();
      fetchFilteredEmployees();
      
      // Reset form and close dialog
      setNewEmployee({});
      setAddDialogOpen(false);
      
      // Show success message
      setSnackbar({
        open: true,
        message: `✅ Employee "${newEmployee.full_name}" added successfully!`,
        severity: 'success'
      });
    } catch (error: any) {
      console.error('Error adding employee:', error);
      const errorMessage = error.response?.data?.detail || 'Failed to add employee. Please check all fields and try again.';
      setSnackbar({
        open: true,
        message: `❌ ${errorMessage}`,
        severity: 'error'
      });
    }
  };

  return (
    <Box sx={{ pl: 0, ml: 0 }}>
      {viewMode !== 'cards' && (
        <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 600 }}>
              🔍 Search & Filter
            </Typography>
          </Box>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={2.2}>
              <TextField
                fullWidth
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search employee name"
                size="small"
                InputProps={{
                  sx: {
                    '& input::placeholder': {
                      color: '#999',
                      opacity: 1,
                    }
                  }
                }}
              />
            </Grid>
            <Grid item xs={3} md={1.3}>
              <FormControl fullWidth size="small">
                <Select
                  value={filters.min_age}
                  onChange={(e) => setFilters({ ...filters, min_age: e.target.value })}
                  displayEmpty
                  renderValue={(selected) => {
                    if (!selected) {
                      return <span style={{ color: '#999' }}>Min Age</span>;
                    }
                    return selected === '' ? 'All Ages' : selected;
                  }}
                >
                  <MenuItem value="">All Ages</MenuItem>
                  <MenuItem value="18">18</MenuItem>
                  <MenuItem value="20">20</MenuItem>
                  <MenuItem value="25">25</MenuItem>
                  <MenuItem value="30">30</MenuItem>
                  <MenuItem value="35">35</MenuItem>
                  <MenuItem value="40">40</MenuItem>
                  <MenuItem value="45">45</MenuItem>
                  <MenuItem value="50">50</MenuItem>
                  <MenuItem value="55">55</MenuItem>
                  <MenuItem value="60">60</MenuItem>
                  <MenuItem value="65">65</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={3} md={1.3}>
              <FormControl fullWidth size="small">
                <Select
                  value={filters.max_age}
                  onChange={(e) => setFilters({ ...filters, max_age: e.target.value })}
                  displayEmpty
                  renderValue={(selected) => {
                    if (!selected) {
                      return <span style={{ color: '#999' }}>Max Age</span>;
                    }
                    return selected === '' ? 'All Ages' : selected;
                  }}
                >
                  <MenuItem value="">All Ages</MenuItem>
                  <MenuItem value="25">25</MenuItem>
                  <MenuItem value="30">30</MenuItem>
                  <MenuItem value="35">35</MenuItem>
                  <MenuItem value="40">40</MenuItem>
                  <MenuItem value="45">45</MenuItem>
                  <MenuItem value="50">50</MenuItem>
                  <MenuItem value="55">55</MenuItem>
                  <MenuItem value="60">60</MenuItem>
                  <MenuItem value="65">65</MenuItem>
                  <MenuItem value="70">70</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} md={1.4}>
              <FormControl fullWidth size="small">
                <Select
                  value={filters.position}
                  onChange={(e) => setFilters({ ...filters, position: e.target.value })}
                  displayEmpty
                  renderValue={(selected) => {
                    if (!selected) {
                      return <span style={{ color: '#999' }}>Position</span>;
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
            <Grid item xs={6} md={1.4}>
              <FormControl fullWidth size="small">
                <Select
                  value={filters.department}
                  onChange={(e) => setFilters({ ...filters, department: e.target.value })}
                  displayEmpty
                  renderValue={(selected) => {
                    if (!selected) {
                      return <span style={{ color: '#999' }}>Department</span>;
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
            <Grid item xs={6} md={1.2}>
              <FormControl fullWidth size="small">
                <Select
                  value={filters.gender}
                  onChange={(e) => setFilters({ ...filters, gender: e.target.value })}
                  displayEmpty
                  renderValue={(selected) => {
                    if (!selected) {
                      return <span style={{ color: '#999' }}>Gender</span>;
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
            <Grid item xs={6} md={1.6}>
              <Button 
                variant="contained" 
                color="secondary" 
                onClick={clearFilters} 
                size="medium"
                fullWidth
                sx={{ 
                  fontWeight: 600,
                  borderRadius: 2,
                  py: 1,
                  textTransform: 'none',
                  boxShadow: '0px 2px 4px 0px rgba(0, 0, 0, 0.1)',
                  '&:hover': {
                    boxShadow: '0px 4px 8px 0px rgba(0, 0, 0, 0.15)',
                    transform: 'translateY(-1px)'
                  }
                }}
              >
                🧹 Clear All
              </Button>
            </Grid>
          </Grid>
        </Paper>
      )}

      {viewMode !== 'cards' && (
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 600 }}>
              Employee List ({getCurrentEmployees().length} records)
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
                onClick={() => setAddDialogOpen(true)}
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
        </Box>
      )}

      {viewMode === 'cards' && renderCardView()}
      {viewMode === 'compact' && renderCompactView()}

      {viewMode !== 'cards' && (
        <Paper sx={{ mt: 2 }}>
          <TablePagination
            rowsPerPageOptions={[20, 60, 100]}
            component="div"
            count={getCurrentEmployees().length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Paper>
      )}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="xl" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Add New Employee</Typography>
            <Button 
              variant="outlined" 
              color="primary" 
              onClick={handleUseSample}
              size="small"
            >
              Use Sample
            </Button>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={4}>
              <TextField
                fullWidth
                label="Full Name"
                value={newEmployee.full_name || ''}
                onChange={(e) => setNewEmployee({ ...newEmployee, full_name: e.target.value })}
                required
                InputLabelProps={{ sx: { fontWeight: 'bold' } }}
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                fullWidth
                label="ID Number"
                value={newEmployee.Id_number || ''}
                onChange={(e) => setNewEmployee({ ...newEmployee, Id_number: e.target.value })}
                required
                InputLabelProps={{ sx: { fontWeight: 'bold' } }}
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                fullWidth
                label="Phone"
                value={newEmployee.phone || ''}
                onChange={(e) => setNewEmployee({ ...newEmployee, phone: e.target.value })}
                InputLabelProps={{ sx: { fontWeight: 'bold' } }}
              />
            </Grid>
            <Grid item xs={2.4}>
              <TextField
                fullWidth
                label="DOB"
                type="date"
                value={newEmployee.dob || ''}
                onChange={(e) => setNewEmployee({ ...newEmployee, dob: e.target.value })}
                InputLabelProps={{ shrink: true, sx: { fontWeight: 'bold' } }}
                required
              />
            </Grid>
            <Grid item xs={2.4}>
              <TextField
                fullWidth
                label="Gender"
                value={newEmployee.gender || ''}
                onChange={(e) => setNewEmployee({ ...newEmployee, gender: e.target.value })}
                InputLabelProps={{ sx: { fontWeight: 'bold' } }}
              />
            </Grid>
            <Grid item xs={2.4}>
              <TextField
                fullWidth
                label="Issue Date"
                value={newEmployee.Issue_date || ''}
                onChange={(e) => setNewEmployee({ ...newEmployee, Issue_date: e.target.value })}
              />
            </Grid>
            <Grid item xs={2.4}>
              <TextField
                fullWidth
                label="Join Date"
                type="date"
                value={newEmployee.join_date || ''}
                onChange={(e) => setNewEmployee({ ...newEmployee, join_date: e.target.value })}
                InputLabelProps={{ shrink: true, sx: { fontWeight: 'bold' } }}
              />
            </Grid>
            <Grid item xs={2.4}>
              <TextField
                fullWidth
                label="Emergency Contact"
                value={newEmployee.emergency_contact || ''}
                onChange={(e) => setNewEmployee({ ...newEmployee, emergency_contact: e.target.value })}
                InputLabelProps={{ sx: { fontWeight: 'bold' } }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Address"
                value={newEmployee.address || ''}
                onChange={(e) => setNewEmployee({ ...newEmployee, address: e.target.value })}
                InputLabelProps={{ sx: { fontWeight: 'bold' } }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Current Address"
                value={newEmployee.current_address || ''}
                onChange={(e) => setNewEmployee({ ...newEmployee, current_address: e.target.value })}
                InputLabelProps={{ sx: { fontWeight: 'bold' } }}
              />
            </Grid>
            <Grid item xs={2.4}>
              <TextField
                fullWidth
                label="Education Level"
                value={newEmployee.education_level || ''}
                onChange={(e) => setNewEmployee({ ...newEmployee, education_level: e.target.value })}
                InputLabelProps={{ sx: { fontWeight: 'bold' } }}
              />
            </Grid>
            <Grid item xs={2.4}>
              <TextField
                fullWidth
                label="Department"
                value={newEmployee.department || ''}
                onChange={(e) => setNewEmployee({ ...newEmployee, department: e.target.value })}
                InputLabelProps={{ sx: { fontWeight: 'bold' } }}
              />
            </Grid>
            <Grid item xs={2.4}>
              <TextField
                fullWidth
                label="Position"
                value={newEmployee.position || ''}
                onChange={(e) => setNewEmployee({ ...newEmployee, position: e.target.value })}
                InputLabelProps={{ sx: { fontWeight: 'bold' } }}
              />
            </Grid>
            <Grid item xs={2.4}>
              <TextField
                fullWidth
                label="Contract ID"
                value={newEmployee.contract_id || ''}
                onChange={(e) => setNewEmployee({ ...newEmployee, contract_id: e.target.value })}
              />
            </Grid>
            <Grid item xs={2.4}>
              <TextField
                fullWidth
                label="Contract Type"
                value={newEmployee.contract_type || ''}
                onChange={(e) => setNewEmployee({ ...newEmployee, contract_type: e.target.value })}
                InputLabelProps={{ sx: { fontWeight: 'bold' } }}
              />
            </Grid>
            <Grid item xs={2.4}>
              <TextField
                fullWidth
                label="Contract Sign Date"
                type="date"
                value={newEmployee.contract_sign_date || ''}
                onChange={(e) => setNewEmployee({ ...newEmployee, contract_sign_date: e.target.value })}
                InputLabelProps={{ shrink: true, sx: { fontWeight: 'bold' } }}
              />
            </Grid>
            <Grid item xs={2.4}>
              <TextField
                fullWidth
                label="Contract End Date"
                value={newEmployee.contract_end_date || ''}
                onChange={(e) => setNewEmployee({ ...newEmployee, contract_end_date: e.target.value })}
              />
            </Grid>
            <Grid item xs={2.4}>
              <TextField
                fullWidth
                label="Salary"
                type="number"
                value={newEmployee.salary || ''}
                onChange={(e) => setNewEmployee({ ...newEmployee, salary: parseFloat(e.target.value) })}
                InputLabelProps={{ sx: { fontWeight: 'bold' } }}
              />
            </Grid>
            <Grid item xs={2.4}>
              <TextField
                fullWidth
                label="Allowance"
                value={newEmployee.allowance || ''}
                onChange={(e) => setNewEmployee({ ...newEmployee, allowance: e.target.value })}
              />
            </Grid>
            <Grid item xs={2.4}>
              <TextField
                fullWidth
                label="Last Salary Adjustment"
                value={newEmployee.last_salary_adjustment || ''}
                onChange={(e) => setNewEmployee({ ...newEmployee, last_salary_adjustment: e.target.value })}
              />
            </Grid>
            <Grid item xs={2.4}>
              <TextField
                fullWidth
                label="Tax Code"
                type="number"
                value={newEmployee.tax_code || ''}
                onChange={(e) => setNewEmployee({ ...newEmployee, tax_code: parseInt(e.target.value) })}
                InputLabelProps={{ sx: { fontWeight: 'bold' } }}
              />
            </Grid>
            <Grid item xs={2.4}>
              <TextField
                fullWidth
                label="Dependent Count"
                value={newEmployee.dependent_count || ''}
                onChange={(e) => setNewEmployee({ ...newEmployee, dependent_count: e.target.value })}
                InputLabelProps={{ sx: { fontWeight: 'bold' } }}
              />
            </Grid>
            <Grid item xs={2.4}>
              <TextField
                fullWidth
                label="Social Insurance Number"
                type="number"
                value={newEmployee.social_insurance_number || ''}
                onChange={(e) => setNewEmployee({ ...newEmployee, social_insurance_number: parseInt(e.target.value) })}
                InputLabelProps={{ sx: { fontWeight: 'bold' } }}
              />
            </Grid>
            <Grid item xs={2.4}>
              <TextField
                fullWidth
                label="Medical Insurance Hospital"
                value={newEmployee.medical_insurance_hospital || ''}
                onChange={(e) => setNewEmployee({ ...newEmployee, medical_insurance_hospital: e.target.value })}
              />
            </Grid>
            <Grid item xs={2.4}>
              <TextField
                fullWidth
                label="Bank Account"
                type="number"
                value={newEmployee.bank_account || ''}
                onChange={(e) => setNewEmployee({ ...newEmployee, bank_account: parseInt(e.target.value) })}
                InputLabelProps={{ sx: { fontWeight: 'bold' } }}
              />
            </Grid>
            <Grid item xs={2.4}>
              <TextField
                fullWidth
                label="Bank Name"
                value={newEmployee.bank_name || ''}
                onChange={(e) => setNewEmployee({ ...newEmployee, bank_name: e.target.value })}
                InputLabelProps={{ sx: { fontWeight: 'bold' } }}
              />
            </Grid>
            <Grid item xs={2.4}>
              <TextField
                fullWidth
                label="PVI Care"
                value={newEmployee.pvi_care || ''}
                onChange={(e) => setNewEmployee({ ...newEmployee, pvi_care: e.target.value })}
              />
            </Grid>
            <Grid item xs={2.4}>
              <TextField
                fullWidth
                label="Training Courses"
                value={newEmployee.training_courses || ''}
                onChange={(e) => setNewEmployee({ ...newEmployee, training_courses: e.target.value })}
              />
            </Grid>
            <Grid item xs={2.4}>
              <TextField
                fullWidth
                label="Training Skills"
                value={newEmployee.training_skills || ''}
                onChange={(e) => setNewEmployee({ ...newEmployee, training_skills: e.target.value })}
              />
            </Grid>
          </Grid>
          <Button 
            onClick={handleAddEmployee}
            variant="contained"
            color="primary"
            fullWidth
            sx={{ mt: 2 }}
          >
            Save Employee
          </Button>
        </DialogContent>
      </Dialog>

      {/* Edit Employee Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="xl" fullWidth>
        <DialogTitle>
          <Typography variant="h6">Edit Employee</Typography>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={4}>
              <TextField
                fullWidth
                label="Full Name"
                value={editingEmployee.full_name || ''}
                onChange={(e) => setEditingEmployee({ ...editingEmployee, full_name: e.target.value })}
                required
                InputLabelProps={{ sx: { fontWeight: 'bold' } }}
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                fullWidth
                label="ID Number"
                value={editingEmployee.Id_number || ''}
                onChange={(e) => setEditingEmployee({ ...editingEmployee, Id_number: e.target.value })}
                required
                disabled
                InputLabelProps={{ sx: { fontWeight: 'bold' } }}
                helperText="ID Number cannot be changed"
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                fullWidth
                label="Phone"
                value={editingEmployee.phone || ''}
                onChange={(e) => setEditingEmployee({ ...editingEmployee, phone: e.target.value })}
                InputLabelProps={{ sx: { fontWeight: 'bold' } }}
              />
            </Grid>
            <Grid item xs={2.4}>
              <TextField
                fullWidth
                label="DOB"
                type="date"
                value={editingEmployee.dob || ''}
                onChange={(e) => setEditingEmployee({ ...editingEmployee, dob: e.target.value })}
                InputLabelProps={{ shrink: true, sx: { fontWeight: 'bold' } }}
                required
              />
            </Grid>
            <Grid item xs={2.4}>
              <TextField
                fullWidth
                label="Gender"
                value={editingEmployee.gender || ''}
                onChange={(e) => setEditingEmployee({ ...editingEmployee, gender: e.target.value })}
                InputLabelProps={{ sx: { fontWeight: 'bold' } }}
              />
            </Grid>
            <Grid item xs={2.4}>
              <TextField
                fullWidth
                label="Issue Date"
                value={editingEmployee.Issue_date || ''}
                onChange={(e) => setEditingEmployee({ ...editingEmployee, Issue_date: e.target.value })}
              />
            </Grid>
            <Grid item xs={2.4}>
              <TextField
                fullWidth
                label="Join Date"
                type="date"
                value={editingEmployee.join_date || ''}
                onChange={(e) => setEditingEmployee({ ...editingEmployee, join_date: e.target.value })}
                InputLabelProps={{ shrink: true, sx: { fontWeight: 'bold' } }}
              />
            </Grid>
            <Grid item xs={2.4}>
              <TextField
                fullWidth
                label="Emergency Contact"
                value={editingEmployee.emergency_contact || ''}
                onChange={(e) => setEditingEmployee({ ...editingEmployee, emergency_contact: e.target.value })}
                InputLabelProps={{ sx: { fontWeight: 'bold' } }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Address"
                value={editingEmployee.address || ''}
                onChange={(e) => setEditingEmployee({ ...editingEmployee, address: e.target.value })}
                InputLabelProps={{ sx: { fontWeight: 'bold' } }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Current Address"
                value={editingEmployee.current_address || ''}
                onChange={(e) => setEditingEmployee({ ...editingEmployee, current_address: e.target.value })}
                InputLabelProps={{ sx: { fontWeight: 'bold' } }}
              />
            </Grid>
            <Grid item xs={2.4}>
              <TextField
                fullWidth
                label="Education Level"
                value={editingEmployee.education_level || ''}
                onChange={(e) => setEditingEmployee({ ...editingEmployee, education_level: e.target.value })}
                InputLabelProps={{ sx: { fontWeight: 'bold' } }}
              />
            </Grid>
            <Grid item xs={2.4}>
              <TextField
                fullWidth
                label="Department"
                value={editingEmployee.department || ''}
                onChange={(e) => setEditingEmployee({ ...editingEmployee, department: e.target.value })}
                InputLabelProps={{ sx: { fontWeight: 'bold' } }}
              />
            </Grid>
            <Grid item xs={2.4}>
              <TextField
                fullWidth
                label="Position"
                value={editingEmployee.position || ''}
                onChange={(e) => setEditingEmployee({ ...editingEmployee, position: e.target.value })}
                InputLabelProps={{ sx: { fontWeight: 'bold' } }}
              />
            </Grid>
            <Grid item xs={2.4}>
              <TextField
                fullWidth
                label="Contract ID"
                value={editingEmployee.contract_id || ''}
                onChange={(e) => setEditingEmployee({ ...editingEmployee, contract_id: e.target.value })}
              />
            </Grid>
            <Grid item xs={2.4}>
              <TextField
                fullWidth
                label="Contract Type"
                value={editingEmployee.contract_type || ''}
                onChange={(e) => setEditingEmployee({ ...editingEmployee, contract_type: e.target.value })}
                InputLabelProps={{ sx: { fontWeight: 'bold' } }}
              />
            </Grid>
            <Grid item xs={2.4}>
              <TextField
                fullWidth
                label="Contract Sign Date"
                type="date"
                value={editingEmployee.contract_sign_date || ''}
                onChange={(e) => setEditingEmployee({ ...editingEmployee, contract_sign_date: e.target.value })}
                InputLabelProps={{ shrink: true, sx: { fontWeight: 'bold' } }}
              />
            </Grid>
            <Grid item xs={2.4}>
              <TextField
                fullWidth
                label="Contract End Date"
                value={editingEmployee.contract_end_date || ''}
                onChange={(e) => setEditingEmployee({ ...editingEmployee, contract_end_date: e.target.value })}
              />
            </Grid>
            <Grid item xs={2.4}>
              <TextField
                fullWidth
                label="Salary"
                type="number"
                value={editingEmployee.salary || ''}
                onChange={(e) => setEditingEmployee({ ...editingEmployee, salary: parseFloat(e.target.value) })}
                InputLabelProps={{ sx: { fontWeight: 'bold' } }}
              />
            </Grid>
            <Grid item xs={2.4}>
              <TextField
                fullWidth
                label="Allowance"
                value={editingEmployee.allowance || ''}
                onChange={(e) => setEditingEmployee({ ...editingEmployee, allowance: e.target.value })}
              />
            </Grid>
            <Grid item xs={2.4}>
              <TextField
                fullWidth
                label="Last Salary Adjustment"
                type="date"
                value={editingEmployee.last_salary_adjustment || ''}
                onChange={(e) => setEditingEmployee({ ...editingEmployee, last_salary_adjustment: e.target.value })}
                InputLabelProps={{ shrink: true, sx: { fontWeight: 'bold' } }}
              />
            </Grid>
            <Grid item xs={2.4}>
              <TextField
                fullWidth
                label="Tax Code"
                type="number"
                value={editingEmployee.tax_code || ''}
                onChange={(e) => setEditingEmployee({ ...editingEmployee, tax_code: parseInt(e.target.value) })}
                InputLabelProps={{ sx: { fontWeight: 'bold' } }}
              />
            </Grid>
            <Grid item xs={2.4}>
              <TextField
                fullWidth
                label="Dependent Count"
                value={editingEmployee.dependent_count || ''}
                onChange={(e) => setEditingEmployee({ ...editingEmployee, dependent_count: e.target.value })}
                InputLabelProps={{ sx: { fontWeight: 'bold' } }}
              />
            </Grid>
            <Grid item xs={2.4}>
              <TextField
                fullWidth
                label="Social Insurance Number"
                type="number"
                value={editingEmployee.social_insurance_number || ''}
                onChange={(e) => setEditingEmployee({ ...editingEmployee, social_insurance_number: parseInt(e.target.value) })}
                InputLabelProps={{ sx: { fontWeight: 'bold' } }}
              />
            </Grid>
            <Grid item xs={2.4}>
              <TextField
                fullWidth
                label="Medical Insurance Hospital"
                value={editingEmployee.medical_insurance_hospital || ''}
                onChange={(e) => setEditingEmployee({ ...editingEmployee, medical_insurance_hospital: e.target.value })}
              />
            </Grid>
            <Grid item xs={2.4}>
              <TextField
                fullWidth
                label="Bank Account"
                type="number"
                value={editingEmployee.bank_account || ''}
                onChange={(e) => setEditingEmployee({ ...editingEmployee, bank_account: parseInt(e.target.value) })}
                InputLabelProps={{ sx: { fontWeight: 'bold' } }}
              />
            </Grid>
            <Grid item xs={2.4}>
              <TextField
                fullWidth
                label="Bank Name"
                value={editingEmployee.bank_name || ''}
                onChange={(e) => setEditingEmployee({ ...editingEmployee, bank_name: e.target.value })}
                InputLabelProps={{ sx: { fontWeight: 'bold' } }}
              />
            </Grid>
            <Grid item xs={2.4}>
              <TextField
                fullWidth
                label="PVI Care"
                value={editingEmployee.pvi_care || ''}
                onChange={(e) => setEditingEmployee({ ...editingEmployee, pvi_care: e.target.value })}
              />
            </Grid>
            <Grid item xs={2.4}>
              <TextField
                fullWidth
                label="Training Courses"
                value={editingEmployee.training_courses || ''}
                onChange={(e) => setEditingEmployee({ ...editingEmployee, training_courses: e.target.value })}
              />
            </Grid>
            <Grid item xs={2.4}>
              <TextField
                fullWidth
                label="Training Skills"
                value={editingEmployee.training_skills || ''}
                onChange={(e) => setEditingEmployee({ ...editingEmployee, training_skills: e.target.value })}
              />
            </Grid>
          </Grid>
          <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
            <Button 
              onClick={handleUpdateEmployee}
              variant="contained"
              color="primary"
              fullWidth
            >
              Update Employee
            </Button>
            <Button 
              onClick={() => setEditDialogOpen(false)}
              variant="outlined"
              color="secondary"
              fullWidth
            >
              Cancel
            </Button>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Professional Delete Confirmation Dialog */}
      <Dialog
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
        <DialogTitle sx={{ fontWeight: 600, fontSize: '1.25rem', pb: 1 }}>
          ⚠️ Confirm Deletion
        </DialogTitle>
        <DialogContent>
          <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: 1.6 }}>
            Are you sure you want to delete employee <strong>"{employeeToDelete?.name}"</strong>? This action cannot be undone.
          </p>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button 
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
          </Button>
          <Button 
            onClick={confirmDeleteEmployee}
            variant="contained"
            color="error"
            sx={{ 
              textTransform: 'none',
              fontWeight: 600,
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

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
    </Box>
  );
};

export default EmployeeDashboard;