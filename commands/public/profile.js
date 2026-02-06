module.exports = {
    name: "profile",
    description: "Afficher le profil d'un utilisateur",
    aliases: ["profil", "info", "user"],
    async execute(sock, m, { args, remoteJid, sender }) {
        let target = sender; // Par défaut, soi-même

        // Si mention ou réponse
        if (m.message.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
            target = m.message.extendedTextMessage.contextInfo.mentionedJid[0];
        } else if (m.message.extendedTextMessage?.contextInfo?.participant) {
            target = m.message.extendedTextMessage.contextInfo.participant;
        }

        try {
            // 1. Récupérer la photo de profil
            let ppUrl;
            try {
                ppUrl = await sock.profilePictureUrl(target, 'image');
            } catch (e) {
                // Image par défaut si pas de photo
                ppUrl = "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png";
            }

            // 2. Récupérer le statut (Bio)
            let status = { status: "Non disponible" };
            try {
                status = await sock.fetchStatus(target);
            } catch (e) {
                // Ignore errors if status is hidden
            }

            // 3. Infos basiques
            const username = target.split('@')[0];

            const caption = `👤 *Profil Utilisateur*\n\n` +
                `🏷️ *Nom/Tag* : @${username}\n` +
                `📱 *Numéro* : +${username}\n` +
                `📝 *Bio* : ${status.status || 'Aucune'}\n` +
                `📅 *Date Bio* : ${status.setAt ? new Date(status.setAt).toLocaleDateString() : 'Inconnue'}`;

            // Envoi
            await sock.sendMessage(remoteJid, {
                image: { url: ppUrl },
                caption: caption,
                mentions: [target]
            }, { quoted: m });

        } catch (error) {
            console.error("Erreur Profil:", error);
            await sock.sendMessage(remoteJid, { text: "❌ Impossible de récupérer les infos." }, { quoted: m });
        }
    }
};
