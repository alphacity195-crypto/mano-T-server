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

```
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
            "Seja natural, direto e parceiro.",
        input: mensagem
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
```

});

const PORT = process.env.PORT || 3000;

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
