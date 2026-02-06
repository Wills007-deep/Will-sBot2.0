const axios = require('axios');
const fs = require('fs');

async function transcribeAudio(audioBuffer) {
    try {
        const hfKey = process.env.HUGGINGFACE_API_KEY;
        if (!hfKey) {
            throw new Error("Clé HUGGINGFACE_API_KEY manquante.");
        }

        const fetch = require('cross-fetch');

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 60000); // 60s timeout

        const response = await fetch(
            "https://router.huggingface.co/hf-inference/models/openai/whisper-large-v3",
            {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${hfKey}`,
                    "Content-Type": "audio/ogg",
                    "Accept": "application/json"
                },
                body: audioBuffer,
                signal: controller.signal
            }
        ).finally(() => clearTimeout(timeout));


        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`HF Error ${response.status}: ${errText}`);
        }

        const data = await response.json();

        if (data && data.text) {
            return data.text;
        } else {
            throw new Error("Réponse vide de l'API Whisper.");
        }

    } catch (error) {
        console.error("Erreur Transcription:", error);
        throw error;
    }
}

module.exports = { transcribeAudio };
