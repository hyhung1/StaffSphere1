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

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ open, onClose, onLogout }) => {
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
      onClose();
      return;
    }
    navigate(path);
    onClose();
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ 
        p: 3, 
        textAlign: 'center',
        borderBottom: `1px solid ${theme.palette.divider}`
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
          <img 
            src="/female-avatar.png" 
            alt="Mrs Nhung Ho" 
            style={{ 
              width: '60px', 
              height: '60px',
              borderRadius: '50%',
              marginRight: '12px',
              objectFit: 'cover'
            }} 
          />
          <Typography variant="h6" sx={{ 
            fontWeight: 700, 
            letterSpacing: '0.5px',
            color: theme.palette.text.primary
          }}>
            Mrs Nhung Ho
          </Typography>
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
                  minWidth: 50,
                  color: isActive(item.path) 
                    ? theme.palette.primary.main 
                    : theme.palette.text.secondary,
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
                         ? theme.palette.primary.main 
                         : theme.palette.text.primary,
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
                  minWidth: 50,
                  color: isActive(item.path) 
                    ? theme.palette.primary.main 
                    : theme.palette.text.secondary,
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
                         ? theme.palette.primary.main 
                         : theme.palette.text.primary,
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
      variant="temporary"
      open={open}
      onClose={onClose}
      ModalProps={{
        keepMounted: true, // Better open performance on mobile
      }}
      sx={{
        display: { xs: 'block', md: 'none' },
        '& .MuiDrawer-paper': {
          boxSizing: 'border-box',
          width: drawerWidth,
          backgroundColor: theme.palette.background.paper,
          borderRight: `1px solid ${theme.palette.divider}`,
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
};

export default Sidebar;
