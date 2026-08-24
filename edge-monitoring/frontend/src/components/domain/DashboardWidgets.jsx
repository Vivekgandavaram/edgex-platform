import { useEffect, useState } from 'react';
import { Area, AreaChart, Bar, BarChart, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Grip, LayoutGrid, Maximize2, Trash2, X } from 'lucide-react';
import GlassPanel from '../ui/GlassPanel';
import Button from '../ui/Button';

function seedFrom(value) {
  return [...String(value)].reduce((seed, character) => ((seed * 31) + character.charCodeAt(0)) % 9973, 17);
}

function sampleFor(seed) {
  const numericSeed = seedFrom(seed);
  const baseline = 18 + (numericSeed % 28);
  const wave = 1.5 + (numericSeed % 6) / 2;
  return Array.from({ length: 12 }, (_, index) => ({
    time: `${String(index + 8).padStart(2, '0')}:00`,
    value: Number((baseline + Math.sin((index + numericSeed % 5) / 1.8) * wave + ((numericSeed * (index + 1)) % 17) / 10).toFixed(1)),
  }));
}
const chartTypes = ['Line', 'Area', 'Bar', 'Trend', 'Sparkline'];
const lenses = ['Temperature', 'Humidity', 'Pressure', 'Vibration', 'Throughput'];
const treatments = ['Signal', 'Pulse', 'Range', 'Baseline'];
export const WIDGET_TEMPLATES = Array.from({ length: 100 }, (_, index) => ({
  id: `template-${index + 1}`,
  name: `${lenses[index % lenses.length]} ${chartTypes[index % chartTypes.length]} ${treatments[index % treatments.length]}`,
  chart: chartTypes[index % chartTypes.length],
  lens: lenses[index % lenses.length],
}));

function Chart({ type, seed }) {
  const common = { data: sampleFor(seed), margin: { top: 8, right: 8, left: -24, bottom: 0 } };
  const axis = <><XAxis dataKey="time" hide /><YAxis hide domain={['dataMin - 2', 'dataMax + 2']} /><Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 11 }} /></>;
  if (type === 'Bar') return <ResponsiveContainer width="100%" height="100%"><BarChart {...common}>{axis}<Bar dataKey="value" fill="#22D3EE" radius={[3, 3, 0, 0]} /></BarChart></ResponsiveContainer>;
  if (type === 'Area') return <ResponsiveContainer width="100%" height="100%"><AreaChart {...common}>{axis}<Area type="monotone" dataKey="value" stroke="#10B981" fill="#10B981" fillOpacity={0.2} strokeWidth={2} /></AreaChart></ResponsiveContainer>;
  return <ResponsiveContainer width="100%" height="100%"><LineChart {...common}>{axis}<Line type="monotone" dataKey="value" stroke={type === 'Trend' ? '#F59E0B' : '#3B82F6'} strokeWidth={2} dot={false} /></LineChart></ResponsiveContainer>;
}

function Widget({ widget, onDelete, onResize, onDragStart, onDrop }) {
  const latestValue = sampleFor(widget.id).at(-1).value;
  return <GlassPanel draggable onDragStart={() => onDragStart(widget.id)} onDragOver={(event) => event.preventDefault()} onDrop={() => onDrop(widget.id)} className="relative min-h-[220px] overflow-hidden p-4" style={{ gridColumn: `span ${widget.width || 3}`, gridRow: `span ${widget.height || 3}` }}>
    <div className="flex items-start justify-between gap-3"><div className="flex items-start gap-2"><Grip className="mt-0.5 h-4 w-4 shrink-0 cursor-grab text-muted/60" title="Drag to reorder" /><div><div className="flex items-center gap-2"><span className="text-sm font-semibold text-ink">{widget.title}</span>{widget.simulated && <span className="rounded-full border border-amber/30 bg-amber/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-amber">Simulated</span>}</div><p className="mt-1 text-xs text-muted">{widget.subtitle}</p></div></div><div className="flex items-center gap-3"><select aria-label="Widget size" value={`${widget.width || 4}x${widget.height || 2}`} onChange={(event) => onResize(widget.id, event.target.value)} className="rounded-md border border-border bg-white/[0.04] px-1.5 py-1 text-[10px] text-muted"><option value="2x2">2 x 2</option><option value="3x3">3 x 3</option><option value="4x4">4 x 4</option><option value="2x4">2 x 4</option><option value="3x6">3 x 6</option><option value="4x6">4 x 6</option></select><button type="button" title="Delete widget" aria-label="Delete widget" onClick={() => onDelete(widget.id)} className="text-muted hover:text-crimson"><Trash2 className="h-4 w-4" /></button></div></div>
    <div className="mt-3 h-32"><Chart type={widget.chart} seed={widget.id} /></div>
    <div className="mt-2 flex items-baseline gap-2"><strong className="font-tabular text-xl text-ink">{latestValue}</strong><span className="text-xs text-muted">{widget.unit} · {widget.updated}</span></div>
    <Maximize2 className="pointer-events-none absolute bottom-2 right-2 h-3 w-3 rotate-90 text-muted/50" />
  </GlassPanel>;
}

