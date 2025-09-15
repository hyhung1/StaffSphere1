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

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Employee Management Dashboard
      </Typography>

      {/* Search and Filter Section */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          🔍
          Search & Filter
        </Typography>

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

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6">Total Employees</Typography>
              <Typography variant="h4" color="primary">
                {employees.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6">Average Salary</Typography>
              <Typography variant="h4" color="primary">
                {employees.length > 0
                  ? formatCurrency(employees.reduce((sum, emp) => sum + emp.salary, 0) / employees.length)
                  : '₫0'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6">Departments</Typography>
              <Typography variant="h4" color="primary">
{Array.from(new Set(employees.map(emp => emp.department))).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Actions */}
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">
          Employee List ({employees.length} records)
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            onClick={exportData}
          >
            📥 Export CSV
          </Button>
          <Button
            variant="contained"
          >
            ➕ Add Employee
          </Button>
        </Box>
      </Box>

      {/* Employee Table */}
      <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
        <Table sx={{ minWidth: 1200 }}>
          <TableHead>
            <TableRow>
              <TableCell>Full Name</TableCell>
              <TableCell>Age</TableCell>
              <TableCell>Gender</TableCell>
              <TableCell>Department</TableCell>
              <TableCell>Position</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Education</TableCell>
              <TableCell>Salary</TableCell>
              <TableCell>Contract Type</TableCell>
              <TableCell>Contract ID</TableCell>
              <TableCell>Address</TableCell>
              <TableCell>Insurance</TableCell>
              <TableCell>Training Skills</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {employees
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((employee) => (
                <TableRow key={employee.Id_number} hover>
                  <TableCell>
                    <Box>
                      <Typography variant="subtitle2">
                        {employee.full_name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        ID: {employee.Id_number}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{Math.floor(employee.age)}</TableCell>
                  <TableCell>
                    <Chip
                      label={employee.gender}
                      size="small"
                      color={employee.gender === 'Nam' ? 'info' : 'secondary'}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={employee.department}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell sx={{ maxWidth: 200 }}>
                    <Typography variant="body2" noWrap>
                      {employee.position}
                    </Typography>
                  </TableCell>
                  <TableCell>{employee.phone}</TableCell>
                  <TableCell sx={{ maxWidth: 150 }}>
                    <Typography variant="body2" noWrap>
                      {employee.education_level}
                    </Typography>
                  </TableCell>
                  <TableCell>{formatCurrency(employee.salary)}</TableCell>
                  <TableCell>
                    <Chip
                      label={employee.contract_type}
                      size="small"
                      color={employee.contract_type === 'Không thời hạn' ? 'success' : 'default'}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">
                      {employee.contract_id}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ maxWidth: 200 }}>
                    <Typography variant="body2" noWrap title={employee.address}>
                      {employee.address}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ maxWidth: 150 }}>
                    <Typography variant="caption" noWrap title={employee.medical_insurance_hospital}>
                      {employee.medical_insurance_hospital}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ maxWidth: 150 }}>
                    <Typography variant="caption" noWrap title={employee.training_skills}>
                      {employee.training_skills}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <IconButton size="small" color="primary">
                        👁️
                      </IconButton>
                      <IconButton size="small" color="secondary">
                        ✏️
                      </IconButton>
                      <IconButton size="small" color="error">
                        🗑️
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={employees.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>
    </Box>
  );
};

export default EmployeeDashboard;