import { describe, expect, it } from 'vitest';

import { shouldRetrieveKnowledgeContext } from './question-context';

describe('question context selection', () => {
  it('uses RAG for ordinary text questions', () => {
    expect(shouldRetrieveKnowledgeContext({})).toBe(true);
  });

  it('does not mix unrelated RAG chunks into direct attachments', () => {
    expect(shouldRetrieveKnowledgeContext({ documentData: 'pdf-base64' })).toBe(false);
    expect(shouldRetrieveKnowledgeContext({ imageData: 'image-base64' })).toBe(false);
  });
});
