import { useState, useEffect } from 'react';
import { Box, Typography, Paper, Alert, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import EditLocationIcon from '@mui/icons-material/EditLocation';
import LocationMap from '../components/LocationMap';
import { useAuth } from '../contexts/AuthContext';

const randomNames = [
  'Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Quinn', 'Avery',
  'Skyler', 'Dakota', 'Reese', 'Finley', 'Sage', 'River', 'Phoenix', 'Blake'
];

const excludedUsers = ['Reese33', 'River89'];

// US city coordinates to ensure pins are on land
const usCities = [
  { lat: 40.7128, lng: -74.0060, name: 'New York, NY' },
  { lat: 34.0522, lng: -118.2437, name: 'Los Angeles, CA' },
  { lat: 41.8781, lng: -87.6298, name: 'Chicago, IL' },
  { lat: 29.7604, lng: -95.3698, name: 'Houston, TX' },
  { lat: 33.4484, lng: -112.0740, name: 'Phoenix, AZ' },
  { lat: 39.9526, lng: -75.1652, name: 'Philadelphia, PA' },
  { lat: 29.4241, lng: -98.4936, name: 'San Antonio, TX' },
  { lat: 32.7767, lng: -96.7970, name: 'Dallas, TX' },
  { lat: 37.3382, lng: -121.8863, name: 'San Jose, CA' },
  { lat: 30.2672, lng: -97.7431, name: 'Austin, TX' },
  { lat: 39.7392, lng: -104.9903, name: 'Denver, CO' },
  { lat: 47.6062, lng: -122.3321, name: 'Seattle, WA' },
  { lat: 38.9072, lng: -77.0369, name: 'Washington, DC' },
  { lat: 42.3601, lng: -71.0589, name: 'Boston, MA' },
  { lat: 36.1627, lng: -86.7816, name: 'Nashville, TN' },
  { lat: 35.2271, lng: -80.8431, name: 'Charlotte, NC' },
  { lat: 45.5152, lng: -122.6784, name: 'Portland, OR' },
  { lat: 36.1699, lng: -115.1398, name: 'Las Vegas, NV' },
  { lat: 25.7617, lng: -80.1918, name: 'Miami, FL' },
  { lat: 33.7490, lng: -84.3880, name: 'Atlanta, GA' },
  { lat: 44.9778, lng: -93.2650, name: 'Minneapolis, MN' },
  { lat: 32.7157, lng: -117.1611, name: 'San Diego, CA' },
  { lat: 27.9506, lng: -82.4572, name: 'Tampa, FL' },
  { lat: 38.2527, lng: -85.7585, name: 'Louisville, KY' },
  { lat: 43.0389, lng: -87.9065, name: 'Milwaukee, WI' },
];

const generateRandomPeople = (count = 15) => {
  const shuffled = [...usCities].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map((city, i) => ({
    id: `random-${i}`,
    username: randomNames[Math.floor(Math.random() * randomNames.length)] + Math.floor(Math.random() * 100),
    coordinates: {
      lat: city.lat + (Math.random() - 0.5) * 0.1,
      lng: city.lng + (Math.random() - 0.5) * 0.1,
    },
    location: city.name,
  })).filter(person => !excludedUsers.includes(person.username));
};

function MapView() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [randomPeople, setRandomPeople] = useState([]);

  const hasLocation = user?.location && user?.coordinates;

  useEffect(() => {
    setRandomPeople(generateRandomPeople(15));
  }, []);

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
              onClick={() => navigate('/profile')}
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
              otherUsers={randomPeople}
            />
          </Paper>

          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Button
              variant="outlined"
              onClick={() => navigate('/profile')}
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
