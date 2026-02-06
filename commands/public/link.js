module.exports = {
    name: "link",
    description: "Obtenir le lien d'invitation du groupe",
    aliases: ["lien"],
    async execute(sock, m, { remoteJid, isGroup }) {
        if (!isGroup) {
            return sock.sendMessage(remoteJid, { text: "❌ Cette commande est réservée aux groupes." }, { quoted: m });
        }

        try {
            const groupMetadata = await sock.groupMetadata(remoteJid);
            const participants = groupMetadata.participants;
            const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net';

            // Vérifier si le bot est admin
            const botPart = participants.find(p => p.id === botId);
            if (!botPart || (botPart.admin !== 'admin' && botPart.admin !== 'superadmin')) {
                return sock.sendMessage(remoteJid, { text: "❌ Je dois être Admin pour générer le lien du groupe." }, { quoted: m });
            }

            const code = await sock.groupInviteCode(remoteJid);
            const link = `https://chat.whatsapp.com/${code}`;

            await sock.sendMessage(remoteJid, {
                text: `🔗 *Lien du groupe :*\n\n${link}`
            }, { quoted: m });

        } catch (error) {
            console.error("Erreur Link:", error);
            await sock.sendMessage(remoteJid, { text: "❌ Impossible de récupérer le lien. Vérifiez mes permissions." }, { quoted: m });
        }
    }
};
