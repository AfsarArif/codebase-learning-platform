'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, Search, ZoomIn, ZoomOut } from 'lucide-react';

interface GraphNode {
  id: string; label: string; source_file?: string;
  source_location?: string; community?: number;
  community_name?: string; file_type?: string;
}
interface GraphLink { source: string; target: string; relation?: string; confidence?: string; }

const COLORS = ['#3b82f6','#ef4444','#22c55e','#f59e0b','#8b5cf6','#06b6d4','#ec4899','#84cc16','#f97316','#6366f1'];

export default function GraphPage({ params }: { params: { repoId: string } }) {
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [links, setLinks] = useState<GraphLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [search, setSearch] = useState('');
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    fetch(`/api/repos/${params.repoId}/architecture`)
      .then(r => r.json())
      .then(d => {
        if (d.data?.graphData) {
          setNodes(d.data.graphData.nodes || []);
          setLinks(d.data.graphData.links || []);
        } else { setError('No graph data available. Try re-indexing this repository.'); }
      })
      .catch(() => setError('Failed to load graph'))
      .finally(() => setLoading(false));
  }, [params.repoId]);

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (error) return <div className="text-center py-20"><p className="text-muted-foreground mb-4">{error}</p><Link href={`/dashboard/${params.repoId}`} className="text-primary hover:underline">← Back</Link></div>;

  const filtered = search ? nodes.filter(n => n.label.toLowerCase().includes(search.toLowerCase()) || (n.source_file||'').toLowerCase().includes(search.toLowerCase())) : nodes;

  // Layout: grid by community
  const communities = [...new Set(nodes.map(n => n.community ?? 0))].sort();
  const cols = Math.ceil(Math.sqrt(Math.max(communities.length, 1)));
  const cellW = 800 / cols;
  const cellH = 600 / Math.ceil(Math.max(communities.length, 1) / cols);

  const nodePositions = new Map<string, {x:number,y:number}>();
  nodes.forEach(n => {
    const cIdx = communities.indexOf(n.community ?? 0);
    const col = cIdx % cols;
    const row = Math.floor(cIdx / cols);
    nodes.forEach(() => {}); // just to scope
    const cx = col * cellW + cellW/2 + (Math.random() * cellW * 0.6 - cellW * 0.3);
    const cy = row * cellH + cellH/2 + (Math.random() * cellH * 0.6 - cellH * 0.3);
    nodePositions.set(n.id, {x: Math.max(10, Math.min(790, cx)), y: Math.max(10, Math.min(590, cy))});
  });

  const degree = new Map<string, number>();
  links.forEach(l => {
    degree.set(l.source, (degree.get(l.source)||0)+1);
    degree.set(l.target, (degree.get(l.target)||0)+1);
  });

  return (
    <div>
      <Link href={`/dashboard/${params.repoId}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
      </Link>

      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold">Dependency Graph</h1>
          <p className="text-sm text-muted-foreground">{nodes.length} nodes · {links.length} edges · {communities.length} modules</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search symbols..." className="pl-8 pr-3 py-1.5 text-sm border rounded-md w-48" />
          </div>
          <button onClick={() => setZoom(z => Math.min(z+0.3, 3))} className="p-1.5 border rounded-md hover:bg-accent"><ZoomIn className="h-4 w-4" /></button>
          <button onClick={() => setZoom(z => Math.max(z-0.3, 0.3))} className="p-1.5 border rounded-md hover:bg-accent"><ZoomOut className="h-4 w-4" /></button>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="flex-1 border rounded-lg bg-white overflow-hidden" style={{ height: '600px' }}>
          <svg width="100%" height="100%" viewBox="0 0 800 600" style={{transform: `scale(${zoom})`, transformOrigin: '0 0'}}>
            {links.map((l, i) => {
              const s = nodePositions.get(l.source);
              const t = nodePositions.get(l.target);
              if (!s || !t) return null;
              return <line key={i} x1={s.x} y1={s.y} x2={t.x} y2={t.y} stroke="#e5e7eb" strokeWidth={0.5} opacity={0.5} />;
            })}
            {filtered.map(n => {
              const pos = nodePositions.get(n.id);
              if (!pos) return null;
              const d = degree.get(n.id) || 1;
              const r = Math.max(3, Math.min(18, Math.sqrt(d) * 3));
              const color = COLORS[(n.community ?? 0) % COLORS.length];
              const sel = selectedNode?.id === n.id;
              return (
                <g key={n.id} style={{cursor: 'pointer'}} onClick={() => setSelectedNode(sel ? null : n)}>
                  <circle cx={pos.x} cy={pos.y} r={r} fill={color} opacity={sel ? 1 : 0.7} stroke={sel ? '#000' : 'none'} strokeWidth={sel ? 2 : 0} />
                  <text x={pos.x} y={pos.y - r - 2} textAnchor="middle" fontSize="7" fill="#666">{n.label.length > 18 ? n.label.slice(0, 18)+'…' : n.label}</text>
                </g>
              );
            })}
          </svg>
        </div>

        <div className="w-56 flex-shrink-0 space-y-3">
          <div className="border rounded-lg p-3">
            <h3 className="text-sm font-medium mb-2">Modules</h3>
            {communities.map(c => {
              const name = nodes.find(n => n.community === c)?.community_name || `Module ${c}`;
              return (
                <div key={c} className="flex items-center gap-2 text-xs py-0.5">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{background: COLORS[c % COLORS.length]}} />
                  <span className="truncate">{name}</span>
                </div>
              );
            })}
          </div>

          {selectedNode && (
            <div className="border rounded-lg p-3">
              <h3 className="text-sm font-medium mb-2 truncate">{selectedNode.label}</h3>
              <div className="text-xs space-y-1 text-muted-foreground">
                <p>Type: {selectedNode.file_type || 'symbol'}</p>
                {selectedNode.source_file && <p className="truncate">File: {selectedNode.source_file}</p>}
                {selectedNode.source_location && <p>Loc: {selectedNode.source_location}</p>}
                {selectedNode.community_name && <p>Module: {selectedNode.community_name}</p>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
