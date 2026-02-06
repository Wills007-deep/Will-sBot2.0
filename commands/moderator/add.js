module.exports = {
    name: "add",
    description: "Ajouter un membre au groupe (Ex: !add 237xxxxxx)",
    aliases: ["ajouter"],
    adminOnly: true,
    async execute(sock, m, { args, remoteJid, sender }) {
        if (!remoteJid.endsWith("@g.us")) {
            return sock.sendMessage(remoteJid, { text: "❌ Cette commande ne fonctionne que dans un groupe." }, { quoted: m });
        }

        try {
            const groupMetadata = await sock.groupMetadata(remoteJid);
            const participants = groupMetadata.participants;
            const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net';

            // Vérifier si le bot est admin
            const botPart = participants.find(p => p.id === botId);
            if (!botPart || (botPart.admin !== 'admin' && botPart.admin !== 'superadmin')) {
                return sock.sendMessage(remoteJid, { text: "❌ Je dois être Admin pour ajouter des membres." }, { quoted: m });
            }

            // Vérifier si l'expéditeur est admin
            const senderPart = participants.find(p => p.id === sender);
            const isOwner = sender.split('@')[0].split(':')[0] === process.env.OWNER_NUMBER;
            if (!isOwner && (!senderPart || (senderPart.admin !== 'admin' && senderPart.admin !== 'superadmin'))) {
                return sock.sendMessage(remoteJid, { text: "❌ Seuls les Admins peuvent utiliser cette commande." }, { quoted: m });
            }

            let numbers = [];
            if (m.message.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
                numbers = m.message.extendedTextMessage.contextInfo.mentionedJid;
            } else if (args.length > 0) {
                numbers = args.map(arg => {
                    const clean = arg.replace(/[^0-9]/g, '');
                    return clean + '@s.whatsapp.net';
                });
            }

            if (numbers.length === 0) {
                return sock.sendMessage(remoteJid, { text: "⚠️ Donnez un numéro (Ex: !add 237xxxxxx) ou mentionnez quelqu'un." }, { quoted: m });
            }

            await sock.sendMessage(remoteJid, { react: { text: "⏳", key: m.key } });

            const response = await sock.groupParticipantsUpdate(remoteJid, numbers, "add");

            let resultText = "📝 *Rapport d'ajout :*\n\n";
            response.forEach((res, i) => {
                const num = numbers[i].split('@')[0];
                if (res.status === "200") {
                    resultText += `✅ @${num} : Ajouté\n`;
                } else if (res.status === "403") {
                    resultText += `❌ @${num} : Privé (Lien d'invitation nécessaire)\n`;
                } else if (res.status === "409") {
                    resultText += `❌ @${num} : Déjà présent\n`;
                } else {
                    resultText += `❌ @${num} : Erreur (${res.status})\n`;
                }
            });

            await sock.sendMessage(remoteJid, { text: resultText, mentions: numbers }, { quoted: m });

        } catch (error) {
            console.error("Erreur Add:", error);
            await sock.sendMessage(remoteJid, { text: "❌ Une erreur est survenue lors de l'ajout." }, { quoted: m });
        }
    }
};
