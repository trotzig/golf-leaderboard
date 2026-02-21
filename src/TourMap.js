import React, { useEffect, useRef } from 'react';
import { format } from 'date-fns';

// Groups competitions by venue, returning a map of venue → [competition, …]
function groupByVenue(competitions) {
  const groups = {};
  for (const c of competitions) {
    if (!c.venue) continue;
    if (!groups[c.venue]) groups[c.venue] = [];
    groups[c.venue].push(c);
  }
  return groups;
}

export default function TourMap({ competitions, locations, now }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    if (mapRef.current) return;

    const darkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;

    import('leaflet').then(({ default: L }) => {
      const tileUrl = darkMode
        ? 'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png';
      const labelUrl = darkMode
        ? 'https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png';

      const map = L.map(containerRef.current, {
        scrollWheelZoom: false,
        zoomControl: true,
      });

      L.tileLayer(tileUrl, {
        attribution:
          '© <a href="https://carto.com/">CARTO</a> © <a href="https://www.openstreetmap.org/copyright">OSM</a>',
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map);

      // Labels on top so markers sit beneath text
      L.tileLayer(labelUrl, {
        subdomains: 'abcd',
        maxZoom: 19,
        pane: 'shadowPane',
      }).addTo(map);

      const groups = groupByVenue(competitions);
      const markerLatLngs = [];

      for (const [venue, comps] of Object.entries(groups)) {
        const loc = locations[venue];
        if (!loc) continue;
        markerLatLngs.push([loc.lat, loc.lng]);

        const isPast = comps.every(c => new Date(c.end) < now);
        const isCurrent = comps.some(
          c => new Date(c.start) <= now && new Date(c.end) >= now,
        );

        const markerClass = isCurrent
          ? 'tour-map-pin tour-map-pin--current'
          : isPast
          ? 'tour-map-pin tour-map-pin--past'
          : 'tour-map-pin';

        const icon = L.divIcon({
          className: '',
          html: `<div class="${markerClass}"></div>`,
          iconSize: [12, 12],
          iconAnchor: [6, 6],
        });

        const popupLines = comps.map(c => {
          const dateRange = `${format(new Date(c.start), 'MMM d')} – ${format(
            new Date(c.end),
            'MMM d',
          )}`;
          const finished = new Date(c.end) < now;
          return `<a href="/t/${c.slug}${finished ? '?finished=1' : ''}">${
            c.name
          }</a><br><span class="tour-map-date">${dateRange}</span>`;
        });

        L.marker([loc.lat, loc.lng], { icon })
          .addTo(map)
          .bindPopup(
            `<div class="tour-map-popup"><strong>${venue}</strong>${popupLines.join(
              '<hr>',
            )}</div>`,
            { maxWidth: 260 },
          );
      }

      if (markerLatLngs.length > 0) {
        map.fitBounds(markerLatLngs, {
          paddingTopLeft: [40, 40],
          paddingBottomRight: [40, 120],
          maxZoom: 5,
        });
      } else {
        map.setView([57, 14], 4);
      }

      mapRef.current = map;
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  return (
    <>
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        crossOrigin=""
      />
      <div ref={containerRef} className="tour-map" />
    </>
  );
}
