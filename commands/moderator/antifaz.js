const fs = require('fs');
const path = require('path');

// Chemin vers le fichier de configuration (à adapter selon où il sera stocké dans votre projet)
// Pour Will's Bot, on peut utiliser un fichier settings.json à la racine ou dans data
const SETTINGS_FILE = path.resolve(__dirname, '../../data/settings.json');

module.exports = {
    name: "antifaz",
    description: "Activer ou désactiver l'Anti-Delete (Restauration de messages)",
    adminOnly: true, // IMPORTANT: Réservé aux admins
    async execute(sock, m, { args, remoteJid, antideleteGroups, sender }) {
        // --- VÉRIFICATION ADMIN/OWNER ---
        const isOwner = m.key.fromMe || sender.split('@')[0].split(':')[0] === process.env.OWNER_NUMBER;
        let isAdmin = false;

        if (m.key.remoteJid.endsWith('@g.us')) {
            const groupMetadata = await sock.groupMetadata(m.key.remoteJid);
            const participant = groupMetadata.participants.find(p => p.id === sender);
            isAdmin = participant && (participant.admin === 'admin' || participant.admin === 'superadmin');
        }

        if (!isOwner && !isAdmin) {
            return sock.sendMessage(remoteJid, { text: "❌ Désolé, cette commande est réservée aux Administrateurs du groupe." }, { quoted: m });
        }


        const action = args[0]?.toLowerCase();

        if (!action) {
            const status = antideleteGroups.has(remoteJid) ? "ACTIVÉ ✅" : "DÉSACTIVÉ ❌";
            return sock.sendMessage(remoteJid, { text: `🛡️ *Anti-Faz System*\n\nLe système de restauration est actuellement : *${status}*\n\nUsage :\n*!antifaz on* (Activer)\n*!antifaz off* (Désactiver)` }, { quoted: m });
        }

        if (action === 'on' || action === 'enable' || action === 'activer') {
            antideleteGroups.add(remoteJid);
            await sock.sendMessage(remoteJid, { text: "✅ *Anti-Faz Activé !* \nJe restaurerai désormais les messages supprimés dans ce groupe." }, { quoted: m });
        } else if (action === 'off' || action === 'disable' || action === 'desactiver') {
            antideleteGroups.delete(remoteJid);
            await sock.sendMessage(remoteJid, { text: "❌ *Anti-Faz Désactivé.* \nLes messages supprimés resteront secrets." }, { quoted: m });
        } else {
            return sock.sendMessage(remoteJid, { text: "Usage incorrect. Utilisez *!antifaz on* ou *!antifaz off*." }, { quoted: m });
        }

        // Sauvegarde persistante
        try {
            // S'assurer que le dossier data existe
            const dir = path.dirname(SETTINGS_FILE);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

            let currentSettings = {};
            if (fs.existsSync(SETTINGS_FILE)) {
                currentSettings = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8'));
            }

            // Mettre à jour la liste
            currentSettings.antidelete = Array.from(antideleteGroups);
            fs.writeFileSync(SETTINGS_FILE, JSON.stringify(currentSettings, null, 2));

        } catch (e) {
            console.error("Erreur sauvegarde settings:", e);
        }
    }
};
