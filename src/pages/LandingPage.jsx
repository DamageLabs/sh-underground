import { useNavigate, Navigate } from 'react-router-dom';
import { Box, Typography, Button, Stack, Paper } from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import GroupsIcon from '@mui/icons-material/Groups';
import { useAuth } from '../contexts/AuthContext';

const steps = [
  { icon: <LocationOnIcon sx={{ fontSize: 48, color: '#fff' }} />, title: 'Get Invited', description: 'Get an invite link from a member' },
  { icon: <LocationOnIcon sx={{ fontSize: 48, color: '#fff' }} />, title: 'Set Location', description: 'Pin your city on the map' },
  { icon: <GroupsIcon sx={{ fontSize: 48, color: '#fff' }} />, title: 'Connect', description: 'Find and link up with members nearby' },
];

function LandingPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (isAuthenticated) {
    return <Navigate to="/profile" replace />;
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: '#0a0a0a',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        pt: 10,
      }}
    >
      <Box
        component="img"
        src="/logo-2.jpg"
        alt="SH Underground"
        sx={{ width: 200, height: 200, mb: 3, borderRadius: 2 }}
      />
      <Typography variant="h3" sx={{ color: '#ffffff', fontWeight: 'bold', mb: 1 }}>
        SH Underground
      </Typography>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
        Connect with the underground community
      </Typography>
      <Button
        variant="outlined"
        size="large"
        onClick={() => navigate('/login')}
        sx={{ px: 4, color: '#fff', borderColor: '#fff', '&:hover': { borderColor: '#ccc', color: '#ccc' } }}
      >
        Login
      </Button>

      <Box sx={{ mt: 8, px: 2, maxWidth: 900, width: '100%' }}>
        <Typography variant="h5" sx={{ color: '#fff', textAlign: 'center', mb: 4 }}>
          How It Works
        </Typography>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={3}
          justifyContent="center"
          alignItems="stretch"
        >
          {steps.map((step, i) => (
            <Paper
              key={step.title}
              elevation={0}
              sx={{
                flex: 1,
                p: 3,
                textAlign: 'center',
                backgroundColor: '#1a1a1a',
                borderRadius: 2,
              }}
            >
              {step.icon}
              <Typography variant="h6" sx={{ color: '#fff', mt: 1.5, mb: 1 }}>
                {i + 1}. {step.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {step.description}
              </Typography>
            </Paper>
          ))}
        </Stack>
      </Box>
    </Box>
  );
}

export default LandingPage;
