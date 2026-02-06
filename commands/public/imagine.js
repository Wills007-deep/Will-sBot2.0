const axios = require('axios');
const fs = require('fs');

module.exports = {
    name: "imagine",
    description: "Génère une image via IA (Hugging Face)",
    aliases: ["img", "dalle"],
    async execute(sock, m, { args, prefix }) {
        if (args.length === 0) {
            return sock.sendMessage(m.key.remoteJid, { text: `⚠️ Décris l'image ! Exemple : *${prefix}imagine un chat cyberpunk*` }, { quoted: m });
        }

        const prompt = args.join(" ");
        await sock.sendMessage(m.key.remoteJid, { react: { text: "🎨", key: m.key } });

        try {
            const hfKey = process.env.HUGGINGFACE_API_KEY;

            // Si pas de clé, message d'erreur explicite
            if (!hfKey || hfKey.trim() === "") {
                return sock.sendMessage(m.key.remoteJid, { text: "❌ Clé HUGGINGFACE_API_KEY manquante dans le .env !" }, { quoted: m });
            }

            // Utilisation fetch comme recommandé pour gérer parfaitement les headers
            const fetch = require('cross-fetch');

            const response = await fetch(
                "https://router.huggingface.co/hf-inference/models/stabilityai/stable-diffusion-xl-base-1.0",
                {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${hfKey}`,
                        "Content-Type": "application/json",
                        "Accept": "image/png" // ⬅️ HEADER OBLIGATOIRE
                    },
                    body: JSON.stringify({
                        inputs: prompt
                    })
                }
            );

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`HF Error ${response.status}: ${errText}`);
            }

            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            await sock.sendMessage(m.key.remoteJid, {
                image: buffer,
                caption: `🎨 Image générée pour : *${prompt}* (SDXL 1.0)`
            }, { quoted: m });

            await sock.sendMessage(m.key.remoteJid, { react: { text: "✅", key: m.key } });

        } catch (error) {
            if (error.response && error.response.data) {
                try {
                    // Tenter de parser le buffer en JSON
                    const errorJson = JSON.parse(Buffer.from(error.response.data).toString('utf8'));
                    errorMsg = errorJson.error || errorJson.message || JSON.stringify(errorJson);
                } catch (e) {
                    errorMsg = Buffer.from(error.response.data).toString('utf8');
                }
            } else {
                errorMsg = error.message;
            }

            console.error("Erreur HF:", errorMsg);
            await sock.sendMessage(m.key.remoteJid, { text: `❌ Erreur Hugging Face : ${errorMsg}` }, { quoted: m });
        }
    }
};
