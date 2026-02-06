module.exports = {
    name: "group",
    description: "Gérer l'ouverture et la fermeture du groupe",
    aliases: ["groupe"],
    adminOnly: true,
    async execute(sock, m, { args, remoteJid }) {
        if (!remoteJid.endsWith("@g.us")) {
            return sock.sendMessage(remoteJid, { text: "❌ Cette commande ne fonctionne que dans un groupe." }, { quoted: m });
        }

        const action = args[0]?.toLowerCase();
        if (!action || !['open', 'close', 'ouvrir', 'fermer'].includes(action)) {
            return sock.sendMessage(remoteJid, { text: "❓ Usage: *!group open* ou *!group close*" }, { quoted: m });
        }

        try {
            await sock.sendMessage(remoteJid, { react: { text: "⚙️", key: m.key } });

            const setting = (action === 'close' || action === 'fermer') ? 'announcement' : 'not_announcement';
            await sock.groupSettingUpdate(remoteJid, setting);

            const message = setting === 'announcement'
                ? "🔒 *Groupe Fermé* : Seuls les admins peuvent envoyer des messages."
                : "🔓 *Groupe Ouvert* : Tout le monde peut envoyer des messages.";

            await sock.sendMessage(remoteJid, { text: message }, { quoted: m });

        } catch (err) {
            console.error("Erreur Group Settings:", err);
            await sock.sendMessage(remoteJid, { text: "❌ Erreur. Vérifiez que je suis bien admin du groupe." }, { quoted: m });
        }
    }
};
