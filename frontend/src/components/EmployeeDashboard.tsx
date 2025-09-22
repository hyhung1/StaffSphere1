import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
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

  const API_BASE_URL = import.meta.env.VITE_API_URL || '';

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
      const response = await axios.get(`${API_BASE_URL}/employees`);
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

      const response = await axios.get(`${API_BASE_URL}/employees?${params.toString()}`);
      setEmployees(response.data);
    } catch (error) {
      console.error('Error fetching filtered employees:', error);
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
      min_age: '',
      max_age: '',
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
      fetchAllEmployees(); // Refresh all employees data after import
      fetchFilteredEmployees(); // Refresh filtered employees data after import
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


  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Get current dataset based on view mode
  const getCurrentEmployees = () => {
    return viewMode === 'cards' ? allEmployees : employees;
  };

  // Calculate paginated employees based on current view
  const paginatedEmployees = getCurrentEmployees().slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  // Group employees by department
  const groupEmployeesByDepartment = () => {
    const groups: Record<string, Employee[]> = {};
    const currentEmployees = getCurrentEmployees();

    // Initialize groups for all departments
    currentEmployees.forEach(emp => {
      if (!groups[emp.department]) {
        groups[emp.department] = [];
      }
      groups[emp.department].push(emp);
    });

    return groups;
  };


  // Professional Organizational Chart Component
  const renderCardView = () => {
    const departmentGroups = groupEmployeesByDepartment();

    return (
      <>
        <Grid container spacing={2} sx={{ pl: 0, ml: -1, mr: 0 }}>
          {/* Left side - Organizational Chart */}
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
              {/* SVG Organizational Chart */}
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
              {/* Modern gradients and effects */}
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

              {/* Modern Connecting Lines - BIGGER VERSION */}
              <g strokeWidth="8" opacity="0.9">
                {/* Sales - Top: Connect to center of Sales box (y=60) - shorter line */}
                <path d="M 450 265 L 450 60" stroke="rgba(255,255,255,0.9)" fill="none" strokeLinecap="round" strokeWidth="8" strokeDasharray="12,6">
                  <animate attributeName="stroke-dashoffset" values="0;18;0" dur="3s" repeatCount="indefinite"/>
                </path>

                {/* Back Office - Bottom: Connect to center of Back Office box (y=570) */}
                <path d="M 450 365 L 450 570" stroke="rgba(255,255,255,0.9)" fill="none" strokeLinecap="round" strokeWidth="8" strokeDasharray="12,6">
                  <animate attributeName="stroke-dashoffset" values="0;18;0" dur="3s" repeatCount="indefinite"/>
                </path>

                {/* Engineering - Top Right: Straight line to center of Engineering box (720, 180) */}
                <line x1="503" y1="262" x2="720" y2="180" stroke="url(#modernLineGradient)" strokeLinecap="round" strokeWidth="8" strokeDasharray="12,6">
                  <animate attributeName="stroke-dashoffset" values="0;18;0" dur="3s" repeatCount="indefinite"/>
                </line>
                {/* Commissioning - Bottom Right: Straight line to center of Commissioning box (720, 420) */}
                <line x1="503" y1="368" x2="720" y2="420" stroke="url(#modernLineGradient)" strokeLinecap="round" strokeWidth="8" strokeDasharray="12,6">
                  <animate attributeName="stroke-dashoffset" values="0;18;0" dur="3s" repeatCount="indefinite"/>
                </line>
                {/* Contract - Bottom Left: Straight line to center of Contract box (180, 420) */}
                <line x1="397" y1="368" x2="180" y2="420" stroke="url(#modernLineGradient)" strokeLinecap="round" strokeWidth="8" strokeDasharray="12,6">
                  <animate attributeName="stroke-dashoffset" values="0;18;0" dur="3s" repeatCount="indefinite"/>
                </line>
                {/* Drafter - Top Left: Straight line to center of Drafter box (180, 180) */}
                <line x1="397" y1="262" x2="180" y2="180" stroke="url(#modernLineGradient)" strokeLinecap="round" strokeWidth="8" strokeDasharray="12,6">
                  <animate attributeName="stroke-dashoffset" values="0;18;0" dur="3s" repeatCount="indefinite"/>
                </line>
              </g>

              {/* Enhanced Center Company Logo - PERFECTLY CENTERED */}
              <g transform="translate(450, 315)">
                {/* Outer glow ring - BIGGER */}
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
                {/* Main circle - BIGGER */}
                <circle
                  cx="0"
                  cy="0"
                  r="95"
                  fill="url(#modernCenterGradient)"
                  filter="url(#dropshadow)"
                  stroke="rgba(255,255,255,0.8)"
                  strokeWidth="4"
                />
                {/* Inner shadow - BIGGER */}
                <circle
                  cx="0"
                  cy="0"
                  r="88"
                  fill="none"
                  stroke="rgba(0,0,0,0.1)"
                  strokeWidth="2"
                />
                {/* Logo image - perfectly centered */}
                <image 
                  x="-50"
                  y="-50"
                  width="100"
                  height="100"
                  href="/logo.png"
                  style={{ filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.3))' }}
                />
              </g>

              {/* Sales Department - Top */}
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
                {/* Card background with gradient - BIGGER */}
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
                {/* Glass effect overlay */}
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

              {/* Engineering Department - Top Right */}
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
                {/* Card background with gradient - BIGGER */}
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
                {/* Glass effect overlay */}
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

              {/* Commissioning Department - Bottom Right */}
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
                {/* Card background with gradient - BIGGER */}
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
                {/* Glass effect overlay */}
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

              {/* Back Office Department - Bottom */}
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
                {/* Card background with gradient - BIGGER */}
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
                {/* Glass effect overlay */}
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

              {/* Contract Department - Bottom Left */}
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
                {/* Card background with gradient - BIGGER */}
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
                {/* Glass effect overlay */}
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

              {/* Drafter Department - Top Left */}
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
                {/* Card background with gradient - BIGGER */}
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
                {/* Glass effect overlay */}
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
          
          {/* Right side - Company Statistics */}
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

              {/* Key Metrics Row */}
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

              {/* Employment Details and Department Analysis */}
              <Grid container spacing={2}>
                {/* Employment Details */}
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

                {/* Department Analysis */}
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

  // Calculate age from DOB
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

  // Compact Table View Component
  const renderCompactView = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
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
                <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={12}>
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
    <Box sx={{ pl: 0, ml: 0 }}>
      {/* View Mode Selector and Search/Filter Section */}
      {viewMode !== 'cards' && (
        <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 600 }}>
              🔍 Search & Filter
            </Typography>
          </Box>

          <>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={1.8}>
            <TextField
              fullWidth
              label="Search employee name"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Employee name..."
              size="small"
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
          </>
        </Paper>
      )}


      {/* Actions - Only show for non-Cards view */}
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


      {/* Employee Display */}
      {viewMode === 'cards' && renderCardView()}
      {viewMode === 'compact' && renderCompactView()}

      {/* Pagination */}
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
    </Box>
  );
};

export default EmployeeDashboard;