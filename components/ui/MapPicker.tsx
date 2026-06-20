'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

type Props = {
  lat: number | null;
  lng: number | null;
  onChange: (lat: number, lng: number, address?: string) => void;
  height?: number;
  readOnly?: boolean;
};

export function MapPicker({ lat, lng, onChange, height = 300, readOnly = false }: Props) {
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const getIcon = (L: any) => L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
  });

  const updateMarker = useCallback((L: any, map: any, lat: number, lng: number) => {
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    } else {
      markerRef.current = L.marker([lat, lng], { icon: getIcon(L) }).addTo(map);
    }
    map.setView([lat, lng], 15);
  }, []);

  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
        { headers: { 'Accept-Language': 'id' } }
      );
      const data = await res.json();
      onChange(lat, lng, data.display_name ?? '');
    } catch {
      onChange(lat, lng);
    }
  }, [onChange]);

  useEffect(() => {
    if (typeof window === 'undefined' || mapRef.current) return;

    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    import('leaflet').then((L) => {
      if (!containerRef.current || mapRef.current) return;

      const defaultLat = lat ?? -6.2088;
      const defaultLng = lng ?? 106.8456;

      const map = L.default.map(containerRef.current).setView([defaultLat, defaultLng], lat ? 15 : 11);
      L.default.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(map);

      if (lat && lng) updateMarker(L.default, map, lat, lng);

      if (!readOnly) {
        map.on('click', (e: any) => {
          updateMarker(L.default, map, e.latlng.lat, e.latlng.lng);
          reverseGeocode(e.latlng.lat, e.latlng.lng);
        });
      }

      mapRef.current = map;
    });

    return () => {
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; markerRef.current = null; }
    };
  }, []);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    setSearchResults([]);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=5`,
        { headers: { 'Accept-Language': 'id' } }
      );
      const data = await res.json();
      setSearchResults(data);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const selectResult = (result: any) => {
    const rlat = parseFloat(result.lat);
    const rlng = parseFloat(result.lon);
    setSearchResults([]);
    setSearchQuery('');
    import('leaflet').then((L) => {
      if (!mapRef.current) return;
      updateMarker(L.default, mapRef.current, rlat, rlng);
      onChange(rlat, rlng, result.display_name);
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>
        Lokasi{!readOnly && <span style={{ fontWeight: '400', color: 'var(--text-secondary)', marginLeft: '6px' }}>— cari atau klik peta</span>}
      </label>

      {/* Search */}
      {!readOnly && (
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Cari lokasi... (tekan Enter)"
              style={{
                flex: 1, padding: '10px 12px',
                border: '1px solid var(--border)', borderRadius: '8px',
                fontSize: '14px', color: 'var(--text-primary)',
                backgroundColor: 'var(--surface)', outline: 'none',
                boxSizing: 'border-box' as const,
              }}
            />
            <button
              type="button"
              onClick={handleSearch}
              disabled={searching}
              style={{
                padding: '10px 16px', backgroundColor: 'var(--primary)',
                color: '#fff', border: 'none', borderRadius: '8px',
                fontSize: '13px', fontWeight: '600', cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {searching ? '...' : 'Cari'}
            </button>
          </div>

          {/* Search results dropdown */}
          {searchResults.length > 0 && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0,
              backgroundColor: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: '8px', zIndex: 1000, marginTop: '4px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.1)', overflow: 'hidden',
            }}>
              {searchResults.map((result, i) => (
                <div
                  key={i}
                  onClick={() => selectResult(result)}
                  style={{
                    padding: '10px 14px', cursor: 'pointer', fontSize: '13px',
                    color: 'var(--text-primary)',
                    borderBottom: i < searchResults.length - 1 ? '1px solid var(--border)' : 'none',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F8FAFC')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  {result.display_name}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Map */}
      <div
        ref={containerRef}
        style={{
          height: `${height}px`, width: '100%',
          borderRadius: '8px', border: '1px solid var(--border)',
          overflow: 'hidden', zIndex: 0,
        }}
      />

      {lat && lng && (
        <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0 }}>
          📍 {lat.toFixed(6)}, {lng.toFixed(6)}
        </p>
      )}
    </div>
  );
}