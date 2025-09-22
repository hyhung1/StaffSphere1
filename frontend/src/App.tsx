import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, Container, Fab } from '@mui/material';
import { Menu } from '@mui/icons-material';
import EmployeeDashboard from './components/EmployeeDashboard';
import EmployeeDetail from './components/EmployeeDetail';
import Statistics from './components/Statistics';
import Sidebar from './components/Sidebar';
import PermanentSidebar, { drawerWidth } from './components/PermanentSidebar';
import Login from './components/Login';

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
      default: '#FAFAFA',  // Very soft neutral gray
      paper: '#FCFCFC',    // Almost white with hint of warmth
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
          boxShadow: '0px 2px 8px 0px rgba(0, 0, 0, 0.08)',
          backgroundColor: '#FCFCFC',
          border: '1px solid #F0F0F0',
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
          boxShadow: '0px 2px 8px 0px rgba(0, 0, 0, 0.08)',
          border: '1px solid #F0F0F0',
          background: '#FCFCFC',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0px 4px 12px 0px rgba(0, 0, 0, 0.12)',
            background: '#FEFEFE',
          },
        },
      },
    },
  },
});

function App() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogin = async (username: string, password: string): Promise<boolean> => {
    // Simple authentication - in a real app, this would be an API call
    if (username === 'admin' && password === 'password') {
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Login onLogin={handleLogin} />
      </ThemeProvider>
    );
  }

  // Show main application if authenticated
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box sx={{ display: 'flex' }}>

          {/* Navigation Drawer */}
          <Box
            component="nav"
            sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
            aria-label="mailbox folders"
          >
            {/* Mobile drawer */}
            <Sidebar open={mobileOpen} onClose={handleDrawerToggle} onLogout={handleLogout} />
            
            {/* Desktop permanent drawer */}
            <PermanentSidebar onLogout={handleLogout} />
          </Box>

          {/* Main content */}
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              pt: 3,
              pr: 3,
              pb: 3,
              pl: 1, // Small left padding for comfortable spacing from sidebar
              width: { md: `calc(100% - ${drawerWidth}px)` },
              background: 'linear-gradient(135deg, #F7FAFC 0%, #EDF2F7 30%, #E2E8F0 60%, #CBD5E0 100%)',
              minHeight: '100vh',
            }}
          >
            {/* Mobile Menu Button */}
            <Fab
              color="primary"
              aria-label="menu"
              onClick={handleDrawerToggle}
              sx={{
                position: 'fixed',
                top: 16,
                left: 16,
                display: { xs: 'flex', md: 'none' },
                zIndex: (theme) => theme.zIndex.drawer + 1,
              }}
            >
              <Menu />
            </Fab>

            <Container maxWidth="xl" sx={{ pl: 0, ml: 0 }}>
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
