// Browser version of the map: Leaflet + OpenStreetMap tiles (free, no API key).
// Phones use pin-map.tsx (react-native-maps) instead.
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import React, { useEffect, useRef } from 'react';
import { View } from 'react-native';
import { Colors } from '@/constants/theme';
import type { PinMapProps } from './pin-map.types';

export type { MapPin, PinMapProps } from './pin-map.types';

// Convert a react-native-maps style "delta" (degrees across) into a Leaflet zoom level.
function deltaToZoom(delta: number) {
  return Math.max(3, Math.min(18, Math.round(Math.log2(360 / delta))));
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

export function PinMap({
  center,
  delta = 0.12,
  pins,
  showsUserLocation,
  interactive = true,
  style,
}: PinMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);

  // Create the map once.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      center: [center.latitude, center.longitude],
      zoom: deltaToZoom(delta),
      dragging: interactive,
      scrollWheelZoom: interactive,
      doubleClickZoom: interactive,
      touchZoom: interactive,
      boxZoom: interactive,
      keyboard: interactive,
      zoomControl: interactive,
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);
    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    // The container can change size after first paint (flex layouts); keep tiles filled.
    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-center when the user's location arrives.
  useEffect(() => {
    mapRef.current?.setView([center.latitude, center.longitude], mapRef.current.getZoom());
  }, [center.latitude, center.longitude]);

  // Draw pins (and the "you are here" dot).
  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;
    layer.clearLayers();

    // Draw "you are here" first so court pins sit on top of it.
    if (showsUserLocation) {
      L.circleMarker([center.latitude, center.longitude], {
        radius: 7,
        color: Colors.white,
        weight: 2,
        fillColor: '#1C7ED6',
        fillOpacity: 1,
        interactive: false, // never block a court pin that sits at your location
      }).addTo(layer);
    }

    for (const p of pins) {
      const marker = L.circleMarker([p.lat, p.lng], {
        radius: 9,
        color: Colors.white,
        weight: 2,
        fillColor: p.color ?? Colors.primary,
        fillOpacity: 1,
      });
      const popup = document.createElement('div');
      popup.innerHTML =
        `<strong>${escapeHtml(p.title)}</strong>` +
        (p.description ? `<br/>${escapeHtml(p.description)}` : '');
      if (p.onPress) {
        const link = document.createElement('a');
        link.href = '#';
        link.textContent = 'View details →';
        link.style.display = 'block';
        link.style.marginTop = '6px';
        link.style.color = Colors.primary;
        link.style.fontWeight = '600';
        link.onclick = (e) => {
          e.preventDefault();
          p.onPress?.();
        };
        popup.appendChild(link);
      }
      marker.bindPopup(popup);
      marker.addTo(layer);
    }
  }, [pins, showsUserLocation, center.latitude, center.longitude]);

  return (
    <View style={[{ overflow: 'hidden' }, style]}>
      <div ref={containerRef} style={{ height: '100%', width: '100%', minHeight: 160 }} />
    </View>
  );
}
