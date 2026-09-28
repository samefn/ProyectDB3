// ─────────────────────────────────────────────────────────────
//  "MySQL" en memoria para el modo demo.
//  Entiende exactamente las consultas que usa el proyecto:
//  INSERT (normal y masivo con VALUES ?), SELECT * con WHERE / LIMIT / OFFSET,
//  SELECT COUNT(*) y UPDATE ... SET ... WHERE.
//  Respeta llaves primarias, AUTO_INCREMENT, UNIQUE y llaves foráneas,
//  y devuelve errores con los mismos códigos que MySQL (ER_DUP_ENTRY…).
// ─────────────────────────────────────────────────────────────

const SCHEMA = {
  club: {
    columns: ['club_id', 'club_name', 'country', 'city', 'stadium'],
    ints: ['club_id'],
    pk: ['club_id'],
  },
  match: {
    columns: ['match_id', 'date', 'result', 'away_club_id', 'local_club_id'],
    ints: ['match_id', 'away_club_id', 'local_club_id'],
    dates: ['date'],
    pk: ['match_id'],
    fks: [
      { col: 'away_club_id', table: 'club', ref: 'club_id' },
      { col: 'local_club_id', table: 'club', ref: 'club_id' },
    ],
  },
  player: {
    columns: ['player_id', 'first_name', 'last_name', 'age', 'nationality', 'club_id'],
    ints: ['player_id', 'age', 'club_id'],
    pk: ['player_id'],
    autoIncrement: 'player_id',
    notNull: ['first_name', 'last_name', 'club_id'],
    fks: [{ col: 'club_id', table: 'club', ref: 'club_id' }],
  },
  playermatch: {
    columns: ['player_id', 'match_id'],
    ints: ['player_id', 'match_id'],
    pk: ['player_id', 'match_id'],
    fks: [
      { col: 'player_id', table: 'player', ref: 'player_id' },
      { col: 'match_id', table: 'match', ref: 'match_id' },
    ],
  },
  user: {
    columns: ['id', 'name', 'password', 'image'],
    ints: ['id'],
    pk: ['id'],
    autoIncrement: 'id',
    unique: ['name'],
    notNull: ['name', 'password'],
  },
};

let tables = {};
let counters = {};

function reset() {
  tables = {};
  counters = {};
  for (const t of Object.keys(SCHEMA)) {
    tables[t] = [];
    counters[t] = 1;
  }
}
reset();

function sqlError(code, message) {
  const err = new Error(message);
  err.code = code;
  return err;
}

