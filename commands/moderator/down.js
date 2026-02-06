module.exports = {
    name: "down",
    description: "Rétrograder un Admin",
    aliases: ["demote", "unadmin"],
    async execute(sock, m, { args, isGroup, remoteJid }) {
        if (!isGroup) return sock.sendMessage(remoteJid, { text: "⚠️ Groupe uniquement." }, { quoted: m });

        let target;
        if (m.message.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
            target = m.message.extendedTextMessage.contextInfo.mentionedJid[0];
        } else if (m.message.extendedTextMessage?.contextInfo?.participant) {
            target = m.message.extendedTextMessage.contextInfo.participant;
        }

        if (!target) return sock.sendMessage(remoteJid, { text: "⚠️ Qui dois-je rétrograder ?" }, { quoted: m });

        try {
            await sock.groupParticipantsUpdate(remoteJid, [target], "demote");
            await sock.sendMessage(remoteJid, { text: `📉 @${target.split('@')[0]} n'est plus Admin.`, mentions: [target] }, { quoted: m });
        } catch (error) {
            console.error("Erreur Demote:", error);
            await sock.sendMessage(remoteJid, { text: "❌ Erreur (Vérifiez mes droits admin)." }, { quoted: m });
        }
    }
};