export default function DashboardWidgets() {
  const [widgets, setWidgets] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('edgex_dashboard_widgets'));
      return saved?.length ? saved.map((widget) => ({ ...widget, width: widget.width || 3, height: widget.height || 3 })) : [{ id: 'simulated-reading', title: 'Temperature probe', subtitle: 'Demo device / temperature', chart: 'Area', value: '24.8', unit: '°C', updated: 'just now', simulated: true, width: 3, height: 3 }];
    } catch { return [{ id: 'simulated-reading', title: 'Temperature probe', subtitle: 'Demo device / temperature', chart: 'Area', value: '24.8', unit: '°C', updated: 'just now', simulated: true, width: 3, height: 3 }]; }
  });
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [query, setQuery] = useState('');
  useEffect(() => { localStorage.setItem('edgex_dashboard_widgets', JSON.stringify(widgets)); }, [widgets]);
  const remove = (id) => setWidgets((current) => current.filter((widget) => widget.id !== id));
  const [dragged, setDragged] = useState(null);
  const resize = (id, value) => { const [width, height] = value.split('x').map(Number); setWidgets((current) => current.map((widget) => widget.id === id ? { ...widget, width, height } : widget)); };
  const drop = (targetId) => { if (!dragged || dragged === targetId) return; setWidgets((current) => { const next = [...current]; const from = next.findIndex((widget) => widget.id === dragged); const to = next.findIndex((widget) => widget.id === targetId); const [item] = next.splice(from, 1); next.splice(to, 0, item); return next; }); setDragged(null); };
  const add = (template) => { setWidgets((current) => [...current, { id: `${template.id}-${Date.now()}`, title: template.lens, subtitle: template.name, chart: template.chart, value: '24.8', unit: 'sample units', updated: 'simulated', simulated: true, width: 3, height: 3 }]); setCatalogOpen(false); };
  const filtered = WIDGET_TEMPLATES.filter((template) => template.name.toLowerCase().includes(query.toLowerCase()));
  return <section className="mt-6"><div className="mb-3 flex items-center justify-between"><div><h2 className="flex items-center gap-2 text-sm font-semibold text-ink"><LayoutGrid className="h-4 w-4 text-cyan" /> Dashboard widgets</h2><p className="mt-1 text-xs text-muted">Drag by the grip, choose a grid size, or remove simulated views.</p></div><Button variant="ghost" className="!px-3 !py-1.5 text-xs" onClick={() => setCatalogOpen(true)}>Add widget</Button></div><div className="dashboard-grid">{widgets.map((widget) => <Widget key={widget.id} widget={widget} onDelete={remove} onResize={resize} onDragStart={setDragged} onDrop={drop} />)}</div>{catalogOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setCatalogOpen(false)}><GlassPanel strong className="w-full max-w-2xl p-5" onClick={(event) => event.stopPropagation()}><div className="flex items-center justify-between"><h2 className="text-lg font-semibold text-ink">Chart template library <span className="text-sm font-normal text-muted">100 templates</span></h2><button aria-label="Close template library" onClick={() => setCatalogOpen(false)} className="text-muted hover:text-ink"><X className="h-5 w-5" /></button></div><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search templates..." className="mt-4 w-full rounded-xl border border-border bg-white/[0.04] px-3 py-2.5 text-sm text-ink focus:outline-none" /><div className="mt-4 grid max-h-80 grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2">{filtered.map((template) => <button key={template.id} onClick={() => add(template)} className="rounded-xl border border-border p-3 text-left hover:border-cyan/50 hover:bg-cyan/5"><span className="block text-sm text-ink">{template.name}</span><span className="mt-1 block text-xs text-muted">{template.chart} chart · simulated preview</span></button>)}</div></GlassPanel></div>}</section>;
}
