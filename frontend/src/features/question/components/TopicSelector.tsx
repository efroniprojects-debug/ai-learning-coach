import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

interface TopicData {
  icon: string;
  subtopics: string[];
}

interface Props {
  selectedSubtopic: string | null;
  onSelect: (topic: string, subtopic: string) => void;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '';

export function TopicSelector({ selectedSubtopic, onSelect }: Props) {
  const [openTopic, setOpenTopic] = useState<string | null>(null);

  const { data: taxonomy, isLoading, isError } = useQuery<Record<string, TopicData>>({
    queryKey: ['physics-topics'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/v1/physics/topics`);
      if (!res.ok) throw new Error('Failed');
      return res.json() as Promise<Record<string, TopicData>>;
    },
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) return <p className="text-sm text-gray-400 p-3 text-center">טוען נושאים...</p>;
  if (isError || !taxonomy) return <p className="text-sm text-red-400 p-3 text-center">לא ניתן לטעון נושאים</p>;

  return (
    <div dir="rtl" className="space-y-1">
      {Object.entries(taxonomy).map(([topic, data]) => (
        <div key={topic} className="border border-gray-200 rounded-lg overflow-hidden">
          <button
            onClick={() => setOpenTopic(openTopic === topic ? null : topic)}
            className="w-full flex items-center justify-between px-3 py-2.5 bg-gray-50 hover:bg-gray-100 transition-colors text-right"
          >
            <span className="flex items-center gap-2 font-medium text-gray-800 text-sm">
              <span>{data.icon}</span>
              <span>{topic}</span>
            </span>
            <span className="text-gray-400 text-xs">{openTopic === topic ? '▲' : '▼'}</span>
          </button>

          {openTopic === topic && (
            <div className="px-3 py-2 bg-white flex flex-wrap gap-1.5">
              {data.subtopics.map((sub) => (
                <button
                  key={sub}
                  onClick={() => onSelect(topic, sub)}
                  className={[
                    'text-xs px-2.5 py-1.5 rounded-full border transition-all',
                    selectedSubtopic === sub
                      ? 'bg-blue-600 text-white border-blue-600 font-medium'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400 hover:text-blue-600',
                  ].join(' ')}
                >
                  {sub}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
