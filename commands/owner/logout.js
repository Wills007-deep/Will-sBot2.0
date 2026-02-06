const fs = require('fs');
const path = require('path');

module.exports = {
    name: "logout",
    description: "Effacer la session et éteindre le bot (Proprio uniquement)",
    aliases: ["exit", "shutdown"],
    async execute(sock, m, { remoteJid, sender }) {
        // Sécurité Owner
        const isOwner = sender.split('@')[0].split(':')[0] === process.env.OWNER_NUMBER || m.key.fromMe;
        if (!isOwner) {
            return sock.sendMessage(remoteJid, { text: "❌ Commande réservée au propriétaire." }, { quoted: m });
        }

        await sock.sendMessage(remoteJid, { text: "👋 Déconnexion en cours... La session sera effacée. Relancez le bot pour scanner un nouveau QR code." }, { quoted: m });

        const AUTH_FOLDER = path.join(__dirname, "../../auth_info");

        setTimeout(async () => {
            try {
                await sock.logout();
                if (fs.existsSync(AUTH_FOLDER)) {
                    fs.rmSync(AUTH_FOLDER, { recursive: true, force: true });
                }
                console.log("[LOGOUT] Session effacée. Arrêt du bot...");
                process.exit(0);
            } catch (err) {
                console.error("Logout error:", err);
                process.exit(1);
            }
        }, 3000);
    }
};
