import { describe, expect, it } from 'vitest';

import { buildSystemPrompt, DEFAULT_SUBJECT_ID, getSubjectConcepts, getSubjectConfig, getSubjectTaxonomy, normalizeStudyUnits } from './subjects';

describe('subject registry', () => {
  it('keeps existing data and prompts on Physics by default', () => {
    expect(DEFAULT_SUBJECT_ID).toBe('physics');
    expect(getSubjectConfig(DEFAULT_SUBJECT_ID).nameHe).toBe('פיזיקה');
    expect(buildSystemPrompt('concept', DEFAULT_SUBJECT_ID)).toContain('פיזיקיו');
  });

  it('rejects an unregistered subject before data can be mixed', () => {
    expect(() => getSubjectConfig('unknown')).toThrow('Unknown subject');
  });

  it('provides a separate Mathematics teacher and topic taxonomy', () => {
    expect(getSubjectConfig('math').nameHe).toBe('מתמטיקה');
    expect(buildSystemPrompt('step_by_step', 'math')).toContain('מורה פרטי למתמטיקה');
    expect(getSubjectTaxonomy('math', 3)).toHaveProperty('כלכלה ופיננסים');
    expect(getSubjectTaxonomy('math', 5)).toHaveProperty('מספרים מרוכבים');
    expect(getSubjectConcepts('math', 3)).toContain('תכנון ליניארי');
    expect(getSubjectConcepts('math', 3)).not.toContain('מספרים מרוכבים');
    expect(getSubjectConcepts('math', 5)).not.toContain('Force');
  });

  it('normalizes study units without creating Physics tracks', () => {
    expect(normalizeStudyUnits('physics', 5)).toBe(0);
    expect(normalizeStudyUnits('math')).toBe(5);
    expect(normalizeStudyUnits('math', 3)).toBe(3);
    expect(buildSystemPrompt('step_by_step', 'math', 4)).toContain('4 יחידות לימוד');
  });
});
