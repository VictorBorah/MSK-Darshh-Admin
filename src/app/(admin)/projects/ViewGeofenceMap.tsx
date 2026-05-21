'use client';

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

interface ViewGeofenceMapProps {
  geofenceJson: string;
  onClose: () => void;
  projectName: string;
}

export default function ViewGeofenceMap({ geofenceJson, onClose, projectName }: ViewGeofenceMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);

  useEffect(() => {
    // Fix default icon issue with Next.js/Webpack
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });

    if (mapRef.current && !mapInstance.current) {
      // Default viewpoint in case geofence is empty
      const map = L.map(mapRef.current, { maxZoom: 22 }).setView([26.7271, 93.1353], 14);
      mapInstance.current = map;

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

      // Render the Geofence Polygon
      if (geofenceJson) {
        try {
          const parsed = JSON.parse(geofenceJson);
          const geoJsonLayer = L.geoJSON(parsed, {
            style: {
              color: '#3b82f6', // beautiful blue border
              fillColor: '#3b82f6',
              fillOpacity: 0.25,
              weight: 3
            }
          }).addTo(map);

          const bounds = geoJsonLayer.getBounds();
          if (bounds.isValid()) {
            map.fitBounds(bounds, { padding: [30, 30] });
          }
        } catch (e) {
          console.error("Failed to parse geofence JSON inside viewer", e);
        }
      }
    }

    return () => {
      // Allow map clean state
    };
  }, [geofenceJson]);

  return (
    <div className="bg-[#1c2130] border border-gray-700/50 rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.6)] p-6 flex flex-col items-center justify-center w-[900px] max-w-[95vw] z-[120] relative">
      <style dangerouslySetInnerHTML={{ __html: `
        /* Injected Leaflet CDN Styles */
        @import url('https://unpkg.com/leaflet@1.9.4/dist/leaflet.css');

        /* Premium custom styling for Leaflet controls */
        .leaflet-container {
          font-family: inherit;
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
        <div className="flex flex-col">
          <h3 className="text-[17px] font-semibold text-white">Geofence Boundary</h3>
          <span className="text-[12px] text-gray-400 mt-0.5">{projectName} View-Only Mode</span>
        </div>
        <button 
          onClick={onClose}
          className="px-4 py-1.5 bg-gray-700 hover:bg-gray-600 text-white font-medium text-[13px] rounded transition-colors"
        >
          Close Map
        </button>
      </div>

      <div className="w-full h-[500px] rounded-md overflow-hidden bg-gray-800 border border-gray-700 mb-6 relative z-10" style={{ isolation: 'isolate' }}>
         <div ref={mapRef} className="w-full h-full z-0" style={{ zIndex: 0 }} />
      </div>

      <div className="w-full flex justify-end z-20">
        <button onClick={onClose} className="px-6 py-2 bg-blue-600 hover:bg-blue-500 outline-none border-none text-white font-medium text-sm rounded-md transition-colors shadow-sm">
          Return to Details
        </button>
      </div>
    </div>
  );
}
