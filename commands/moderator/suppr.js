module.exports = {
    name: "suppr",
    description: "Supprimer n'importe quel message (Répondre au message)",
    aliases: ["del", "delete"],
    adminOnly: true,
    async execute(sock, m, { remoteJid, isGroup, sender }) {
        const quoted = m.message.extendedTextMessage?.contextInfo;

        if (!quoted || !quoted.stanzaId) {
            return sock.sendMessage(remoteJid, { text: "⚠️ Répondez au message que vous voulez supprimer." }, { quoted: m });
        }

        // Vérification Admin (si c'est un groupe)
        if (isGroup) {
            const groupMetadata = await sock.groupMetadata(remoteJid);
            const participant = groupMetadata.participants.find(p => p.id === sender);
            const isAdmin = participant && (participant.admin === 'admin' || participant.admin === 'superadmin');
            const isOwner = sender.split('@')[0].split(':')[0] === process.env.OWNER_NUMBER;

            if (!isAdmin && !isOwner) {
                return sock.sendMessage(remoteJid, { text: "❌ Désolé, cette commande est réservée aux Administrateurs." }, { quoted: m });
            }
        }

        try {
            await sock.sendMessage(remoteJid, {
                delete: {
                    remoteJid: remoteJid,
                    fromMe: quoted.participant === sock.user.id,
                    id: quoted.stanzaId,
                    participant: quoted.participant
                }
            });
        } catch (error) {
            console.error("Erreur Suppr:", error);
            await sock.sendMessage(remoteJid, { text: "❌ Impossible de supprimer ce message. Vérifiez que je suis bien Admin." }, { quoted: m });
        }
    }
};
