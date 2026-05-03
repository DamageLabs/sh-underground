import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  Paper,
  CircularProgress,
  Link,
} from '@mui/material';
import { api } from '../api';

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [tokenError, setTokenError] = useState('');
  const [username, setUsername] = useState('');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setTokenError('No reset token provided');
      setVerifying(false);
      return;
    }
    api.verifyResetToken(token).then((res) => {
      if (res.valid) {
        setTokenValid(true);
        setUsername(res.username || '');
      } else {
        setTokenError(res.error || 'Invalid reset token');
      }
      setVerifying(false);
    }).catch(() => {
      setTokenError('Failed to verify token');
      setVerifying(false);
    });
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setSubmitting(true);
    try {
      await api.resetPassword(token, newPassword);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
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
              Reset Password
            </Typography>
          </Box>

          {verifying && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          )}

          {!verifying && tokenError && (
            <>
              <Alert severity="error" sx={{ mb: 2 }}>
                {tokenError}
              </Alert>
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                Reset links expire after 24 hours. Contact an admin for a new one.{' '}
                <Link component={RouterLink} to="/login">Back to login</Link>
              </Typography>
            </>
          )}

          {!verifying && tokenValid && success && (
            <Alert severity="success">
              Password reset successfully. Redirecting to login...
            </Alert>
          )}

          {!verifying && tokenValid && !success && (
            <Box component="form" onSubmit={handleSubmit}>
              {username && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Resetting password for <strong>{username}</strong>
                </Typography>
              )}

              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              <TextField
                margin="normal"
                required
                fullWidth
                name="newPassword"
                label="New Password"
                type="password"
                autoComplete="new-password"
                autoFocus
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="confirmPassword"
                label="Confirm New Password"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                disabled={submitting}
              >
                {submitting ? 'Resetting...' : 'Reset Password'}
              </Button>
            </Box>
          )}
        </Paper>
      </Box>
    </Container>
  );
}

export default ResetPassword;
