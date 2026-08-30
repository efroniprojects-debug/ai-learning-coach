import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

interface PhetSim {
  title: string;
  url: string;
  description: string;
}

interface Props {
  subtopic: string | null;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '';

export function PhetPanel({ subtopic }: Props) {
  const [openUrl, setOpenUrl] = useState<string | null>(null);
  const [iframeLoaded, setIframeLoaded] = useState(false);

  const { data: sims = [], isLoading } = useQuery<PhetSim[]>({
    queryKey: ['phet-sims', subtopic],
    queryFn: async () => {
      if (!subtopic) return [];
      const res = await fetch(`${API_BASE}/api/v1/physics/phet?subtopic=${encodeURIComponent(subtopic)}`);
      if (!res.ok) return [];
      return res.json() as Promise<PhetSim[]>;
    },
    enabled: !!subtopic,
    staleTime: 10 * 60 * 1000,
  });

  if (!subtopic) {
    return (
      <p dir="rtl" className="text-center py-3 text-gray-400 text-sm">
        🔬 בחר נושא לסימולציות PhET
      </p>
    );
  }

  if (isLoading) return <p className="text-center py-3 text-gray-400 text-sm">טוען...</p>;
  if (sims.length === 0) return <p dir="rtl" className="text-center py-3 text-gray-400 text-sm">אין סימולציות לנושא זה</p>;

  return (
    <div dir="rtl" className="space-y-2">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">סימולציות PhET</p>
      {sims.map((sim) => (
        <div key={sim.url} className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-blue-800 truncate">{sim.title}</p>
            <p className="text-xs text-blue-600">{sim.description}</p>
          </div>
          <button
            onClick={() => { setOpenUrl(sim.url); setIframeLoaded(false); }}
            className="mr-2 flex-shrink-0 text-xs bg-blue-600 text-white px-2.5 py-1.5 rounded-md hover:bg-blue-700 transition-colors"
          >
            פתח 🔬
          </button>
        </div>
      ))}

      {openUrl && (
        <div
          className="fixed inset-0 z-[9999] bg-black/80 flex flex-col"
          onClick={(e) => { if (e.target === e.currentTarget) setOpenUrl(null); }}
        >
          <div className="flex items-center justify-between px-4 py-2 bg-gray-900">
            <span className="text-white text-sm font-medium">🔬 סימולציית PhET</span>
            <button onClick={() => setOpenUrl(null)} className="text-white hover:text-gray-300 text-xl font-bold px-2">✕</button>
          </div>
          {!iframeLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10 mt-10">
              <div className="text-white text-center">
                <div className="animate-spin text-4xl mb-2">⚛️</div>
                <p className="text-sm">טוען סימולציה...</p>
              </div>
            </div>
          )}
          <iframe
            src={openUrl}
            className="flex-1 w-full"
            allow="fullscreen"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            onLoad={() => setIframeLoaded(true)}
            title="PhET Simulation"
          />
        </div>
      )}
    </div>
  );
}
