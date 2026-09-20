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

async function buscarClima(latitude, longitude) {


const url =
    "https://api.open-meteo.com/v1/forecast" +
    "?latitude=" + encodeURIComponent(latitude) +
    "&longitude=" + encodeURIComponent(longitude) +
    "&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m" +
    "&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum" +
    "&forecast_days=3" +
    "&timezone=auto";

const resposta = await fetch(url);

if (!resposta.ok) {
    throw new Error(
        "Nao foi possivel consultar o servico de clima."
    );
}

return await resposta.json();


}

async function buscarCotacao(base, moeda) {


const url =
    "https://api.frankfurter.dev/v2/rate/" +
    encodeURIComponent(base.toLowerCase()) +
    "/" +
    encodeURIComponent(moeda.toLowerCase());

const resposta = await fetch(url);

if (!resposta.ok) {
    throw new Error(
        "Nao foi possivel consultar a cotacao."
    );
}

return await resposta.json();


}

function identificarFerramenta(mensagem) {


const texto =
    mensagem
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

const ferramentas = [];

const palavrasClima = [
    "tempo",
    "clima",
    "chuva",
    "chover",
    "chovendo",
    "previsao",
    "temperatura",
    "calor",
    "frio",
    "vento",
    "umidade",
    "trovoada",
    "tempestade"
];

const palavrasCambio = [
    "dolar",
    "euro",
    "libra",
    "iene",
    "cotacao",
    "cambio",
    "moeda",
    "quanto vale",
    "real"
];

if (
    palavrasClima.some(
        palavra => texto.includes(palavra)
    )
) {
    ferramentas.push("clima");
}

if (
    palavrasCambio.some(
        palavra => texto.includes(palavra)
    )
) {
    ferramentas.push("cotacao");
}

return ferramentas;


}

function extrairFontesWeb(resposta) {


const fontes = [];

if (!resposta || !resposta.output) {
    return fontes;
}

for (const item of resposta.output) {

    if (
        item.type !== "web_search_call"
    ) {
        continue;
    }

    const sources =
        item.action &&
        item.action.sources;

    if (!Array.isArray(sources)) {
        continue;
    }

    for (const fonte of sources) {

        fontes.push({
            titulo:
                fonte.title ||
                "",
            url:
                fonte.url ||
                ""
        });

    }
}

return fontes;


}

function detectarChamadasWeb(resposta) {


const chamadas = [];

if (!resposta || !resposta.output) {
    return chamadas;
}

for (const item of resposta.output) {

    if (
        item.type === "web_search_call"
    ) {

        chamadas.push({
            id:
                item.id ||
                null,

            status:
                item.status ||
                null,

            tipo:
                item.type,

            acao:
                item.action
                    ? item.action.type
                    : null
        });
    }
}

return chamadas;


}

app.get("/", (req, res) => {


res.json({
    status: "online",
    message: "Mano T esta vivo",
    ferramentas: [
        "web_search",
        "clima",
        "cotacao"
    ]
});


});

