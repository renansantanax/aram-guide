const {
  syncChampions,
  syncAbilities,
  syncItems,
  syncRunes,
} = require("../services/dataDragon");

async function runSync() {
  console.log("🚀 Iniciando rotina de sincronização COMPLETA do ARAM Guide...");

  await syncChampions();
  await syncAbilities();
  await syncItems();
  await syncRunes();

  setTimeout(() => {
    console.log(
      "Rotina 100% finalizada com sucesso! O banco está populado. ⚔️",
    );
    process.exit(0);
  }, 8000);
}

runSync();
