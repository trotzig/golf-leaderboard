import Link from 'next/link';
import { useRouter } from 'next/router';
import React from 'react';

/**
 * Parse a position string into a numeric value.
 * Returns null if the player did not finish (CUT, MC, WD, DQ, etc.)
 */
function parsePosition(pos) {
  if (!pos) return null;
  const cleaned = pos.replace(/^T/, '').trim();
  const num = parseInt(cleaned, 10);
  return isNaN(num) ? null : num;
}

function isMadeCut(pos) {
  if (!pos) return false;
  const upper = pos.toUpperCase();
  if (upper === 'CUT' || upper === 'MC' || upper === 'WD' || upper === 'DQ') {
    return false;
  }
  // Any numeric position means they made the cut
  return parsePosition(pos) !== null;
}

function formatScore(v) {
  if (v === 0) return 'E';
  if (v > 0) return `+${v}`;
  return `${v}`;
}

/**
 * Compute per-year stats from all competitionScores.
 * Only includes finished competitions (those with a numeric-parseable position or explicit CUT).
 * Scores are stored as integers multiplied by 10000, so divide before use.
 */
export function computeYearlyStats(competitionScores) {
  const byYear = {};

  for (const item of competitionScores) {
    const year = new Date(item.competition.start).getFullYear();
    if (!byYear[year]) {
      byYear[year] = { scores: [], positions: [], cutsMade: 0, total: 0 };
    }
    const entry = byYear[year];
    const pos = parsePosition(item.position);
    const madeIt = isMadeCut(item.position);

    // Only count if there's actual result data (position is set, not just empty)
    if (item.position && item.position !== '-') {
      entry.total++;
      entry.scores.push(item.score / 10000);
      if (madeIt) {
        entry.cutsMade++;
        entry.positions.push(pos);
      }
    }
  }

  return Object.entries(byYear)
    .map(([year, data]) => ({
      year: parseInt(year, 10),
      avgScore: data.scores.length
        ? data.scores.reduce((a, b) => a + b, 0) / data.scores.length
        : null,
      cutPct: data.total > 0 ? (data.cutsMade / data.total) * 100 : null,
      bestScore: data.scores.length ? Math.min(...data.scores) : null,
      bestPosition:
        data.positions.length ? Math.min(...data.positions) : null,
    }))
    .sort((a, b) => a.year - b.year);
}

const METRICS = [
  { key: 'avgScore', label: 'Avg score', lower: true, format: v => formatScore(Math.round(v)) },
  { key: 'cutPct', label: 'Cuts made %', lower: false, format: v => `${Math.round(v)}%` },
  { key: 'bestScore', label: 'Best score', lower: true, format: v => formatScore(v) },
  { key: 'bestPosition', label: 'Best position', lower: true, format: v => `#${v}` },
];

function LineChart({ data, metricKey, lower, formatValue }) {
  const values = data.map(d => d[metricKey]).filter(v => v !== null);
  if (values.length === 0) return <p className="stats-no-data">No data available</p>;

  const width = 480;
  const height = 200;
  const padLeft = 44;
  const padRight = 16;
  const padTop = 28; // extra room for top value label
  const padBottom = 36;
  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  const validData = data.filter(d => d[metricKey] !== null);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  // For a single data point, create a range of 2 centred on the value
  const range = maxVal - minVal || 2;
  const displayMin = maxVal - minVal ? minVal : minVal - 1;
  const displayMax = maxVal - minVal ? maxVal : maxVal + 1;

  // y: lower value = better visually if lower=true (put good at top)
  function toY(v) {
    if (lower) {
      return padTop + ((v - displayMin) / range) * chartH;
    } else {
      return padTop + ((displayMax - v) / range) * chartH;
    }
  }

  function toX(i) {
    if (validData.length === 1) return padLeft + chartW / 2;
    const innerPad = 20;
    return padLeft + innerPad + (i / (validData.length - 1)) * (chartW - innerPad * 2);
  }

  const points = validData.map((d, i) => [toX(i), toY(d[metricKey])]);
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]},${p[1]}`).join(' ');

  // Y-axis: up to 4 ticks, skipping duplicates after formatting
  const ticks = 4;
  const seenLabels = new Set();
  const yTicks = Array.from({ length: ticks + 1 }, (_, i) => {
    const v = displayMin + (range * i) / ticks;
    const y = toY(v);
    const label = formatValue(v);
    if (seenLabels.has(label)) return null;
    seenLabels.add(label);
    return { v, y, label };
  }).filter(Boolean);

  const primaryColor = 'var(--primary)';

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="stats-chart-svg"
      aria-label={`Chart showing ${METRICS.find(m => m.key === metricKey)?.label}`}
    >
      {/* Grid lines */}
      {yTicks.map(({ y }, i) => (
        <line
          key={i}
          x1={padLeft}
          y1={y}
          x2={width - padRight}
          y2={y}
          stroke="rgba(128,128,128,0.15)"
          strokeWidth="1"
        />
      ))}

      {/* Y-axis labels */}
      {yTicks.map(({ label, y }, i) => (
        <text
          key={i}
          x={padLeft - 6}
          y={y + 4}
          textAnchor="end"
          fontSize="10"
          fill="currentColor"
          opacity="0.6"
        >
          {label}
        </text>
      ))}

      {/* X-axis labels (years) */}
      {validData.map((d, i) => (
        <text
          key={d.year}
          x={toX(i)}
          y={height - padBottom + 16}
          textAnchor="middle"
          fontSize="11"
          fill="currentColor"
          opacity="0.7"
        >
          {d.year}
        </text>
      ))}

      {/* Area fill */}
      {points.length > 1 && (
        <path
          d={`${pathD} L${points[points.length - 1][0]},${padTop + chartH} L${points[0][0]},${padTop + chartH} Z`}
          fill={primaryColor}
          opacity="0.1"
        />
      )}

      {/* Line */}
      {points.length > 1 && (
        <path
          d={pathD}
          fill="none"
          stroke={primaryColor}
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      )}

      {/* Data points + value labels */}
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p[0]} cy={p[1]} r="4" fill={primaryColor} />
          <text
            x={p[0]}
            y={Math.max(padTop - 4, p[1] - 9)}
            textAnchor="middle"
            fontSize="10"
            fill={primaryColor}
            fontWeight="600"
          >
            {formatValue(validData[i][metricKey])}
          </text>
        </g>
      ))}
    </svg>
  );
}

export default function PlayerStatsChart({ competitionScores }) {
  const router = useRouter();
  const statParam = router.query.stat;
  const activeMetric =
    METRICS.find(m => m.key === statParam)?.key ?? METRICS[0].key;
  const yearlyStats = computeYearlyStats(competitionScores);

  if (yearlyStats.length === 0) return null;

  const metric = METRICS.find(m => m.key === activeMetric);

  return (
    <div className="player-stats">
      <h2>Stats</h2>
      <div className="page-margin">
        <ul className="tabs stats-tabs">
          {METRICS.map(m => (
            <li key={m.key} className={activeMetric === m.key ? 'tab-selected' : ''}>
              <Link href={{ query: { ...router.query, stat: m.key } }} scroll={false} shallow>{m.label}</Link>
            </li>
          ))}
        </ul>
        <div className="stats-chart-container">
          <LineChart
            data={yearlyStats}
            metricKey={activeMetric}
            lower={metric.lower}
            formatValue={metric.format}
          />
        </div>
      </div>
    </div>
  );
}
