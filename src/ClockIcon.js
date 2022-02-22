import React from 'react';
import { getMinutes, getHours } from 'date-fns';

function Clock({ date }) {
  const minutes = getMinutes(date);
  const hours = getHours(date);
  const center = {
    x: 15,
    y: 15,
  };
  const lengths = {
    hour: 9,
    minutes: 12,
  };
  const floatingHour = (hours % 12) + minutes / 60;
  const angle = {
    hour: (2.0 * Math.PI * floatingHour) / 12.0,
    minute: 2.0 * Math.PI * floatingHour,
  };

  return (
    <svg
      viewBox="0 0 30 30"
      width="24"
      height="24"
      style={{
        border: '2px solid currentColor',
        borderRadius: '50%',
        opacity: '0.7',
      }}
    >
      <g id="hands">
        <line
          style={{ stroke: 'currentColor', strokeWidth: 2 }}
          x1={center.x}
          y1={center.y}
          x2={center.x + lengths.hour * Math.sin(angle.hour)}
          y2={center.y - lengths.hour * Math.cos(angle.hour)}
        />
        <line
          style={{ stroke: 'currentColor', strokeWidth: 2 }}
          x1={center.x}
          y1={center.y}
          x2={center.x + lengths.minutes * Math.sin(angle.minute)}
          y2={center.y - lengths.minutes * Math.cos(angle.minute)}
        />
      </g>
    </svg>
  );
}

export default Clock;
