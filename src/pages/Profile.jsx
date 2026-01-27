import { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Alert,
  CircularProgress,
  Card,
  CardContent,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import SaveIcon from '@mui/icons-material/Save';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PersonIcon from '@mui/icons-material/Person';
import LockIcon from '@mui/icons-material/Lock';
import { useAuth } from '../contexts/AuthContext';

function Profile() {
  const { user, updateLocation, updateProfile, changePassword } = useAuth();
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [locationInput, setLocationInput] = useState(user?.location || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [geocodedResult, setGeocodedResult] = useState(null);

  const handleSaveProfile = () => {
    updateProfile({ fullName });
    setSuccess('Profile saved successfully!');
  };

  const handleChangePassword = () => {
    setError('');
    setSuccess('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Please fill in all password fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (newPassword.length < 4) {
      setError('New password must be at least 4 characters');
      return;
    }

    try {
      changePassword(currentPassword, newPassword);
      setSuccess('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.message);
    }
  };

  const geocodeAddress = async (address) => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      throw new Error('Google Maps API key not configured');
    }

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        address
      )}&key=${apiKey}`
    );

    const data = await response.json();

    if (data.status === 'ZERO_RESULTS') {
      throw new Error('No results found for this address');
    }

    if (data.status !== 'OK') {
      throw new Error(data.error_message || 'Geocoding failed');
    }

    const result = data.results[0];
    return {
      formattedAddress: result.formatted_address,
      coordinates: {
        lat: result.geometry.location.lat,
        lng: result.geometry.location.lng,
      },
    };
  };

  const handleSearch = async () => {
    if (!locationInput.trim()) {
      setError('Please enter a location');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    setGeocodedResult(null);

    try {
      const result = await geocodeAddress(locationInput);
      setGeocodedResult(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    if (!geocodedResult) {
      setError('Please search for a location first');
      return;
    }

    updateLocation(geocodedResult.formattedAddress, geocodedResult.coordinates);
    setSuccess('Location saved successfully!');
    setGeocodedResult(null);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Profile
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonIcon color="primary" />
          Personal Information
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <TextField
            fullWidth
            label="Full Name"
            placeholder="Enter your full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
          <Button
            variant="contained"
            onClick={handleSaveProfile}
            startIcon={<SaveIcon />}
            sx={{ minWidth: 120 }}
          >
            Save
          </Button>
        </Box>
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LockIcon color="primary" />
          Change Password
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            type="password"
            label="Current Password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
          <TextField
            type="password"
            label="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <TextField
            type="password"
            label="Confirm New Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <Button
            variant="contained"
            onClick={handleChangePassword}
            startIcon={<LockIcon />}
            sx={{ alignSelf: 'flex-start' }}
          >
            Change Password
          </Button>
        </Box>
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LocationOnIcon color="primary" />
          Set Your Location
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Enter an address or place name to set your location
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <TextField
            fullWidth
            label="Enter location"
            placeholder="e.g., 1600 Pennsylvania Ave, Washington DC"
            value={locationInput}
            onChange={(e) => setLocationInput(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={loading}
          />
          <Button
            variant="contained"
            onClick={handleSearch}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <SearchIcon />}
            sx={{ minWidth: 120 }}
          >
            Search
          </Button>
        </Box>

        {geocodedResult && (
          <Card variant="outlined" sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                Found Location:
              </Typography>
              <Typography variant="body1" gutterBottom>
                {geocodedResult.formattedAddress}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Coordinates: {geocodedResult.coordinates.lat.toFixed(6)},{' '}
                {geocodedResult.coordinates.lng.toFixed(6)}
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Button
                  variant="contained"
                  color="success"
                  onClick={handleSave}
                  startIcon={<SaveIcon />}
                >
                  Save This Location
                </Button>
              </Box>
            </CardContent>
          </Card>
        )}
      </Paper>

      {user?.location && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LocationOnIcon color="primary" />
            Current Saved Location
          </Typography>
          <Typography variant="body1">{user.location}</Typography>
          {user.coordinates && (
            <Typography variant="caption" color="text.secondary">
              Coordinates: {user.coordinates.lat.toFixed(6)},{' '}
              {user.coordinates.lng.toFixed(6)}
            </Typography>
          )}
        </Paper>
      )}
    </Box>
  );
}

export default Profile;
