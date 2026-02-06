const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

/**
 * Gestionnaire pour extraire les messages ViewOnce (Vue Unique)
 * Se déclenche lorsque le propriétaire réagit (ex: 👀, 🔓, ❤️) à un message éphémère.
 * La réaction doit venir du propriétaire du bot.
 * @param {object} reaction - L'objet réaction reçu de Baileys
 * @param {object} sock - Socket Baileys
 * @param {Map} messageCache - Cache des messages pour retrouver le contenu original
 * @param {string} ownerJid - JID du propriétaire pour vérification
 */
async function handleViewOnceData(reaction, sock, messageCache, ownerJid) {
    const { key } = reaction;

    // 1. Log
    logger.info(`[ViewOnce] Extraction demandée pour ${key.id}`);

    // 2. Récupérer le message depuis le cache
    const targetId = reaction.reaction?.key?.id || key.id;
    const cachedMsg = messageCache.get(targetId);
    if (!cachedMsg) return; // Message trop vieux ou pas en cache

    // 3. Vérifier si c'est un ViewOnce
    let content = cachedMsg.message;
    // Peel layers (Baileys sometimes wraps messages)
    if (content.ephemeralMessage) content = content.ephemeralMessage.message;
    if (content.viewOnceMessage) content = content.viewOnceMessage.message;
    if (content.viewOnceMessageV2) content = content.viewOnceMessageV2.message;
    if (content.viewOnceMessageV2Extension) content = content.viewOnceMessageV2Extension.message;

    // Simplification: Try to find media message inside
    const mediaType = Object.keys(content).find(k => k.includes('Message') && k !== 'senderKeyDistributionMessage');
    if (!mediaType) return;

    console.log(`[ViewOnce Handler] Tentative d'extraction pour message ${key.id} (Type: ${mediaType})`);

    try {
        const mediaData = content[mediaType];

        // Sécurité supplémentaire : s'assurer qu'il y a des données média
        if (!mediaData || !mediaData.mediaKey) return;

        // 4. Télécharger le média (Correction: Options vides pour éviter fetch failed)
        const stream = await downloadContentFromMessage(mediaData, mediaType.replace('Message', ''), {});
        let buffer = Buffer.from([]);
        for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

        // 5. Envoyer en privé au propriétaire (Note to self)
        const myJid = sock.user.id.split(':')[0] + '@s.whatsapp.net';
        const senderName = cachedMsg.pushName || "Inconnu";
        const caption = `🕵️ *ViewOnce Capturé* \n👤 *De:* ${senderName}\n📅 *Date:* ${new Date().toLocaleTimeString()}`;

        // Options message
        const options = { caption };

        const type = mediaType.replace('Message', '');

        if (type === 'image') {
            await sock.sendMessage(myJid, { image: buffer, ...options });
        } else if (type === 'video') {
            await sock.sendMessage(myJid, { video: buffer, ...options });
        } else if (type === 'audio') {
            await sock.sendMessage(myJid, { audio: buffer, mimetype: 'audio/mp4', ptt: true });
        }

        // 6. Feedback discret (réaction de confirmation sur le message d'origine)
        await sock.sendMessage(key.remoteJid, {
            react: { text: "🔓", key: key }
        });

        console.log(`[ViewOnce Handler] Succès ! Média envoyé à ${myJid}`);

    } catch (err) {
        console.error("[ViewOnce Handler] Erreur d'extraction :", err);
    }
}

module.exports = handleViewOnceData;
