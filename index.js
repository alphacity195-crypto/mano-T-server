const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");

require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

const openai = new OpenAI({
apiKey: process.env.OPENAI_API_KEY
});

app.get("/", (req, res) => {
res.json({
status: "online",
message: "Mano T esta vivo"
});
});

app.get("/health", (req, res) => {
res.json({
status: "ok",
service: "Mano T"
});
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
console.log("Mano T esta rodando na porta " + PORT + "!");
});
