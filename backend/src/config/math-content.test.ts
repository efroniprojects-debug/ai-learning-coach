import { describe, expect, it } from 'vitest';

import { getMathCurriculum } from './math-curriculum';
import { getMathExamCatalog } from './math-exams';
import { getMathProblems } from './math-practice';
import { getMathSimulations, isAllowedSimulationUrl } from './simulations';

describe('math content registry', () => {
  it('keeps curriculum, questions and questionnaires isolated by units', () => {
    expect(getMathCurriculum(3).questionnaires).toContain('35371');
    expect(getMathCurriculum(5).questionnaires).not.toContain('35371');
    expect(getMathProblems(3).every((problem) => problem.units === 3)).toBe(true);
    expect(getMathProblems(4).every((problem) => problem.units === 4)).toBe(true);
    expect(getMathExamCatalog(5).map((exam) => exam.questionnaire)).toEqual(['35571', '35572']);
  });

  it('preserves LaTeX commands without control-character leakage', () => {
    const renderedContent = getMathProblems(5).flatMap((problem) => [problem.question, problem.expectedAnswer, ...problem.hints]).join(' ');
    expect(renderedContent).toContain('\\frac');
    expect(renderedContent).not.toMatch(/[\b\f\v]/u);
  });

  it('returns simulations only for a matching topic and level', () => {
    expect(getMathSimulations(3, 'נגזרות')).toEqual([]);
    expect(getMathSimulations(4, 'נגזרות').map((simulation) => simulation.id)).toContain('phet-calculus-grapher');
    expect(getMathSimulations(3, 'גאומטריה במישור').map((simulation) => simulation.id)).toContain('phet-quadrilateral');
  });

  it('allows only approved HTTPS simulation hosts', () => {
    expect(isAllowedSimulationUrl('https://phet.colorado.edu/sims/html/quadrilateral/latest/quadrilateral_all.html')).toBe(true);
    expect(isAllowedSimulationUrl('http://phet.colorado.edu/example')).toBe(false);
    expect(isAllowedSimulationUrl('https://example.com/embed')).toBe(false);
  });
});
