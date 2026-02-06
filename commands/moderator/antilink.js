const fs = require('fs');
const path = require('path');

const settingsPath = path.join(__dirname, '../../data/settings.json');

module.exports = {
    name: "antilink",
    description: "Activer ou désactiver l'anti-lien",
    aliases: ["anti-link", "link"],
    async execute(sock, m, { args, isGroup, remoteJid, antilinkGroups }) {
        if (!isGroup) return sock.sendMessage(remoteJid, { text: "⚠️ Groupe uniquement." }, { quoted: m });

        const mode = args[0]?.toLowerCase();

        if (mode === 'on') {
            if (!antilinkGroups.has(remoteJid)) {
                antilinkGroups.add(remoteJid);
                this.save(antilinkGroups);
                return sock.sendMessage(remoteJid, { text: "✅ *Antilink ACTIVÉ* pour ce groupe." }, { quoted: m });
            } else {
                return sock.sendMessage(remoteJid, { text: "⚠️ Antilink est déjà activé." }, { quoted: m });
            }
        } else if (mode === 'off') {
            if (antilinkGroups.has(remoteJid)) {
                antilinkGroups.delete(remoteJid);
                this.save(antilinkGroups);
                return sock.sendMessage(remoteJid, { text: "❌ *Antilink DÉSACTIVÉ*." }, { quoted: m });
            } else {
                return sock.sendMessage(remoteJid, { text: "⚠️ Antilink n'était pas activé." }, { quoted: m });
            }
        } else {
            const status = antilinkGroups.has(remoteJid) ? "Activé ✅" : "Désactivé ❌";
            return sock.sendMessage(remoteJid, { text: `🛡️ *Système Anti-Lien*\n\nÉtat : *${status}*\n\nUsage : *!antilink on* ou *!antilink off*` }, { quoted: m });
        }
    },

    save(antilinkGroups) {
        let settings = {};
        if (fs.existsSync(settingsPath)) settings = JSON.parse(fs.readFileSync(settingsPath));
        settings.antilink_groups = Array.from(antilinkGroups);
        fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
    }
};
