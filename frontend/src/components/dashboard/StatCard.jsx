import React from 'react';
import AnimatedCounter from './AnimatedCounter';

// 1% Club style: cream card, big number, pine label, tang/leaf accent bar.
export default function StatCard({ icon, label, value, sub, accent = 'pine', onClick }) {
  const bars = {
    pine: 'bg-club-pine',
    tang: 'bg-club-tang',
    leaf: 'bg-club-leaf',
    gold: 'bg-club-gold',
    red: 'bg-red-500',
  };
  return (
    <button
      onClick={onClick}
      className="club-card text-left p-5 rounded-3xl hover:-translate-y-0.5 hover:shadow-xl transition-all"
    >
      <div className={`h-1.5 w-10 rounded-full mb-3 ${bars[accent] || bars.pine}`} />
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-widest text-club-pine/70">{label}</span>
        <span className="text-xl">{icon}</span>
      </div>
      <div className="mt-1 text-3xl md:text-4xl font-extrabold text-club-ink tracking-tight">
        <AnimatedCounter value={value} />
      </div>
      {sub && <div className="mt-1 text-xs font-medium text-club-ink/60">{sub}</div>}
    </button>
  );
}
