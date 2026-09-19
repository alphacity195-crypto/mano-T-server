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

const arquivoMemoria = "memoria.json";

let historico = [];

if (fs.existsSync(arquivoMemoria)) {
    try {
        historico = JSON.parse(
            fs.readFileSync(arquivoMemoria, "utf8")
        );

        console.log("Memoria carregada!");
    } catch (erro) {
        console.log("Nao foi possivel carregar a memoria.");
        historico = [];
    }
}


// =========================================================
// ROTA PRINCIPAL
// =========================================================

app.get("/", (req, res) => {
    res.json({
        status: "online",
        message: "Mano T esta vivo"
    });
});


// =========================================================
// HEALTH
// =========================================================

app.get("/health", (req, res) => {
    res.json({
        status: "ok",
        service: "Mano T",
        timestamp: new Date().toISOString()
    });
});


// =========================================================
// CHAT NORMAL
// =========================================================

app.post("/chat", async (req, res) => {

    try {

        const mensagem = req.body.mensagem;

        if (!mensagem || typeof mensagem !== "string") {
            return res.status(400).json({
                erro: "Mensagem nao enviada"
            });
        }

        historico.push({
            role: "user",
            content: mensagem
        });

        const contexto = historico.slice(-30);

        const resposta = await openai.responses.create({

            model: "gpt-5.6-luna",

            instructions:
                "Voce e o Mano T, uma IA pessoal amigavel, natural e prestativa. " +
                "Responda sempre em portugues do Brasil. " +
                "Use o historico da conversa para manter o contexto. " +
                "Seja natural, direto e parceiro.",

            input: contexto
        });

        const textoResposta = resposta.output_text;

        historico.push({
            role: "assistant",
            content: textoResposta
        });

        try {

            fs.writeFileSync(
                arquivoMemoria,
                JSON.stringify(
                    historico,
                    null,
                    2
                ),
                "utf8"
            );

        } catch (erroMemoria) {

            console.log(
                "Nao foi possivel salvar a memoria:",
                erroMemoria.message
            );
        }

        res.json({
            resposta: textoResposta
        });

    } catch (erro) {

        console.error(
            "Erro no chat:",
            erro
        );

        res.status(500).json({
            erro:
                "O Mano T teve um problema ao pensar."
        });
    }
});


// =========================================================
// REALTIME
// CRIAR CLIENT SECRET PARA O ANDROID
// =========================================================

app.post("/realtime/session", async (req, res) => {

    try {

        console.log(
            "Solicitacao de nova sessao Realtime..."
        );

        const resposta = await fetch(
            "https://api.openai.com/v1/realtime/client_secrets",
            {
                method: "POST",

                headers: {
                    "Authorization":
                        `Bearer ${process.env.OPENAI_API_KEY}`,

                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({

                    session: {

                        type: "realtime",

                        model: "gpt-realtime-2.1",

                        instructions:
                            "Voce e o Mano T, uma IA pessoal amigavel, natural e prestativa. " +
                            "Fale sempre em portugues do Brasil. " +
                            "Converse de maneira natural, como uma ligacao telefonica. " +
                            "Seja direto, espontaneo e parceiro. " +
                            "Nao fique repetindo frases desnecessarias. " +
                            "Responda por voz de forma natural.",

                        audio: {

                            output: {
                                voice: "marin"
                            }
                        }
                    }
                })
            }
        );

        const dados = await resposta.json();

        console.log(
            "OpenAI respondeu:",
            resposta.status
        );

        if (!resposta.ok) {

            console.error(
                "Erro OpenAI:",
                dados
            );

            return res
                .status(resposta.status)
                .json({
                    erro:
                        "OpenAI recusou a sessao Realtime.",

                    detalhe:
                        dados
                });
        }

        res.json(dados);

    } catch (erro) {

        console.error(
            "Erro ao criar sessao Realtime:",
            erro
        );

        res.status(500).json({

            erro:
                "Erro ao iniciar o modo chamada.",

            detalhe:
                erro.message
        });
    }
});


// =========================================================
// 404
// =========================================================

app.use((req, res) => {

    res.status(404).json({

        erro:
            "Rota nao encontrada",

        caminho:
            req.path
    });
});


// =========================================================
// SERVIDOR
// =========================================================

const PORT =
    process.env.PORT || 3000;

app.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log(
            "Mano T esta rodando na porta " +
            PORT +
            "!"
        );
    }
);
