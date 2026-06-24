const db = require("./connection");

const createTables = () => {
  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS champions (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        role TEXT,
        image_url TEXT,
        tier TEXT,
        aram_tags TEXT
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS items (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        image_url TEXT,
        description TEXT
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS runes (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        path TEXT,
        image_url TEXT
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS builds (
        champion_id TEXT PRIMARY KEY,
        items TEXT, 
        rune_primary TEXT,
        rune_secondary TEXT,
        FOREIGN KEY(champion_id) REFERENCES champions(id)
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS abilities (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        champion_id TEXT,
        key TEXT,
        name TEXT,
        description TEXT,
        aram_tip TEXT,
        FOREIGN KEY(champion_id) REFERENCES champions(id)
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS aram_tips (
        champion_id TEXT PRIMARY KEY,
        strengths TEXT,
        weaknesses TEXT,
        playstyle TEXT,
        FOREIGN KEY(champion_id) REFERENCES champions(id)
      )
    `);

    console.log("Tabelas criadas/verificadas com sucesso! 🛡️");
  });

  db.close();
};

createTables();
