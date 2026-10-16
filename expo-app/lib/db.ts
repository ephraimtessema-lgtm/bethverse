import * as SQLite from 'expo-sqlite';
import * as Crypto from 'expo-crypto';

export type Poem = {
  id: string;
  title: string;
  content: string;
  plain_text: string;
  collection: string | null;
  is_favorite: number;
  is_archived: number;
  word_count: number;
  char_count: number;
  edit_count: number;
  created_date: string;
  updated_date: string;
};

export type Collection = {
  id: string;
  name: string;
  color: string | null;
  created_date: string;
};

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function getDb() {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync('bethverse.db');
  }
  const db = await dbPromise;
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS poems (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL DEFAULT '',
      content TEXT NOT NULL DEFAULT '',
      plain_text TEXT NOT NULL DEFAULT '',
      collection TEXT,
      is_favorite INTEGER NOT NULL DEFAULT 0,
      is_archived INTEGER NOT NULL DEFAULT 0,
      word_count INTEGER NOT NULL DEFAULT 0,
      char_count INTEGER NOT NULL DEFAULT 0,
      edit_count INTEGER NOT NULL DEFAULT 0,
      created_date TEXT NOT NULL,
      updated_date TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS collections (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      color TEXT,
      created_date TEXT NOT NULL
    );
  `);
  return db;
}

export function plainTextToHtml(plain: string) {
  return plain
    .split('\n')
    .map((line) => `<p>${line === '' ? '<br>' : line}</p>`)
    .join('');
}

function countWords(text: string) {
  const t = text.trim();
  if (!t) return 0;
  return t.split(/\s+/).length;
}

function sortPoems(items: Poem[], sort: string) {
  const list = [...items];
  list.sort((a, b) => {
    switch (sort) {
      case 'created_date':
        return new Date(a.created_date).getTime() - new Date(b.created_date).getTime();
      case 'title':
        return (a.title || '').localeCompare(b.title || '');
      case '-updated_date':
        return new Date(b.updated_date).getTime() - new Date(a.updated_date).getTime();
      default:
        return new Date(b.created_date).getTime() - new Date(a.created_date).getTime();
    }
  });
  return list;
}

async function uuid() {
  return Crypto.randomUUID();
}

export const db = {
  entities: {
    Poem: {
      async list(sort = '-created_date', limit = 500): Promise<Poem[]> {
        const database = await getDb();
        const rows = await database.getAllAsync<Poem>('SELECT * FROM poems');
        return sortPoems(rows, sort).slice(0, limit);
      },

      async filter(query: Record<string, string>): Promise<Poem[]> {
        const items = await db.entities.Poem.list();
        return items.filter((item) =>
          Object.entries(query).every(([k, v]) => (item as Record<string, unknown>)[k] === v),
        );
      },

      async create(data: Partial<Poem>) {
        const database = await getDb();
        const now = new Date().toISOString();
        const id = await uuid();
        const plain = data.plain_text ?? '';
        const poem: Poem = {
          id,
          title: data.title ?? '',
          content: data.content ?? (plain ? plainTextToHtml(plain) : ''),
          plain_text: plain,
          collection: data.collection ?? null,
          is_favorite: data.is_favorite ? 1 : 0,
          is_archived: data.is_archived ? 1 : 0,
          word_count: data.word_count ?? countWords(plain),
          char_count: data.char_count ?? plain.length,
          edit_count: data.edit_count ?? 0,
          created_date: now,
          updated_date: now,
        };
        await database.runAsync(
          `INSERT INTO poems (id, title, content, plain_text, collection, is_favorite, is_archived, word_count, char_count, edit_count, created_date, updated_date)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            poem.id,
            poem.title,
            poem.content,
            poem.plain_text,
            poem.collection,
            poem.is_favorite,
            poem.is_archived,
            poem.word_count,
            poem.char_count,
            poem.edit_count,
            poem.created_date,
            poem.updated_date,
          ],
        );
        return poem;
      },

      async update(id: string, data: Partial<Poem>) {
        const database = await getDb();
        const rows = await database.getAllAsync<Poem>('SELECT * FROM poems WHERE id = ?', [id]);
        const existing = rows[0];
        if (!existing) throw new Error('Poem not found');
        const plain = data.plain_text ?? existing.plain_text;
        const updated: Poem = {
          ...existing,
          ...data,
          id,
          plain_text: plain,
          content: data.content ?? existing.content ?? plainTextToHtml(plain),
          word_count: data.word_count ?? countWords(plain),
          char_count: data.char_count ?? plain.length,
          updated_date: new Date().toISOString(),
          is_favorite: data.is_favorite !== undefined ? (data.is_favorite ? 1 : 0) : existing.is_favorite,
          is_archived: data.is_archived !== undefined ? (data.is_archived ? 1 : 0) : existing.is_archived,
        };
        await database.runAsync(
          `UPDATE poems SET title=?, content=?, plain_text=?, collection=?, is_favorite=?, is_archived=?, word_count=?, char_count=?, edit_count=?, updated_date=? WHERE id=?`,
          [
            updated.title,
            updated.content,
            updated.plain_text,
            updated.collection,
            updated.is_favorite,
            updated.is_archived,
            updated.word_count,
            updated.char_count,
            updated.edit_count,
            updated.updated_date,
            id,
          ],
        );
        return updated;
      },

      async delete(id: string) {
        const database = await getDb();
        await database.runAsync('DELETE FROM poems WHERE id = ?', [id]);
      },
    },

    Collection: {
      async list(sort = 'name', limit = 100): Promise<Collection[]> {
        const database = await getDb();
        const rows = await database.getAllAsync<Collection>('SELECT * FROM collections ORDER BY name');
        return rows.slice(0, limit);
      },

      async create(data: { name: string; color?: string | null }) {
        const database = await getDb();
        const id = await uuid();
        const col: Collection = {
          id,
          name: data.name,
          color: data.color ?? null,
          created_date: new Date().toISOString(),
        };
        await database.runAsync(
          'INSERT INTO collections (id, name, color, created_date) VALUES (?, ?, ?, ?)',
          [col.id, col.name, col.color, col.created_date],
        );
        return col;
      },

      async update(id: string, data: { name: string; color?: string | null }) {
        const database = await getDb();
        await database.runAsync('UPDATE collections SET name = ?, color = ? WHERE id = ?', [
          data.name,
          data.color ?? null,
          id,
        ]);
        const rows = await database.getAllAsync<Collection>('SELECT * FROM collections WHERE id = ?', [id]);
        return rows[0];
      },

      async delete(id: string) {
        const database = await getDb();
        await database.runAsync('DELETE FROM collections WHERE id = ?', [id]);
      },
    },
  },
};

export async function exportBackup() {
  const poems = await db.entities.Poem.list();
  const collections = await db.entities.Collection.list();
  return {
    poems,
    collections,
    exportDate: new Date().toISOString(),
    version: '1.0',
  };
}

export async function importBackup(data: {
  poems?: Array<Record<string, unknown>>;
  collections?: Array<Record<string, unknown>>;
}) {
  if (data.collections?.length) {
    for (const raw of data.collections) {
      await db.entities.Collection.create({
        name: String(raw.name ?? 'Imported'),
        color: raw.color as string | null,
      });
    }
  }
  let count = 0;
  if (data.poems?.length) {
    for (const raw of data.poems) {
      await db.entities.Poem.create({
        title: String(raw.title ?? ''),
        content: String(raw.content ?? ''),
        plain_text: String(raw.plain_text ?? ''),
        collection: raw.collection as string | null,
        is_favorite: raw.is_favorite ? 1 : 0,
        is_archived: raw.is_archived ? 1 : 0,
        word_count: Number(raw.word_count ?? 0),
        char_count: Number(raw.char_count ?? 0),
      });
      count++;
    }
  }
  return count;
}
