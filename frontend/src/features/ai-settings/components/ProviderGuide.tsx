import { useState } from 'react';

interface ProviderGuideProps {
  provider: 'claude' | 'gemini' | 'openai';
}

export function ProviderGuide({ provider }: ProviderGuideProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const guides = {
    claude: {
      title: 'Claude (Anthropic)',
      steps: [
        {
          step: 1,
          title: 'לך לקונסולה של Anthropic',
          description: 'בקר ב-console.anthropic.com',
        },
        {
          step: 2,
          title: 'הירשם או התחבר',
          description: 'אם אין לך חשבון, הירשם עם המייל שלך',
        },
        {
          step: 3,
          title: 'לך לעמוד ה-API Keys',
          description: 'בתפריט השמאלי, בחר "API Keys"',
        },
        {
          step: 4,
          title: 'צור API Key חדש',
          description: 'לחץ על "Create Key" והעתק אותו',
        },
        {
          step: 5,
          title: 'הדבק כאן',
          description: 'הדבק את ה-API Key בשדה שמעלה',
        },
      ],
      link: 'https://console.anthropic.com/account/keys',
    },
    gemini: {
      title: 'Gemini (Google)',
      steps: [
        {
          step: 1,
          title: 'לך ל-Google AI Studio',
          description: 'בקר ב-aistudio.google.com',
        },
        {
          step: 2,
          title: 'התחבר עם ה-Google Account שלך',
          description: 'אם אתה כבר מחובר, דלג על שלב זה',
        },
        {
          step: 3,
          title: 'לחץ על "Get API Key"',
          description: 'בעמוד הבית, לחץ על "Get API Key"',
        },
        {
          step: 4,
          title: 'בחר "Create API Key"',
          description: 'בחר "Create new secret key in new project"',
        },
        {
          step: 5,
          title: 'העתק את המפתח',
          description: 'המפתח יוצג מיד - העתק אותו',
        },
      ],
      link: 'https://aistudio.google.com/app/apikey',
    },
    openai: {
      title: 'OpenAI',
      steps: [
        {
          step: 1,
          title: 'לך לעמוד ה-API',
          description: 'בקר ב-platform.openai.com',
        },
        {
          step: 2,
          title: 'התחבר או הירשם',
          description: 'השתמש בחשבון OpenAI שלך',
        },
        {
          step: 3,
          title: 'לך לעמוד "API Keys"',
          description: 'בתפריט השמאלי בחר "API Keys"',
        },
        {
          step: 4,
          title: 'צור API Key חדש',
          description: 'לחץ על "Create new secret key"',
        },
        {
          step: 5,
          title: 'העתק מיד',
          description: 'המפתח יוצג פעם אחת בלבד - העתק אותו עכשיו',
        },
      ],
      link: 'https://platform.openai.com/account/api-keys',
    },
  };

  const guide = guides[provider];

  return (
    <div className="border border-blue-200 bg-blue-50 rounded-lg p-4 mb-6">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-left font-semibold text-blue-900 hover:text-blue-700"
      >
        <span>📖 {guide.title} - איך להשיג API Key?</span>
        <span className="text-xl">{isExpanded ? '▼' : '▶'}</span>
      </button>

      {isExpanded && (
        <div className="mt-4 space-y-4 pt-4 border-t border-blue-200">
          {/* Steps */}
          <div className="space-y-3">
            {guide.steps.map((step, idx) => (
              <div key={idx} className="flex gap-3 items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                  {step.step}
                </div>
                <div className="flex-grow">
                  <h4 className="font-semibold text-gray-900">{step.title}</h4>
                  <p className="text-sm text-gray-700 mt-1">{step.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Link */}
          <div className="mt-4 pt-4 border-t border-blue-200">
            <a
              href={guide.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
            >
              🔗 לך ישירות לעמוד
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>

          {/* Security Note */}
          <div className="mt-4 p-3 bg-white border border-blue-200 rounded text-sm text-gray-700">
            <p className="font-semibold text-gray-900 mb-1">🔒 בטיחות:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>המפתח שלך מוצפן בשרת ולעולם לא חשוף ללקוח</li>
              <li>אנחנו לעולם לא לוגים או שומרים מפתחות בטקסט פשוט</li>
              <li>אתה יכול למחוק את המפתח בכל עת</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
