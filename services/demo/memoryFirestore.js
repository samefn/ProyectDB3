// ─────────────────────────────────────────────────────────────
//  "Firestore" en memoria para el modo demo.
//  Implementa la parte de la API de firebase-admin que usa el proyecto:
//  db.collection(x).get() / .doc(id).get() / .doc(id).set(data)
//  y subcolecciones: .doc(id).collection(sub)
// ─────────────────────────────────────────────────────────────

let root = new Map(); // nombre de colección -> Map(id -> { data, subs: Map })

function reset() {
  root = new Map();
}

const clone = (v) => (v === undefined ? v : JSON.parse(JSON.stringify(v)));

// En la demo pública se quitan < y > de los textos para evitar inyección de HTML/JS
const sanitize = (v) => {
  if (typeof v === 'string') return v.replace(/[<>]/g, '');
  if (Array.isArray(v)) return v.map(sanitize);
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, sanitize(x)]));
  return v;
};

function makeDocSnapshot(id, entry) {
  return {
    id,
    exists: Boolean(entry && entry.data),
    data: () => (entry && entry.data ? clone(entry.data) : undefined),
  };
}

class CollectionRef {
  constructor(getMap) {
    this._getMap = getMap; // devuelve (y crea si falta) el Map de la colección
  }
  doc(id) {
    return new DocRef(this._getMap, String(id));
  }
  async get() {
    const docs = [...this._getMap().entries()]
      .filter(([, e]) => e.data)
      .map(([id, e]) => makeDocSnapshot(id, e));
    return {
      docs,
      size: docs.length,
      empty: docs.length === 0,
      forEach: (fn) => docs.forEach(fn),
    };
  }
  async add(data) {
    const id = Math.random().toString(36).slice(2, 12);
    await this.doc(id).set(data);
    return this.doc(id);
  }
}

class DocRef {
  constructor(getParentMap, id) {
    this._getParentMap = getParentMap;
    this.id = id;
  }
  _entry(create = false) {
    const map = this._getParentMap();
    if (!map.has(this.id) && create) map.set(this.id, { data: null, subs: new Map() });
    return map.get(this.id);
  }
  async get() {
    return makeDocSnapshot(this.id, this._entry());
  }
  async set(data, options = {}) {
    const e = this._entry(true);
    const clean = sanitize(clone(data));
    e.data = options.merge && e.data ? { ...e.data, ...clean } : clean;
  }
  async update(data) {
    const e = this._entry();
    if (!e || !e.data) {
      const err = new Error(`No document to update: ${this.id}`);
      err.code = 5;
      throw err;
    }
    e.data = { ...e.data, ...sanitize(clone(data)) };
  }
  async delete() {
    this._getParentMap().delete(this.id);
  }
  collection(name) {
    return new CollectionRef(() => {
      const e = this._entry(true);
      if (!e.subs.has(name)) e.subs.set(name, new Map());
      return e.subs.get(name);
    });
  }
}

const db = {
  collection(name) {
    return new CollectionRef(() => {
      if (!root.has(name)) root.set(name, new Map());
      return root.get(name);
    });
  },
};

module.exports = { db, reset };
