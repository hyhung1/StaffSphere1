import React, { useState } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Container,
  InputAdornment,
  Alert,
  CircularProgress,
  Link as MuiLink,
  Divider,
} from '@mui/material';
import {
  Email,
  Person,
  CheckCircleOutline,
} from '@mui/icons-material';

interface ForgotPasswordProps {
  onBackToLogin: () => void;
}

const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onBackToLogin }) => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [recoveredCredentials, setRecoveredCredentials] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setRecoveredCredentials(null);

    if (!email || !username) {
      setError('Please enter both email and username');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/recover-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          username,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Password recovery failed');
      }

      setRecoveredCredentials(data.credentials);
    } catch (err: any) {
      setError(err.message || 'No account found with the provided information');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: 2,
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={24}
          sx={{
            p: 4,
            borderRadius: 3,
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          }}
        >
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                color: '#2C5282',
                mb: 1,
              }}
            >
              Forgot Password?
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Enter your email and username to recover your account
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {recoveredCredentials && (
            <Alert
              icon={<CheckCircleOutline fontSize="large" />}
              severity="success"
              sx={{ mb: 3 }}
            >
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Account Found!
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ textAlign: 'left' }}>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  <strong>Full Name:</strong> {recoveredCredentials.fullName}
                </Typography>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  <strong>Username:</strong> {recoveredCredentials.username}
                </Typography>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  <strong>Email:</strong> {recoveredCredentials.email}
                </Typography>
                <Typography variant="body1" sx={{ mb: 1, color: 'error.main' }}>
                  <strong>Password:</strong> {recoveredCredentials.password}
                </Typography>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Typography variant="body2" color="text.secondary">
                ⚠️ Please save this information securely and consider changing your password after logging in.
              </Typography>
            </Alert>
          )}

          {!recoveredCredentials && (
            <Box component="form" onSubmit={handleSubmit}>
              <TextField
                fullWidth
                type="email"
                label="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                sx={{ mb: 2 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email sx={{ color: '#2C5282' }} />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                fullWidth
                label="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
                sx={{ mb: 3 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person sx={{ color: '#2C5282' }} />
                    </InputAdornment>
                  ),
                }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading}
                sx={{
                  mb: 2,
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
                  },
                }}
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : undefined}
              >
                {loading ? 'Recovering...' : 'Recover Password'}
              </Button>
            </Box>
          )}

          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Typography variant="body2">
              Remember your password?{' '}
              <MuiLink
                component="button"
                type="button"
                onClick={onBackToLogin}
                sx={{
                  color: '#2C5282',
                  fontWeight: 600,
                  textDecoration: 'none',
                  '&:hover': {
                    textDecoration: 'underline',
                  },
                }}
              >
                Back to Sign In
              </MuiLink>
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default ForgotPassword;

