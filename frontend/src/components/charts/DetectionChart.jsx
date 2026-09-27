import React, { useMemo } from 'react';

// Pure-SVG district bar chart — no extra dependencies.
export default function DetectionChart({ detections = [] }) {
  const bars = useMemo(() => {
    const counts = {};
    detections.forEach((d) => {
      const k = d.district || 'Unknown';
      counts[k] = (counts[k] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
  }, [detections]);

  const max = Math.max(1, ...bars.map(([, v]) => v));
  const W = 560, H = 220, padL = 110, padB = 24, padT = 8;
  const rowH = (H - padT - padB) / Math.max(bars.length, 1);

  if (!bars.length) {
    return <div className="text-xs text-slate-500">No detections yet — live ANPR feed will populate this chart.</div>;
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      {bars.map(([name, v], i) => {
        const y = padT + i * rowH;
        const bw = ((W - padL - 16) * v) / max;
        return (
          <g key={name}>
            <text x={0} y={y + rowH / 2 + 4} fontSize="11" fill="#0C3B32" opacity="0.65" fontFamily="JetBrains Mono, monospace">
              {String(name).slice(0, 14)}
            </text>
            <rect x={padL} y={y + 4} width={bw} height={rowH - 10} rx={4} fill="url(#sentinelBar)" />
            <text x={padL + bw + 6} y={y + rowH / 2 + 4} fontSize="11" fill="#14201C" fontWeight="700">
              {v}
            </text>
          </g>
        );
      })}
      <defs>
        <linearGradient id="sentinelBar" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#0C3B32" />
          <stop offset="100%" stopColor="#FF6B2C" />
        </linearGradient>
      </defs>
    </svg>
  );
}
