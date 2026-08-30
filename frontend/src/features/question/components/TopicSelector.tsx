import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

const API_BASE = import.meta.env.VITE_API_URL || '';

interface TopicConfig {
  icon: string;
  subtopics: string[];
}

interface PhetSim {
  title: string;
  url: string;
  description: string;
}

interface Props {
  selectedTopic: string | null;
  selectedSubtopic: string | null;
  onSelect: (topic: string, subtopic: string) => void;
  onPhetSims: (sims: PhetSim[]) => void;
}

export function TopicSelector({ selectedTopic, selectedSubtopic, onSelect, onPhetSims }: Props) {
  const [expandedTopic, setExpandedTopic] = useState<string | null>(selectedTopic);

  const { data: taxonomy, isLoading } = useQuery<Record<string, TopicConfig>>({
    queryKey: ['physics-topics'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/v1/physics/topics`);
      if (!res.ok) throw new Error('Failed to fetch topics');
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const handleSubtopicClick = async (topic: string, subtopic: string) => {
    onSelect(topic, subtopic);
    try {
      const res = await fetch(`${API_BASE}/api/v1/physics/phet?subtopic=${encodeURIComponent(subtopic)}`);
      if (res.ok) {
        const sims: PhetSim[] = await res.json();
        onPhetSims(sims);
      }
    } catch {
      onPhetSims([]);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 text-center text-gray-400 text-sm" dir="rtl">
        טוען נושאים...
      </div>
    );
  }

  if (!taxonomy) return null;

  return (
    <div className="space-y-1" dir="rtl">
      {Object.entries(taxonomy).map(([topicName, config]) => {
        const isExpanded = expandedTopic === topicName;
        return (
          <div key={topicName} className="border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setExpandedTopic(isExpanded ? null : topicName)}
              className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 text-sm font-medium text-gray-700 transition-colors"
            >
              <span className="flex items-center gap-2">
                <span>{config.icon}</span>
                <span>{topicName}</span>
              </span>
              <span className="text-gray-400 text-xs">{isExpanded ? '▲' : '▼'}</span>
            </button>
            {isExpanded && (
              <div className="px-4 py-3 flex flex-wrap gap-2 bg-white">
                {config.subtopics.map((sub) => {
                  const isSelected = selectedTopic === topicName && selectedSubtopic === sub;
                  return (
                    <button
                      key={sub}
                      onClick={() => handleSubtopicClick(topicName, sub)}
                      className={`px-3 py-1 rounded-full text-xs border transition-colors
                        ${isSelected
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400 hover:text-blue-600'
                        }`}
                    >
                      {sub}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
