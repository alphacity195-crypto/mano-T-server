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

async function buscarClima() {

const url =
    "https://api.open-meteo.com/v1/forecast" +
    "?latitude=-23.5505" +
    "&longitude=-46.6333" +
    "&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m" +
    "&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum" +
    "&forecast_days=3" +
    "&timezone=auto";

const resposta = await fetch(url);

if (!resposta.ok) {
    throw new Error("Erro ao consultar clima.");
}

return await resposta.json();

}

async function buscarCotacao() {

const url =
    "https://api.frankfurter.dev/v2/rate/usd/brl";

const resposta = await fetch(url);

if (!resposta.ok) {
    throw new Error("Erro ao consultar cotacao.");
}

return await resposta.json();

}

function detectarFerramentas(mensagem) {

const texto =
    mensagem
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

return {
    clima:
        /tempo|clima|chuva|chover|previsao|temperatura|calor|frio|vento|umidade/.test(texto),

    cotacao:
        /dolar|euro|libra|iene|cotacao|cambio|moeda/.test(texto)
};

}

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

const diagnostico = {
    clima: {
        tentado: false,
        sucesso: false,
        erro: null
    },

    cotacao: {
        tentado: false,
        sucesso: false,
        erro: null
    },

    webSearch: {
        solicitado: true,
        chamadas: [],
        fontes: []
    }
};

try {

    const mensagem = req.body.mensagem;

    if (!mensagem || typeof mensagem !== "string") {

        return res.status(400).json({
            erro: "Mensagem nao enviada",
            diagnostico
        });

    }

    const ferramentas =
        detectarFerramentas(mensagem);

    let contexto = "";

    if (ferramentas.clima) {

        diagnostico.clima.tentado = true;

        try {

            const clima =
                await buscarClima();

            diagnostico.clima.sucesso = true;

            contexto +=
                "\nDADOS DE CLIMA ATUAIS:\n" +
                JSON.stringify(clima);

        } catch (erro) {

            diagnostico.clima.erro =
                erro.message;

        }
    }

    if (ferramentas.cotacao) {

        diagnostico.cotacao.tentado = true;

        try {

            const cotacao =
                await buscarCotacao();

            diagnostico.cotacao.sucesso = true;

            contexto +=
                "\nDADOS DE COTACAO ATUAIS:\n" +
                JSON.stringify(cotacao);

        } catch (erro) {

            diagnostico.cotacao.erro =
                erro.message;

        }
    }

    const resposta =
        await openai.responses.create({

            model: "gpt-5.6-luna",

            instructions:
                "Voce e o Mano T. " +
                "Responda sempre em portugues do Brasil. " +
                "Seja natural, direto e parceiro. " +
                "Use os dados externos fornecidos no contexto. " +
                "Quando precisar de informacao atual, use a pesquisa na internet. " +
                "Nunca invente informacoes atuais. " +
                "Nunca diga que nao tem acesso a internet se uma ferramenta foi executada.",

            tools: [
                {
                    type: "web_search"
                }
            ],

            tool_choice: "required",

            include: [
                "web_search_call.action.sources"
            ],

            input:
                mensagem +
                contexto
        });

    for (const item of resposta.output || []) {

        if (item.type === "web_search_call") {

            diagnostico.webSearch.chamadas.push({
                id: item.id || null,
                status: item.status || null,
                tipo: item.type
            });

            const sources =
                item.action &&
                item.action.sources;

            if (Array.isArray(sources)) {

                for (const fonte of sources) {

                    diagnostico.webSearch.fontes.push({
                        titulo:
                            fonte.title || "",
                        url:
                            fonte.url || ""
                    });

                }
            }
        }
    }

    console.log(
        "DIAGNOSTICO:",
        JSON.stringify(
            diagnostico,
            null,
            2
        )
    );

    res.json({
        resposta:
            resposta.output_text,

        diagnostico
    });

} catch (erro) {

    console.error(
        "ERRO NO CHAT:",
        erro
    );

    diagnostico.erro =
        erro.message ||
        "Erro desconhecido";

    res.status(500).json({
        erro:
            "Erro ao consultar as ferramentas.",
        detalhes:
            erro.message,
        diagnostico
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

    const audio =
        await openai.audio.speech.create({

            model: "gpt-4o-mini-tts",
            voice: "cedar",
            input: texto,
            response_format: "mp3"
        });

    const buffer =
        Buffer.from(
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

    console.error(
        "Erro no TTS:",
        erro
    );

    res.status(500).json({
        erro:
            "Nao foi possivel gerar a voz do Mano T."
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
                            model:
                                "gpt-4o-mini-transcribe",
                            language:
                                "pt"
                        }
                    },

                    output: {
                        voice: "cedar"
                    }
                }
            }
        });

    res.json({
        value:
            sessao.value
    });

} catch (erro) {

    console.error(
        "Erro ao criar sessao Realtime:",
        erro
    );

    res.status(500).json({
        erro:
            "Erro ao criar sessao Realtime",
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
