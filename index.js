require("dotenv").config();
const express = require("express");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const YAML = require("js-yaml");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

const championsRoutes = require("./src/routes/champions");
const buildsRoutes = require("./src/routes/builds");

app.use(cors());
app.use(express.json());

const swaggerDoc = YAML.load(fs.readFileSync("./swagger.yaml", "utf8"));
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDoc));

app.get("/", (req, res) => {
  res.json({ message: "ARAM Guide API rodando liso! ⚔️" });
});

app.use("/champions", championsRoutes);
app.use("/", buildsRoutes);

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
