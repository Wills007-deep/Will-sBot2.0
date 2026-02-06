const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const { transcribeAudio } = require('../../utils/transcriber');
const fs = require('fs');

module.exports = {
    name: "transcript",
    description: "Transcrit un message vocal (Répondre au vocal)",
    aliases: ["tr", "txt"],
    async execute(sock, m, { args, prefix }) {
        // Vérifier si c'est une réponse à un message
        const quoted = m.message.extendedTextMessage?.contextInfo?.quotedMessage;

        if (!quoted) {
            return sock.sendMessage(m.key.remoteJid, { text: "⚠️ Répondez à un message vocal avec cette commande !" }, { quoted: m });
        }

        // Vérifier si le message cité est un vocal ou audio
        const isAudio = quoted.audioMessage;

        if (!isAudio) {
            return sock.sendMessage(m.key.remoteJid, { text: "⚠️ Ce n'est pas un message audio." }, { quoted: m });
        }

        await sock.sendMessage(m.key.remoteJid, { react: { text: "👂", key: m.key } });

        try {
            // Télécharger le média (Utilisation de downloadContentFromMessage pour plus de robustesse)
            const mediaData = quoted.audioMessage;
            const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

            const stream = await downloadContentFromMessage(mediaData, 'audio', {});
            let buffer = Buffer.from([]);
            for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);


            // Transcrire via Hugging Face
            const text = await transcribeAudio(buffer);

            await sock.sendMessage(m.key.remoteJid, {
                text: `📝 *Transcription :*\n\n"${text}"`
            }, { quoted: m });

            await sock.sendMessage(m.key.remoteJid, { react: { text: "✅", key: m.key } });

        } catch (error) {
            console.error("Erreur Transcript:", error);
            await sock.sendMessage(m.key.remoteJid, { text: "❌ Impossible de transcrire ce vocal." }, { quoted: m });
        }
    }
};
