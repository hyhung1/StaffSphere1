import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Typography,
  Divider,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Dashboard,
  People,
  BarChart,
  Settings,
  ExitToApp,
  Business,
} from '@mui/icons-material';

const drawerWidth = 224;

const PermanentSidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();

  const menuItems = [
    {
      text: 'Dashboard',
      icon: <Dashboard />,
      path: '/',
      description: 'Employee Overview'
    },
    {
      text: 'Employee List',
      icon: <People />,
      path: '/',
      description: 'Manage Staff'
    },
    {
      text: 'Statistics',
      icon: <BarChart />,
      path: '/statistics',
      description: 'Analytics & Reports'
    },
    {
      text: 'Departments',
      icon: <Business />,
      path: '/departments',
      description: 'Department Management'
    },
  ];

  const bottomMenuItems = [
    {
      text: 'Settings',
      icon: <Settings />,
      path: '/settings',
      description: 'System Configuration'
    },
    {
      text: 'Logout',
      icon: <ExitToApp />,
      path: '/logout',
      description: 'Sign Out'
    },
  ];

  const handleNavigation = (path: string, text: string) => {
    if (text === 'Logout') {
      // Handle logout logic here
      console.log('Logout clicked');
      return;
    }
    navigate(path);
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ 
        p: 3, 
        backgroundColor: theme.palette.primary.main,
        color: 'white',
        textAlign: 'center'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
          <img 
            src="/logo.png" 
            alt="StaffSphere" 
            style={{ 
              height: '40px', 
              width: 'auto',
              marginRight: '12px'
            }} 
          />
          <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: '0.5px' }}>
            StaffSphere
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '0.85rem' }}>
          HR Management System
        </Typography>
      </Box>

      {/* Navigation Items */}
      <Box sx={{ flexGrow: 1, py: 1 }}>
        <List sx={{ px: 2 }}>
          {menuItems.map((item) => (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => handleNavigation(item.path, item.text)}
                sx={{
                  borderRadius: 2,
                  py: 1.5,
                  px: 2,
                  backgroundColor: isActive(item.path) 
                    ? alpha(theme.palette.primary.main, 0.1)
                    : 'transparent',
                  border: isActive(item.path) 
                    ? `1px solid ${alpha(theme.palette.primary.main, 0.3)}`
                    : '1px solid transparent',
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.05),
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                <ListItemIcon sx={{ 
                  minWidth: 40,
                  color: isActive(item.path) 
                    ? theme.palette.primary.main 
                    : theme.palette.text.secondary,
                }}>
                  {item.icon}
                </ListItemIcon>
                <Box sx={{ flexGrow: 1 }}>
                  <ListItemText 
                    primary={item.text}
                    secondary={item.description}
                    primaryTypographyProps={{
                      fontSize: '0.95rem',
                      fontWeight: isActive(item.path) ? 600 : 500,
                      color: isActive(item.path) 
                        ? theme.palette.primary.main 
                        : theme.palette.text.primary,
                    }}
                    secondaryTypographyProps={{
                      fontSize: '0.8rem',
                      color: theme.palette.text.secondary,
                    }}
                  />
                </Box>
              </ListItemButton>
            </ListItem>
          ))}
        </List>

        <Divider sx={{ mx: 2, my: 2 }} />

        {/* Bottom Menu Items */}
        <List sx={{ px: 2 }}>
          {bottomMenuItems.map((item) => (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => handleNavigation(item.path, item.text)}
                sx={{
                  borderRadius: 2,
                  py: 1.5,
                  px: 2,
                  backgroundColor: isActive(item.path) 
                    ? alpha(theme.palette.primary.main, 0.1)
                    : 'transparent',
                  border: isActive(item.path) 
                    ? `1px solid ${alpha(theme.palette.primary.main, 0.3)}`
                    : '1px solid transparent',
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.05),
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                <ListItemIcon sx={{ 
                  minWidth: 40,
                  color: isActive(item.path) 
                    ? theme.palette.primary.main 
                    : theme.palette.text.secondary,
                }}>
                  {item.icon}
                </ListItemIcon>
                <Box sx={{ flexGrow: 1 }}>
                  <ListItemText 
                    primary={item.text}
                    secondary={item.description}
                    primaryTypographyProps={{
                      fontSize: '0.95rem',
                      fontWeight: isActive(item.path) ? 600 : 500,
                      color: isActive(item.path) 
                        ? theme.palette.primary.main 
                        : theme.palette.text.primary,
                    }}
                    secondaryTypographyProps={{
                      fontSize: '0.8rem',
                      color: theme.palette.text.secondary,
                    }}
                  />
                </Box>
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>

      {/* Footer */}
      <Box sx={{ 
        p: 2, 
        borderTop: `1px solid ${theme.palette.divider}`,
        backgroundColor: alpha(theme.palette.grey[50], 0.5)
      }}>
        <Typography variant="caption" sx={{ 
          color: theme.palette.text.secondary,
          display: 'block',
          textAlign: 'center',
          fontSize: '0.75rem'
        }}>
          © 2024 StaffSphere
        </Typography>
        <Typography variant="caption" sx={{ 
          color: theme.palette.text.secondary,
          display: 'block',
          textAlign: 'center',
          fontSize: '0.75rem'
        }}>
          Version 1.0.0
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Drawer
      variant="permanent"
      sx={{
        display: { xs: 'none', md: 'block' },
        '& .MuiDrawer-paper': {
          boxSizing: 'border-box',
          width: drawerWidth,
          backgroundColor: theme.palette.background.paper,
          borderRight: `1px solid ${theme.palette.divider}`,
        },
      }}
      open
    >
      {drawerContent}
    </Drawer>
  );
};

export { drawerWidth };
export default PermanentSidebar;
