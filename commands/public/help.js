module.exports = {
    name: 'help',
    description: 'Affiche le menu des commandes',
    aliases: ['menu', 'aide', 'h'],
    async execute(sock, m, { remoteJid, pushName, prefix, commands }) {
        const categories = {
            "🔓 HACK & VIEWONCE": ["vv", "save"],
            "🛡️ MODÉRATION": ["add", "degage", "up", "down", "tagall", "group", "antifaz", "suppr"],
            "🤖 INTELLIGENCE ARTIFICIELLE": ["ai", "aisay", "transcript", "imagine"],
            "🎵 MUSIQUE & AUDIO": ["play", "chipmunks"],
            "⚙️ OUTILS & SOCIAL": ["s", "pp", "translate", "profile", "link", "ping"],
            "🎮 DIVERTISSEMENT": ["av", "motgame", "guess"],
            "👑 OWNER": ["logout"]
        };

        let menu = `✨ *BIENVENUE SUR WILL'S BOT 2.0* ✨\n`;
        menu += `━━━━━━━━━━━━━━━━━━━━━━\n`;
        menu += `👤 *Utilisateur :* ${pushName}\n`;
        menu += `🤖 *Statut :* Opérationnel\n`;
        menu += `🔢 *Préfixe :* [ ${prefix} ]\n`;
        menu += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;

        for (const [category, cmds] of Object.entries(categories)) {
            let catText = "";
            cmds.forEach(cmdName => {
                const cmd = commands.get(cmdName);
                if (cmd) {
                    catText += `  ▫️ *${prefix}${cmd.name}*\n`;
                }
            });

            if (catText) {
                menu += `┏━━ *${category}*\n`;
                menu += catText;
                menu += `┗━━━━━━━━━━━━━━━━━━━━\n\n`;
            }
        }

        menu += `💡 _Utilisez ${prefix}help <commande> pour plus d'infos._\n`;
        menu += `🚀 *Will's Bot - Le futur entre vos mains*`;

        await sock.sendMessage(remoteJid, {
            text: menu,
            contextInfo: {
                externalAdReply: {
                    title: "Will's Bot 2.0 - Menu Premium",
                    body: "Système intelligent & Hack Tools",
                    thumbnailUrl: "https://i.ibb.co/vzG7L1b/image.png", // Image générique, à personnaliser
                    sourceUrl: "https://github.com/",
                    mediaType: 1,
                    renderLargerThumbnail: true
                }
            }
        }, { quoted: m });
    }
};
