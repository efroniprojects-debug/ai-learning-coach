import { useState } from 'react';

export interface PhetSim {
  title: string;
  url: string;
  description: string;
}

interface Props {
  sims: PhetSim[];
}

export function PhetPanel({ sims }: Props) {
  const [activeUrl, setActiveUrl] = useState<string | null>(null);
  const [iframeLoaded, setIframeLoaded] = useState(false);

  const openSim = (url: string) => {
    setIframeLoaded(false);
    setActiveUrl(url);
  };

  const closeModal = () => {
    setActiveUrl(null);
    setIframeLoaded(false);
  };

  if (sims.length === 0) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg border border-dashed border-gray-300 text-center text-sm text-gray-400" dir="rtl">
        בחר נושא כדי לראות סימולציות רלוונטיות 🔬
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2" dir="rtl">
        <p className="text-xs font-medium text-gray-500 flex items-center gap-1">
          <span>🔬</span> סימולציות PhET
        </p>
        {sims.map((sim) => (
          <div
            key={sim.url}
            className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">{sim.title}</p>
              <p className="text-xs text-gray-500">{sim.description}</p>
            </div>
            <button
              onClick={() => openSim(sim.url)}
              className="shrink-0 mr-3 px-3 py-1.5 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 transition-colors"
            >
              פתח סימולציה 🔬
            </button>
          </div>
        ))}
      </div>

      {/* Full-screen iframe modal */}
      {activeUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center"
          onClick={closeModal}
        >
          <div
            className="relative w-[90vw] h-[90vh] bg-white rounded-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button (RTL — top-left visually = top-right in layout) */}
            <button
              onClick={closeModal}
              className="absolute top-2 left-2 z-10 w-8 h-8 flex items-center justify-center bg-black/60 text-white rounded-full hover:bg-black/80 text-lg leading-none"
              aria-label="סגור"
            >
              ✕
            </button>

            {!iframeLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-white">
                <div className="flex flex-col items-center gap-3 text-gray-400">
                  <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm">טוען סימולציה...</span>
                </div>
              </div>
            )}

            <iframe
              src={activeUrl}
              className="w-full h-full"
              allow="fullscreen"
              sandbox="allow-scripts allow-same-origin allow-forms"
              onLoad={() => setIframeLoaded(true)}
              title="PhET Simulation"
            />
          </div>
        </div>
      )}
    </>
  );
}
