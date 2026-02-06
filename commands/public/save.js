const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: "save",
    description: "Télécharger un statut ou un média éphémère",
    aliases: ["status", "download", "dl"],
    async execute(sock, m, { remoteJid }) {
        // Vérifier s'il y a un message cité (Reply)
        const quoted = m.message.extendedTextMessage?.contextInfo?.quotedMessage;

        if (!quoted) {
            return sock.sendMessage(remoteJid, { text: "⚠️ Répondez à un statut ou une image/vidéo avec *!save* pour le télécharger." }, { quoted: m });
        }

        try {
            await sock.sendMessage(remoteJid, { react: { text: "⬇️", key: m.key } });

            // Préparer le "faux" message object pour le downloadMediaMessage
            // Baileys a besoin de la structure exacte
            const messageToDownload = {
                key: {
                    remoteJid: m.message.extendedTextMessage.contextInfo.remoteJid,
                    id: m.message.extendedTextMessage.contextInfo.stanzaId,
                    participant: m.message.extendedTextMessage.contextInfo.participant
                },
                message: quoted
            };

            // Télécharger le média
            const buffer = await downloadMediaMessage(
                messageToDownload,
                'buffer',
                {},
                {
                    logger: console, // Logger minimal
                    reuploadRequest: sock.updateMediaMessage // Astuce pour certains types
                }
            );

            if (!buffer) {
                throw new Error("Impossible de télécharger le média.");
            }

            // Déterminer le type de message pour le renvoi
            const type = Object.keys(quoted)[0];

            if (type === 'imageMessage') {
                await sock.sendMessage(remoteJid, { image: buffer, caption: "✅ Statut sauvegardé" }, { quoted: m });
            } else if (type === 'videoMessage') {
                await sock.sendMessage(remoteJid, { video: buffer, caption: "✅ Statut sauvegardé" }, { quoted: m });
            } else if (type === 'audioMessage') {
                await sock.sendMessage(remoteJid, { audio: buffer, mimetype: 'audio/mp4' }, { quoted: m });
            } else {
                await sock.sendMessage(remoteJid, { document: buffer, mimetype: 'application/octet-stream', fileName: 'status_download.bin' }, { quoted: m });
            }

            await sock.sendMessage(remoteJid, { react: { text: "✅", key: m.key } });

        } catch (error) {
            console.error("Erreur Save Status:", error);
            await sock.sendMessage(remoteJid, { text: "❌ Erreur lors du téléchargement. (Le statut est peut-être trop vieux ou illisible)." }, { quoted: m });
        }
    }
};
