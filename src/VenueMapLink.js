import React from 'react';
import Icon from './Icon';
import locations from './locations.json';

export default function VenueMapLink({ venue }) {
  if (!venue) return null;
  const loc = locations[venue];
  if (!loc) return <span>{venue}</span>;
  return (
    <a
      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        venue,
      )}&center=${loc.lat},${loc.lng}`}
      target="_blank"
      rel="noopener noreferrer"
      className="venue-map-link"
    >
      <Icon name="pin" />
      {venue}
      <span className="visually-hidden"> (opens in Google Maps)</span>
    </a>
  );
}
