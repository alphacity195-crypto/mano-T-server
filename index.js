const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");
const fs = require("fs");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// ============================
// MEMÓRIA PERMANENTE
// ============================

const arquivoMemoria = "memoria.json";

let historico = [];

if (fs.existsSync(arquivoMemoria)) {
    try {
        historico = JSON.parse(
            fs.readFileSync(arquivoMemoria, "utf8")
        );
        console.log("🧠 Memória carregada!");
    } catch (erro) {
        console.log("⚠️ Não foi possível carregar a memória.");
        historico = [];
    }
}

// ============================
// PÁGINA INICIAL
// ============================

app.get("/", (req, res) => {
    res.json({
        status: "online",
        message: "Mano T está vivo 🤖"
    });
});

// ============================
// CHAT
// ============================

app.post("/chat", async (req, res) => {
    try {
        const mensagem = req.body.mensagem;

        if (!mensagem) {
            return res.status(400).json({
                erro: "Mensagem não enviada"
            });
        }

        // Guarda a mensagem do usuário
        historico.push({
            role: "user",
            content: mensagem
        });

        const resposta = await openai.responses.create({
            model: "gpt-5.6-luna",

            instructions:
                "Você é o Mano T, uma IA pessoal amigável, natural e prestativa. " +
                "Responda em português do Brasil. " +
                "Use o histórico da conversa para manter o contexto e lembrar informações importantes.",

            input: historico
        });

        const textoResposta = resposta.output_text;

        // Guarda a resposta do Mano T
        historico.push({
            role: "assistant",
            content: textoResposta
        });

        // Salva a memória no computador
        fs.writeFileSync(
            arquivoMemoria,
            JSON.stringify(historico, null, 2),
            "utf8"
        );

        res.json({
            resposta: textoResposta
        });

    } catch (erro) {
        console.error(erro);

        res.status(500).json({
            erro: "O Mano T teve um problema ao pensar."
        });
    }
});

// ============================
// INICIAR SERVIDOR
// ============================

app.listen(3000, () => {
    console.log("🤖 Mano T está rodando na porta 3000!");
});