app.get("/health", (req, res) => {


res.json({
    status: "ok",
    service: "Mano T"
});
```

});

app.post("/chat", async (req, res) => {

const diagnostico = {

    mensagemRecebida:
        req.body &&
        req.body.mensagem
            ? true
            : false,

    ferramentaDetectada:
        [],

    clima:

        {
            tentado: false,
            sucesso: false,
            erro: null
        },

    cotacao:

        {
            tentado: false,
            sucesso: false,
            erro: null
        },

    webSearch:

        {
            solicitado: false,
            chamadas: [],
            fontes: []
        }

};

try {

    const mensagem =
        req.body.mensagem;

    if (
        !mensagem ||
        typeof mensagem !== "string"
    ) {

        return res.status(400).json({
            erro: "Mensagem nao enviada",
            diagnostico
        });

    }

    const ferramentasDetectadas =
        identificarFerramenta(
            mensagem
        );

    diagnostico.ferramentaDetectada =
        ferramentasDetectadas;

    let contextoFerramentas = "";

    if (
        ferramentasDetectadas.includes(
            "clima"
        )
    ) {

        diagnostico.clima.tentado =
            true;

        try {

            const clima =
                await buscarClima(
                    -23.5505,
                    -46.6333
                );

            diagnostico.clima.sucesso =
                true;

            contextoFerramentas +=
                "\n\nDADOS DE CLIMA CONSULTADOS AGORA EM SAO PAULO:\n" +
                JSON.stringify(
                    clima
                );

        } catch (erro) {

            diagnostico.clima.erro =
                erro.message ||
                "Erro desconhecido";

            console.error(
                "Erro no clima:",
                erro
            );

        }

    }

    if (
        ferramentasDetectadas.includes(
            "cotacao"
        )
    ) {

        diagnostico.cotacao.tentado =
            true;

        try {

            const cotacao =
                await buscarCotacao(
                    "usd",
                    "brl"
                );

            diagnostico.cotacao.sucesso =
                true;

            contextoFerramentas +=
                "\n\nDADOS DE COTACAO CONSULTADOS AGORA:\n" +
                JSON.stringify(
                    cotacao
                );

        } catch (erro) {

            diagnostico.cotacao.erro =
                erro.message ||
                "Erro desconhecido";

            console.error(
                "Erro na cotacao:",
                erro
            );

        }

    }

    diagnostico.webSearch.solicitado =
        true;

    const resposta =
        await openai.responses.create({

            model:
                "gpt-5.6-luna",

            instructions:

                "Voce e o Mano T, uma IA pessoal amigavel, natural e prestativa. " +

                "Responda sempre em portugues do Brasil. " +

                "Seja natural, direto e parceiro. " +

                "Voce possui acesso a pesquisa na internet. " +

                "Quando a pergunta pedir informacao atual, noticias, clima, " +
                "cotacoes, precos, acontecimentos recentes ou qualquer dado " +
                "que possa ter mudado, pesquise na internet antes de responder. " +

                "Quando houver dados de APIs no contexto, use esses dados " +
                "como fonte principal. " +

                "Nunca invente informacoes atuais. " +

                "Nunca diga que nao possui acesso a internet se a pesquisa " +
                "ou uma API tiver sido executada com sucesso.",

            tools: [

                {
                    type:
                        "web_search",

                    external_web_access:
                        true
                }

            ],

            tool_choice:
                "required",

            include: [
                "web_search_call.action.sources"
            ],

            input:
                mensagem +
                contextoFerramentas

        });

    diagnostico.webSearch.chamadas =
        detectarChamadasWeb(
            resposta
        );

    diagnostico.webSearch.fontes =
        extrairFontesWeb(
            resposta
        );

    console.log(
        "========== DIAGNOSTICO MANO T =========="
    );

    console.log(
        JSON.stringify(
            diagnostico,
            null,
            2
        )
    );

    console.log(
        "========================================="
    );

    res.json({

        resposta:
            resposta.output_text,

        diagnostico

    });

} catch (erro) {

    console.error(
        "Erro no chat:",
        erro
    );

    diagnostico.erro =
        erro.message ||
        "Erro desconhecido";

    res.status(500).json({

        erro:
            "O Mano T teve um problema ao consultar as ferramentas.",

        detalhes:
            erro.message ||
            "Erro desconhecido",

        diagnostico

    });

}


});

app.post("/tts", async (req, res) => {


try {

    const texto =
        req.body.texto;

    if (
        !texto ||
        typeof texto !== "string"
    ) {

        return res.status(400).json({
            erro: "Texto nao enviado"
        });

    }

    const audio =
        await openai.audio.speech.create({

            model:
                "gpt-4o-mini-tts",

            voice:
                "cedar",

            input:
                texto,

            response_format:
                "mp3"

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

    res.send(
        buffer
    );

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

app.post(
"/realtime/session",
async (req, res) => {


    try {

        const sessao =
            await openai
                .realtime
                .clientSecrets
                .create({

                    session: {

                        type:
                            "realtime",

                        model:
                            "gpt-realtime-2.1",

                        instructions:

                            "Voce e o Mano T, uma IA pessoal amigavel, natural e parceira. " +
                            "Fale sempre em portugues do Brasil, com pronuncia e entonacao naturais " +
                            "do portugues brasileiro. " +
                            "Nao responda em ingles ou outro idioma, a menos que o usuario peca explicitamente. " +
                            "Mantenha uma conversa natural, descontraida e direta, como um parceiro brasileiro " +
                            "conversando com o usuario.",

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

                                voice:
                                    "cedar"

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

}


);

const PORT =
process.env.PORT ||
3000;

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
