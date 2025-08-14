import { describe, it, expect } from 'vitest';
import { getVisiblePages } from '@/components/Pagination';

describe('getVisiblePages', () => {
  it('shows first pages when near start', () => {
    expect(getVisiblePages(2, 10)).toEqual([1,2,3,4,5]);
  });

  it('shows last pages when near end', () => {
    expect(getVisiblePages(9, 10)).toEqual([6,7,8,9,10]);
  });

  it('returns all pages when total pages less than max', () => {
    expect(getVisiblePages(1, 3)).toEqual([1,2,3]);
  });
});
