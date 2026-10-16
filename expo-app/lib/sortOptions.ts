import type { SortKey } from '@/lib/theme';
import type { Strings } from '@/lib/i18n';

export function getSortOptions(t: Strings): { value: SortKey; label: string }[] {
  return [
    { value: '-created_date', label: t.sortNewest },
    { value: 'created_date', label: t.sortOldest },
    { value: 'title', label: t.sortAZ },
    { value: '-updated_date', label: t.sortRecentEdit },
  ];
}
