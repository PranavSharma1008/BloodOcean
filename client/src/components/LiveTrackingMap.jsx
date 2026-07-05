import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useLanguage } from '../context/LanguageContext';
import 'leaflet/dist/leaflet.css';

// NEW COMPONENT: LiveTrackingMap
// Displays real-time donor location on an interactive map

const markerHtml = (color, label) => `<div style="
  width: 40px; height: 40px; border-radius: 50%;
  background: ${color}; border: 3px solid white;
  box-shadow: 0 4px 12px rgba(0,0,0,0.4);
  display: flex; align-items: center; justify-content: center;
  color: white; font-weight: bold; font-size: 14px;
  transition: all 0.3s ease;
">${label}</div>`;

const donorIcon = L.divIcon({
  className: 'donor-marker',
  html: markerHtml('#dc2626', 'D'),
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

const requesterIcon = L.divIcon({
  className: 'requester-marker',
  html: markerHtml('#2563eb', 'R'),
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

const DonorMarker = ({ position }) => {
  const { t } = useLanguage();
  const markerRef = useRef(null);
  const prevPosRef = useRef(null);

  useEffect(() => {
    if (markerRef.current && position) {
      const newLatLng = new L.LatLng(position.lat, position.lng);
      if (prevPosRef.current) {
        const prevLatLng = prevPosRef.current;
        const distance = prevLatLng.distanceTo(newLatLng);
        if (distance > 0.5) {
          markerRef.current.setLatLng(newLatLng);
          prevPosRef.current = newLatLng;
        }
      } else {
        markerRef.current.setLatLng(newLatLng);
        prevPosRef.current = newLatLng;
      }
    }
  }, [position]);

  return (
    <Marker
      ref={markerRef}
      position={position || [0, 0]}
      icon={donorIcon}
    >
      <Popup>
        <div className="text-center">
          <p className="font-bold text-red-700">{t('Donor')}</p>
          <p className="text-xs">{t('Live location')}</p>
          {position && <p className="text-xs text-gray-500">{position.lat.toFixed(5)}, {position.lng.toFixed(5)}</p>}
        </div>
      </Popup>
    </Marker>
  );
};

const RequesterMarker = ({ position }) => {
  const { t } = useLanguage();
  return (
    <Marker position={position || [0, 0]} icon={requesterIcon}>
      <Popup>
        <div className="text-center">
          <p className="font-bold text-blue-700">{t('Requester')}</p>
          <p className="text-xs">{t('Destination')}</p>
          {position && <p className="text-xs text-gray-500">{position[1].toFixed(5)}, {position[0].toFixed(5)}</p>}
        </div>
      </Popup>
    </Marker>
  );
};

const RouteFetcher = ({ from, to, onRouteLoaded }) => {
  const map = useMap();

  useEffect(() => {
    if (!from || !to || from[0] === 0 || to[0] === 0) return;

    const fetchRoute = async () => {
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${from[0]},${from[1]};${to[0]},${to[1]}?overview=full&geometries=geojson`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          const coordinates = route.geometry.coordinates.map(([lng, lat]) => [lat, lng]);

          onRouteLoaded({
            coordinates,
            distance: route.distance,
            duration: route.duration,
          });

          // Fit map to show both markers and route
          const bounds = L.latLngBounds(coordinates);
          map.fitBounds(bounds, { padding: [50, 50] });
        }
      } catch (err) {
        console.error('Failed to fetch route:', err);
      }
    };

    fetchRoute();
  }, [from, to, map, onRouteLoaded]);

  return null;
};

const LiveTrackingMap = ({ requesterLocation, donorLocation, onRouteLoaded, routeCoords }) => {
  const { t } = useLanguage();
  const center = donorLocation
    ? [donorLocation.lat, donorLocation.lng]
    : requesterLocation
      ? [requesterLocation[1], requesterLocation[0]]
      : [20.5937, 78.9629];

  const routeFrom = donorLocation ? [donorLocation.lng, donorLocation.lat] : requesterLocation;
  const routeTo = requesterLocation;

  return (
    <div className="rounded-2xl overflow-hidden border-2 border-gray-100 shadow-lg" style={{ height: '500px' }}>
      <MapContainer
        center={center}
        zoom={13}
        className="h-full w-full"
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {requesterLocation && requesterLocation[0] !== 0 && (
          <RequesterMarker position={[requesterLocation[1], requesterLocation[0]]} />
        )}
        {donorLocation && (
          <DonorMarker position={donorLocation} />
        )}
        {routeFrom && routeTo && (
          <RouteFetcher from={routeFrom} to={routeTo} onRouteLoaded={onRouteLoaded} />
        )}
        {routeCoords && (
          <Polyline positions={routeCoords} color="#ef4444" weight={4} opacity={0.7} />
        )}
      </MapContainer>
    </div>
  );
};

export default LiveTrackingMap;
