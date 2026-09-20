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

app.post("/chat", async (req, res) => {
try {
const mensagem = req.body.mensagem;

    if (!mensagem || typeof mensagem !== "string") {
        return res.status(400).json({
            erro: "Mensagem nao enviada"
        });
    }

  const resposta = await openai.responses.create({
model: "gpt-5.6-luna",

instructions:
    "Voce e o Mano T, uma IA pessoal amigavel, natural e prestativa. " +
    "Responda sempre em portugues do Brasil. " +
    "Seja natural, direto e parceiro. " +
    "Quando a pergunta depender de informacoes atuais, noticias, " +
    "precos, acontecimentos recentes ou outros dados que possam " +
    "ter mudado, pesquise na internet antes de responder.",

tools: [
    {
        type: "web_search"
    }
],

input: mensagem

});

    });

    res.json({
        resposta: resposta.output_text
    });

} catch (erro) {

    console.error("Erro no chat:", erro);

    res.status(500).json({
        erro: "O Mano T teve um problema ao pensar."
    });
}

});

app.post("/tts", async (req, res) => {
try {
const texto = req.body.texto;

    if (!texto || typeof texto !== "string") {
        return res.status(400).json({
            erro: "Texto nao enviado"
        });
    }

    const audio = await openai.audio.speech.create({
        model: "gpt-4o-mini-tts",
        voice: "cedar",
        input: texto,
        response_format: "mp3"
    });

    const buffer = Buffer.from(
        await audio.arrayBuffer()
    );

    res.setHeader(
        "Content-Type",
        "audio/mpeg"
    );

    res.setHeader(
        "Content-Length",
        buffer.length
    );

    res.send(buffer);

} catch (erro) {

    console.error("Erro no TTS:", erro);

    res.status(500).json({
        erro: "Nao foi possivel gerar a voz do Mano T."
    });
}

});

app.post("/realtime/session", async (req, res) => {
try {

    const sessao =
        await openai.realtime.clientSecrets.create({
            session: {
                type: "realtime",
                model: "gpt-realtime-2.1",

                instructions:
                    "Voce e o Mano T, uma IA pessoal amigavel, natural e parceira. " +
                    "Fale sempre em portugues do Brasil, com pronuncia e entonacao naturais do portugues brasileiro. " +
                    "Nao responda em ingles ou outro idioma, a menos que o usuario peca explicitamente. " +
                    "Mantenha uma conversa natural, descontraida e direta, como um parceiro brasileiro conversando com o usuario.",

                audio: {
                    input: {
                        transcription: {
                            model: "gpt-4o-mini-transcribe",
                            language: "pt"
                        }
                    },

                    output: {
                        voice: "cedar"
                    }
                }
            }
        });

    res.json({
        value: sessao.value
    });

} catch (erro) {

    console.error(
        "Erro ao criar sessao Realtime:",
        erro
    );

    res.status(500).json({
        erro: "Erro ao criar sessao Realtime",
        detalhes:
            erro.message ||
            "Erro desconhecido"
    });
}

});

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
