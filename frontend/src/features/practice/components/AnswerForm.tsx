import React, { useState } from 'react';

export function AnswerForm({
  problem,
  onSubmit,
  loading,
}: {
  problem: any;
  onSubmit: (answer: string, isCorrect: boolean) => Promise<void>;
  loading: boolean;
}) {
  const [answer, setAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (isCorrect: boolean) => {
    setSubmitted(true);
    await onSubmit(answer, isCorrect);
  };

  return (
    <div className="bg-white rounded-lg shadow p-8">
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          Your Answer:
        </label>
        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Type or paste your solution..."
          className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          rows={6}
          disabled={loading}
        />
        <p className="text-sm text-gray-500 mt-2">
          {answer.length} characters
        </p>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => handleSubmit(true)}
          disabled={!answer.trim() || loading}
          className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition"
        >
          {loading ? 'Submitting...' : '✓ Mark Correct'}
        </button>
        <button
          onClick={() => handleSubmit(false)}
          disabled={!answer.trim() || loading}
          className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition"
        >
          {loading ? 'Submitting...' : '✗ Mark Incorrect'}
        </button>
      </div>

      <p className="text-xs text-gray-500 mt-4 text-center">
        Evaluate your own answer honestly for better learning.
      </p>
    </div>
  );
}
