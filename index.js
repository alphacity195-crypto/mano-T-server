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

 /*

 CENTRAL DE FERRAMENTAS DO MANO T

Ferramentas atuais:

1. Web Search
2. Clima em tempo real
3. Cotacao de moedas
4. Estrutura para futuras APIs/MCP

========================================================
*/

// ======================================================
// FUNCAO: BUSCAR CLIMA
// ======================================================

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

// ======================================================
// FUNCAO: BUSCAR COTACAO
// ======================================================

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

// ======================================================
// FUNCAO: IDENTIFICAR FERRAMENTA
// ======================================================

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
    "dólar",
    "euro",
    "libra",
    "iene",
    "cotacao",
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

// ======================================================
// ROTAS BASICAS
// ======================================================

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

});

// ======================================================
// CHAT
// ======================================================

app.post("/chat", async (req, res) => {

try {

    const mensagem =
        req.body.mensagem;

    if (
        !mensagem ||
        typeof mensagem !== "string"
    ) {

        return res.status(400).json({
            erro: "Mensagem nao enviada"
        });

    }


    const ferramentasDetectadas =
        identificarFerramenta(
            mensagem
        );


    let contextoFerramentas = "";


    // ==================================================
    // CLIMA
    // ==================================================

    if (
        ferramentasDetectadas.includes(
            "clima"
        )
    ) {

        /*
        Sao Paulo como coordenada padrao
        enquanto ainda nao adicionamos
        localizacao do celular ao backend.
        */

        try {

            const clima =
                await buscarClima(
                    -23.5505,
                    -46.6333
                );


            contextoFerramentas +=
                "\n\nDADOS DE CLIMA EM TEMPO REAL:\n" +
                JSON.stringify(
                    clima
                );

        } catch (erro) {

            console.error(
                "Erro no clima:",
                erro
            );

        }

    }


    // ==================================================
    // COTACAO
    // ==================================================

    if (
        ferramentasDetectadas.includes(
            "cotacao"
        )
    ) {

        try {

            const cotacao =
                await buscarCotacao(
                    "usd",
                    "brl"
                );


            contextoFerramentas +=
                "\n\nDADOS DE COTACAO:\n" +
                JSON.stringify(
                    cotacao
                );

        } catch (erro) {

            console.error(
                "Erro na cotacao:",
                erro
            );

        }

    }


    // ==================================================
    // RESPOSTA OPENAI
    // ==================================================

    const resposta =
        await openai.responses.create({

            model:
                "gpt-5.6-luna",


            instructions:

                "Voce e o Mano T, uma IA pessoal amigavel, natural e prestativa. " +

                "Responda sempre em portugues do Brasil. " +

                "Seja natural, direto e parceiro. " +

                "Voce possui acesso a ferramentas externas. " +

                "Quando receber dados de ferramentas, use esses dados " +
                "como fonte principal da resposta. " +

                "Nunca invente dados atuais. " +

                "Quando uma informacao depender do momento atual, " +
                "use a ferramenta apropriada ou a pesquisa na internet. " +

                "Se houver dados de clima, cotacao ou outra API no contexto, " +
                "considere esses dados antes de responder. " +

                "Nao diga que nao possui acesso a internet quando houver " +
                "uma ferramenta disponivel para consultar a informacao. " +

                "Se uma fonte externa falhar, informe isso de maneira simples.",


            tools: [

                {
                    type:
                        "web_search"
                }

            ],


            tool_choice:
                "required",


            input:
                mensagem +
                contextoFerramentas

        });


    res.json({

        resposta:
            resposta.output_text

    });


} catch (erro) {

    console.error(
        "Erro no chat:",
        erro
    );


    res.status(500).json({

        erro:
            "O Mano T teve um problema ao consultar as ferramentas.",

        detalhes:
            erro.message ||
            "Erro desconhecido"

    });

}

});

// ======================================================
// TTS
// ======================================================

app.post("/tts", async (req, res) => {

try {

    const texto =
        req.body.texto;


    if (
        !texto ||
        typeof texto !== "string"
    ) {

        return res.status(400).json({

            erro:
                "Texto nao enviado"

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

// ======================================================
// REALTIME
// ======================================================

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

                            "Fale sempre em portugues do Brasil, " +
                            "com pronuncia e entonacao naturais " +
                            "do portugues brasileiro. " +

                            "Nao responda em ingles ou outro idioma, " +
                            "a menos que o usuario peca explicitamente. " +

                            "Mantenha uma conversa natural, " +
                            "descontraida e direta, como um parceiro brasileiro " +
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

// ======================================================
// PORTA
// ======================================================

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
