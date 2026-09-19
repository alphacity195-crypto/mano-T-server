const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");
const fs = require("fs");
const https = require("https");

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
// REALTIME - CRIAR SESSAO TEMPORARIA
// =========================================================

app.post("/realtime/session", async (req, res) => {

    try {

        console.log(
            "Solicitacao de nova sessao Realtime..."
        );

        const dadosSessao = JSON.stringify({

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
        });

        const opcoes = {

            hostname:
                "api.openai.com",

            path:
                "/v1/realtime/client_secrets",

            method:
                "POST",

            headers: {

                "Authorization":
                    "Bearer " +
                    process.env.OPENAI_API_KEY,

                "Content-Type":
                    "application/json",

                "Content-Length":
                    Buffer.byteLength(dadosSessao)
            }
        };


        const requisicao =
            https.request(
                opcoes,
                (respostaOpenAI) => {

                    let dados = "";

                    respostaOpenAI.on(
                        "data",
                        (parte) => {
                            dados += parte;
                        }
                    );

                    respostaOpenAI.on(
                        "end",
                        () => {

                            console.log(
                                "OpenAI respondeu:",
                                respostaOpenAI.statusCode
                            );

                            if (
                                respostaOpenAI.statusCode < 200 ||
                                respostaOpenAI.statusCode >= 300
                            ) {

                                console.error(
                                    "Erro OpenAI:",
                                    dados
                                );

                                return res
                                    .status(
                                        respostaOpenAI.statusCode
                                    )
                                    .json({

                                        erro:
                                            "OpenAI recusou a sessao Realtime.",

                                        detalhe:
                                            dados
                                    });
                            }

                            try {

                                const resultado =
                                    JSON.parse(dados);

                                res.json(resultado);

                            } catch (erro) {

                                console.error(
                                    "Resposta invalida da OpenAI:",
                                    dados
                                );

                                res.status(500).json({

                                    erro:
                                        "Resposta invalida da OpenAI.",

                                    detalhe:
                                        dados
                                });
                            }
                        }
                    );
                }
            );


        requisicao.on(
            "error",
            (erro) => {

                console.error(
                    "Erro na conexao com OpenAI:",
                    erro
                );

                if (!res.headersSent) {

                    res.status(500).json({

                        erro:
                            "Nao foi possivel conectar a OpenAI.",

                        detalhe:
                            erro.message
                    });
                }
            }
        );


        requisicao.write(
            dadosSessao
        );

        requisicao.end();

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
