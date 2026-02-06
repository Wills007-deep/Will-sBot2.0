const youtubedl = require('yt-dlp-exec');
const fs = require('fs');
const path = require('path');
const logger = require('../../utils/logger');
const crypto = require('crypto');

module.exports = {
    name: "video",
    description: "Télécharge une vidéo depuis TikTok, Insta, FB, Twitter...",
    aliases: ["v", "dl", "tiktok", "insta", "reels"],
    async execute(sock, m, { args, prefix }) {
        let url = args[0];

        // 1. Essayer de récupérer l'URL depuis un message cité
        if (!url) {
            const quotedMsg = m.message.extendedTextMessage?.contextInfo?.quotedMessage;
            if (quotedMsg) {
                const text = quotedMsg.conversation || quotedMsg.extendedTextMessage?.text || "";
                // Regex simple pour trouver une URL
                const match = text.match(/(https?:\/\/[^\s]+)/);
                if (match) url = match[0];
            }
        }

        if (!url) {
            return sock.sendMessage(m.key.remoteJid, { text: `❌ Envoie un lien ou réponds à un lien avec *${prefix}video*` }, { quoted: m });
        }

        await sock.sendMessage(m.key.remoteJid, { react: { text: "⬇️", key: m.key } });

        const randomName = crypto.randomBytes(4).toString('hex');
        const outputPath = path.join(__dirname, `../../temp/${randomName}.mp4`);

        try {
            // Téléchargement propre
            await youtubedl(url, {
                noCheckCertificates: true,
                noWarnings: true,
                preferFreeFormats: true,
                addHeader: [
                    'referer:youtube.com',
                    'user-agent:googlebot'
                ],
                output: outputPath
            });

            if (!fs.existsSync(outputPath)) {
                throw new Error("Fichier non trouvé après téléchargement.");
            }

            await sock.sendMessage(m.key.remoteJid, {
                video: { url: outputPath },
                caption: `🎥 *Vidéo téléchargée !*`
            }, { quoted: m });

            await sock.sendMessage(m.key.remoteJid, { react: { text: "✅", key: m.key } });

            // Nettoyage
            fs.unlinkSync(outputPath);

        } catch (error) {
            logger.error(`[VideoDL] Erreur: ${error.message}`);
            await sock.sendMessage(m.key.remoteJid, { text: `❌ Impossible de télécharger cette vidéo.\n_Erreur: ${error.message}_` }, { quoted: m });

            if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
        }
    }
};
