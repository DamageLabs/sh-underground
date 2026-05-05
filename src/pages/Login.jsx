import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  Paper,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [migrationRequired, setMigrationRequired] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const { login, completeMigration } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password');
      return;
    }

    setLoading(true);
    try {
      const result = await login(username, password);
      if (result.needsMigration) {
        setMigrationRequired(true);
      } else {
        navigate('/app/profile');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMigrate = async (e) => {
    e.preventDefault();
    setError('');

    const normalized = newEmail.trim().toLowerCase();
    if (!EMAIL_REGEX.test(normalized)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      await completeMigration(username, password, normalized);
      navigate('/app/profile');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        <Paper elevation={3} sx={{ p: 4 }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              mb: 3,
            }}
          >
            <Box
              component="img"
              src="/logo-2.jpg"
              alt="SH Underground"
              sx={{ width: 100, height: 100, mb: 2 }}
            />
            <Typography component="h1" variant="h4" sx={{ color: 'primary.main' }}>
              SH Underground
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {migrationRequired ? 'Set your email to continue' : 'Sign in to your account'}
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {migrationRequired ? (
            <Box component="form" onSubmit={handleMigrate}>
              <Alert severity="info" sx={{ mb: 2 }}>
                Usernames are now email addresses. Enter your email to update your account — this will be your new login.
              </Alert>
              <TextField
                margin="normal"
                required
                fullWidth
                id="newEmail"
                label="Email"
                name="newEmail"
                type="email"
                autoComplete="email"
                autoFocus
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                disabled={loading}
              >
                {loading ? 'Updating...' : 'Update and continue'}
              </Button>
            </Box>
          ) : (
            <Box component="form" onSubmit={handleSubmit}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="username"
                label="Username or Email"
                name="username"
                autoComplete="username"
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type="password"
                id="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                disabled={loading}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Need an account? Ask a member for an invite link.
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Forgot your password? Contact an admin for a reset link.
                </Typography>
              </Box>
            </Box>
          )}
        </Paper>
      </Box>
    </Container>
  );
}

export default Login;
