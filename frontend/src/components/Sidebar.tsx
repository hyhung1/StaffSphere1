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

const drawerWidth = 139;

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
            alt="Mrs Nhung" 
            style={{ 
              width: '44px', 
              height: '44px',
              borderRadius: '50%',
              marginRight: '8px',
              objectFit: 'cover'
            }} 
          />
          <Typography variant="subtitle1" sx={{
            fontWeight: 700,
            letterSpacing: '0.46px',
            color: theme.palette.text.primary,
            fontSize: '0.8rem',
          }}>
            Mrs Nhung
          </Typography>
        </Box>
      </Box>

      {/* Navigation Items */}
      <Box sx={{ flexGrow: 1, py: 1 }}>
        <List sx={{ px: 1.3 }}>
          {menuItems.map((item) => (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.36 }}>
              <ListItemButton
                onClick={() => handleNavigation(item.path, item.text)}
                sx={{
                  borderRadius: 1.3,
                  py: 1.08,
                  px: 1.44,
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
                  minWidth: 36,
                  color: isActive(item.path) 
                    ? theme.palette.primary.main 
                    : theme.palette.text.secondary,
                  '& .MuiSvgIcon-root': {
                    fontSize: '1.0rem',
                  },
                }}>
                  {item.icon}
                </ListItemIcon>
                <Box sx={{ flexGrow: 1 }}>
                   <ListItemText 
                     primary={item.text}
                     primaryTypographyProps={{
                       fontSize: '0.8rem',
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

        <Divider sx={{ mx: 1.3, my: 1.3 }} />

        {/* Bottom Menu Items */}
        <List sx={{ px: 1.3 }}>
          {bottomMenuItems.map((item) => (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.36 }}>
              <ListItemButton
                onClick={() => handleNavigation(item.path, item.text)}
                sx={{
                  borderRadius: 1.3,
                  py: 1.08,
                  px: 1.44,
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
                  minWidth: 36,
                  color: isActive(item.path) 
                    ? theme.palette.primary.main 
                    : theme.palette.text.secondary,
                  '& .MuiSvgIcon-root': {
                    fontSize: '1.0rem',
                  },
                }}>
                  {item.icon}
                </ListItemIcon>
                <Box sx={{ flexGrow: 1 }}>
                   <ListItemText 
                     primary={item.text}
                     primaryTypographyProps={{
                       fontSize: '0.8rem',
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
          background: 'linear-gradient(180deg, #F7FAFC 0%, #EDF2F7 50%, #E2E8F0 100%)',
          borderRight: `1px solid rgba(44, 82, 130, 0.1)`,
          boxShadow: '2px 0 8px rgba(44, 82, 130, 0.08)',
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
};

export default Sidebar;
