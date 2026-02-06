const fs = require('fs');
const path = require('path');
const logger = require('./logger');

const commands = new Map();
const defaultPrefix = process.env.PREFIX || '!';

/**
 * Charge récursivement toutes les commandes du dossier commands/
 */
function loadCommands(dir = path.join(__dirname, '../commands')) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        // Créer les sous-dossiers par défaut
        ['public', 'moderator', 'owner'].forEach(sub => {
            fs.mkdirSync(path.join(dir, sub), { recursive: true });
        });
    }

    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            loadCommands(fullPath);
        } else if (file.endsWith('.js')) {
            try {
                // Supprimer le cache pour permettre le hot-reload plus tard
                delete require.cache[require.resolve(fullPath)];
                const command = require(fullPath);

                if (command.name) {
                    commands.set(command.name, command);
                    if (command.aliases && Array.isArray(command.aliases)) {
                        command.aliases.forEach(alias => commands.set(alias, command));
                    }
                    logger.debug(`Commande chargée : ${command.name}`);
                }
            } catch (error) {
                logger.error(`Erreur chargement commande ${file}:`, error);
            }
        }
    }
    const uniqueCommands = new Set(commands.values()).size;
    logger.info(`${uniqueCommands} commandes uniques (${commands.size} déclencheurs au total) chargées.`);
}

/**
 * Traite le message entrant
 */
async function handleMessage(sock, m) {
    try {
        const messageHeader = m.message;
        if (!messageHeader) return;

        // Extraire le texte du message (conversation, image, extended, etc.)
        const type = Object.keys(messageHeader)[0];
        const body = (type === 'conversation') ? messageHeader.conversation :
            (type === 'extendedTextMessage') ? messageHeader.extendedTextMessage.text :
                (type === 'imageMessage') ? messageHeader.imageMessage.caption :
                    (type === 'videoMessage') ? messageHeader.videoMessage.caption : '';

        // Préfixe dynamique passé depuis index.js
        const prefix = m.globalPrefix || defaultPrefix;

        // --- JEUX ET ÉCOUTES PASSIVES ---
        if (body && !body.startsWith(prefix)) {
            const uniqueCmds = Array.from(new Set(commands.values()));
            for (const cmd of uniqueCmds) {
                if (cmd.onMessage) {
                    try {
                        if (await cmd.onMessage(sock, m, body)) return;
                    } catch (e) { }
                }
            }
        }

        if (!body || !body.startsWith(prefix)) return;

        const args = body.slice(prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();

        const command = commands.get(commandName);

        if (!command) return;

        // Informations utiles pour la commande
        const remoteJid = m.key.remoteJid;
        const sender = m.key.participant || remoteJid;
        const isGroup = remoteJid.endsWith('@g.us');
        const pushName = m.pushName || 'Utilisateur';

        // Log simple
        logger.info(`[COMMANDE] ${pushName} (${sender.split('@')[0]}) utilise ${commandName}`);

        // Exécuter la commande
        await command.execute(sock, m, {
            args,
            body,
            remoteJid,
            sender,
            isGroup,
            pushName,
            prefix, // Préfixe dynamique passé
            commands, // Passer la map des commandes ici
            antideleteGroups: m.antideleteGroups // Passer les groupes anti-delete
        });

    } catch (error) {
        logger.error('Erreur dans le handler:', error);
    }
}

// Charger les commandes au démarrage du module
loadCommands();

module.exports = handleMessage;
module.exports.commands = commands; // Pour l'aide
