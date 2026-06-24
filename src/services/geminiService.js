const { GoogleGenerativeAI } = require("@google/generative-ai");
const db = require("../db/connection");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function generateAramData(championId, championName) {
  try {
    console.log(`🧠 Solicitando análise do Gemini para: ${championName}...`);

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json" },
    });

    const prompt = `Você é um analista especialista de League of Legends focado em ARAM.
    Crie a build ideal e dicas para o campeão ${championName} no modo ARAM.
    Retorne EXATAMENTE neste formato JSON, sem blocos de código ou formatação markdown:
    {
      "items": ["nome do item 1 em pt_BR", "nome do item 2 em pt_BR", "nome 3", "nome 4", "nome 5", "nome 6"],
      "rune_primary": "Nome da Runa Principal (ex: Eletrocutar)",
      "rune_secondary": "Nome da Árvore Secundária (ex: Precisão)",
      "strengths": "Pontos fortes no ARAM",
      "weaknesses": "Pontos fracos no ARAM",
      "playstyle": "Resumo de como jogar com ele no ARAM"
    }`;

    const result = await model.generateContent(prompt);
    let rawText = result.response.text();

    rawText = rawText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();
    const aiResponse = JSON.parse(rawText);

    console.log(`📥 Salvando os dados gerados de ${championName} no banco...`);

    db.serialize(() => {
      db.run("BEGIN TRANSACTION");

      const stmtBuild = db.prepare(`
        INSERT OR REPLACE INTO builds (champion_id, items, rune_primary, rune_secondary)
        VALUES (?, ?, ?, ?)
      `);
      stmtBuild.run(
        championId,
        JSON.stringify(aiResponse.items),
        aiResponse.rune_primary,
        aiResponse.rune_secondary,
      );
      stmtBuild.finalize();

      const stmtTips = db.prepare(`
        INSERT OR REPLACE INTO aram_tips (champion_id, strengths, weaknesses, playstyle)
        VALUES (?, ?, ?, ?)
      `);
      stmtTips.run(
        championId,
        aiResponse.strengths,
        aiResponse.weaknesses,
        aiResponse.playstyle,
      );
      stmtTips.finalize();

      db.run("COMMIT", () => {
        console.log(
          `✨ Sucesso! Curadoria automática de ${championName} salva no banco.`,
        );
      });
    });

    return true;
  } catch (error) {
    console.error(
      `❌ Erro ao gerar dados para ${championName}:`,
      error.message,
    );
    return false;
  }
}

module.exports = { generateAramData };
