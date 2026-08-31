import { describe, expect, it } from 'vitest';

import { buildSystemPrompt, DEFAULT_SUBJECT_ID, getSubjectConfig } from './subjects';

describe('subject registry', () => {
  it('keeps existing data and prompts on Physics by default', () => {
    expect(DEFAULT_SUBJECT_ID).toBe('physics');
    expect(getSubjectConfig(DEFAULT_SUBJECT_ID).nameHe).toBe('פיזיקה');
    expect(buildSystemPrompt('concept', DEFAULT_SUBJECT_ID)).toContain('פיזיקיו');
  });

  it('rejects an unregistered subject before data can be mixed', () => {
    expect(() => getSubjectConfig('unknown')).toThrow('Unknown subject');
  });
});
