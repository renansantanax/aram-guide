# ⚔️ ARAM Guide API

> Projeto pessoal feito pra quem tá aprendendo a jogar ARAM no LoL (eu) :)

Uma API REST que fornece builds, runas, habilidades e dicas otimizadas para o modo ARAM do League of Legends. Os dados de campeões e itens vêm do **Data Dragon** (API oficial da Riot) e as builds são geradas com **IA** via Gemini.

---

## 🚀 Tecnologias

- **Node.js** + **Express** — servidor e rotas
- **SQLite** — banco de dados local
- **Gemini AI** — geração automática de builds e dicas de ARAM
- **Data Dragon** (Riot Games) — dados de campeões, itens e runas
- **node-cron** — job de sincronização automática com novos patches

---

## 📁 Estrutura do projeto

```
aram-guide/
├── src/
│   ├── routes/
│   │   ├── champions.js     # Rotas de campeões
│   │   └── builds.js        # Rotas de builds, habilidades, itens e runas
│   ├── services/
│   │   ├── dataDragon.js    # Integração com a API da Riot
│   │   └── geminiService.js # Geração de builds com IA
│   ├── jobs/
│   │   ├── syncPatch.js     # Sincroniza dados do patch atual
│   │   └── generateAiBuilds.js # Gera builds via Gemini para todos os campeões
│   └── db/
│       ├── connection.js    # Conexão com o SQLite
│       └── migrations.js    # Criação das tabelas
├── index.js                 # Entry point
├── swagger.yaml             # Documentação da API (OpenAPI 3.0)
└── package.json
```

---

## ⚙️ Como rodar

**Pré-requisitos:** Node.js 18+ e uma chave de API do Gemini

**1. Clone o repositório**
```bash
git clone https://github.com/renansantanax/aram-guide.git
cd aram-guide
```

**2. Instale as dependências**
```bash
npm install
```

**3. Configure as variáveis de ambiente**

Crie um arquivo `.env` na raiz:
```env
GEMINI_API_KEY=sua_chave_aqui
PORT=3000
```

**4. Popule o banco de dados**

Primeiro, sincronize os campeões, itens, runas e habilidades a partir do Data Dragon (API da Riot):
```bash
node src/jobs/syncPatch.js
```

Depois, gere as builds com a IA. Esse job processa os campeões em lotes de 5 e usa a `GEMINI_API_KEY` do `.env` — **sem ela esse passo não funciona**. Pra conseguir a chave, acesse [aistudio.google.com](https://aistudio.google.com) e crie uma gratuitamente:
```bash
node src/jobs/generateAiBuilds.js
```

> ⚠️ O job roda em loop até processar todos os ~160 campeões. Ele já tem pausas automáticas entre os lotes pra não estourar o rate limit do Gemini.

**5. Rode o servidor**
```bash
npm run dev   # com hot-reload (nodemon)
npm start     # produção
```

A API estará disponível em `http://localhost:3000` ✅

---

## 📖 Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/champions` | Lista todos os campeões |
| GET | `/champions?q=ez&role=Marksman` | Busca por nome e/ou função |
| GET | `/champions/:id` | Dados de um campeão específico |
| GET | `/champions/:id/build` | Build de ARAM com runas e dicas |
| GET | `/champions/:id/abilities` | Habilidades com tips de ARAM |
| GET | `/items/:id` | Detalhes de um item |
| GET | `/runes/:id` | Detalhes de uma runa |

A documentação completa está no `swagger.yaml` — pode jogar no [Swagger Editor](https://editor.swagger.io) pra visualizar bonitinho, ou servir via `swagger-ui-express`:

```bash
npm install swagger-ui-express js-yaml
```

```js
// index.js
const swaggerUi = require('swagger-ui-express');
const YAML = require('js-yaml');
const fs = require('fs');

const swaggerDoc = YAML.load(fs.readFileSync('./swagger.yaml', 'utf8'));
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc));
// Acesse: http://localhost:3000/docs
```

---

## 🤖 Como as builds são geradas

1. O job `syncPatch.js` puxa os dados mais recentes do Data Dragon (campeões, itens, runas) e salva no SQLite
2. O job `generateAiBuilds.js` envia os dados de cada campeão pro Gemini e pede uma build otimizada para ARAM
3. O Gemini retorna os itens recomendados, runas, forças, fraquezas e estilo de jogo
4. Tudo fica salvo no banco e disponível via API

---

## 🗄️ Banco de dados

| Tabela | O que armazena |
|--------|---------------|
| `champions` | Nome, função, tier no ARAM, imagem |
| `builds` | Itens e runas por campeão |
| `abilities` | Habilidades com dicas de ARAM |
| `aram_tips` | Forças, fraquezas e playstyle |
| `items` | Catálogo de itens |
| `runes` | Catálogo de runas |

---

## 📝 Licença

ISC — faz o que quiser, é só um projeto de estudos mesmo haha
