import { afterEach, describe, expect, it, vi } from 'vitest';

import { GeminiAdapter } from './gemini.adapter';

describe('GeminiAdapter', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('normalizes a provider response into the shared gateway contract', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      candidates: [{ content: { parts: [{ text: 'תוכן לימודי' }] } }],
      usageMetadata: { totalTokenCount: 12 },
    }), { status: 200, headers: { 'Content-Type': 'application/json' } })));
    const adapter = new GeminiAdapter('test-key', 'test-model');

    const response = await adapter.generateResponse({ messages: [{ role: 'user', content: 'שאלה' }] });

    expect(response).toMatchObject({ content: 'תוכן לימודי', provider: 'gemini', model: 'test-model', tokensUsed: 12 });
  });

  it('emits text deltas through the provider-neutral stream contract', async () => {
    const body = 'data: {"candidates":[{"content":{"parts":[{"text":"חלק ראשון"}]}}]}\n\n'
      + 'data: {"candidates":[{"content":{"parts":[{"text":" וחלק שני"}]}}]}\n\n';
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(body, { status: 200 })));
    const adapter = new GeminiAdapter('test-key', 'test-model');
    const deltas: string[] = [];

    for await (const chunk of adapter.generateStream({ messages: [{ role: 'user', content: 'שאלה' }] })) {
      deltas.push(chunk.delta);
    }

    expect(deltas).toEqual(['חלק ראשון', ' וחלק שני']);
  });
});
