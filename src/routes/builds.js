const express = require("express");
const router = express.Router();
const db = require("../db/connection");

// GET /champions/:id/build
router.get("/champions/:id/build", (req, res) => {
  const { id } = req.params;

  const query = `
    SELECT b.items, b.rune_primary, b.rune_secondary, t.strengths, t.weaknesses, t.playstyle
    FROM builds b
    LEFT JOIN aram_tips t ON b.champion_id = t.champion_id
    WHERE b.champion_id = ?
  `;

  db.get(query, [id], (err, row) => {
    if (err) {
      return res
        .status(500)
        .json({ error: "Erro ao buscar a build", details: err.message });
    }
    if (!row) {
      return res.status(404).json({
        message: "Build ainda não cadastrada para este campeão no ARAM.",
      });
    }

    if (row.items) {
      try {
        row.items = JSON.parse(row.items);
      } catch (e) {}
    }

    res.json(row);
  });
});

// GET /champions/:id/abilities
router.get("/champions/:id/abilities", (req, res) => {
  const { id } = req.params;

  db.all(
    "SELECT * FROM abilities WHERE champion_id = ? ORDER BY key ASC",
    [id],
    (err, rows) => {
      if (err) {
        return res
          .status(500)
          .json({ error: "Erro ao buscar habilidades", details: err.message });
      }
      if (rows.length === 0) {
        return res
          .status(404)
          .json({ message: "Habilidades não encontradas." });
      }
      res.json(rows);
    },
  );
});

// GET /items/:id
router.get("/items/:id", (req, res) => {
  const { id } = req.params;
  db.get("SELECT * FROM items WHERE id = ?", [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ message: "Item não encontrado." });
    res.json(row);
  });
});

// GET /runes/:id
router.get("/runes/:id", (req, res) => {
  const { id } = req.params;
  db.get("SELECT * FROM runes WHERE id = ?", [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ message: "Runa não encontrada." });
    res.json(row);
  });
});

module.exports = router;
