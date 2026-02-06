module.exports = {
    name: "say",
    description: "Faire répéter un texte au bot",
    aliases: ["dit", "repond"],
    async execute(sock, m, { args, remoteJid }) {
        const text = args.join(" ");
        if (!text) return;
        await sock.sendMessage(remoteJid, { text: text });
    }
};
