import React, { useState } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Container,
  InputAdornment,
  IconButton,
  Alert,
  CircularProgress,
  Link as MuiLink,
  Divider,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Person,
  Lock,
} from '@mui/icons-material';

interface LoginProps {
  onLogin: (username: string, password: string) => Promise<boolean>;
  onRegister?: () => void;
  onForgotPassword?: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, onRegister, onForgotPassword }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const success = await onLogin(username, password);
      if (!success) {
        setError('Invalid username or password. Please try again.');
      }
    } catch (err) {
      setError('An error occurred during login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: 3,
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={24}
          sx={{
            padding: { xs: 3, sm: 4, md: 5 },
            borderRadius: 3,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
          }}
        >
          {/* Logo and Title Section */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              mb: 4,
            }}
          >
            <Box
              component="img"
              src="/logo.png"
              alt="Company Logo"
              sx={{
                height: { xs: 60, sm: 80 },
                width: 'auto',
                mb: 2,
                filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1))',
              }}
            />
            <Typography
              variant="h6"
              sx={{
                color: '#4A5568',
                textAlign: 'center',
                fontWeight: 500,
                fontSize: { xs: '1rem', sm: '1.1rem' },
              }}
            >
              Employee Management System
            </Typography>
          </Box>

          {/* Login Form */}
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            {error && (
              <Alert
                severity="error"
                sx={{
                  mb: 3,
                  borderRadius: 2,
                  '& .MuiAlert-icon': {
                    fontSize: '1.2rem',
                  },
                }}
              >
                {error}
              </Alert>
            )}

            <TextField
              margin="normal"
              required
              fullWidth
              id="username"
              label="Username"
              name="username"
              autoComplete="username"
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Person sx={{ color: '#718096' }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                  '&:hover fieldset': {
                    borderColor: '#4299E1',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#2C5282',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: '#4A5568',
                  '&.Mui-focused': {
                    color: '#2C5282',
                  },
                },
              }}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock sx={{ color: '#718096' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={handleClickShowPassword}
                      edge="end"
                      sx={{ color: '#718096' }}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                  '&:hover fieldset': {
                    borderColor: '#4299E1',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#2C5282',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: '#4A5568',
                  '&.Mui-focused': {
                    color: '#2C5282',
                  },
                },
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading || !username || !password}
              sx={{
                mt: 2,
                mb: 3,
                py: 1.5,
                borderRadius: 2,
                fontSize: '1.1rem',
                fontWeight: 600,
                textTransform: 'none',
                background: 'linear-gradient(45deg, #2C5282 30%, #4299E1 90%)',
                boxShadow: '0 4px 20px 0 rgba(44, 82, 130, 0.4)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #1A365D 30%, #2C5282 90%)',
                  boxShadow: '0 6px 25px 0 rgba(44, 82, 130, 0.5)',
                  transform: 'translateY(-2px)',
                },
                '&:disabled': {
                  background: '#E2E8F0',
                  color: '#A0AEC0',
                  boxShadow: 'none',
                },
                transition: 'all 0.3s ease',
              }}
              startIcon={
                loading ? (
                  <CircularProgress size={20} color="inherit" />
                ) : undefined
              }
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </Button>

            {/* Forgot Password Link */}
            {onForgotPassword && (
              <Box sx={{ textAlign: 'center', mb: 2 }}>
                <MuiLink
                  component="button"
                  type="button"
                  onClick={onForgotPassword}
                  sx={{
                    color: '#2C5282',
                    fontWeight: 500,
                    textDecoration: 'none',
                    fontSize: '0.9rem',
                    '&:hover': {
                      textDecoration: 'underline',
                    },
                  }}
                >
                  Forgot Password?
                </MuiLink>
              </Box>
            )}

            {/* Divider */}
            {onRegister && (
              <Divider sx={{ my: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  OR
                </Typography>
              </Divider>
            )}

            {/* Register Link */}
            {onRegister && (
              <Box sx={{ textAlign: 'center', mb: 2 }}>
                <Typography variant="body2">
                  Don't have an account?{' '}
                  <MuiLink
                    component="button"
                    type="button"
                    onClick={onRegister}
                    sx={{
                      color: '#2C5282',
                      fontWeight: 600,
                      textDecoration: 'none',
                      '&:hover': {
                        textDecoration: 'underline',
                      },
                    }}
                  >
                    Create Account
                  </MuiLink>
                </Typography>
              </Box>
            )}
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Login;
