import React, { useState } from 'react';
import { shareApi } from '@/services/share.api';

export function ShareDialog({
  resourceId,
  resourceType,
  onClose,
}: {
  resourceId: string;
  resourceType: 'question' | 'solution' | 'progress_report';
  onClose: () => void;
}) {
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expiresIn, setExpiresIn] = useState<number | undefined>(undefined);

  const handleGenerateLink = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await shareApi.generateLink(resourceType, resourceId, expiresIn);
      setShareLink(result.shareUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate link');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (shareLink) {
      navigator.clipboard.writeText(shareLink);
      alert('Link copied to clipboard!');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h2 className="text-2xl font-bold mb-4">Share {resourceType}</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
            {error}
          </div>
        )}

        {!shareLink ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Link Expiration</label>
              <select
                value={expiresIn || ''}
                onChange={(e) => setExpiresIn(e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-full p-2 border border-gray-300 rounded"
              >
                <option value="">Never expire</option>
                <option value="60">1 hour</option>
                <option value="1440">1 day</option>
                <option value="10080">1 week</option>
              </select>
            </div>

            <button
              onClick={handleGenerateLink}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 rounded transition"
            >
              {loading ? 'Generating...' : 'Generate Link'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-3 bg-green-50 border border-green-200 rounded">
              <p className="text-sm text-gray-600 mb-2">Your shareable link:</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={shareLink}
                  readOnly
                  className="flex-1 p-2 bg-gray-100 border border-gray-300 rounded text-sm"
                />
                <button
                  onClick={handleCopy}
                  className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-semibold transition"
                >
                  Copy
                </button>
              </div>
            </div>

            <p className="text-xs text-gray-600">
              Anyone with this link can view your {resourceType}.
            </p>

            <button
              onClick={() => setShareLink(null)}
              className="w-full bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 rounded transition"
            >
              Generate Another Link
            </button>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full mt-4 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 rounded transition"
        >
          Close
        </button>
      </div>
    </div>
  );
}
