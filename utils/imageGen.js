const fetch = require('cross-fetch');
const logger = require('./logger');

async function generateImage(prompt) {
    const hfKey = process.env.HUGGINGFACE_API_KEY;
    if (!hfKey) throw new Error("Clé HUGGINGFACE_API_KEY manquante");

    try {
        const response = await fetch(
            "https://router.huggingface.co/hf-inference/models/stabilityai/stable-diffusion-xl-base-1.0",
            {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${hfKey}`,
                    "Content-Type": "application/json",
                    "Accept": "image/png"
                },
                body: JSON.stringify({ inputs: prompt })
            }
        );

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`HF Error ${response.status}: ${errText}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer);
    } catch (error) {
        logger.error("[ImageGen] Erreur:", error.message);
        throw error;
    }
}

module.exports = { generateImage };
