import { useNavigate } from 'react-router-dom';

interface TopicScore { topic: string; elo: number; score: number }
interface Gap { topic: string; subtopic: string; elo: number; confidence: string }

interface Props {
  topics: TopicScore[];
  gaps: Gap[];
  hasData: boolean;
}

export function GapRadar({ topics, gaps, hasData }: Props) {
  const navigate = useNavigate();
  const size = 320;
  const center = size / 2;
  const radius = 112;
  const point = (index: number, value = 100) => {
    const angle = -Math.PI / 2 + (index * 2 * Math.PI) / Math.max(topics.length, 1);
    const distance = radius * value / 100;
    return [center + Math.cos(angle) * distance, center + Math.sin(angle) * distance];
  };
  const polygon = topics.map((topic, index) => point(index, topic.score).join(',')).join(' ');

  return (
    <section className="mb-8 rounded-xl bg-white p-4 shadow sm:p-6" dir="rtl">
      <h2 className="text-2xl font-bold text-gray-900 mb-1">מפת הידע שלי</h2>
      <p className="text-sm text-gray-500 mb-4">תמונה עדכנית של החוזקות והנושאים שכדאי לחזק</p>
      {!hasData ? (
        <div className="py-16 text-center text-gray-500">פתור תרגילים כדי לבנות מפת ידע 🗺️</div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6 items-center">
          <svg viewBox={`0 0 ${size} ${size}`} className="mx-auto w-full min-w-[280px] max-w-[320px]" role="img" aria-label="גרף רדאר של השליטה בנושאי הפיזיקה">
            {[20, 40, 60, 80, 100].map((level) => (
              <polygon key={level} points={topics.map((_, index) => point(index, level).join(',')).join(' ')} fill="none" stroke="#e5e7eb" strokeWidth="1" />
            ))}
            {topics.map((topic, index) => {
              const [x, y] = point(index);
              const [labelX, labelY] = point(index, 122);
              return <g key={topic.topic}><line x1={center} y1={center} x2={x} y2={y} stroke="#d1d5db" /><text x={labelX} y={labelY} textAnchor="middle" dominantBaseline="middle" className="fill-gray-700 text-[10px]">{topic.topic}</text></g>;
            })}
            <polygon points={polygon} fill="rgba(37,99,235,.22)" stroke="#2563eb" strokeWidth="3" />
          </svg>
          <div>
            <h3 className="font-bold text-gray-800 mb-3">נושאים לחיזוק</h3>
            {gaps.length === 0 ? <p className="text-green-700 bg-green-50 rounded-lg p-4">אין כרגע פערים מתחת ל־900 ELO. יפה מאוד! 🎉</p> : (
              <div className="space-y-3">{gaps.slice(0, 3).map((gap) => (
                <div key={gap.subtopic} className="border border-amber-200 bg-amber-50 rounded-lg p-3">
                  <div className="flex justify-between gap-3"><div><p className="font-semibold text-gray-900">{gap.subtopic}</p><p className="text-xs text-gray-500">{gap.topic} · ELO {gap.elo}</p></div><button onClick={() => navigate('/ask', { state: { selectedTopic: gap.topic, selectedSubtopic: gap.subtopic, prefilledText: `אני רוצה לתרגל את הנושא ${gap.subtopic}. התחל איתי בהדרגה.` } })} className="text-xs bg-blue-600 text-white rounded-lg px-3 py-2 hover:bg-blue-700">📚 תרגל עכשיו</button></div>
                </div>
              ))}</div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
