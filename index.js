```js
const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");
const fs = require("fs");
require("dotenv").config();

const app = express();

// ============================
// CONFIGURAÇÕES
// ============================

app.use(cors());
app.use(express.json());

// ============================
// OPENAI
// ============================

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// ============================
// MEMÓRIA
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
// HEALTH CHECK
// ============================

app.get("/health", (req, res) => {
    res.json({
        status: "ok",
        service: "Mano T",
        timestamp: new Date().toISOString()
    });
});

// ============================
// CHAT
// ============================

app.post("/chat", async (req, res) => {
    try {
        const mensagem = req.body.mensagem;

        if (!mensagem || typeof mensagem !== "string") {
            return res.status(400).json({
                erro: "Mensagem não enviada"
            });
        }

        // Guarda a mensagem do usuário
        historico.push({
            role: "user",
            content: mensagem
        });

        // Usa apenas as últimas 30 mensagens como contexto
        const contexto = historico.slice(-30);

        // Envia para a OpenAI
        const resposta = await openai.responses.create({
            model: "gpt-5.6-luna",

            instructions:
                "Você é o Mano T, uma IA pessoal amigável, natural e prestativa. " +
                "Responda sempre em português do Brasil. " +
                "Use o histórico da conversa para manter o contexto. " +
                "Seja natural, direto e parceiro.",

            input: contexto
        });

        const textoResposta = resposta.output_text;

        // Guarda a resposta do Mano T
        historico.push({
            role: "assistant",
            content: textoResposta
        });

        // Salva a memória
        try {
            fs.writeFileSync(
                arquivoMemoria,
                JSON.stringify(historico, null, 2),
                "utf8"
            );
        } catch (erroMemoria) {
            console.log(
                "⚠️ Não foi possível salvar a memória:",
                erroMemoria.message
            );
        }

        // Envia resposta para o usuário
        res.json({
            resposta: textoResposta
        });

    } catch (erro) {
        console.error("❌ Erro no chat:", erro);

        res.status(500).json({
            erro: "O Mano T teve um problema ao pensar."
        });
    }
});

// ============================
// ROTA NÃO ENCONTRADA
// ============================

app.use((req, res) => {
    res.status(404).json({
        erro: "Rota não encontrada",
        caminho: req.path
    });
});

// ============================
// INICIAR SERVIDOR
// ============================

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
    console.log(`🤖 Mano T está rodando na porta ${PORT}!`);
});
```
