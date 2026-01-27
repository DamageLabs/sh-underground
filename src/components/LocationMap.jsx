import { useState, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, MarkerF, InfoWindowF } from '@react-google-maps/api';
import { Box, CircularProgress, Typography, Alert } from '@mui/material';

const containerStyle = {
  width: '100%',
  height: '550px',
};

const defaultCenter = {
  lat: 39.8283,
  lng: -98.5795,
};

function LocationMap({ coordinates, locationName, username, fullName, otherUsers = [], onMapClick }) {
  const [infoWindowOpen, setInfoWindowOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
  });

  const center = defaultCenter;

  const handleMarkerClick = useCallback(() => {
    setInfoWindowOpen(true);
  }, []);

  const handleInfoWindowClose = useCallback(() => {
    setInfoWindowOpen(false);
  }, []);

  const handleMapClick = useCallback(
    (event) => {
      if (onMapClick) {
        onMapClick({
          lat: event.latLng.lat(),
          lng: event.latLng.lng(),
        });
      }
    },
    [onMapClick]
  );

  if (loadError) {
    return (
      <Alert severity="error">
        Error loading Google Maps. Please check your API key configuration.
      </Alert>
    );
  }

  if (!isLoaded) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: 550,
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={4}
      onClick={handleMapClick}
    >
      {coordinates && (
        <MarkerF
          position={coordinates}
          onClick={handleMarkerClick}
          label={username ? { text: username, color: '#000', fontWeight: 'bold', fontSize: '14px' } : undefined}
          icon={{
            url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
            scaledSize: new window.google.maps.Size(50, 50),
            labelOrigin: new window.google.maps.Point(25, 60),
          }}
        >
          {infoWindowOpen && (
            <InfoWindowF onCloseClick={handleInfoWindowClose}>
              <Box sx={{ p: 1 }}>
                {fullName && (
                  <Typography variant="subtitle1" fontWeight="bold">
                    {fullName}
                  </Typography>
                )}
                {username && (
                  <Typography variant="body2" color={fullName ? 'text.secondary' : 'text.primary'} fontWeight={fullName ? 'normal' : 'bold'}>
                    {username}
                  </Typography>
                )}
                <Typography variant="body2">
                  {locationName || 'Selected location'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
                </Typography>
              </Box>
            </InfoWindowF>
          )}
        </MarkerF>
      )}

      {otherUsers.map((person) => (
        <MarkerF
          key={person.id}
          position={person.coordinates}
          onClick={() => setSelectedUser(person)}
          label={{ text: person.username, color: '#000', fontWeight: 'bold', fontSize: '12px' }}
          icon={{
            url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
            scaledSize: new window.google.maps.Size(40, 40),
            labelOrigin: new window.google.maps.Point(20, 50),
          }}
        >
          {selectedUser?.id === person.id && (
            <InfoWindowF onCloseClick={() => setSelectedUser(null)}>
              <Box sx={{ p: 1 }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  {person.username}
                </Typography>
                <Typography variant="body2">
                  {person.location}
                </Typography>
              </Box>
            </InfoWindowF>
          )}
        </MarkerF>
      ))}
    </GoogleMap>
  );
}

export default LocationMap;
