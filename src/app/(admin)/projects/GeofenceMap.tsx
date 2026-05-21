'use client';

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
// @ts-ignore
import 'leaflet-draw';

interface GeofenceMapProps {
  initialGeofence: string;
  onSave: (geojson: any) => void;
  onCancel: () => void;
}

export default function GeofenceMap({ initialGeofence, onSave, onCancel }: GeofenceMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const drawnItemsRef = useRef<L.FeatureGroup | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Fix default icon issue with Next.js/Webpack
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });

    if (mapRef.current && !mapInstance.current) {
      const map = L.map(mapRef.current, { maxZoom: 22 }).setView([26.7271, 93.1353], 14); // Default map view
      mapInstance.current = map;

      const performFallbackGeocode = async (address: string, nextFallback?: string) => {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`);
          const data = await res.json();
          if (data && data.length > 0) {
             map.setView([parseFloat(data[0].lat), parseFloat(data[0].lon)], 16);
          } else if (nextFallback) {
             performFallbackGeocode(nextFallback);
          }
        } catch (err) {
          if (nextFallback) performFallbackGeocode(nextFallback);
        }
      };

      const tryFallbackSequence = () => {
        performFallbackGeocode("Darsh Builders, Biswanath Charilai, Assam, India", "Biswanath Charilai, Assam, India");
      };

      if (!initialGeofence) {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              map.setView([position.coords.latitude, position.coords.longitude], 16);
            },
            (error) => {
              console.warn('Geolocation error:', error);
              tryFallbackSequence();
            },
            { timeout: 10000 }
          );
        } else {
          tryFallbackSequence();
        }
      }

      // Premium Google Maps Tile Layers for high-fidelity geofence context
      const googleHybrid = L.tileLayer(
        'https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
        {
          maxZoom: 22,
          maxNativeZoom: 18,
          attribution: 'Map data &copy; Google',
          subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
        }
      ).addTo(map);

      const googleSatellite = L.tileLayer(
        'https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
        {
          maxZoom: 22,
          maxNativeZoom: 18,
          attribution: 'Map data &copy; Google',
          subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
        }
      );

      const googleRoadmap = L.tileLayer(
        'https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
        {
          maxZoom: 22,
          maxNativeZoom: 18,
          attribution: 'Map data &copy; Google',
          subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
        }
      );

      const esriSatellite = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 22, maxNativeZoom: 18, attribution: 'Tiles &copy; Esri' }
      );

      L.control.layers({
        "Google Hybrid (Default)": googleHybrid,
        "Google Satellite": googleSatellite,
        "Google Roadmap": googleRoadmap,
        "Esri Satellite": esriSatellite
      }).addTo(map);

      const drawnItems = new L.FeatureGroup();
      drawnItemsRef.current = drawnItems;
      map.addLayer(drawnItems);

      const drawControl = new L.Control.Draw({
        edit: { featureGroup: drawnItems },
        draw: {
          polygon: { allowIntersection: false, showArea: true },
          polyline: false,
          rectangle: false,
          circle: false,
          marker: false,
          circlemarker: false
        }
      });
      map.addControl(drawControl);

      map.on(L.Draw.Event.CREATED, (e: any) => {
        drawnItems.clearLayers();
        drawnItems.addLayer(e.layer);
      });

      if (initialGeofence) {
        try {
          const parsed = JSON.parse(initialGeofence);
          const geoJsonLayer = L.geoJSON(parsed);
          const bounds = geoJsonLayer.getBounds();
          geoJsonLayer.eachLayer(layer => {
             drawnItems.addLayer(layer);
          });
          map.fitBounds(bounds);
        } catch (e) {
          console.error("Failed to parse initial geofence JSON", e);
        }
      }
    }

    return () => {
      // Allow map to stay mounted mostly unless the component is fully destroyed
    };
  }, [initialGeofence]);

  const handleSearch = async () => {
    if (!searchQuery) return;
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data.length > 0 && mapInstance.current) {
        mapInstance.current.setView([parseFloat(data[0].lat), parseFloat(data[0].lon)], 18);
      } else {
        alert("Location not found");
      }
    } catch (e) {
      console.error("Search failed", e);
      alert("Search failed");
    }
  };

  const handleSave = () => {
    if (!drawnItemsRef.current || drawnItemsRef.current.getLayers().length === 0) {
      alert("Please draw a geofence polygon first.");
      return;
    }
    const geojson = drawnItemsRef.current.toGeoJSON();
    onSave(geojson);
  };

  return (
    <div className="bg-[#1c2130] border border-gray-700/50 rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.6)] p-6 flex flex-col items-center justify-center w-[900px] max-w-[95vw]">
      <style dangerouslySetInnerHTML={{ __html: `
        /* Injected Leaflet Draw and Leaflet CDN Styles */
        @import url('https://unpkg.com/leaflet@1.9.4/dist/leaflet.css');
        @import url('https://cdnjs.cloudflare.com/ajax/libs/leaflet.draw/1.0.4/leaflet.draw.css');

        /* Leaflet Draw toolbar sprite override */
        .leaflet-draw-toolbar a {
          background-image: url('https://cdnjs.cloudflare.com/ajax/libs/leaflet.draw/1.0.4/images/spritesheet.png') !important;
          background-repeat: no-repeat !important;
        }
        .leaflet-retina .leaflet-draw-toolbar a {
          background-image: url('https://cdnjs.cloudflare.com/ajax/libs/leaflet.draw/1.0.4/images/spritesheet-2x.png') !important;
          background-size: 300px 30px !important;
        }
        
        /* Premium custom styling for Leaflet controls and search */
        .leaflet-container {
          font-family: inherit;
        }
        .leaflet-draw-actions {
          margin-left: 2px !important;
        }
        .leaflet-draw-actions a {
          background-color: #374151 !important;
          color: #f3f4f6 !important;
          border-color: #4b5563 !important;
        }
        .leaflet-draw-actions a:hover {
          background-color: #4b5563 !important;
        }
        .leaflet-bar {
          border: 1px solid rgba(156, 163, 175, 0.2) !important;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
        }
        .leaflet-bar a {
          background-color: #1f2937 !important;
          border-bottom: 1px solid rgba(156, 163, 175, 0.1) !important;
          color: #f3f4f6 !important;
        }
        .leaflet-bar a:hover {
          background-color: #374151 !important;
          color: #ffffff !important;
        }
        .leaflet-bar a.leaflet-disabled {
          background-color: #111827 !important;
          color: #4b5563 !important;
        }
      `}} />
      <div className="w-full flex items-center justify-between mb-4">
        <h3 className="text-[17px] font-semibold text-white">Configure Geofence</h3>
        <div className="flex gap-2 w-[400px]">
          <input 
            type="text" 
            placeholder="Search address / landmark"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            className="flex-1 bg-gray-800 border-none text-white text-[13px] rounded px-3 h-9 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-inner"
          />
          <button 
            onClick={handleSearch}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-medium text-[13px] rounded transition-colors"
          >
            Search
          </button>
        </div>
      </div>

      <div className="w-full h-[500px] rounded-md overflow-hidden bg-gray-800 border border-gray-700 mb-6 relative z-10" style={{ isolation: 'isolate' }}>
         <div ref={mapRef} className="w-full h-full z-0" style={{ zIndex: 0 }} />
      </div>

      <div className="w-full flex justify-end gap-3 z-20">
        <button onClick={onCancel} className="px-6 py-2 bg-gray-700 hover:bg-gray-600 outline-none border border-gray-600 text-white font-medium text-sm rounded-md transition-colors shadow-sm">
          Cancel
        </button>
        <button onClick={handleSave} className="px-6 py-2 bg-blue-600 hover:bg-blue-500 outline-none border-none text-white font-medium text-sm rounded-md transition-colors shadow-sm">
          Set Geofence
        </button>
      </div>
    </div>
  );
}
