const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

module.exports = {
    name: "vv",
    description: "Récupérer un message ViewOnce (Vue Unique)",
    aliases: ["viewonce", "hack"],
    async execute(sock, m, { remoteJid }) {
        // Vérifier s'il y a un message cité (Reply)
        const quoted = m.message.extendedTextMessage?.contextInfo?.quotedMessage;
        const quotedId = m.message.extendedTextMessage?.contextInfo?.stanzaId;

        if (!quoted || !quotedId) {
            return sock.sendMessage(remoteJid, { text: "⚠️ Répondez à un message ViewOnce avec *!vv* pour le récupérer." }, { quoted: m });
        }

        try {
            await sock.sendMessage(remoteJid, { react: { text: "🕵️", key: m.key } });

            // Logique directe
            let content = quoted;
            // Peel layers
            if (content.ephemeralMessage) content = content.ephemeralMessage.message;
            if (content.viewOnceMessage) content = content.viewOnceMessage.message;
            if (content.viewOnceMessageV2) content = content.viewOnceMessageV2.message;
            if (content.viewOnceMessageV2Extension) content = content.viewOnceMessageV2Extension.message;

            const mediaType = Object.keys(content).find(k => k.includes('Message') && k !== 'senderKeyDistributionMessage');

            if (!mediaType) {
                return sock.sendMessage(remoteJid, { text: "❌ Ce n'est pas un message média ViewOnce valide." }, { quoted: m });
            }

            const mediaData = content[mediaType];
            if (!mediaData || !mediaData.mediaKey) {
                return sock.sendMessage(remoteJid, { text: "❌ Impossible de décrypter (Données manquantes ou message trop vieux)." }, { quoted: m });
            }

            // Télécharger le média
            const stream = await downloadContentFromMessage(mediaData, mediaType.replace('Message', ''), {});
            let buffer = Buffer.from([]);
            for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

            // Renvoyer DIRECTEMENT dans le chat où la commande a été tapée
            const caption = `🔓 *ViewOnce Récupéré*`;
            const type = mediaType.replace('Message', '');
            const options = { caption, quoted: m };

            if (type === 'image') {
                await sock.sendMessage(remoteJid, { image: buffer, ...options });
            } else if (type === 'video') {
                await sock.sendMessage(remoteJid, { video: buffer, ...options });
            } else if (type === 'audio') {
                await sock.sendMessage(remoteJid, { audio: buffer, mimetype: 'audio/mp4', ptt: true, ...options });
            }

        } catch (error) {
            console.error("Erreur VV:", error);
            const errorMsg = error.message || "Erreur inconnue";
            await sock.sendMessage(remoteJid, { text: `❌ Échec: ${errorMsg}` }, { quoted: m });
        }
    }
};