function normalize(sql) {
  return sql
    .replace(/soccerdb\./gi, '')
    .replace(/`/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/;$/, '');
}

function coerce(table, col, value) {
  const s = SCHEMA[table];
  if (value === undefined || value === null || value === '') return value === '' && !s.ints.includes(col) ? '' : null;
  if (s.ints.includes(col)) {
    const n = parseInt(value, 10);
    if (Number.isNaN(n)) throw sqlError('ER_TRUNCATED_WRONG_VALUE_FOR_FIELD', `Incorrect integer value: '${value}' for column '${col}'`);
    return n;
  }
  if (s.dates && s.dates.includes(col)) {
    const str = value instanceof Date ? value.toISOString().slice(0, 10) : String(value).slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(str)) throw sqlError('ER_TRUNCATED_WRONG_VALUE', `Incorrect date value: '${value}' for column '${col}'`);
    return str;
  }
  // En la demo pública se quitan < y > para que nadie pueda inyectar HTML/JS
  // que luego vean otros visitantes (la página muestra datos con innerHTML).
  return String(value).replace(/[<>]/g, '');
}

// Convierte la fila guardada a lo que devolvería mysql2 (DATE → objeto Date)
function output(table, row) {
  const s = SCHEMA[table];
  const out = { ...row };
  (s.dates || []).forEach((c) => {
    if (out[c]) out[c] = new Date(`${out[c]}T00:00:00`);
  });
  return out;
}

function getTable(name) {
  const t = name.toLowerCase();
  if (!SCHEMA[t]) throw sqlError('ER_NO_SUCH_TABLE', `Table 'soccerdb.${name}' doesn't exist`);
  return t;
}

function insertRow(table, cols, values) {
  const s = SCHEMA[table];
  const row = {};
  s.columns.forEach((c) => (row[c] = null));
  cols.forEach((c, i) => {
    if (!s.columns.includes(c)) throw sqlError('ER_BAD_FIELD_ERROR', `Unknown column '${c}' in 'field list'`);
    row[c] = coerce(table, c, values[i]);
  });

  if (s.autoIncrement) {
    const ai = s.autoIncrement;
    if (row[ai] === null) row[ai] = counters[table];
    counters[table] = Math.max(counters[table], row[ai] + 1);
  }
  (s.notNull || []).forEach((c) => {
    if (row[c] === null || row[c] === undefined) throw sqlError('ER_BAD_NULL_ERROR', `Column '${c}' cannot be null`);
  });

  const pkVal = (r) => s.pk.map((c) => r[c]).join('-');
  if (tables[table].some((r) => pkVal(r) === pkVal(row))) {
    throw sqlError('ER_DUP_ENTRY', `Duplicate entry '${pkVal(row)}' for key '${table}.PRIMARY'`);
  }
  (s.unique || []).forEach((c) => {
    if (tables[table].some((r) => r[c] === row[c])) {
      throw sqlError('ER_DUP_ENTRY', `Duplicate entry '${row[c]}' for key '${table}.${c}'`);
    }
  });
  (s.fks || []).forEach((fk) => {
    if (row[fk.col] !== null && !tables[fk.table].some((r) => r[fk.ref] === row[fk.col])) {
      throw sqlError(
        'ER_NO_REFERENCED_ROW_2',
        `Cannot add or update a child row: a foreign key constraint fails (FOREIGN KEY (${fk.col}) REFERENCES ${fk.table} (${fk.ref}))`
      );
    }
  });

  tables[table].push(row);
  return row;
}

// Separa "(1, 'a', NULL), (2, 'b', ?)" en tuplas de valores
function parseTuples(text, args, argIndex) {
  const tuples = [];
  let i = 0;
  let current = null;
  let token = '';
  let inStr = false;
  const pushToken = () => {
    const t = token.trim();
    token = '';
    if (!current) return;
    if (t === '?') current.push(args[argIndex.i++]);
    else if (/^null$/i.test(t)) current.push(null);
    else if (/^-?\d+(\.\d+)?$/.test(t)) current.push(Number(t));
    else if (t.startsWith("'")) current.push(t.slice(1, -1).replace(/''/g, "'"));
    else if (t !== '') current.push(t);
  };
  while (i < text.length) {
    const ch = text[i];
    if (inStr) {
      token += ch;
      if (ch === "'" && text[i + 1] === "'") { token += "'"; i += 2; continue; }
      if (ch === "'") inStr = false;
    } else if (ch === "'") { inStr = true; token += ch; }
    else if (ch === '(') { current = []; token = ''; }
    else if (ch === ',' && current) pushToken();
    else if (ch === ')') { pushToken(); tuples.push(current); current = null; }
    else if (current) token += ch;
    i++;
  }
  return tuples;
}

function parseConditions(where, args, argIndex) {
  if (!where) return [];
  return where.split(/ AND /i).map((cond) => {
    const m = cond.match(/^(\w+) = (.+)$/);
    if (!m) throw sqlError('ER_PARSE_ERROR', `Condición no soportada en modo demo: ${cond}`);
    const raw = m[2].trim();
    let value;
    if (raw === '?') value = args[argIndex.i++];
    else if (raw.startsWith("'")) value = raw.slice(1, -1);
    else value = Number(raw);
    return { col: m[1], value };
  });
}

function matches(table, row, conds) {
  return conds.every(({ col, value }) => {
    const v = coerce(table, col, value);
    return row[col] === v;
  });
}

function execute(rawSql, args = []) {
  const sql = normalize(rawSql);
  const argIndex = { i: 0 };
  let m;

  // INSERT masivo: INSERT INTO t (cols) VALUES ?   con args[0] = [[...], [...]]
  if ((m = sql.match(/^INSERT INTO (\w+) \(([^)]+)\) VALUES \?$/i))) {
    const table = getTable(m[1]);
    const cols = m[2].split(',').map((c) => c.trim());
    const rows = args[0] || [];
    let firstId = null;
    rows.forEach((values) => {
      const r = insertRow(table, cols, values);
      if (firstId === null && SCHEMA[table].autoIncrement) firstId = r[SCHEMA[table].autoIncrement];
    });
    return { affectedRows: rows.length, insertId: firstId || 0 };
  }

  // INSERT normal (con ? o con valores literales, uno o varios registros)
  if ((m = sql.match(/^INSERT INTO (\w+) \(([^)]+)\) VALUES (.+)$/i))) {
    const table = getTable(m[1]);
    const cols = m[2].split(',').map((c) => c.trim());
    const tuples = parseTuples(m[3], args, argIndex);
    let last = null;
    tuples.forEach((values) => (last = insertRow(table, cols, values)));
    const ai = SCHEMA[table].autoIncrement;
    return { affectedRows: tuples.length, insertId: ai && last ? last[ai] : 0 };
  }

  // SELECT COUNT(*) AS alias FROM t
  if ((m = sql.match(/^SELECT COUNT\(\*\)(?: AS (\w+))? FROM (\w+)$/i))) {
    const table = getTable(m[2]);
    return [{ [m[1] || 'COUNT(*)']: tables[table].length }];
  }

  // SELECT * FROM t [WHERE ...] [LIMIT ? OFFSET ?]
  if ((m = sql.match(/^SELECT \* FROM (\w+)(?: WHERE (.+?))?(?: LIMIT (\?|\d+)(?: OFFSET (\?|\d+))?)?$/i))) {
    const table = getTable(m[1]);
    const conds = parseConditions(m[2], args, argIndex);
    let rows = tables[table].filter((r) => matches(table, r, conds));
    if (m[3]) {
      const limit = m[3] === '?' ? Number(args[argIndex.i++]) : Number(m[3]);
      const offset = m[4] ? (m[4] === '?' ? Number(args[argIndex.i++]) : Number(m[4])) : 0;
      rows = rows.slice(offset, offset + limit);
    }
    return rows.map((r) => output(table, r));
  }

  // UPDATE t SET a = ?, b = ? WHERE c = ?
  if ((m = sql.match(/^UPDATE (\w+) SET (.+) WHERE (.+)$/i))) {
    const table = getTable(m[1]);
    const sets = m[2].split(',').map((s) => {
      const [col, val] = s.split('=').map((x) => x.trim());
      return { col, value: val === '?' ? args[argIndex.i++] : val.replace(/^'|'$/g, '') };
    });
    const conds = parseConditions(m[3], args, argIndex);
    let affected = 0;
    tables[table].forEach((r) => {
      if (matches(table, r, conds)) {
        sets.forEach(({ col, value }) => (r[col] = coerce(table, col, value)));
        affected++;
      }
    });
    return { affectedRows: affected, changedRows: affected };
  }

  throw sqlError('ER_PARSE_ERROR', `Consulta no soportada en modo demo: ${sql}`);
}

// Misma interfaz que services/sqlService.js
class MemorySqlConnection {
  constructor() {
    this.isConnected = false;
  }
  connectToDb() {
    this.isConnected = true;
    return Promise.resolve();
  }
  query(sql, args) {
    return new Promise((resolve, reject) => {
      try {
        resolve(execute(sql, args));
      } catch (err) {
        reject(err);
      }
    });
  }
  closeConnection() {
    this.isConnected = false;
    return Promise.resolve();
  }
}

module.exports = { MemorySqlConnection, execute, reset };
