import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
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
  CardActions,
  Divider,
} from '@mui/material';
import Grid from '@mui/material/Grid';
// Temporarily removed @mui/icons-material to reduce memory usage
import axios from 'axios';

interface Employee {
  full_name: string;
  dob: string;
  age: number;
  gender: string;
  Id_number: string;
  address: string;
  current_address: string;
  phone: string;
  education_level: string;
  department: string;
  position: string;
  contract_id: string;
  contract_type: string;
  contract_sign_date: string;
  salary: number;
  last_salary_adjustment: string;
  tax_code: number;
  social_insurance_number: number;
  medical_insurance_hospital: string;
  bank_account: number;
  pvi_care: string;
  training_skills: string;
}

const EmployeeDashboard: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'cards' | 'compact'>('compact');
  const [expandedEmployees, setExpandedEmployees] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState({
    department: '',
    position: '',
    contract_type: '',
    gender: '',
    min_salary: '',
    max_salary: '',
    min_age: '',
    max_age: '',
  });

  const API_BASE_URL = process.env.REACT_APP_API_URL || '';

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (filters.department) params.append('department', filters.department);
      if (filters.position) params.append('position', filters.position);
      if (filters.contract_type) params.append('contract_type', filters.contract_type);
      if (filters.gender) params.append('gender', filters.gender);
      if (filters.min_salary) params.append('min_salary', filters.min_salary);
      if (filters.max_salary) params.append('max_salary', filters.max_salary);
      if (filters.min_age) params.append('min_age', filters.min_age);
      if (filters.max_age) params.append('max_age', filters.max_age);

      const response = await axios.get(`${API_BASE_URL}/employees?${params.toString()}`);
      setEmployees(response.data);
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(0);
    fetchEmployees();
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilters({
      department: '',
      position: '',
      contract_type: '',
      gender: '',
      min_salary: '',
      max_salary: '',
      min_age: '',
      max_age: '',
    });
    setPage(0);
  };

  const exportData = async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const response = await axios.get(`${API_BASE_URL}/export/csv?${params.toString()}`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'employees.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
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

  // Card View Component
  const renderCardView = () => (
    <Grid container spacing={3}>
      {paginatedEmployees.map((employee: Employee) => (
        <Grid item xs={12} sm={6} md={4} key={employee.Id_number}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flexGrow: 1 }}>
              <Typography variant="h6" component="h2" gutterBottom sx={{ fontSize: '16px' }}>
                {employee.full_name}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                ID: {employee.Id_number}
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Chip 
                  label={employee.department} 
                  color="primary" 
                  size="small" 
                  sx={{ mr: 1, mb: 1, fontWeight: 600 }}
                />
                <Chip 
                  label={employee.gender} 
                  color={employee.gender === 'Nam' ? 'info' : 'secondary'} 
                  size="small" 
                  sx={{ mr: 1, mb: 1, fontWeight: 600 }}
                />
                <Chip 
                  label={employee.contract_type} 
                  color={employee.contract_type === 'Không thời hạn' ? 'success' : 'secondary'} 
                  size="small" 
                  variant={employee.contract_type === 'Không thời hạn' ? 'filled' : 'outlined'}
                  sx={{ mb: 1, fontWeight: 600 }}
                />
              </Box>

              <Typography variant="body2"><strong>Position:</strong> {employee.position}</Typography>
              <Typography variant="body2"><strong>Age:</strong> {Math.ceil(employee.age)} years</Typography>
              <Typography variant="body2"><strong>Phone:</strong> {employee.phone}</Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Current Address:</strong> {employee.current_address}
              </Typography>
              
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

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
            <TableCell><Typography variant="subtitle2" fontWeight="bold">Current Address</Typography></TableCell>
            <TableCell><Typography variant="subtitle2" fontWeight="bold">Address</Typography></TableCell>
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
                    <Typography variant="caption" color="text.secondary">
                      {Math.ceil(employee.age)} years
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
                    {new Date(employee.dob).toLocaleDateString('vi-VN')}
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
                  <Typography variant="body2" sx={{ wordWrap: 'break-word', maxWidth: 200 }}>
                    {employee.current_address}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ wordWrap: 'break-word', maxWidth: 200 }}>
                    {employee.address}
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
                    {expandedEmployees.has(employee.Id_number) ? '▲' : '▼'}
                  </Button>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={9}>
                  <Collapse in={expandedEmployees.has(employee.Id_number)} timeout="auto" unmountOnExit>
                    <Box sx={{ margin: 1 }}>
                      <Typography variant="h6" gutterBottom component="div">
                        Complete Details
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={4}>
                          <Typography variant="body2"><strong>Salary:</strong></Typography>
                          <Typography variant="body2" fontWeight="bold" sx={{ mb: 1 }}>
                            {formatCurrency(employee.salary)}
                          </Typography>
                          <Typography variant="body2"><strong>Contract ID:</strong></Typography>
                          <Typography variant="body2" sx={{ mb: 1 }}>{employee.contract_id}</Typography>
                          <Typography variant="body2"><strong>Contract Type:</strong></Typography>
                          <Chip 
                            label={employee.contract_type} 
                            size="small" 
                            color={employee.contract_type === 'Không thời hạn' ? 'success' : 'default'}
                            sx={{ mb: 1 }}
                          />
                          <Typography variant="body2"><strong>Contract Sign Date:</strong></Typography>
                          <Typography variant="body2" sx={{ mb: 1 }}>{new Date(employee.contract_sign_date).toLocaleDateString('en-GB')}</Typography>
                          <Typography variant="body2"><strong>Last Salary Adjustment:</strong></Typography>
                          <Typography variant="body2">{new Date(employee.last_salary_adjustment).toLocaleDateString('en-GB')}</Typography>
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <Typography variant="body2"><strong>ID Number:</strong></Typography>
                          <Typography variant="body2" sx={{ mb: 1 }}>{employee.Id_number}</Typography>
                          <Typography variant="body2"><strong>Education:</strong></Typography>
                          <Typography variant="body2" sx={{ mb: 1 }}>{employee.education_level}</Typography>
                          <Typography variant="body2"><strong>Tax Code:</strong></Typography>
                          <Typography variant="body2" sx={{ mb: 1 }}>{employee.tax_code}</Typography>
                          <Typography variant="body2"><strong>Social Insurance Number:</strong></Typography>
                          <Typography variant="body2" sx={{ mb: 1 }}>{employee.social_insurance_number}</Typography>
                          <Typography variant="body2"><strong>Bank Account:</strong></Typography>
                          <Typography variant="body2">{employee.bank_account}</Typography>
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <Typography variant="body2"><strong>PVI Care:</strong></Typography>
                          <Typography variant="body2" sx={{ mb: 1 }}>{employee.pvi_care}</Typography>
                          <Typography variant="body2"><strong>Medical Insurance:</strong></Typography>
                          <Typography variant="body2" sx={{ mb: 1 }}>{employee.medical_insurance_hospital}</Typography>
                          <Typography variant="body2"><strong>Training Skills:</strong></Typography>
                          <Typography variant="body2">{employee.training_skills}</Typography>
                        </Grid>
                      </Grid>
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
      {/* Search and Filter Section */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 600 }}>
            🔍 Search & Filter
          </Typography>
          <Box>
            <Typography variant="body2" sx={{ mb: 1, color: 'text.secondary', fontWeight: 500 }}>View Mode:</Typography>
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
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Search employees"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Name, phone, ID, department..."
              InputProps={{
                endAdornment: (
                  <Button onClick={handleSearch}>🔍</Button>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Department</InputLabel>
              <Select
                value={filters.department}
                onChange={(e) => setFilters({ ...filters, department: e.target.value })}
              >
                <MenuItem value="">All Departments</MenuItem>
                <MenuItem value="Sales">Sales</MenuItem>
                <MenuItem value="Engineering">Engineering</MenuItem>
                <MenuItem value="HR">HR</MenuItem>
                <MenuItem value="Marketing">Marketing</MenuItem>
                <MenuItem value="Finance">Finance</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Gender</InputLabel>
              <Select
                value={filters.gender}
                onChange={(e) => setFilters({ ...filters, gender: e.target.value })}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="Nam">Nam</MenuItem>
                <MenuItem value="Nữ">Nữ</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Min Salary"
              type="number"
              value={filters.min_salary}
              onChange={(e) => setFilters({ ...filters, min_salary: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Max Salary"
              type="number"
              value={filters.max_salary}
              onChange={(e) => setFilters({ ...filters, max_salary: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              label="Min Age"
              type="number"
              value={filters.min_age}
              onChange={(e) => setFilters({ ...filters, min_age: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              label="Max Age"
              type="number"
              value={filters.max_age}
              onChange={(e) => setFilters({ ...filters, max_age: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button variant="contained" onClick={handleSearch}>
                Apply
              </Button>
              <Button variant="outlined" onClick={clearFilters}>
                Clear
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>


      {/* Actions */}
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 600 }}>
          Employee List ({employees.length} records) - Testing Auto-refresh Now! 🔄
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
            📥 Export CSV
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

      {/* Employee Display */}
      {viewMode === 'cards' && renderCardView()}
      {viewMode === 'compact' && renderCompactView()}
      {viewMode === 'table' && (
        <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
          <Table sx={{ minWidth: 2400, tableLayout: 'auto' }}>
            <TableHead>
              <TableRow>
                <TableCell><Typography variant="subtitle2" fontWeight="bold">Full Name</Typography></TableCell>
                <TableCell><Typography variant="subtitle2" fontWeight="bold">DOB</Typography></TableCell>
                <TableCell><Typography variant="subtitle2" fontWeight="bold">Age</Typography></TableCell>
                <TableCell><Typography variant="subtitle2" fontWeight="bold">Gender</Typography></TableCell>
                <TableCell><Typography variant="subtitle2" fontWeight="bold">ID Number</Typography></TableCell>
                <TableCell><Typography variant="subtitle2" fontWeight="bold">Address</Typography></TableCell>
                <TableCell><Typography variant="subtitle2" fontWeight="bold">Current Address</Typography></TableCell>
                <TableCell><Typography variant="subtitle2" fontWeight="bold">Phone</Typography></TableCell>
                <TableCell><Typography variant="subtitle2" fontWeight="bold">Education Level</Typography></TableCell>
                <TableCell><Typography variant="subtitle2" fontWeight="bold">Department</Typography></TableCell>
                <TableCell><Typography variant="subtitle2" fontWeight="bold">Position</Typography></TableCell>
                <TableCell><Typography variant="subtitle2" fontWeight="bold">Contract ID</Typography></TableCell>
                <TableCell><Typography variant="subtitle2" fontWeight="bold">Contract Type</Typography></TableCell>
                <TableCell><Typography variant="subtitle2" fontWeight="bold">Contract Sign Date</Typography></TableCell>
                <TableCell><Typography variant="subtitle2" fontWeight="bold">Salary</Typography></TableCell>
                <TableCell><Typography variant="subtitle2" fontWeight="bold">Last Salary Adjustment</Typography></TableCell>
                <TableCell><Typography variant="subtitle2" fontWeight="bold">Tax Code</Typography></TableCell>
                <TableCell><Typography variant="subtitle2" fontWeight="bold">Social Insurance Number</Typography></TableCell>
                <TableCell><Typography variant="subtitle2" fontWeight="bold">Medical Insurance Hospital</Typography></TableCell>
                <TableCell><Typography variant="subtitle2" fontWeight="bold">Bank Account</Typography></TableCell>
                <TableCell><Typography variant="subtitle2" fontWeight="bold">PVI Care</Typography></TableCell>
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
                      {new Date(employee.dob).toLocaleDateString('en-GB')}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ minWidth: 80 }}>
                    <Typography variant="body2">
                      {Math.ceil(employee.age)}
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
                      {new Date(employee.contract_sign_date).toLocaleDateString('en-GB')}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ minWidth: 120 }}>
                    <Typography variant="body2">
                      {formatCurrency(employee.salary)}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ minWidth: 140 }}>
                    <Typography variant="body2">
                      {new Date(employee.last_salary_adjustment).toLocaleDateString('en-GB')}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ minWidth: 120 }}>
                    <Typography variant="body2">
                      {employee.tax_code}
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
                  <TableCell sx={{ minWidth: 100 }}>
                    <Typography variant="body2">
                      {employee.pvi_care}
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
      <Paper sx={{ mt: 2 }}>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={employees.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
    </Box>
  );
};

export default EmployeeDashboard;