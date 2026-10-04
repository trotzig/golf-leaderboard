import React from 'react';

// Decorative elevation lines, like the green contours in a yardage book.
export default function CourseContours(props) {
  const rings = [
    [150, 112, -8],
    [122, 90, -4],
    [96, 70, 0],
    [72, 52, 4],
    [50, 36, 8],
    [30, 22, 12],
    [13, 10, 16],
  ];
  return (
    <svg
      viewBox="0 0 360 280"
      fill="none"
      stroke="currentColor"
      aria-hidden="true"
      {...props}
    >
      {rings.map(([rx, ry, rotate], i) => (
        <ellipse
          key={rx}
          cx={180 + i * 4}
          cy={140 - i * 2}
          rx={rx}
          ry={ry}
          transform={`rotate(${rotate - 12} 180 140)`}
        />
      ))}
    </svg>
  );
}
