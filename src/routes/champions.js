const express = require("express");
const router = express.Router();
const db = require("../db/connection");

// GET /champions e GET /champions/search?q=nome&role=funcao
router.get(["/", "/search"], (req, res) => {
  const { q, role } = req.query;

  let query = "SELECT * FROM champions WHERE 1=1";
  const params = [];

  if (role) {
    query += " AND LOWER(role) = LOWER(?)";
    params.push(role);
  }

  if (q) {
    query += " AND LOWER(name) LIKE LOWER(?)";
    params.push(`%${q}%`);
  }

  query += " ORDER BY name ASC";

  db.all(query, params, (err, rows) => {
    if (err) {
      return res
        .status(500)
        .json({ error: "Erro ao buscar campeões", details: err.message });
    }
    res.json(rows);
  });
});

// GET /champions/:id
router.get("/:id", (req, res) => {
  const { id } = req.params;

  db.get("SELECT * FROM champions WHERE id = ?", [id], (err, row) => {
    if (err) {
      return res
        .status(500)
        .json({ error: "Erro ao buscar o campeão", details: err.message });
    }

    if (!row) {
      return res.status(404).json({ error: "Campeão não encontrado" });
    }

    res.json(row);
  });
});

module.exports = router;
