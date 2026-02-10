import { useState, useEffect } from 'react';
import { Box, Typography, Paper, Alert, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import EditLocationIcon from '@mui/icons-material/EditLocation';
import LocationMap from '../components/LocationMap';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../api';

function MapView() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [otherUsers, setOtherUsers] = useState([]);

  const hasLocation = user?.location && user?.coordinates;

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const users = await api.getAllUsers();
        const filtered = users
          .filter(u => u.username !== user.username && u.coordinates)
          .map(u => ({
            id: u.username,
            username: u.username,
            fullName: u.fullName,
            coordinates: u.coordinates,
            location: u.location,
            markerColor: u.markerColor || 'red',
            profilePhoto: u.profilePhoto,
          }));
        setOtherUsers(filtered);
      } catch (err) {
        console.error('Failed to fetch users:', err);
      }
    };

    if (user?.username) {
      fetchUsers();
    }
  }, [user?.username]);

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Your Underground
      </Typography>

      {!hasLocation ? (
        <Alert
          severity="info"
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => navigate('/app/profile')}
              startIcon={<EditLocationIcon />}
            >
              Set Location
            </Button>
          }
        >
          You haven't set a location yet. Go to your profile to set one.
        </Alert>
      ) : (
        <>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <LocationOnIcon color="primary" />
              <Typography variant="subtitle1">{user.location}</Typography>
            </Box>
            <Typography variant="caption" color="text.secondary">
              Click on the marker to see more details
            </Typography>
          </Paper>

          <Paper sx={{ overflow: 'hidden' }}>
            <LocationMap
              coordinates={user.coordinates}
              locationName={user.location}
              username={user.username}
              fullName={user.fullName}
              markerColor={user.markerColor}
              profilePhoto={user.profilePhoto}
              otherUsers={otherUsers}
            />
          </Paper>

          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Button
              variant="outlined"
              onClick={() => navigate('/app/profile')}
              startIcon={<EditLocationIcon />}
            >
              Change Location
            </Button>
          </Box>
        </>
      )}
    </Box>
  );
}

export default MapView;
