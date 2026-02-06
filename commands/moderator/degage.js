module.exports = {
    name: "degage",
    description: "Exclure un membre du groupe",
    aliases: ["kick", "ban", "out"],
    async execute(sock, m, { args, isGroup, remoteJid, sender }) {
        if (!isGroup) {
            return sock.sendMessage(remoteJid, { text: "⚠️ Cette commande ne fonctionne que dans les groupes." }, { quoted: m });
        }

        // Vérifier si l'utilisateur est admin (A faire plus tard proprement, pour l'instant on suppose que oui ou on check basique)
        // Pour l'instant on laisse ouvert ou on ajoute une vérification simple

        let target;
        if (m.message.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
            target = m.message.extendedTextMessage.contextInfo.mentionedJid[0];
        } else if (m.message.extendedTextMessage?.contextInfo?.participant) {
            // Si c'est une réponse à un message
            target = m.message.extendedTextMessage.contextInfo.participant;
        }

        if (!target) {
            return sock.sendMessage(remoteJid, { text: "⚠️ Mentionnez quelqu'un ou répondez à son message pour l'exclure." }, { quoted: m });
        }

        try {
            await sock.groupParticipantsUpdate(remoteJid, [target], "remove");
            await sock.sendMessage(remoteJid, { text: `👋 Bye bye @${target.split('@')[0]} !`, mentions: [target] }, { quoted: m });
        } catch (error) {
            console.error("Erreur Kick:", error);
            await sock.sendMessage(remoteJid, { text: "❌ Impossible d'exclure ce membre (Je dois être Admin)." }, { quoted: m });
        }
    }
};
