export const Colors = {
  primary: '#E8590C', // court orange
  primaryDark: '#C2410C',
  ink: '#1A1A1A',
  inkSecondary: '#5C6066',
  background: '#FFFFFF',
  surface: '#F4F4F6',
  border: '#E3E4E8',
  success: '#2F9E44',
  danger: '#E03131',
  waitlist: '#E8940C',
  white: '#FFFFFF',
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 20,
  pill: 999,
} as const;

/** Default map region: downtown Cleveland (Public Square). */
export const DEFAULT_REGION = {
  latitude: 41.4993,
  longitude: -81.6944,
  latitudeDelta: 0.12,
  longitudeDelta: 0.12,
};
