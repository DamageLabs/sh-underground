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

const getPhotoUrl = (photoPath) => {
  if (!photoPath) return null;
  if (photoPath.startsWith('http')) return photoPath;
  return `/api${photoPath}`;
};

function LocationMap({ coordinates, locationName, username, fullName, markerColor = 'red', profilePhoto = null, otherUsers = [], onMapClick }) {
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
            url: `http://maps.google.com/mapfiles/ms/icons/${markerColor}-dot.png`,
            scaledSize: new window.google.maps.Size(50, 50),
            labelOrigin: new window.google.maps.Point(25, 60),
          }}
        >
          {infoWindowOpen && (
            <InfoWindowF onCloseClick={handleInfoWindowClose}>
              <div style={{ padding: '8px', color: '#000', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                {profilePhoto && (
                  <img
                    src={getPhotoUrl(profilePhoto)}
                    alt={username}
                    style={{
                      width: 60,
                      height: 60,
                      borderRadius: '50%',
                      objectFit: 'cover',
                      flexShrink: 0,
                    }}
                  />
                )}
                <div>
                  {fullName && (
                    <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '4px' }}>
                      {fullName}
                    </div>
                  )}
                  {username && (
                    <div style={{ fontSize: '14px', color: fullName ? '#666' : '#000', fontWeight: fullName ? 'normal' : 'bold' }}>
                      @{username}
                    </div>
                  )}
                  <div style={{ fontSize: '14px', marginTop: '4px' }}>
                    {locationName || 'Selected location'}
                  </div>
                  <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>
                    {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
                  </div>
                </div>
              </div>
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
            url: `http://maps.google.com/mapfiles/ms/icons/${person.markerColor || 'blue'}-dot.png`,
            scaledSize: new window.google.maps.Size(40, 40),
            labelOrigin: new window.google.maps.Point(20, 50),
          }}
        >
          {selectedUser?.id === person.id && (
            <InfoWindowF onCloseClick={() => setSelectedUser(null)}>
              <div style={{ padding: '8px', color: '#000', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                {person.profilePhoto && (
                  <img
                    src={getPhotoUrl(person.profilePhoto)}
                    alt={person.username}
                    style={{
                      width: 60,
                      height: 60,
                      borderRadius: '50%',
                      objectFit: 'cover',
                      flexShrink: 0,
                    }}
                  />
                )}
                <div>
                  {person.fullName && (
                    <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '4px' }}>
                      {person.fullName}
                    </div>
                  )}
                  <div style={{ fontSize: '14px', color: person.fullName ? '#666' : '#000', fontWeight: person.fullName ? 'normal' : 'bold' }}>
                    @{person.username}
                  </div>
                  <div style={{ fontSize: '14px', marginTop: '4px' }}>
                    {person.location}
                  </div>
                </div>
              </div>
            </InfoWindowF>
          )}
        </MarkerF>
      ))}
    </GoogleMap>
  );
}

export default LocationMap;
