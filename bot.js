const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const Database = require('./utils/database');
const { googleSearch } = require('./utils/google');
const { chatAI } = require('./utils/ai');
const { 
  tiktokDownload, 
  instagramDownload, 
  facebookDownload,
  spotifyDownload,
  apkDownload,
  mediaFireDownload 
} = require('./utils/downloader');
const axios = require('axios');
const fs = require('fs');

const botsDB = new Database('bots.json');
const settingsDB = new Database('settings.json');

const BOT_PROFILE_PICTURE = 'https://i.imgur.com/rm1qWjR.jpeg';

class BotManager {
  constructor() {
    this.bots = new Map();
    this.qrCodes = new Map();
  }

  async createBot(botId, phoneNumber) {
    if (this.bots.has(botId)) {
      return false;
    }

    const client = new Client({
      authStrategy: new LocalAuth({ clientId: botId }),
      puppeteer: {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu'
        ]
      }
    });

    this.setupEventHandlers(client, botId);
    await client.initialize();
    this.bots.set(botId, { client, phoneNumber });
    return true;
  }

  setupEventHandlers(client, botId) {
    client.on('qr', async (qr) => {
      console.log(`QR Code generated for bot ${botId}`);
      const qrImage = await qrcode.toDataURL(qr);
      this.qrCodes.set(botId, qrImage);
      botsDB.update({ id: botId }, { qrCode: qrImage });
    });

    client.on('ready', async () => {
      console.log(`✅ Bot ${botId} is ready!`);
      botsDB.update({ id: botId }, { status: 'active' });

      // Set profile picture
      try {
        const response = await axios.get(BOT_PROFILE_PICTURE, { responseType: 'arraybuffer' });
        const media = new MessageMedia('image/jpeg', Buffer.from(response.data).toString('base64'));
        await client.setProfilePicture(media);
        console.log('✅ Profile picture set successfully');
      } catch (error) {
        console.log('⚠️ Could not set profile picture:', error.message);
      }

      // Auto join channel
      const settings = this.getSettings(botId);
      if (settings.autoJoinChannel) {
        await this.autoJoinChannel(client);
      }
    });

    client.on('auth_failure', () => {
      console.log(`❌ Authentication failed for bot ${botId}`);
      botsDB.update({ id: botId }, { status: 'failed' });
    });

    client.on('disconnected', () => {
      console.log(`⚠️ Bot ${botId} disconnected`);
      botsDB.update({ id: botId }, { status: 'disconnected' });
      this.bots.delete(botId);
    });

    client.on('message', async (message) => {
      await this.handleMessage(client, message, botId);
    });
  }

  getSettings(botId) {
    let settings = settingsDB.findOne({ botId });
    if (!settings) {
      settings = {
        botId,
        autoReact: false,
        reactToCommands: true,
        reactions: ['❤️', '💞', '😊', '🔥', '👍', '⭐'],
        autoJoinChannel: true,
        welcomeMessage: true,
        antiSpam: true
      };
      settingsDB.insert(settings);
    }
    return settings;
  }

  async autoJoinChannel(client) {
    try {
      const channelId = '0029VavLxme5PO0yDv3eUa47';
      console.log(`Attempting to join channel: ${channelId}`);
    } catch (error) {
      console.error('Error joining channel:', error);
    }
  }

  async reactToMessage(message, botId) {
    try {
      const settings = this.getSettings(botId);
      if (!settings.autoReact && !settings.reactToCommands) {
        return;
      }

      const reactions = settings.reactions || ['❤️', '💞', '😊', '🔥', '👍', '⭐'];
      const randomReaction = reactions[Math.floor(Math.random() * reactions.length)];
      await message.react(randomReaction);
    } catch (error) {
      // Silently fail
    }
  }

  async handleMessage(client, message, botId) {
    const body = message.body.trim();
    const lowerBody = body.toLowerCase();
    const chat = await message.getChat();
    const settings = this.getSettings(botId);

    const isCommand = lowerBody.startsWith('.');

    if (isCommand && settings.reactToCommands) {
      await this.reactToMessage(message, botId);
    }

    if (!isCommand && settings.autoReact && !message.fromMe) {
      await this.reactToMessage(message, botId);
    }

    try {
      // Help & Menu
      if (lowerBody === '.menu' || lowerBody === '.help') {
        await this.sendMenu(chat);
      }
      else if (lowerBody === '.settings') {
        await this.sendSettings(chat, botId);
      }
      else if (lowerBody === '.alive' || lowerBody === '.ping') {
        await this.handleAlive(chat);
      }
      else if (lowerBody === '.owner' || lowerBody === '.dev') {
        await this.handleOwner(chat);
      }

      // Search & AI
      else if (lowerBody.startsWith('.google ')) {
        const query = body.substring(8);
        await this.handleGoogleSearch(chat, query);
      }
      else if (lowerBody.startsWith('.ai ') || lowerBody.startsWith('.gpt ')) {
        const prompt = body.substring(lowerBody.startsWith('.ai ') ? 4 : 5);
        await this.handleAIChat(chat, prompt);
      }

      // Media Creation
      else if (lowerBody.startsWith('.c2i ')) {
        const text = body.substring(5);
        await this.handleTextToImage(chat, text);
      }
      else if (lowerBody.startsWith('.sticker') || lowerBody.startsWith('.s ')) {
        await this.handleSticker(message, chat);
      }

      // Downloaders
      else if (lowerBody.startsWith('.tiktok ') || lowerBody.startsWith('.tt ')) {
        const url = body.split(' ')[1];
        await this.handleTikTokDownload(chat, url);
      }
      else if (lowerBody.startsWith('.instagram ') || lowerBody.startsWith('.ig ')) {
        const url = body.split(' ')[1];
        await this.handleInstagramDownload(chat, url);
      }
      else if (lowerBody.startsWith('.facebook ') || lowerBody.startsWith('.fb ')) {
        const url = body.split(' ')[1];
        await this.handleFacebookDownload(chat, url);
      }
      else if (lowerBody.startsWith('.spotify ') || lowerBody.startsWith('.sp ')) {
        const url = body.split(' ')[1];
        await this.handleSpotifyDownload(chat, url);
      }
      else if (lowerBody.startsWith('.apk ')) {
        const appName = body.substring(5);
        await this.handleApkDownload(chat, appName);
      }
      else if (lowerBody.startsWith('.mediafire ') || lowerBody.startsWith('.mf ')) {
        const url = body.split(' ')[1];
        await this.handleMediaFireDownload(chat, url);
      }

      // Movies
      else if (lowerBody.startsWith('.yts ')) {
        const query = body.substring(5);
        await this.handleYTSSearch(chat, query);
      }
      else if (lowerBody.startsWith('.movie ')) {
        const url = body.substring(7);
        await this.handleMovieInfo(chat, url);
      }
      else if (lowerBody.startsWith('.download ')) {
        const url = body.substring(10);
        await this.handleMovieDownload(chat, url);
      }

      // Fun & Utility
      else if (lowerBody.startsWith('.weather ')) {
        const city = body.substring(9);
        await this.handleWeather(chat, city);
      }
      else if (lowerBody === '.joke') {
        await this.handleJoke(chat);
      }
      else if (lowerBody === '.quote') {
        await this.handleQuote(chat);
      }
      else if (lowerBody.startsWith('.translate ')) {
        const text = body.substring(11);
        await this.handleTranslate(chat, text);
      }

    } catch (error) {
      console.error('Message handling error:', error);
      await chat.sendMessage('❌ An error occurred. Please try again later.');
    }
  }

  async sendMenu(chat) {
    const menu = `
╔════════════════════════════╗
║   👑 *QUEEN SELINA* 💞     ║
╚════════════════════════════╝

*🔍 SEARCH & AI*
━━━━━━━━━━━━━━━━━━━━━━
.google <query> - Google search
.ai <message> - Chat with AI
.gpt <message> - GPT chat

*📥 DOWNLOADERS*
━━━━━━━━━━━━━━━━━━━━━━
.tiktok <url> - TikTok video
.instagram <url> - Instagram media
.facebook <url> - Facebook video
.spotify <url> - Spotify track
.apk <name> - Download APK
.mediafire <url> - MediaFire file

*🎨 MEDIA & FUN*
━━━━━━━━━━━━━━━━━━━━━━
.c2i <text> - Text to Image
.sticker - Convert to sticker
.weather <city> - Weather info
.joke - Random joke
.quote - Inspirational quote
.translate <text> - Translate

*🎬 MOVIES*
━━━━━━━━━━━━━━━━━━━━━━
.yts <query> - Search movies
.movie <url> - Movie details
.download <url> - Download links

*ℹ️ INFO & SETTINGS*
━━━━━━━━━━━━━━━━━━━━━━
.menu - Show this menu
.settings - Bot settings
.alive - Check status
.owner - Developer info

━━━━━━━━━━━━━━━━━━━━━━━━━━
✨ *QUEEN SELINA BOT* ✨
━━━━━━━━━━━━━━━━━━━━━━━━━━

💞 _Advanced WhatsApp Bot_
🔒 _Safe Mode Enabled_
⚡ _Online 24/7_

_Type .help for command list_
    `;
    await chat.sendMessage(menu);
  }

  async sendSettings(chat, botId) {
    const settings = this.getSettings(botId);
    const settingsText = `
⚙️ *BOT SETTINGS*

*Auto React:* ${settings.autoReact ? '✅ ON' : '❌ OFF'}
*React to Commands:* ${settings.reactToCommands ? '✅ ON' : '❌ OFF'}
*Auto Join Channel:* ${settings.autoJoinChannel ? '✅ ON' : '❌ OFF'}
*Welcome Message:* ${settings.welcomeMessage ? '✅ ON' : '❌ OFF'}
*Anti-Spam:* ${settings.antiSpam ? '✅ ON' : '❌ OFF'}

💡 *Change settings:*
Visit your bot dashboard to customize.

⚠️ *Note:* Auto-react disabled by default to prevent bans.
    `;
    await chat.sendMessage(settingsText);
  }

  async handleAlive(chat) {
    const uptime = process.uptime();
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);
    
    const aliveMsg = `
👑 *QUEEN SELINA* 💞

✅ *Status:* Online
⏱️ *Uptime:* ${hours}h ${minutes}m ${seconds}s
🤖 *Version:* 4.0.0
⚡ *Speed:* Fast

_Bot is running perfectly!_
    `;
    await chat.sendMessage(aliveMsg);
  }

  async handleOwner(chat) {
    const ownerMsg = `
👨‍💻 *DEVELOPER INFORMATION*

*Name:* AshenEditZ
*Contact:* +94 726962984
*Email:* ashen.editz@gmail.com

*Bot:* Queen Selina 💞
*Version:* 4.0.0
*Made in:* Sri Lanka 🇱🇰

━━━━━━━━━━━━━━━━━━━━━━
_Thank you for using Queen Selina!_
    `;
    await chat.sendMessage(ownerMsg);
  }

  async handleGoogleSearch(chat, query) {
    await chat.sendStateTyping();
    try {
      const results = await googleSearch(query);
      let resultText = `🔍 *Google Search*\n\n*Query:* ${query}\n\n`;
      
      results.forEach((result, index) => {
        resultText += `${index + 1}. *${result.title}*\n`;
        if (result.link) resultText += `🔗 ${result.link}\n`;
        if (result.description) resultText += `📝 ${result.description}\n\n`;
      });

      await chat.sendMessage(resultText);
    } catch (error) {
      await chat.sendMessage('❌ Error performing search.');
    }
  }

  async handleAIChat(chat, prompt) {
    await chat.sendStateTyping();
    try {
      const response = await chatAI(prompt);
      await chat.sendMessage(`🤖 *Queen Selina AI:*\n\n${response}`);
    } catch (error) {
      await chat.sendMessage('❌ Error connecting to AI.');
    }
  }

  async handleTextToImage(chat, text) {
    await chat.sendStateTyping();
    try {
      const response = await axios.get('https://api.infinityapi.org/c2i', {
        headers: { 'Authorization': 'Bearer Infinity-manoj-x-mizta' },
        params: { 'text': text, 'color': 'red' },
        responseType: 'arraybuffer',
        timeout: 30000
      });

      const media = new MessageMedia(
        'image/png',
        Buffer.from(response.data).toString('base64'),
        'text-image.png'
      );
      await chat.sendMessage(media, { caption: `📝 *${text}*` });
    } catch (error) {
      await chat.sendMessage('❌ Error generating image.');
    }
  }

  async handleSticker(message, chat) {
    await chat.sendStateTyping();
    try {
      if (message.hasMedia) {
        const media = await message.downloadMedia();
        await chat.sendMessage(media, { sendMediaAsSticker: true });
      } else if (message.hasQuotedMsg) {
        const quotedMsg = await message.getQuotedMessage();
        if (quotedMsg.hasMedia) {
          const media = await quotedMsg.downloadMedia();
          await chat.sendMessage(media, { sendMediaAsSticker: true });
        }
      } else {
        await chat.sendMessage('❌ Please reply to an image or send an image with .sticker');
      }
    } catch (error) {
      await chat.sendMessage('❌ Error creating sticker.');
    }
  }

  async handleTikTokDownload(chat, url) {
    await chat.sendStateTyping();
    try {
      const result = await tiktokDownload(url);
      if (result.success) {
        const response = await axios.get(result.video, { responseType: 'arraybuffer', timeout: 60000 });
        const media = new MessageMedia('video/mp4', Buffer.from(response.data).toString('base64'));
        await chat.sendMessage(media, { 
          caption: `🎵 *TikTok Download*\n\n*Title:* ${result.title}\n*Author:* @${result.author}` 
        });
      } else {
        await chat.sendMessage('❌ ' + result.error);
      }
    } catch (error) {
      await chat.sendMessage('❌ Error downloading TikTok video.');
    }
  }

  async handleInstagramDownload(chat, url) {
    await chat.sendStateTyping();
    try {
      const result = await instagramDownload(url);
      if (result.success) {
        const response = await axios.get(result.url, { responseType: 'arraybuffer', timeout: 60000 });
        const media = new MessageMedia('video/mp4', Buffer.from(response.data).toString('base64'));
        await chat.sendMessage(media, { caption: `📸 *Instagram Download*\n\n${result.title || ''}` });
      } else {
        await chat.sendMessage('❌ ' + result.error);
      }
    } catch (error) {
      await chat.sendMessage('❌ Error downloading Instagram content.');
    }
  }

  async handleFacebookDownload(chat, url) {
    await chat.sendStateTyping();
    try {
      const result = await facebookDownload(url);
      if (result.success) {
        await chat.sendMessage(`📘 *Facebook Download*\n\n*Title:* ${result.title}\n\n*HD:* ${result.video_hd}\n*SD:* ${result.video_sd}`);
      } else {
        await chat.sendMessage('❌ ' + result.error);
      }
    } catch (error) {
      await chat.sendMessage('❌ Error downloading Facebook video.');
    }
  }

  async handleSpotifyDownload(chat, url) {
    await chat.sendStateTyping();
    try {
      const result = await spotifyDownload(url);
      if (result.success) {
        await chat.sendMessage(`🎵 *Spotify Download*\n\n*Title:* ${result.title}\n*Artist:* ${result.artist}\n\n*Download:* ${result.download}`);
      } else {
        await chat.sendMessage('❌ ' + result.error);
      }
    } catch (error) {
      await chat.sendMessage('❌ Error downloading Spotify track.');
    }
  }

  async handleApkDownload(chat, appName) {
    await chat.sendStateTyping();
    try {
      const result = await apkDownload(appName);
      if (result.success) {
        await chat.sendMessage(`📱 *APK Download*\n\n*App:* ${result.name}\n*Link:* ${result.url}\n\n_Visit the link to download_`);
      } else {
        await chat.sendMessage('❌ ' + result.error);
      }
    } catch (error) {
      await chat.sendMessage('❌ Error searching APK.');
    }
  }

  async handleMediaFireDownload(chat, url) {
    await chat.sendStateTyping();
    try {
      const result = await mediaFireDownload(url);
      if (result.success) {
        await chat.sendMessage(`📁 *MediaFire Download*\n\n*File:* ${result.filename}\n*Size:* ${result.size}\n*Link:* ${result.download}`);
      } else {
        await chat.sendMessage('❌ ' + result.error);
      }
    } catch (error) {
      await chat.sendMessage('❌ Error getting MediaFire link.');
    }
  }

  async handleYTSSearch(chat, query) {
    await chat.sendStateTyping();
    try {
      const response = await axios.get('https://api.infinityapi.org/ytssearch', {
        headers: { 'Authorization': 'Bearer Infinity-manoj-x-mizta' },
        params: { 'q': query },
        timeout: 15000
      });

      let resultText = `🎬 *YTS Search*\n\n*Query:* ${query}\n\n`;
      
      if (response.data && response.data.data) {
        response.data.data.slice(0, 5).forEach((movie, index) => {
          resultText += `${index + 1}. *${movie.title}* (${movie.year})\n`;
          resultText += `⭐ ${movie.rating}/10\n`;
          resultText += `🔗 ${movie.url}\n\n`;
        });
      } else {
        resultText = '❌ No results found.';
      }
      await chat.sendMessage(resultText);
    } catch (error) {
      await chat.sendMessage('❌ Error searching YTS.');
    }
  }

  async handleMovieInfo(chat, url) {
    await chat.sendStateTyping();
    try {
      const response = await axios.get('https://api.infinityapi.org/cine-minfo', {
        headers: { 'Authorization': 'Bearer Infinity-manoj-x-mizta' },
        params: { 'url': url },
        timeout: 15000
      });

      const movie = response.data;
      let infoText = `🎬 *Movie Info*\n\n`;
      infoText += `*Title:* ${movie.title || 'N/A'}\n`;
      infoText += `*Year:* ${movie.year || 'N/A'}\n`;
      infoText += `*Genre:* ${movie.genre || 'N/A'}\n`;
      infoText += `*Rating:* ${movie.rating || 'N/A'}\n`;
      infoText += `*Description:* ${movie.description || 'N/A'}\n`;
      await chat.sendMessage(infoText);
    } catch (error) {
      await chat.sendMessage('❌ Error fetching movie info.');
    }
  }

  async handleMovieDownload(chat, url) {
    await chat.sendStateTyping();
    try {
      const response = await axios.get('https://api.infinityapi.org/cine-direct-dl', {
        headers: { 'Authorization': 'Bearer Infinity-manoj-x-mizta' },
        params: { 'url': url },
        timeout: 15000
      });

      let downloadText = `📥 *Download Links*\n\n`;
      
      if (response.data && response.data.links) {
        response.data.links.forEach((link, index) => {
          downloadText += `${index + 1}. *${link.quality}* - ${link.size}\n`;
          downloadText += `🔗 ${link.url}\n\n`;
        });
      } else {
        downloadText = '❌ No download links found.';
      }
      await chat.sendMessage(downloadText);
    } catch (error) {
      await chat.sendMessage('❌ Error fetching download links.');
    }
  }

  async handleWeather(chat, city) {
    await chat.sendStateTyping();
    try {
      const response = await axios.get(`https://wttr.in/${encodeURIComponent(city)}?format=j1`);
      const data = response.data;
      const current = data.current_condition[0];
      
      const weatherText = `
🌤️ *Weather Report*

*Location:* ${city}
*Temperature:* ${current.temp_C}°C / ${current.temp_F}°F
*Feels Like:* ${current.FeelsLikeC}°C
*Condition:* ${current.weatherDesc[0].value}
*Humidity:* ${current.humidity}%
*Wind Speed:* ${current.windspeedKmph} km/h
      `;
      await chat.sendMessage(weatherText);
    } catch (error) {
      await chat.sendMessage('❌ Error fetching weather data.');
    }
  }

  async handleJoke(chat) {
    await chat.sendStateTyping();
    try {
      const response = await axios.get('https://official-joke-api.appspot.com/random_joke');
      const joke = response.data;
      await chat.sendMessage(`😂 *Random Joke*\n\n${joke.setup}\n\n${joke.punchline}`);
    } catch (error) {
      await chat.sendMessage('❌ Error fetching joke.');
    }
  }

  async handleQuote(chat) {
    await chat.sendStateTyping();
    try {
      const response = await axios.get('https://api.quotable.io/random');
      const quote = response.data;
      await chat.sendMessage(`💭 *Inspirational Quote*\n\n"${quote.content}"\n\n- ${quote.author}`);
    } catch (error) {
      await chat.sendMessage('❌ Error fetching quote.');
    }
  }

  async handleTranslate(chat, text) {
    await chat.sendStateTyping();
    try {
      const response = await axios.get(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${encodeURIComponent(text)}`);
      const translated = response.data[0][0][0];
      await chat.sendMessage(`🌐 *Translation*\n\n*Original:* ${text}\n*Translated:* ${translated}`);
    } catch (error) {
      await chat.sendMessage('❌ Error translating text.');
    }
  }

  async sendBroadcast(botId, message) {
    const bot = this.bots.get(botId);
    if (!bot) return false;

    try {
      const chats = await bot.client.getChats();
      let sent = 0;
      for (const chat of chats) {
        if (!chat.isGroup) {
          await chat.sendMessage(`📢 *BROADCAST*\n\n${message}\n\n_From Queen Selina Team_`);
          sent++;
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }
      return sent;
    } catch (error) {
      console.error('Broadcast error:', error);
      return 0;
    }
  }

  getQR(botId) {
    return this.qrCodes.get(botId) || null;
  }

  async getPairingCode(botId, phoneNumber) {
    const bot = this.bots.get(botId);
    if (!bot) return null;

    try {
      const code = await bot.client.requestPairingCode(phoneNumber);
      botsDB.update({ id: botId }, { pairingCode: code });
      return code;
    } catch (error) {
      console.error('Pairing code error:', error);
      return null;
    }
  }

  getStatus(botId) {
    return this.bots.has(botId) ? 'active' : 'inactive';
  }

  async stopBot(botId) {
    const bot = this.bots.get(botId);
    if (!bot) return false;

    try {
      await bot.client.destroy();
      this.bots.delete(botId);
      this.qrCodes.delete(botId);
      return true;
    } catch (error) {
      console.error('Stop bot error:', error);
      return false;
    }
  }
}

let instance = null;
module.exports = class {
  constructor() {
    if (!instance) {
      instance = new BotManager();
    }
    return instance;
  }
};
