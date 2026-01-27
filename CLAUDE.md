# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server (port 3000)
npm run build    # Build for production
npm run preview  # Preview production build
```

## Environment Setup

Copy `.env.example` to `.env` and add your Google Maps API key:
```
VITE_GOOGLE_MAPS_API_KEY=your_api_key_here
```

Required Google APIs: Maps JavaScript API, Geocoding API

## Architecture

**SH Underground** is a React + Vite single-page application with Material UI and Google Maps integration.

### Tech Stack
- React 18 with Vite
- Material UI (MUI) v5 for components
- @react-google-maps/api for maps
- React Router v6 for routing
- localStorage for persistence (no backend)

### Application Structure

**Entry Point**: `src/main.jsx` - Sets up MUI theme (dark mode with gold #D4AF37 accents), BrowserRouter, and AuthProvider.

**Routing**: `src/App.jsx` - Defines routes with protected route wrapper:
- `/login`, `/register` - Public auth pages
- `/profile`, `/map` - Protected pages wrapped in Layout

**Auth**: `src/contexts/AuthContext.jsx` - Provides `useAuth()` hook with:
- User state (username, fullName, location, coordinates)
- Methods: register, login, logout, updateLocation, updateProfile, changePassword
- All data persisted to localStorage under `location_app_users` and `location_app_current_user` keys

**Layout**: `src/components/Layout.jsx` - Sidebar navigation + app bar with logout

**Map**: `src/components/LocationMap.jsx` - Google Maps wrapper using MarkerF/InfoWindowF components. Accepts coordinates, username, fullName, and otherUsers array for displaying multiple markers.

### Pages
- **Login/Register**: Auth forms with logo branding
- **Profile**: Edit full name, change password, set location via geocoding
- **MapView**: Displays user's location pin plus randomly generated US users
