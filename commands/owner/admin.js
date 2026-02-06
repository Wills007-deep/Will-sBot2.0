const fs = require('fs');
const path = require('path');
const SETTINGS_FILE = path.resolve(__dirname, "../../data/settings.json");

function updateSettings(updateFn) {
    let settings = {};
    if (fs.existsSync(SETTINGS_FILE)) {
        settings = JSON.parse(fs.readFileSync(SETTINGS_FILE));
    }
    updateFn(settings);
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
}

function cleanNumber(num) {
    if (!num) return null;
    return num.replace(/[^0-9]/g, "");
}

module.exports = {
    name: "admin",
    description: "Commandes de gestion du bot",
    aliases: ["setprefix", "addowner", "delowner", "addmod", "delmod", "savesession", "sync"],
    async execute(sock, m, { args, body, remoteJid, isOwner, prefix }) {
        if (!isOwner) {
            return sock.sendMessage(remoteJid, { text: "⛔ Commande réservée au propriétaire." }, { quoted: m });
        }

        const cmd = body.slice(prefix.length).trim().split(/ +/)[0].toLowerCase();

        // --- 1. SET PREFIX ---
        if (cmd === 'setprefix') {
            const newPrefix = args[0];
            if (!newPrefix) return sock.sendMessage(remoteJid, { text: "❌ Précisez le nouveau préfixe." }, { quoted: m });

            updateSettings(s => s.prefix = newPrefix);
            return sock.sendMessage(remoteJid, { text: `✅ Préfixe changé en : *${newPrefix}*\n(Redémarrage instantané non requis)` });
        }

        // --- 2. GESTION UTILISATEURS ---
        const target = args[0] ? cleanNumber(args[0]) : (
            m.message.extendedTextMessage?.contextInfo?.participant ?
                cleanNumber(m.message.extendedTextMessage.contextInfo.participant) : null
        );

        if (!target) {
            return sock.sendMessage(remoteJid, { text: "❌ Mentionnez ou donnez le numéro de la cible." }, { quoted: m });
        }

        if (cmd === 'addowner') {
            updateSettings(s => {
                if (!s.owners) s.owners = [];
                if (!s.owners.includes(target)) s.owners.push(target);
            });
            await sock.sendMessage(remoteJid, { text: `👑 Nouveau propriétaire ajouté : ${target}` });
        }

        if (cmd === 'delowner') {
            updateSettings(s => {
                if (!s.owners) return;
                s.owners = s.owners.filter(o => o !== target);
            });
            await sock.sendMessage(remoteJid, { text: `🗑️ Propriétaire retiré : ${target}` });
        }

        if (cmd === 'addmod') {
            updateSettings(s => {
                if (!s.moderators) s.moderators = [];
                if (!s.moderators.includes(target)) s.moderators.push(target);
            });
            await sock.sendMessage(remoteJid, { text: `🛡️ Nouveau modérateur ajouté : ${target}` });
        }

        if (cmd === 'delmod') {
            updateSettings(s => {
                if (!s.moderators) return;
                s.moderators = s.moderators.filter(o => o !== target);
            });
            await sock.sendMessage(remoteJid, { text: `🗑️ Modérateur retiré : ${target}` });
        }

        // --- 3. SAUVEGARDE SESSION ---
        if (cmd === 'savesession' || cmd === 'sync') {
            await sock.sendMessage(remoteJid, { text: "🚀 Tentative de sauvegarde de la session sur Render...\n\n_Note : Le bot redémarrera d'ici 1-2 minutes._" });
            try {
                if (global.manualSyncSession) {
                    await global.manualSyncSession();
                    await sock.sendMessage(remoteJid, { text: "✅ Signal envoyé à Render ! Redémarrage imminent..." });
                } else {
                    throw new Error("Fonction de synchro non disponible.");
                }
            } catch (e) {
                await sock.sendMessage(remoteJid, { text: `❌ Erreur : ${e.message}` });
            }
        }
    }
};
