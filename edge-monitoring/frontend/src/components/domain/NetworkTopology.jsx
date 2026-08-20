import clsx from 'clsx';
import { Link } from 'react-router-dom';
import { Cpu, Cloud } from 'lucide-react';

const STATUS_DOT = { ONLINE: 'bg-emerald shadow-[0_0_12px_rgba(16,185,129,0.7)]', OFFLINE: 'bg-muted' };

// Renders only real devices as nodes around a central platform hub, connected
// by lines whose color reflects live status. No synthetic nodes are ever added.
export default function NetworkTopology({ devices }) {
  const radius = 120;
  const center = { x: 200, y: 140 };

  return (
    <div className="relative flex h-72 items-center justify-center overflow-hidden">
      <svg viewBox="0 0 400 280" className="h-full w-full max-w-xl">
        {devices.map((d, i) => {
          const angle = (i / devices.length) * Math.PI * 2 - Math.PI / 2;
          const x = center.x + radius * Math.cos(angle);
          const y = center.y + radius * 0.75 * Math.sin(angle);
          const online = d.status === 'ONLINE';
          return (
            <line
              key={`line-${d._id}`}
              x1={center.x} y1={center.y} x2={x} y2={y}
              stroke={online ? 'url(#lineGradient)' : 'rgba(255,255,255,0.08)'}
              strokeWidth={1.5}
            />
          );
        })}
        <defs>
          <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.1" />
          </linearGradient>
        </defs>

        {/* Platform hub */}
        <circle cx={center.x} cy={center.y} r="22" fill="rgba(139,92,246,0.15)" stroke="#8B5CF6" strokeWidth="1" />

        {devices.map((d, i) => {
          const angle = (i / devices.length) * Math.PI * 2 - Math.PI / 2;
          const x = center.x + radius * Math.cos(angle);
          const y = center.y + radius * 0.75 * Math.sin(angle);
          return (
            <g key={d._id}>
              <circle cx={x} cy={y} r="14" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.15)" />
              <circle cx={x} cy={y - 12} r="3" className={STATUS_DOT[d.status] || 'bg-muted'} fill={d.status === 'ONLINE' ? '#10B981' : '#6B7280'} />
            </g>
          );
        })}
      </svg>

      <div className="absolute inset-x-0 top-1/2 flex -translate-y-1/2 items-center justify-center gap-1 text-[10px] text-violet">
        <Cloud className="h-3 w-3" /> Platform
      </div>

      <div className="absolute bottom-0 left-0 right-0 flex flex-wrap justify-center gap-2 px-2">
        {devices.slice(0, 6).map((d) => (
          <Link
            key={d._id}
            to={`/devices/${d.deviceId}`}
            className={clsx(
              'flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px]',
              d.status === 'ONLINE' ? 'border-emerald/30 bg-emerald/5 text-emerald' : 'border-border text-muted'
            )}
          >
            <Cpu className="h-3 w-3" /> {d.name}
          </Link>
        ))}
      </div>
    </div>
  );
}
