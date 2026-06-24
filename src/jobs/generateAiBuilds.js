require("dotenv").config();
const db = require("../db/connection");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchFromAiWithFallback(prompt) {
  const modelsToTry = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-3.5-flash",
  ];

  for (let i = 0; i < modelsToTry.length; i++) {
    const modelName = modelsToTry[i];
    try {
      console.log(`   └─ Chamando servidor: ${modelName}...`);
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: { responseMimeType: "application/json" },
      });

      return await model.generateContent(prompt);
    } catch (error) {
      console.log(
        `   └─ Erro no ${modelName}: ${error.message.substring(0, 60)}...`
      );
      if (i === modelsToTry.length - 1) {
        throw error;
      }
    }
  }
}

async function runAiCuratorBatch() {
  console.log("🤖 Iniciando Curador de ARAM...");

  const processBatch = () => {
    db.all(
      `
      SELECT id, name FROM champions 
      WHERE id NOT IN (SELECT champion_id FROM builds) 
      ORDER BY name ASC 
      LIMIT 5
      `,
      async (err, champions) => {
        if (err) {
          console.error("❌ Erro no banco:", err.message);
          process.exit(1);
        }

        if (champions.length === 0) {
          console.log("\n🎉 SUCESSO! O banco está populado!");
          process.exit(0);
        }

        const namesStr = champions.map((c) => c.name).join(", ");
        console.log(`\n🧠 Analisando lote: ${namesStr}`);

        try {
          const prompt = `Você é um analista especialista de League of Legends focado em ARAM.
        Crie a build ideal e dicas para os seguintes campeões no modo ARAM: ${namesStr}.
        Retorne EXATAMENTE um ARRAY JSON contendo um objeto para cada campeão.
        Formato OBRIGATÓRIO:
        [
          {
            "championName": "Nome do Campeão",
            "items": ["item 1 pt_BR", "item 2", "item 3", "item 4", "item 5", "item 6"],
            "rune_primary": "Runa Principal",
            "rune_secondary": "Árvore Secundária",
            "strengths": "Pontos fortes no ARAM",
            "weaknesses": "Pontos fracos no ARAM",
            "playstyle": "Resumo de como jogar"
          }
        ]`;

          const result = await fetchFromAiWithFallback(prompt);

          let rawText = result.response.text();
          rawText = rawText
            .replace(/```json/g, "")
            .replace(/```/g, "")
            .trim();
          const aiResponseArray = JSON.parse(rawText);

          db.serialize(() => {
            db.run("BEGIN TRANSACTION");
            const stmtBuild = db.prepare(
              `INSERT OR REPLACE INTO builds (champion_id, items, rune_primary, rune_secondary) VALUES (?, ?, ?, ?)`
            );
            const stmtTips = db.prepare(
              `INSERT OR REPLACE INTO aram_tips (champion_id, strengths, weaknesses, playstyle) VALUES (?, ?, ?, ?)`
            );

            aiResponseArray.forEach((data) => {
              const champ = champions.find(
                (c) => c.name.toLowerCase() === data.championName.toLowerCase()
              );
              if (champ) {
                stmtBuild.run(
                  champ.id,
                  JSON.stringify(data.items),
                  data.rune_primary,
                  data.rune_secondary
                );
                stmtTips.run(
                  champ.id,
                  data.strengths,
                  data.weaknesses,
                  data.playstyle
                );
              }
            });

            stmtBuild.finalize();
            stmtTips.finalize();

            db.run("COMMIT", () => {
              console.log(`✨ Lote salvo com sucesso no banco local!`);
            });
          });

          await sleep(10000);
        } catch (error) {
          console.log(
            "⚠️ Erro ao processar lote. Dormindo 60 segundos antes de tentar novamente..."
          );
          await sleep(60000);
        }

        processBatch();
      }
    );
  };

  processBatch();
}

runAiCuratorBatch();
