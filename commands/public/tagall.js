module.exports = {
    name: "tagall",
    description: "Mentionner tous les membres du groupe",
    aliases: ["tous", "all"],
    adminOnly: true,
    async execute(sock, m, { remoteJid }) {
        if (!remoteJid.endsWith("@g.us")) {
            return sock.sendMessage(remoteJid, { text: "❌ Cette commande ne fonctionne que dans un groupe." }, { quoted: m });
        }

        try {
            const groupMetadata = await sock.groupMetadata(remoteJid);
            const participants = groupMetadata.participants.map(p => p.id);

            if (participants.length === 0) {
                return sock.sendMessage(remoteJid, { text: "❌ Aucun membre trouvé." }, { quoted: m });
            }

            let message = "📢 *APPEL À TOUS LES MEMBRES*\n\n";
            message += `👤 *Par:* @${m.key.participant?.split('@')[0] || m.key.remoteJid.split('@')[0]}\n`;
            message += `👥 *Total:* ${participants.length} membres\n\n`;

            // On peut ajouter un petit texte personnalisé si l'utilisateur a écrit quelque chose après !tagall
            const extra = m.message?.conversation?.split(' ').slice(1).join(' ') ||
                m.message?.extendedTextMessage?.text?.split(' ').slice(1).join(' ') || "";

            if (extra) message += `💬 *Message:* ${extra}\n\n`;

            await sock.sendMessage(remoteJid, {
                text: message,
                mentions: participants
            }, { quoted: m });

        } catch (err) {
            console.error("Erreur TagAll:", err);
            await sock.sendMessage(remoteJid, { text: "❌ Impossible de mentionner tout le monde." }, { quoted: m });
        }
    }
};
