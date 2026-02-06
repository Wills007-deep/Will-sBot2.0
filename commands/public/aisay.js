const gtts = require('gtts');
const fs = require('fs');
const path = require('path');
const { askGroq } = require('../../utils/groq');
const logger = require('../../utils/logger');

module.exports = {
    name: "aisay",
    description: "L'IA répond par une note vocale (via gTTS npm)",
    aliases: ["speak", "parle"],
    async execute(sock, m, { args, prefix }) {
        if (args.length === 0) {
            return sock.sendMessage(m.key.remoteJid, { text: `⚠️ Exemple : *${prefix}aisay Bonjour*` }, { quoted: m });
        }

        await sock.sendMessage(m.key.remoteJid, { react: { text: "🎤", key: m.key } });

        const prompt = args.join(" ");

        // 1. Texte via Groq
        const textResponse = await askGroq(prompt, "Tu es Will's Bot, réponds de manière courte et naturelle pour l'oral.");

        try {
            // 2. Génération Audio via gtts
            const filePath = path.join(__dirname, '../../temp_audio.mp3');

            const gttsInstance = new gtts(textResponse, 'fr');

            gttsInstance.save(filePath, async function (err, result) {
                if (err) {
                    throw new Error(err);
                }

                // 3. Envoi
                await sock.sendMessage(m.key.remoteJid, {
                    audio: { url: filePath },
                    mimetype: 'audio/mp4',
                    ptt: true
                }, { quoted: m });

                await sock.sendMessage(m.key.remoteJid, { react: { text: "✅", key: m.key } });

                // Nettoyage après envoi (petit délai pour éviter lock)
                setTimeout(() => {
                    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                }, 5000);
            });

        } catch (error) {
            logger.error("Erreur gTTS:", error);
            await sock.sendMessage(m.key.remoteJid, { text: "❌ Erreur audio." }, { quoted: m });
        }
    }
};
