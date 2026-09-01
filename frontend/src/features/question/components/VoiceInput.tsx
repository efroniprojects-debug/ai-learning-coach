import { useRef, useState } from 'react';

interface Props { onTranscript: (text: string) => void; disabled?: boolean; }

type Recognition = { lang: string; interimResults: boolean; continuous: boolean; start: () => void; stop: () => void; onresult: ((event: { results: ArrayLike<{ 0: { transcript: string }; isFinal: boolean }> }) => void) | null; onend: (() => void) | null; onerror: (() => void) | null };

export function VoiceInput({ onTranscript, disabled }: Props) {
  const recognitionRef = useRef<Recognition | null>(null);
  const [listening, setListening] = useState(false);
  const RecognitionConstructor = (window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition }).SpeechRecognition
    ?? (window as unknown as { webkitSpeechRecognition?: new () => Recognition }).webkitSpeechRecognition;

  if (!RecognitionConstructor) return null;

  const toggle = () => {
    if (listening) { recognitionRef.current?.stop(); return; }
    const recognition = new RecognitionConstructor();
    recognition.lang = 'he-IL';
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onresult = (event) => {
      const text = Array.from(event.results).map((result) => result[0].transcript).join(' ');
      if (text.trim()) onTranscript(text.trim());
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognitionRef.current = recognition;
    setListening(true);
    recognition.start();
  };

  return <button type="button" onClick={toggle} disabled={disabled} className={`min-h-11 touch-manipulation rounded-lg border px-4 py-2 text-sm ${listening ? 'border-red-300 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}>{listening ? '⏹ עצור הקלטה' : '🎙️ הקלטה'}</button>;
}
