import type { Poem } from '@/lib/db';

/** Poem is worth saving if it has a title or any body text. */
export function poemHasContent(title: string, plainText: string): boolean {
  return Boolean(title.trim() || plainText.trim());
}

export function isPoemEmpty(poem: Pick<Poem, 'title' | 'plain_text'>): boolean {
  return !poemHasContent(poem.title, poem.plain_text);
}

export function displayPoemTitle(title: string, plainText: string, noTitleLabel: string): string {
  if (title.trim()) return title.trim();
  if (plainText.trim()) {
    const line = plainText.trim().split('\n')[0];
    return line.length > 48 ? `${line.slice(0, 48)}…` : line;
  }
  return noTitleLabel;
}

export function filterSavedPoems(poems: Poem[]): Poem[] {
  return poems.filter((p) => !isPoemEmpty(p));
}
