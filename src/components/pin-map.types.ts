import type { StyleProp, ViewStyle } from 'react-native';

export interface MapPin {
  id: string;
  lat: number;
  lng: number;
  title: string;
  description?: string;
  color?: string;
  /** Called when the user taps the pin's label (native) or popup link (web). */
  onPress?: () => void;
}

export interface PinMapProps {
  center: { latitude: number; longitude: number };
  /** Rough size of the visible area in degrees (same idea as react-native-maps' latitudeDelta). */
  delta?: number;
  pins: MapPin[];
  showsUserLocation?: boolean;
  /** false = a fixed preview map that can't be dragged or zoomed. */
  interactive?: boolean;
  style?: StyleProp<ViewStyle>;
}
