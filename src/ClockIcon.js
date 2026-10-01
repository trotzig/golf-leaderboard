import React from 'react';
import { getMinutes, getHours } from 'date-fns';

function Clock({ date }) {
  const minutes = getMinutes(date);
  const hours = getHours(date);
  const center = 12;
  const lengths = {
    hour: 4,
    minute: 6,
  };
  const floatingHour = (hours % 12) + minutes / 60;
  const angle = {
    hour: (2.0 * Math.PI * floatingHour) / 12.0,
    minute: 2.0 * Math.PI * floatingHour,
  };

  return (
    <svg
      className="icon clock-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      role="img"
      aria-label={`Tee time ${hours}:${String(minutes).padStart(2, '0')}`}
    >
      <circle className="icon-tone" cx={center} cy={center} r="9.5" />
      <line
        x1={center}
        y1={center}
        x2={center + lengths.hour * Math.sin(angle.hour)}
        y2={center - lengths.hour * Math.cos(angle.hour)}
      />
      <line
        x1={center}
        y1={center}
        x2={center + lengths.minute * Math.sin(angle.minute)}
        y2={center - lengths.minute * Math.cos(angle.minute)}
      />
    </svg>
  );
}

export default Clock;
