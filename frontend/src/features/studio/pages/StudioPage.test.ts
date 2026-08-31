import { describe, expect, it } from 'vitest';

import { filterStudioSources, type StudioSource } from './StudioPage';

const SOURCES: StudioSource[] = [
  { kind: 'drive', id: '1', name: 'בגרות מתמטיקה 2025.pdf', mimeType: 'application/pdf' },
  { kind: 'upload', id: '2', name: 'סיכום טריגונומטריה.md', mimeType: 'text/markdown' },
  { kind: 'upload', id: '3', name: 'תרגול אלגברה.pdf', mimeType: 'application/pdf' },
];

describe('filterStudioSources', () => {
  it('combines name, location and file type filters', () => {
    expect(filterStudioSources(SOURCES, 'אלגברה', 'upload', 'pdf')).toEqual([SOURCES[2]]);
  });

  it('keeps every source when filters are clear', () => {
    expect(filterStudioSources(SOURCES, '', 'all', 'all')).toEqual(SOURCES);
  });
});
