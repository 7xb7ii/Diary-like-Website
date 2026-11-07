import { PEOPLE, SAMPLE_ENTRIES } from "./app-config.js";

const DB_NAME = "tandem-local";
const OBJECT_STORE = "tables";
const SESSION_KEY = "tandemSession";
const BROADCAST_NAME = "tandem-changes";
const TABLES = ["profiles", "posts", "comments", "likes", "post_stickers", "widgets"];
const ENTRIES_SEEDED_KEY = "entriesSeeded";

const CASCADES = {
  posts: [
    ["comments", "post_id"],
    ["likes", "post_id"],
    ["post_stickers", "post_id"],
  ],
  comments: [
    ["comments", "parent_comment_id"],
    ["likes", "comment_id"],
  ],
};

function createId() {
  return crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function seedProfiles() {
  const now = new Date().toISOString();
  return PEOPLE.map((person) => ({
    id: person.id,
    nickname: person.name,
    username: person.name.toLowerCase(),
    avatar_url: "",
    bio: "",
    theme: "nebula",
    last_seen_at: null,
    created_at: now,
    updated_at: now,
  }));
}

function seedEntries() {
  return SAMPLE_ENTRIES.map(({ author, daysAgo, content }) => {
    const date = new Date(Date.now() - daysAgo * 86400000).toISOString();
    return {
      id: createId(),
      user_id: PEOPLE[author].id,
      content,
      created_at: date,
      updated_at: date,
    };
  });
}

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(OBJECT_STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function runRequest(db, mode, run) {
  return new Promise((resolve, reject) => {
    const request = run(db.transaction(OBJECT_STORE, mode).objectStore(OBJECT_STORE));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function splitColumns(text) {
  return text
    .split(",")
    .map((column) => column.trim())
    .filter(Boolean);
}

function parseSelect(columns = "*") {
  const embeds = [];
  const plain = String(columns).replace(/(\w+)\s*\(([^)]*)\)/g, (_, table, inner) => {
    embeds.push({ table, columns: splitColumns(inner) });
    return "";
  });
  return { columns: splitColumns(plain), embeds };
}

function pick(row, columns) {
  if (!columns.length || columns.includes("*")) return { ...row };
  return Object.fromEntries(columns.map((column) => [column, row[column] ?? null]));
}

function likeToRegExp(pattern) {
  let source = "";
  for (let index = 0; index < pattern.length; index += 1) {
    const char = pattern[index];
    if (char === "\\" && index + 1 < pattern.length) {
      index += 1;
      source += pattern[index].replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    } else if (char === "%") {
      source += ".*";
    } else if (char === "_") {
      source += ".";
    } else {
      source += char.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }
  }
  return new RegExp(`^${source}$`, "is");
}

class Query {
  constructor(store, table) {
    this.store = store;
    this.table = table;
    this.action = "select";
    this.payload = null;
    this.projection = parseSelect();
    this.returnsRows = true;
    this.filters = [];
    this.sort = null;
    this.maxRows = Infinity;
    this.singleMode = "";
  }

  select(columns = "*") {
    this.projection = parseSelect(columns);
    this.returnsRows = true;
    return this;
  }

  insert(payload) {
    return this.write("insert", payload);
  }

  update(payload) {
    return this.write("update", payload);
  }

  delete() {
    return this.write("delete", null);
  }

  write(action, payload) {
    this.action = action;
    this.payload = payload;
    this.returnsRows = false;
    return this;
  }

  eq(column, value) {
    this.filters.push((row) => row[column] === value);
    return this;
  }

  gte(column, value) {
    this.filters.push((row) => row[column] >= value);
    return this;
  }

  in(column, values) {
    const allowed = new Set(values);
    this.filters.push((row) => allowed.has(row[column]));
    return this;
  }

  ilike(column, pattern) {
    const matcher = likeToRegExp(pattern);
    this.filters.push((row) => matcher.test(String(row[column] ?? "")));
    return this;
  }

  order(column, { ascending = true } = {}) {
    this.sort = { column, direction: ascending ? 1 : -1 };
    return this;
  }

  limit(count) {
    this.maxRows = count;
    return this;
  }

  single() {
    this.singleMode = "single";
    return this;
  }

  maybeSingle() {
    this.singleMode = "maybe";
    return this;
  }

  then(onDone, onFail) {
    return this.run().then(onDone, onFail);
  }

  async run() {
    try {
      await this.store.ready;
      const rows = await this[`run${this.action[0].toUpperCase()}${this.action.slice(1)}`]();
      return this.shape(rows);
    } catch (error) {
      console.error(error);
      return { data: null, error: { message: error?.message || "could not save that" } };
    }
  }

  matchingRows() {
    return this.store.tables[this.table].filter((row) =>
      this.filters.every((filter) => filter(row)),
    );
  }

  async runSelect() {
    const rows = this.matchingRows();
    if (this.sort) {
      const { column, direction } = this.sort;
      rows.sort((a, b) =>
        a[column] < b[column] ? -direction : a[column] > b[column] ? direction : 0,
      );
    }
    return rows.slice(0, this.maxRows);
  }

  async runInsert() {
    const now = new Date().toISOString();
    const rows = (Array.isArray(this.payload) ? this.payload : [this.payload]).map((row) => ({
      id: createId(),
      created_at: now,
      updated_at: now,
      ...row,
    }));
    const table = this.store.tables[this.table];
    if (rows.some((row) => table.some((existing) => existing.id === row.id))) {
      throw new Error("that already exists");
    }
    table.push(...rows);
    await this.store.commit(
      this.table,
      rows.map((row) => ({ eventType: "INSERT", new: row, old: {} })),
    );
    return rows;
  }

  async runUpdate() {
    const now = new Date().toISOString();
    const changes = this.matchingRows().map((row) => {
      const old = { ...row };
      Object.assign(row, { updated_at: now }, this.payload);
      return { eventType: "UPDATE", new: row, old };
    });
    if (changes.length) await this.store.commit(this.table, changes);
    return changes.map((change) => change.new);
  }

  async runDelete() {
    const rows = this.matchingRows();
    await this.store.removeRows(this.table, rows);
    return rows;
  }

  shape(rows) {
    if (!this.returnsRows) return { data: null, error: null };

    const data = rows.map((row) => {
      const shaped = pick(row, this.projection.columns);
      this.projection.embeds.forEach(({ table, columns }) => {
        const related = this.store.tables[table]?.find((item) => item.id === row.user_id);
        shaped[table] = related ? pick(related, columns) : null;
      });
      return shaped;
    });

    if (!this.singleMode) return { data, error: null };
    if (data.length === 1 || (this.singleMode === "maybe" && !data.length)) {
      return { data: data[0] ?? null, error: null };
    }
    return { data: null, error: { message: "expected one row" } };
  }
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function toUser(person) {
  return { id: person.id, email: person.email, user_metadata: {} };
}

function readSessionUser() {
  try {
    const person = PEOPLE.find((item) => item.id === localStorage.getItem(SESSION_KEY));
    return person ? toUser(person) : null;
  } catch {
    return null;
  }
}

function createAuth() {
  const listeners = new Set();
  const session = () => {
    const user = readSessionUser();
    return user ? { user } : null;
  };

  return {
    getSession: async () => ({ data: { session: session() }, error: null }),
    getUser: async () => ({ data: { user: readSessionUser() }, error: null }),
    refreshSession: async () => ({ data: { session: session() }, error: null }),

    async signInWithPassword({ email }) {
      const person = PEOPLE.find(
        (item) => item.email.toLowerCase() === String(email).toLowerCase(),
      );
      if (!person) {
        return {
          data: { user: null },
          error: { message: "that email isn't one of the two accounts" },
        };
      }
      localStorage.setItem(SESSION_KEY, person.id);
      const user = toUser(person);
      listeners.forEach((listener) => listener("SIGNED_IN", { user }));
      return { data: { user, session: { user } }, error: null };
    },

    async signOut() {
      localStorage.removeItem(SESSION_KEY);
      listeners.forEach((listener) => listener("SIGNED_OUT", null));
      return { error: null };
    },

    onAuthStateChange(listener) {
      listeners.add(listener);
      return { data: { subscription: { unsubscribe: () => listeners.delete(listener) } } };
    },
  };
}

export function createLocalStore() {
  const uploads = new Map();
  const channels = new Set();
  const broadcast = "BroadcastChannel" in window ? new BroadcastChannel(BROADCAST_NAME) : null;

  const store = {
    tables: Object.fromEntries(TABLES.map((table) => [table, []])),
    db: null,

    async load() {
      this.db = await openDatabase();
      await Promise.all(
        TABLES.map(async (table) => {
          this.tables[table] =
            (await runRequest(this.db, "readonly", (objects) => objects.get(table))) || [];
        }),
      );
      if (!this.tables.profiles.length) {
        this.tables.profiles = seedProfiles();
        await this.save("profiles");
      }

      const seeded = await runRequest(this.db, "readonly", (objects) =>
        objects.get(ENTRIES_SEEDED_KEY),
      );
      if (!seeded) {
        if (!this.tables.posts.length) {
          this.tables.posts = seedEntries();
          await this.save("posts");
        }
        await runRequest(this.db, "readwrite", (objects) => objects.put(true, ENTRIES_SEEDED_KEY));
      }
    },

    save(table) {
      return runRequest(this.db, "readwrite", (objects) => objects.put(this.tables[table], table));
    },

    async commit(table, changes) {
      await this.save(table);
      broadcast?.postMessage({ table, changes });
    },

    async removeRows(table, rows) {
      if (!rows.length) return;
      const removed = new Set(rows);
      this.tables[table] = this.tables[table].filter((row) => !removed.has(row));
      await this.commit(
        table,
        rows.map((row) => ({ eventType: "DELETE", new: {}, old: row })),
      );

      for (const [childTable, column] of CASCADES[table] || []) {
        const ids = new Set(rows.map((row) => row.id));
        await this.removeRows(
          childTable,
          this.tables[childTable].filter((row) => ids.has(row[column])),
        );
      }
    },
  };
  store.ready = store.load();

  if (broadcast) {
    broadcast.onmessage = async ({ data: { table, changes } }) => {
      await store.ready;
      store.tables[table] =
        (await runRequest(store.db, "readonly", (objects) => objects.get(table))) || [];
      channels.forEach((channel) => channel.emit(table, changes));
    };
  }

  return {
    from: (table) => new Query(store, table),

    storage: {
      from: (bucket) => ({
        async upload(path, blob) {
          uploads.set(`${bucket}/${path}`, await blobToDataUrl(blob));
          return { data: { path }, error: null };
        },
        getPublicUrl: (path) => ({ data: { publicUrl: uploads.get(`${bucket}/${path}`) || "" } }),
      }),
    },

    auth: createAuth(),

    channel() {
      const handlers = [];
      const channel = {
        on(_event, { table }, handler) {
          handlers.push({ table, handler });
          return channel;
        },
        emit(table, changes) {
          handlers
            .filter((item) => item.table === table)
            .forEach(({ handler }) => changes.forEach((change) => handler(change)));
        },
        subscribe(callback) {
          channels.add(channel);
          callback?.("SUBSCRIBED");
          return channel;
        },
        unsubscribe() {
          channels.delete(channel);
        },
      };
      return channel;
    },
  };
}
