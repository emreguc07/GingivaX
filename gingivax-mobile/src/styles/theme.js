// src/styles/theme.js

export const COLORS = {
  background: "#070e0e",      // Deep dark clinical slate/teal
  surface: "#0e1b1b",         // Dark slate card surface
  surfaceLight: "#162d2d",    // Lighter dark slate for buttons/inputs
  glass: "rgba(14, 27, 27, 0.8)", // Translucent dark glass
  glassBorder: "rgba(0, 206, 209, 0.12)", // Subtle neon-cyan glass border
  
  primary: "#00ced1",         // Neon Turquoise
  primaryDark: "#00dedf",     // Brighter neon cyan for text readability
  secondary: "#e6f7f7",       // Swapped from dark teal to soft glowing cyan-white
  accent: "#00ced1",          // Cyan accent
  
  text: "#f0f8f8",            // Primary white-teal text
  textSecondary: "#9cb5b5",   // Muted teal text
  textMuted: "#608080",       // Highly muted text
  
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  info: "#3b82f6",
  
  pending: "#f59e0b",
  approved: "#00ced1",        // Matches clinic branding
  cancelled: "#ef4444",
  timeout: "#a0aec0"
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40
};

export const FONTS = {
  bold: "System",
  medium: "System",
  regular: "System",
  light: "System"
};

export const SHADOWS = {
  sm: {
    shadowColor: "rgba(0, 206, 209, 0.1)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: "rgba(0, 206, 209, 0.2)",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  glass: {
    shadowColor: "rgba(0, 206, 209, 0.12)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  neonGlow: {
    shadowColor: "#00ced1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  }
};
