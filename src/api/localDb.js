/**
 * Offline local storage (IndexedDB) for poems and collections.
 */

const DB_NAME = 'bethverse';
const DB_VERSION = 1;

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('poems')) {
        db.createObjectStore('poems', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('collections')) {
        db.createObjectStore('collections', { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function tx(storeName, mode = 'readonly') {
  return openDatabase().then((db) => {
    const transaction = db.transaction(storeName, mode);
    return transaction.objectStore(storeName);
  });
}

function uuid() {
  return crypto.randomUUID();
}

export function plainTextToHtml(plain) {
  return plain
    .split('\n')
    .map((line) => `<p>${line === '' ? '<br>' : line}</p>`)
    .join('');
}

function countWords(text) {
  const t = (text || '').trim();
  if (!t) return 0;
  return t.split(/\s+/).length;
}

function sortPoems(items, sort) {
  const list = [...items];
  list.sort((a, b) => {
    switch (sort) {
      case 'created_date':
        return new Date(a.created_date) - new Date(b.created_date);
      case 'title':
        return (a.title || '').localeCompare(b.title || '');
      case '-updated_date':
        return new Date(b.updated_date) - new Date(a.updated_date);
      case '-created_date':
      default:
        return new Date(b.created_date) - new Date(a.created_date);
    }
  });
  return list;
}

function sortCollections(items, sort) {
  const list = [...items];
  list.sort((a, b) => {
    if (sort === '-name') return b.name.localeCompare(a.name);
    return a.name.localeCompare(b.name);
  });
  return list;
}

async function getAll(storeName) {
  const store = await tx(storeName, 'readonly');
  return new Promise((resolve, reject) => {
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

async function put(storeName, item) {
  const store = await tx(storeName, 'readwrite');
  return new Promise((resolve, reject) => {
    const req = store.put(item);
    req.onsuccess = () => resolve(item);
    req.onerror = () => reject(req.error);
  });
}

async function remove(storeName, id) {
  const store = await tx(storeName, 'readwrite');
  return new Promise((resolve, reject) => {
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

const poemEntity = {
  async list(sort = '-created_date', limit = 500) {
    const items = await getAll('poems');
    return sortPoems(items, sort).slice(0, limit);
  },

  async filter(query, sort, limit) {
    const items = await getAll('poems');
    let filtered = items.filter((item) =>
      Object.entries(query).every(([key, value]) => item[key] === value),
    );
    if (sort) filtered = sortPoems(filtered, sort);
    if (limit) filtered = filtered.slice(0, limit);
    return filtered;
  },

  async create(data) {
    const now = new Date().toISOString();
    const plain = data.plain_text ?? '';
    const poem = {
      id: uuid(),
      title: data.title ?? '',
      content: data.content ?? (plain ? plainTextToHtml(plain) : ''),
      plain_text: plain,
      collection: data.collection ?? null,
      is_favorite: !!data.is_favorite,
      is_archived: !!data.is_archived,
      word_count: data.word_count ?? countWords(plain),
      char_count: data.char_count ?? plain.length,
      edit_count: data.edit_count ?? 0,
      created_date: now,
      updated_date: now,
    };
    await put('poems', poem);
    return poem;
  },

  async update(id, data) {
    const items = await getAll('poems');
    const existing = items.find((p) => p.id === id);
    if (!existing) throw new Error('Poem not found');

    const plain = data.plain_text ?? existing.plain_text ?? '';
    const updated = {
      ...existing,
      ...data,
      id,
      plain_text: plain,
      content: data.content ?? existing.content ?? plainTextToHtml(plain),
      word_count: data.word_count ?? countWords(plain),
      char_count: data.char_count ?? plain.length,
      updated_date: new Date().toISOString(),
    };
    await put('poems', updated);
    return updated;
  },

  async delete(id) {
    await remove('poems', id);
  },
};

const collectionEntity = {
  async list(sort = 'name', limit = 100) {
    const items = await getAll('collections');
    return sortCollections(items, sort).slice(0, limit);
  },

  async create(data) {
    const col = {
      id: uuid(),
      name: data.name ?? 'Untitled',
      color: data.color ?? null,
      created_date: new Date().toISOString(),
    };
    await put('collections', col);
    return col;
  },

  async update(id, data) {
    const items = await getAll('collections');
    const existing = items.find((c) => c.id === id);
    if (!existing) throw new Error('Collection not found');
    const updated = { ...existing, ...data, id };
    await put('collections', updated);
    return updated;
  },

  async delete(id) {
    await remove('collections', id);
  },
};

/** Drop-in replacement for the former cloud entity client. */
export const db = {
  entities: {
    Poem: poemEntity,
    Collection: collectionEntity,
  },
};

export async function exportAll() {
  const poems = await getAll('poems');
  const collections = await getAll('collections');
  return {
    poems,
    collections,
    exportDate: new Date().toISOString(),
    version: '1.0',
  };
}

export async function importBackup(data) {
  if (data.collections && Array.isArray(data.collections)) {
    for (const raw of data.collections) {
      const col = {
        id: raw.id || uuid(),
        name: raw.name ?? 'Imported',
        color: raw.color ?? null,
        created_date: raw.created_date || new Date().toISOString(),
      };
      await put('collections', col);
    }
  }
  if (data.poems && Array.isArray(data.poems)) {
    for (const raw of data.poems) {
      await poemEntity.create({
        title: raw.title,
        content: raw.content,
        plain_text: raw.plain_text,
        collection: raw.collection,
        is_favorite: raw.is_favorite,
        word_count: raw.word_count,
        char_count: raw.char_count,
        is_archived: raw.is_archived,
      });
    }
    return data.poems.length;
  }
  return 0;
}
