import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import { DEFAULT_REGION } from '@/constants/theme';

export interface Coords {
  latitude: number;
  longitude: number;
  /** true once we have the device's real position (vs. the Cleveland default) */
  precise: boolean;
}

/** Device location with a downtown-Cleveland fallback so the app works in simulators. */
export function useLocation(): Coords {
  const [coords, setCoords] = useState<Coords>({
    latitude: DEFAULT_REGION.latitude,
    longitude: DEFAULT_REGION.longitude,
    precise: false,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (!cancelled) {
          setCoords({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            precise: true,
          });
        }
      } catch {
        // keep the fallback
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return coords;
}
