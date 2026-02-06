const Groq = require("groq-sdk");
const logger = require("./logger");

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

async function askGroq(prompt, systemPrompt = "Tu es Will's Bot 2.0, un assistant IA utile, drôle et intelligent.") {
    try {
        const completion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: prompt }
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0.7,
            max_tokens: 1024,
        });

        return completion.choices[0]?.message?.content || "Désolé, je n'ai pas trouvé de réponse.";
    } catch (error) {
        logger.error("Erreur Groq API:", error);
        return "Erreur lors de la communication avec l'IA. Vérifiez ma clé API.";
    }
}

module.exports = { askGroq };
