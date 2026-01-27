# SH Underground

A location-based social network built with React and Google Maps. Users can set their location and see other members on an interactive map of the United States.

![SH Underground Logo](public/logo.png)

## Features

- **User Authentication** - Register and login with username/password
- **Profile Management** - Set full name and change password
- **Location Setting** - Search and geocode addresses via Google Maps API
- **Interactive Map** - View your location and other users on a CONUS map
- **Dark Theme** - Sleek dark UI with gold accents

## Tech Stack

- **Frontend**: React 18, Vite
- **UI**: Material UI (MUI) v5
- **Maps**: @react-google-maps/api
- **Routing**: React Router v6
- **Storage**: localStorage (no backend required)

## Getting Started

### Prerequisites

- Node.js 18+
- Google Maps API key with Maps JavaScript API and Geocoding API enabled

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd underground

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env and add your Google Maps API key
```

### Development

```bash
npm run dev
```

Opens at [http://localhost:3000](http://localhost:3000)

### Production Build

```bash
npm run build
npm run preview
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_GOOGLE_MAPS_API_KEY` | Google Maps API key |

Get your API key from [Google Cloud Console](https://console.cloud.google.com/google/maps-apis).

## Project Structure

```
src/
├── components/
│   ├── Layout.jsx        # App shell with sidebar
│   ├── LocationMap.jsx   # Google Maps wrapper
│   └── ProtectedRoute.jsx
├── contexts/
│   └── AuthContext.jsx   # Authentication state
├── pages/
│   ├── Login.jsx
│   ├── Register.jsx
│   ├── Profile.jsx       # User settings & location
│   └── MapView.jsx       # Main map display
├── App.jsx               # Route definitions
└── main.jsx              # Entry point & theme
```

## Deployment

See [deployment.md](deployment.md) for instructions on deploying to a GCP VM.

## License

MIT
