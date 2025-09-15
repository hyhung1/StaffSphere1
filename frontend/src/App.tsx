import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, AppBar, Toolbar, Typography, Container } from '@mui/material';
import EmployeeDashboard from './components/EmployeeDashboard';
import EmployeeDetail from './components/EmployeeDetail';
import Statistics from './components/Statistics';

// Create a sophisticated professional theme for HR application
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2C5282',  // Deep professional blue
      light: '#4299E1',
      dark: '#1A365D',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#38A169',  // Professional green
      light: '#68D391',
      dark: '#2F855A',
      contrastText: '#FFFFFF',
    },
    error: {
      main: '#E53E3E',
      light: '#FC8181',
      dark: '#C53030',
    },
    warning: {
      main: '#D69E2E',
      light: '#F6E05E',
      dark: '#B7791F',
    },
    info: {
      main: '#3182CE',
      light: '#63B3ED',
      dark: '#2C5282',
    },
    success: {
      main: '#38A169',
      light: '#68D391',
      dark: '#2F855A',
    },
    background: {
      default: '#D9D9D9',  // Medium gray background
      paper: '#F5F5F5',    // Light gray paper
    },
    text: {
      primary: '#2D3748',   // Dark gray for main text
      secondary: '#4A5568', // Medium gray for secondary text
    },
    grey: {
      50: '#F7FAFC',
      100: '#EDF2F7',
      200: '#E2E8F0',
      300: '#CBD5E0',
      400: '#A0AEC0',
      500: '#718096',
      600: '#4A5568',
      700: '#2D3748',
      800: '#1A202C',
      900: '#171923',
    },
  },
  typography: {
    fontFamily: '"Poppins", "Segoe UI", "Roboto", "Open Sans", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      letterSpacing: '-0.025em',
    },
    h2: {
      fontWeight: 700,
      letterSpacing: '-0.025em',
    },
    h3: {
      fontWeight: 600,
      letterSpacing: '-0.02em',
    },
    h4: {
      fontWeight: 600,
      letterSpacing: '-0.02em',
      color: '#2D3748',
    },
    h5: {
      fontWeight: 600,
      letterSpacing: '-0.01em',
    },
    h6: {
      fontWeight: 600,
      letterSpacing: '-0.01em',
      color: '#2D3748',
    },
    subtitle1: {
      fontWeight: 500,
      letterSpacing: '-0.01em',
    },
    subtitle2: {
      fontWeight: 500,
      letterSpacing: '-0.01em',
    },
    body1: {
      letterSpacing: '0.02em',
      fontWeight: 400,
      lineHeight: 1.6,
    },
    body2: {
      letterSpacing: '0.02em',
      fontWeight: 400,
      lineHeight: 1.5,
    },
    button: {
      fontWeight: 600,
      letterSpacing: '0.025em',
      textTransform: 'none',
    },
    caption: {
      letterSpacing: '0.025em',
    },
    overline: {
      letterSpacing: '0.1em',
    },
  },
  shape: {
    borderRadius: 8,
  },
  shadows: [
    'none',
    '0px 1px 2px 0px rgba(0, 0, 0, 0.05)',
    '0px 1px 3px 0px rgba(0, 0, 0, 0.1), 0px 1px 2px 0px rgba(0, 0, 0, 0.06)',
    '0px 4px 6px -1px rgba(0, 0, 0, 0.1), 0px 2px 4px -1px rgba(0, 0, 0, 0.06)',
    '0px 10px 15px -3px rgba(0, 0, 0, 0.1), 0px 4px 6px -2px rgba(0, 0, 0, 0.05)',
    '0px 20px 25px -5px rgba(0, 0, 0, 0.1), 0px 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '0px 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0px 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0px 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0px 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0px 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0px 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0px 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0px 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0px 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0px 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0px 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0px 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0px 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0px 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0px 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0px 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0px 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0px 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0px 25px 50px -12px rgba(0, 0, 0, 0.25)',
  ],
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#1A365D',
          boxShadow: '0px 2px 8px 0px rgba(0, 0, 0, 0.15)',
          '& .MuiTypography-root': {
            color: '#FFFFFF',
            fontWeight: 700,
            fontSize: '1.5rem',
            textShadow: '0px 1px 2px rgba(0, 0, 0, 0.3)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0px 3px 10px 0px rgba(0, 0, 0, 0.15)',
          backgroundColor: '#F5F5F5',
          border: '1px solid #D0D0D0',
          borderRadius: '12px',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontFamily: '"Poppins", "Segoe UI", "Roboto", sans-serif',
          fontWeight: 500,
          letterSpacing: '0.025em',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          textTransform: 'none',
          fontWeight: 600,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.05)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0px 3px 10px 0px rgba(0, 0, 0, 0.15)',
          border: '1px solid #D0D0D0',
          background: '#F5F5F5',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0px 5px 15px 0px rgba(0, 0, 0, 0.2)',
            background: '#F8F8F8',
          },
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box sx={{ flexGrow: 1 }}>
          <AppBar position="static">
            <Toolbar>
              <Box sx={{ display: 'flex', alignItems: 'center', mr: 3 }}>
                <img 
                  src="/logo.png" 
                  alt="Company Logo" 
                  style={{ 
                    height: '56px', 
                    width: 'auto',
                    marginRight: '16px'
                  }} 
                />
              </Box>
              <Typography 
                variant="h5" 
                component="div" 
                sx={{ 
                  flexGrow: 1, 
                  textAlign: 'center',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '1.5rem',
                  textShadow: '0px 1px 2px rgba(0, 0, 0, 0.3)',
                  letterSpacing: '0.5px'
                }}
              >
                Employee Management Dashboard
              </Typography>
            </Toolbar>
          </AppBar>
          <Box sx={{ 
            background: 'linear-gradient(180deg, #E8E8E8 0%, #D4D4D4 100%)',
            minHeight: 'calc(100vh - 64px)',
            pt: 4,
            pb: 4
          }}>
            <Container maxWidth="xl">
              <Routes>
                <Route path="/" element={<EmployeeDashboard />} />
                <Route path="/employee/:id" element={<EmployeeDetail />} />
                <Route path="/statistics" element={<Statistics />} />
              </Routes>
            </Container>
          </Box>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App;
