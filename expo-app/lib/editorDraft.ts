let draft: { title?: string; body?: string } | null = null;

export function setEditorDraft(data: { title?: string; body?: string }) {
  draft = data;
}

export function consumeEditorDraft() {
  const data = draft;
  draft = null;
  return data;
}
