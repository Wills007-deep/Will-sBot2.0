const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const fs = require('fs');
const path = require('path');

ffmpeg.setFfmpegPath(ffmpegPath);

module.exports = {
    name: "s",
    description: "Transformer une image ou vidéo en sticker",
    aliases: ["sticker", "autocollant"],
    async execute(sock, m, { remoteJid }) {
        const quoted = m.message.extendedTextMessage?.contextInfo?.quotedMessage;
        const msgWithMedia = quoted || m.message;

        const mediaType = msgWithMedia.imageMessage ? 'image' :
            msgWithMedia.videoMessage ? 'video' : null;

        if (!mediaType) {
            return sock.sendMessage(remoteJid, { text: "⚠️ Envoyez une image/vidéo ou répondez à un média avec *!s*." }, { quoted: m });
        }

        const tempDir = path.join(__dirname, "../../temp");
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

        const uniqueId = Date.now();
        const tempInput = path.join(tempDir, `input_${uniqueId}`);
        const tempOutput = path.join(tempDir, `output_${uniqueId}.webp`);

        try {
            await sock.sendMessage(remoteJid, { react: { text: "⏳", key: m.key } });

            // Télécharger le média
            const mediaData = msgWithMedia.imageMessage || msgWithMedia.videoMessage;
            const stream = await downloadContentFromMessage(mediaData, mediaType, {});
            let buffer = Buffer.from([]);
            for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

            fs.writeFileSync(tempInput, buffer);

            // Conversion via FFmpeg
            await new Promise((resolve, reject) => {
                ffmpeg(tempInput)
                    .outputOptions([
                        "-vcodec", "libwebp",
                        "-vf", "scale='min(512,iw)':'min(512,ih)':force_original_aspect_ratio=decrease,fps=15,pad=512:512:(512-iw)/2:(512-ih)/2:color=black@0",
                        "-loop", "0", "-preset", "default", "-an", "-vsync", "0",
                    ])
                    .toFormat("webp")
                    .save(tempOutput)
                    .on("end", resolve)
                    .on("error", reject);
            });

            await sock.sendMessage(remoteJid, { sticker: fs.readFileSync(tempOutput) }, { quoted: m });
            await sock.sendMessage(remoteJid, { react: { text: "✅", key: m.key } });

        } catch (error) {
            console.error("Erreur Sticker:", error);
            await sock.sendMessage(remoteJid, { text: "❌ Impossible de créer le sticker. Vérifiez que le média n'est pas trop lourd." }, { quoted: m });
        } finally {
            if (fs.existsSync(tempInput)) fs.unlinkSync(tempInput);
            if (fs.existsSync(tempOutput)) fs.unlinkSync(tempOutput);
        }
    }
};
