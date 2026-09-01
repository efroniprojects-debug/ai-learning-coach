import { afterEach, describe, expect, it, vi } from 'vitest';

import { GeminiAdapter } from './gemini.adapter';

describe('GeminiAdapter', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('requests native JSON output for structured calls', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      candidates: [{ content: { parts: [{ text: '{"ok":true}' }] } }],
    }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
    vi.stubGlobal('fetch', fetchMock);
    const adapter = new GeminiAdapter('test-key', 'test-model');

    await adapter.generateResponse({ messages: [{ role: 'user', content: 'שאלה' }], responseFormat: 'json', responseJsonSchema: { type: 'OBJECT' } });

    const request = fetchMock.mock.calls[0][1] as RequestInit;
    const body = JSON.parse(request.body as string) as { generationConfig: { responseMimeType?: string; responseSchema?: unknown } };
    expect(body.generationConfig.responseMimeType).toBe('application/json');
    expect(body.generationConfig.responseSchema).toEqual({ type: 'OBJECT' });
  });

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
