/**
 * Shared registry for notepad files.
 * Each NotepadApp registers itself on creation so that terminal commands
 * like `ls` and `cat` can discover and read the actual file data.
 */

export interface INotepadEntry {
  aid: string;
  filename: string;
  content: string;
}

const _registry = new Map<string, INotepadEntry>();

export function registerNotepad(entry: INotepadEntry): void {
  _registry.set(entry.filename, entry);
}

export function getNotepadFilenames(): string[] {
  return Array.from(_registry.keys()).sort();
}

export function getNotepadContent(filename: string): string | null {
  return _registry.get(filename)?.content ?? null;
}

export function updateNotepadContent(filename: string, content: string): void {
  const entry = _registry.get(filename);
  if (entry) {
    entry.content = content;
  }
}
