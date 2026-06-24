const axios = require("axios");
const db = require("../db/connection");

const BASE_URL = "https://ddragon.leagueoflegends.com";

async function getLatestVersion() {
  const response = await axios.get(`${BASE_URL}/api/versions.json`);
  return response.data[0];
}

async function syncChampions() {
  try {
    console.log("🔄 Buscando versão mais recente do Data Dragon...");
    const version = await getLatestVersion();
    console.log(`✅ Versão atual: ${version}`);

    console.log("🔄 Baixando dados dos Campeões...");
    const response = await axios.get(
      `${BASE_URL}/cdn/${version}/data/pt_BR/champion.json`
    );
    const championsData = response.data.data;

    console.log("📥 Salvando no banco de dados...");

    db.serialize(() => {
      db.run("BEGIN TRANSACTION");

      const stmt = db.prepare(`
        INSERT OR REPLACE INTO champions (id, name, role, image_url) 
        VALUES (?, ?, ?, ?)
      `);

      let count = 0;
      for (const key in championsData) {
        const champ = championsData[key];
        const role =
          champ.tags && champ.tags.length > 0 ? champ.tags[0] : "Desconhecido";
        const imageUrl = `${BASE_URL}/cdn/${version}/img/champion/${champ.image.full}`;

        stmt.run(champ.id, champ.name, role, imageUrl);
        count++;
      }

      stmt.finalize();

      db.run("COMMIT", () => {
        console.log(`✨ Sucesso! ${count} campeões sincronizados.`);
      });
    });
  } catch (error) {
    console.error("❌ Erro ao sincronizar com o Data Dragon:", error.message);
  }
}

async function syncAbilities() {
  try {
    console.log("🔄 Baixando championFull.json...");
    const version = await getLatestVersion();

    const response = await axios.get(
      `${BASE_URL}/cdn/${version}/data/pt_BR/championFull.json`
    );
    const championsData = response.data.data;

    console.log("📥 Salvando habilidades no banco de dados...");

    db.serialize(() => {
      db.run("BEGIN TRANSACTION");
      db.run("DELETE FROM abilities");

      const stmt = db.prepare(`
        INSERT INTO abilities (champion_id, key, name, description)
        VALUES (?, ?, ?, ?)
      `);

      let count = 0;
      const spellKeys = ["Q", "W", "E", "R"];

      for (const champId in championsData) {
        const champ = championsData[champId];

        champ.spells.forEach((spell, index) => {
          if (index < 4) {
            const cleanDescription = spell.description.replace(
              /(<([^>]+)>)/gi,
              ""
            );

            stmt.run(champId, spellKeys[index], spell.name, cleanDescription);
            count++;
          }
        });
      }

      stmt.finalize();

      db.run("COMMIT", () => {
        console.log(`✨ Sucesso! ${count} habilidades sincronizadas no banco.`);
      });
    });
  } catch (error) {
    console.error("❌ Erro ao sincronizar habilidades com o Data Dragon:", error.message);
  }
}

async function syncItems() {
  try {
    const version = await getLatestVersion();
    console.log("🔄 Baixando dados dos Itens...");

    const response = await axios.get(
      `${BASE_URL}/cdn/${version}/data/pt_BR/item.json`
    );
    const itemsData = response.data.data;

    console.log("📥 Salvando itens no banco de dados...");

    db.serialize(() => {
      db.run("BEGIN TRANSACTION");

      const stmt = db.prepare(`
        INSERT OR REPLACE INTO items (id, name, image_url, description)
        VALUES (?, ?, ?, ?)
      `);

      let count = 0;
      for (const id in itemsData) {
        const item = itemsData[id];
        const cleanDescription = item.description.replace(/(<([^>]+)>)/gi, "");
        const imageUrl = `${BASE_URL}/cdn/${version}/img/item/${item.image.full}`;

        stmt.run(id, item.name, imageUrl, cleanDescription);
        count++;
      }

      stmt.finalize();
      db.run("COMMIT", () => {
        console.log(`✨ Sucesso! ${count} itens sincronizados.`);
      });
    });
  } catch (error) {
    console.error("❌ Erro ao sincronizar itens:", error.message);
  }
}

async function syncRunes() {
  try {
    const version = await getLatestVersion();
    console.log("🔄 Baixando dados das Runas...");

    const response = await axios.get(
      `${BASE_URL}/cdn/${version}/data/pt_BR/runesReforged.json`
    );
    const runesData = response.data;

    console.log("📥 Salvando runas no banco de dados...");

    db.serialize(() => {
      db.run("BEGIN TRANSACTION");

      const stmt = db.prepare(`
        INSERT OR REPLACE INTO runes (id, name, path, image_url)
        VALUES (?, ?, ?, ?)
      `);

      let count = 0;
      runesData.forEach((tree) => {
        const pathName = tree.name;

        tree.slots.forEach((slot) => {
          slot.runes.forEach((rune) => {
            const imageUrl = `${BASE_URL}/cdn/img/${rune.icon}`;
            stmt.run(rune.id, rune.name, pathName, imageUrl);
            count++;
          });
        });
      });

      stmt.finalize();
      db.run("COMMIT", () => {
        console.log(`✨ Sucesso! ${count} runas sincronizadas.`);
      });
    });
  } catch (error) {
    console.error("❌ Erro ao sincronizar runas:", error.message);
  }
}

module.exports = {
  syncChampions,
  syncAbilities,
  syncItems,
  syncRunes,
};
