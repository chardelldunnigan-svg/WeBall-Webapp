// Phones (iOS/Android): Apple Maps / Google Maps via react-native-maps.
// The browser version lives in pin-map.web.tsx — Expo picks the right file per platform.
import React from 'react';
import MapView, { Marker } from 'react-native-maps';
import type { PinMapProps } from './pin-map.types';

export type { MapPin, PinMapProps } from './pin-map.types';

export function PinMap({
  center,
  delta = 0.12,
  pins,
  showsUserLocation,
  interactive = true,
  style,
}: PinMapProps) {
  return (
    <MapView
      style={style}
      initialRegion={{
        latitude: center.latitude,
        longitude: center.longitude,
        latitudeDelta: delta,
        longitudeDelta: delta,
      }}
      scrollEnabled={interactive}
      zoomEnabled={interactive}
      showsUserLocation={showsUserLocation}>
      {pins.map((p) => (
        <Marker
          key={p.id}
          coordinate={{ latitude: p.lat, longitude: p.lng }}
          title={p.title}
          description={p.description}
          pinColor={p.color}
          onCalloutPress={p.onPress}
        />
      ))}
    </MapView>
  );
}
