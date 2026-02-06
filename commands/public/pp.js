module.exports = {
    name: "pp",
    description: "Récupérer la photo de profil d'un utilisateur",
    aliases: ["pdp", "photo"],
    async execute(sock, m, { remoteJid }) {
        let targetJid;

        // Si on répond à quelqu'un
        const quoted = m.message.extendedTextMessage?.contextInfo?.participant;
        // Si on mentionne quelqu'un
        const mentioned = m.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0];

        if (quoted) {
            targetJid = quoted;
        } else if (mentioned) {
            targetJid = mentioned;
        } else {
            targetJid = remoteJid.endsWith('@g.us') ? m.key.participant : remoteJid;
        }

        try {
            await sock.sendMessage(remoteJid, { react: { text: "📸", key: m.key } });

            const ppUrl = await sock.profilePictureUrl(targetJid, 'image').catch(() => null);

            if (!ppUrl) {
                return sock.sendMessage(remoteJid, { text: "❌ Cet utilisateur n'a pas de photo de profil publique." }, { quoted: m });
            }

            await sock.sendMessage(remoteJid, { image: { url: ppUrl }, caption: `📸 Photo de profil de @${targetJid.split('@')[0]}`, mentions: [targetJid] }, { quoted: m });

        } catch (error) {
            console.error("Erreur PP:", error);
            await sock.sendMessage(remoteJid, { text: "❌ Impossible de récupérer la photo de profil." }, { quoted: m });
        }
    }
};
