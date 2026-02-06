const fs = require('fs');
const path = require('path');

const settingsPath = path.join(__dirname, '../data/settings.json');

/**
 * Vérifie si le message contient un lien interdit et agit en conséquence.
 * Retourne true si le message a été traité (supprimé), false sinon.
 */
async function checkAntilink(sock, m) {
    if (!m.message) return false;

    // Récupérer le contenu du message
    const messageContent = m.message.conversation ||
        m.message.extendedTextMessage?.text ||
        m.message.imageMessage?.caption ||
        m.message.videoMessage?.caption || "";

    if (!messageContent) return false;

    const remoteJid = m.key.remoteJid;
    const isGroup = remoteJid.endsWith('@g.us');

    if (!isGroup) return false; // Antilink ne concerne que les groupes

    // 1. Vérifier si l'antilink est activé pour ce groupe
    let settings = { antilink_groups: [] };
    if (fs.existsSync(settingsPath)) {
        try {
            settings = JSON.parse(fs.readFileSync(settingsPath));
        } catch (e) {
            console.error("Erreur lecture settings.json:", e);
        }
    }

    if (!settings.antilink_groups.includes(remoteJid)) return false;

    // 2. Détection de lien (Spécifique WhatsApp Group Link pour l'instant)
    const linkRegex = /chat\.whatsapp\.com\/[A-Za-z0-9]{20,}/;
    const isLink = linkRegex.test(messageContent);

    if (isLink) {
        // 3. Vérifier si l'expéditeur est Admin (Les admins ont le droit)
        const sender = m.key.participant || remoteJid;

        try {
            const groupMetadata = await sock.groupMetadata(remoteJid);
            const participant = groupMetadata.participants.find(p => p.id === sender);
            const isAdmin = participant && (participant.admin === 'admin' || participant.admin === 'superadmin');

            if (isAdmin) {
                console.log(`Lien ignoré car envoyé par admin: ${sender}`);
                return false;
            }

            // 4. Action : Supprimer + Avertir
            console.log(`🚫 Lien détecté de ${sender} dans ${groupMetadata.subject}. Suppression.`);

            // Supprimer le message
            await sock.sendMessage(remoteJid, { delete: m.key });

            // Kicker l'utilisateur (Optionnel, ici on met un message dissuasif pour commencer)
            // await sock.groupParticipantsUpdate(remoteJid, [sender], "remove");

            await sock.sendMessage(remoteJid, {
                text: `🚫 @${sender.split('@')[0]} Pas de liens de groupe ici !`,
                mentions: [sender]
            });

            return true; // Stop propagation

        } catch (err) {
            console.error("Erreur Antilink Check:", err);
            return false;
        }
    }

    return false;
}

module.exports = checkAntilink;
