import { describe, expect, it } from 'vitest';

import { ContentAggregatorService } from './content-aggregator.service';

describe('ContentAggregatorService source verification', () => {
  it('allows only an approved path', () => {
    expect(ContentAggregatorService.isAllowedSource('https://he.khanacademy.org/science/physics/forces-newtons-laws')).toBe(true);
  });

  it('rejects lookalike and insecure domains', () => {
    expect(ContentAggregatorService.isAllowedSource('https://he.khanacademy.org.evil.example/science/physics')).toBe(false);
    expect(ContentAggregatorService.isAllowedSource('http://he.khanacademy.org/science/physics')).toBe(false);
  });

  it('rejects an unapproved path on a partially approved domain', () => {
    expect(ContentAggregatorService.isAllowedSource('https://www.openu.ac.il/private')).toBe(false);
    expect(ContentAggregatorService.isAllowedSource('https://www.openu.ac.il/courses/physics-evil')).toBe(false);
  });

  it('extracts readable text without scripts or markup', () => {
    const text = ContentAggregatorService.extractTextFromHtml('<style>.x{}</style><h1>כוחות</h1><script>alert(1)</script><p>F = ma</p>');
    expect(text).toBe('כוחות F = ma');
  });
});
