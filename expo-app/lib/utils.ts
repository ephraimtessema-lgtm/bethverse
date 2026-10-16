import type { Poem } from '@/lib/db';
import type { SortKey } from '@/lib/theme';

export function sortPoems(list: Poem[], sort: SortKey): Poem[] {
  const sorted = [...list];
  sorted.sort((a, b) => {
    switch (sort) {
      case '-created_date':
        return new Date(b.created_date).getTime() - new Date(a.created_date).getTime();
      case 'created_date':
        return new Date(a.created_date).getTime() - new Date(b.created_date).getTime();
      case 'title':
        return (a.title || '').localeCompare(b.title || '');
      case '-updated_date':
        return new Date(b.updated_date).getTime() - new Date(a.updated_date).getTime();
      default:
        return 0;
    }
  });
  return sorted;
}

export function formatPoemDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}
