# 🤖 Will's Bot 2.0 - Ultimate WhatsApp Assistant

<p align="center">
  <img src="https://img.shields.io/badge/Version-2.0.0-blue?style=for-the-badge" alt="Version">
  <img src="https://img.shields.io/badge/Powered%20By-Baileys%20v7-green?style=for-the-badge" alt="Baileys">
  <img src="https://img.shields.io/badge/AI-Groq%20%26%20HuggingFace-orange?style=for-the-badge" alt="AI">
  <img src="https://img.shields.io/badge/Deploy-Render%20Ready-purple?style=for-the-badge" alt="Render">
</p>

---

## 🌟 Présentation
**Will's Bot 2.0** est un bot WhatsApp multifonctionnel, intelligent et ultra-performant. Conçu pour la modération, le divertissement et l'assistance personnelle, il intègre les meilleures fonctionnalités de **Psychobot** avec une stabilité renforcée.

## 🚀 Fonctionnalités Clés

### 🕵️ Outils "Ninja"
*   **ViewOnce Peek** : Extrait automatiquement les photos/vidéos à vue unique (👀).
*   **Ninja Extraction** : Répondez simplement à un message temporaire pour l'enregistrer.
*   **Anti-Delete (Anti-Faz)** : Récupère instantanément les messages supprimés du groupe.
*   **Status Saver** : Enregistre les statuts et les aime automatiquement ❤️.

### 🧠 Intelligence Artificielle
*   **Auto-Réponse AFK** : Répond intelligemment via Groq quand vous n'êtes pas là.
*   **Secrétaire IA** : Rejette les appels et génère une excuse personnalisée via l'IA.
*   **Transcription Vocale** : Convertit vos vocaux en texte avec Whisper (Hugging Face).
*   **AI Chat** : Discutez avec Llama 3 (`!ai`, `!llama`).

### 🎵 Multimédia & Fun
*   **YouTube Downloader** : Téléchargez n'importe quelle musique avec `!play`.
*   **Sticker Maker** : Créez des stickers à partir d'images ou de vidéos (`!s`).
*   **Audio Effects** : Transformez vos voix avec `!chipmunks`.
*   **Jeux** : Devinez le nombre, Action/Vérité, Mot de passe.

---

## 💻 Installation Locale

1.  **Cloner le repo** :
    ```bash
    git clone https://github.com/votre-username/wills-bot-2.0.git
    cd wills-bot-2.0
    ```
2.  **Installer les dépendances** :
    ```bash
    npm install
    ```
3.  **Configurer le `.env`** :
    Copiez `.env.example` vers `.env` et remplissez vos clés API.
4.  **Lancer le bot** :
    ```bash
    npm start
    ```

---

## ☁️ Déploiement sur Render (Persistance Totale)

Ce bot est optimisé pour **Render**. Grâce au système `SESSION_DATA`, vous ne scannez le QR code qu'une seule fois.

1.  Créez un **Web Service** sur Render.
2.  Ajoutez votre repository.
3.  Configurez les variables d'environnement suivantes :
    *   `OWNER_NUMBER` : Votre numéro (Ex: `2376xxxxxxxx`)
    *   `GROQ_API_KEY` : Votre clé API Groq.
    *   `HUGGINGFACE_API_KEY` : Votre clé Hugging Face.
    *   `RENDER_API_KEY` : Votre clé API Render (Profil -> Settings -> API Keys).
    *   `RENDER_SERVICE_ID` : L'ID de votre service (dans l'URL de votre dashboard Render).

---

## 🛡️ Modération
*   `!add` : Ajouter un membre.
*   `!kick` : Exclure un membre.
*   `!suppr` : Supprimer un message.
*   `!tagall` : Mentionner tout le monde.
*   `!antilink` : Contrôle des pubs interdites.

---

## 🤝 Crédits
Développé avec ❤️ par **Will's Dev** et amélioré avec l'esprit de **Psychobot**.

---
*Ce bot est destiné à un usage personnel et éducatif. Respectez les conditions d'utilisation de WhatsApp.*
