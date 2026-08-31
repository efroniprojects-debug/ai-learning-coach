import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { useSelectedSubject } from './useSelectedSubject';

describe('useSelectedSubject', () => {
  beforeEach(() => localStorage.clear());

  it('persists a valid subject selection between pages', () => {
    const { result, unmount } = renderHook(() => useSelectedSubject());
    act(() => result.current.setSubjectId('math'));
    expect(result.current.subjectId).toBe('math');
    unmount();

    const nextPage = renderHook(() => useSelectedSubject());
    expect(nextPage.result.current.subject.nameHe).toBe('מתמטיקה');
  });

  it('ignores unsupported subjects', () => {
    const { result } = renderHook(() => useSelectedSubject());
    act(() => result.current.setSubjectId('chemistry'));
    expect(result.current.subjectId).toBe('physics');
  });

  it('defaults Mathematics to five units and persists another valid level', () => {
    const { result, unmount } = renderHook(() => useSelectedSubject());
    expect(result.current.mathStudyUnits).toBe(5);

    act(() => result.current.setMathStudyUnits(4));
    expect(result.current.mathStudyUnits).toBe(4);
    unmount();

    const nextPage = renderHook(() => useSelectedSubject());
    expect(nextPage.result.current.mathStudyUnits).toBe(4);
  });

  it('synchronizes the learning context across mounted modules', () => {
    const firstModule = renderHook(() => useSelectedSubject());
    const secondModule = renderHook(() => useSelectedSubject());

    act(() => firstModule.result.current.setSubjectId('math'));

    expect(secondModule.result.current.subjectId).toBe('math');
  });
});
