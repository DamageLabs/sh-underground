import { createTheme } from '@mui/material/styles';

const BRAND_GOLD = '#D4AF37';

export function getTheme(mode) {
  const isDark = mode === 'dark';

  return createTheme({
    palette: {
      mode,
      primary: isDark
        ? { main: BRAND_GOLD, light: '#E5C76B', dark: '#A68B2A' }
        : { main: '#B8941F', light: BRAND_GOLD, dark: '#8C6F14' },
      secondary: { main: '#C9A227' },
      background: isDark
        ? { default: '#0a0a0a', paper: '#1a1a1a' }
        : { default: '#FAFAFA', paper: '#FFFFFF' },
      text: isDark
        ? { primary: '#ffffff', secondary: '#b0b0b0' }
        : { primary: '#1A1A1A', secondary: '#5A5A5A' },
    },
    components: {
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: isDark ? '#1a1a1a' : '#FFFFFF',
            color: isDark ? '#ffffff' : '#1A1A1A',
            borderBottom: `1px solid ${BRAND_GOLD}`,
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: isDark ? '#121212' : '#F5F5F5',
            borderRight: isDark
              ? '1px solid #2d2d2d'
              : '1px solid rgba(0,0,0,0.12)',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          containedPrimary: ({ theme }) => ({
            '&:hover': { backgroundColor: theme.palette.primary.light },
          }),
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            border: isDark
              ? '1px solid #2d2d2d'
              : '1px solid rgba(0,0,0,0.08)',
          },
        },
      },
    },
  });
}
