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
  Analytics,
  Business,
  ExitToApp,
  AccountBalance,
} from '@mui/icons-material';

const drawerWidth = 202;

interface PermanentSidebarProps {
  onLogout: () => void;
}

const PermanentSidebar: React.FC<PermanentSidebarProps> = ({ onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();

  const menuItems = [
    {
      text: 'Company Overview',
      icon: <Business />,
      path: '/?view=cards'
    },
    {
      text: 'Dashboard',
      icon: <Analytics />,
      path: '/?view=compact'
    },
    {
      text: 'Payroll',
      icon: <AccountBalance />,
      path: '/payroll'
    },
  ];

  const bottomMenuItems = [
    {
      text: 'Logout',
      icon: <ExitToApp />,
      path: '/logout'
    },
  ];

  const handleNavigation = (path: string, text: string) => {
    if (text === 'Logout') {
      onLogout();
      return;
    }
    navigate(path);
  };

  const isActive = (path: string) => {
    // Handle the special case for Company Overview and Dashboard views
    if (path === '/?view=cards') {
      // Company Overview is active if we're on / with view=cards or / with no view parameter (default)
      return location.pathname === '/' && (location.search === '?view=cards' || location.search === '');
    }
    if (path === '/?view=compact') {
      // Dashboard is active only if we're explicitly on view=compact
      return location.pathname === '/' && location.search === '?view=compact';
    }
    // For other paths, check exact match
    return location.pathname === path || location.pathname + location.search === path;
  };

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ 
        p: 3, 
        textAlign: 'center',
        background: 'linear-gradient(135deg, rgba(44, 82, 130, 0.05) 0%, rgba(44, 82, 130, 0.02) 100%)',
        borderBottom: `1px solid rgba(44, 82, 130, 0.1)`,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
          <Box sx={{
            position: 'relative',
            mr: 2,
          }}>
            <img 
              src="/female-avatar.png" 
              alt="Mrs Nhung" 
              style={{ 
                width: '64px', 
                height: '64px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '3px solid rgba(44, 82, 130, 0.2)',
                boxShadow: '0 4px 12px rgba(44, 82, 130, 0.15)',
              }} 
            />
            <Box sx={{
              position: 'absolute',
              bottom: 2,
              right: 2,
              width: 16,
              height: 16,
              borderRadius: '50%',
              backgroundColor: '#38A169',
              border: '2px solid #F7FAFC',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }} />
          </Box>
          <Box>
            <Typography variant="subtitle1" sx={{
              fontWeight: 700,
              letterSpacing: '0.5px',
              color: '#2C5282',
              fontSize: '1.1rem',
              mb: 0.2,
            }}>
              Mrs Nhung
            </Typography>
            <Typography variant="caption" sx={{
              color: 'rgba(44, 82, 130, 0.7)',
              fontSize: '0.75rem',
              fontWeight: 500,
              letterSpacing: '0.3px',
            }}>
              HR Administrator
            </Typography>
          </Box>
        </Box>
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
                  background: isActive(item.path) 
                    ? 'linear-gradient(135deg, rgba(44, 82, 130, 0.12) 0%, rgba(44, 82, 130, 0.08) 100%)'
                    : 'transparent',
                  border: isActive(item.path) 
                    ? `1px solid rgba(44, 82, 130, 0.25)`
                    : '1px solid transparent',
                  boxShadow: isActive(item.path) 
                    ? '0 2px 8px rgba(44, 82, 130, 0.12)'
                    : 'none',
                  '&:hover': {
                    background: isActive(item.path) 
                      ? 'linear-gradient(135deg, rgba(44, 82, 130, 0.15) 0%, rgba(44, 82, 130, 0.1) 100%)'
                      : 'linear-gradient(135deg, rgba(44, 82, 130, 0.06) 0%, rgba(44, 82, 130, 0.04) 100%)',
                    border: `1px solid rgba(44, 82, 130, 0.2)`,
                    boxShadow: '0 2px 8px rgba(44, 82, 130, 0.1)',
                    transform: 'translateY(-1px)',
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                <ListItemIcon sx={{ 
                  minWidth: 50,
                  color: isActive(item.path) 
                    ? '#2C5282' 
                    : 'rgba(44, 82, 130, 0.6)',
                  '& .MuiSvgIcon-root': {
                    fontSize: '1.4rem',
                  },
                }}>
                  {item.icon}
                </ListItemIcon>
                <Box sx={{ flexGrow: 1 }}>
                   <ListItemText 
                     primary={item.text}
                     primaryTypographyProps={{
                       fontSize: '1.1rem',
                       fontWeight: isActive(item.path) ? 600 : 500,
                       color: isActive(item.path) 
                         ? '#2C5282' 
                         : 'rgba(44, 82, 130, 0.8)',
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
                  background: isActive(item.path) 
                    ? 'linear-gradient(135deg, rgba(44, 82, 130, 0.12) 0%, rgba(44, 82, 130, 0.08) 100%)'
                    : 'transparent',
                  border: isActive(item.path) 
                    ? `1px solid rgba(44, 82, 130, 0.25)`
                    : '1px solid transparent',
                  boxShadow: isActive(item.path) 
                    ? '0 2px 8px rgba(44, 82, 130, 0.12)'
                    : 'none',
                  '&:hover': {
                    background: isActive(item.path) 
                      ? 'linear-gradient(135deg, rgba(44, 82, 130, 0.15) 0%, rgba(44, 82, 130, 0.1) 100%)'
                      : 'linear-gradient(135deg, rgba(44, 82, 130, 0.06) 0%, rgba(44, 82, 130, 0.04) 100%)',
                    border: `1px solid rgba(44, 82, 130, 0.2)`,
                    boxShadow: '0 2px 8px rgba(44, 82, 130, 0.1)',
                    transform: 'translateY(-1px)',
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                <ListItemIcon sx={{ 
                  minWidth: 50,
                  color: isActive(item.path) 
                    ? '#2C5282' 
                    : 'rgba(44, 82, 130, 0.6)',
                  '& .MuiSvgIcon-root': {
                    fontSize: '1.4rem',
                  },
                }}>
                  {item.icon}
                </ListItemIcon>
                <Box sx={{ flexGrow: 1 }}>
                   <ListItemText 
                     primary={item.text}
                     primaryTypographyProps={{
                       fontSize: '1.1rem',
                       fontWeight: isActive(item.path) ? 600 : 500,
                       color: isActive(item.path) 
                         ? '#2C5282' 
                         : 'rgba(44, 82, 130, 0.8)',
                     }}
                   />
                 </Box>
              </ListItemButton>
            </ListItem>
          ))}
        </List>
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
          background: 'linear-gradient(180deg, #F7FAFC 0%, #EDF2F7 50%, #E2E8F0 100%)',
          borderRight: `1px solid rgba(44, 82, 130, 0.1)`,
          boxShadow: '2px 0 8px rgba(44, 82, 130, 0.08)',
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
