const { generateImage } = require('../../utils/imageGen');

module.exports = {
    name: 'help',
    description: 'Affiche le menu des commandes',
    aliases: ['menu', 'aide', 'h'],
    async execute(sock, m, { remoteJid, pushName, prefix, commands }) {
        await sock.sendMessage(remoteJid, { react: { text: "🤖", key: m.key } });

        const categories = {
            "🔓 HACK & VIEWONCE": ["vv", "save"],
            "🛡️ MODÉRATION": ["add", "degage", "up", "down", "tagall", "group", "antifaz", "suppr"],
            "🤖 INTELLIGENCE ARTIFICIELLE": ["ai", "aisay", "transcript", "imagine"],
            "🎵 MUSIQUE & VIDÉO": ["play", "video", "chipmunks"],
            "⚙️ OUTILS & SOCIAL": ["s", "qrcode", "pp", "translate", "profile", "link", "ping"],
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
                    catText += `  ▫️ *${prefix}${cmd.name}* : _${cmd.description || ""}_\n`;
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

        try {
            // Génération de l'image
            const buffer = await generateImage("Futuristic robot assistant with blue glowing eyes, high tech, digital art, 8k, unreal engine");

            await sock.sendMessage(remoteJid, {
                image: buffer,
                caption: menu
            }, { quoted: m });
        } catch (e) {
            // Fallback si l'image échoue
            await sock.sendMessage(remoteJid, { text: menu }, { quoted: m });
        }
    }
};
