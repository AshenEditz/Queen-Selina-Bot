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

const botsDB = new Database('bots.json');
const settingsDB = new Database('settings.json');

const BOT_PROFILE_PICTURE = 'https://i.imgur.com/rm1qWjR.jpeg';

class BotManager {
  constructor() {
    this.bots = new Map();
    this.qrCodes = new Map();
    this.pairingCodes = new Map();
    console.log('🤖 Bot Manager initialized');
  }

  async createBot(botId, phoneNumber) {
    try {
      if (this.bots.has(botId)) {
        console.log(`⚠️ Bot ${botId} already exists`);
        return false;
      }

      console.log(`🔄 Creating bot ${botId} for ${phoneNumber}...`);

      const client = new Client({
        authStrategy: new LocalAuth({ 
          clientId: botId,
          dataPath: './sessions'
        }),
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
            '--disable-gpu',
            '--disable-web-security'
          ]
        }
      });

      this.setupEventHandlers(client, botId, phoneNumber);
      
      // Store client before initialization
      this.bots.set(botId, { client, phoneNumber, initialized: false });
      
      await client.initialize();
      
      console.log(`✅ Bot ${botId} created successfully`);
      return true;
    } catch (error) {
      console.error(`❌ Error creating bot ${botId}:`, error);
      this.bots.delete(botId);
      return false;
    }
  }

  setupEventHandlers(client, botId, phoneNumber) {
    // Loading screen
    client.on('loading_screen', (percent, message) => {
      console.log(`📱 Bot ${botId}: ${percent}% - ${message}`);
    });

    // QR Code event
    client.on('qr', async (qr) => {
      console.log(`📷 QR Code generated for bot ${botId}`);
      try {
        // Generate QR code as Data URL
        const qrImage = await qrcode.toDataURL(qr, {
          width: 400,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
        
        this.qrCodes.set(botId, qrImage);
        
        // Update database
        botsDB.update({ id: botId }, { 
          qrCode: qrImage,
          qrCodeRaw: qr,
          status: 'pending'
        });
        
        console.log(`✅ QR Code saved for bot ${botId}`);
      } catch (error) {
        console.error(`❌ QR Code generation error for bot ${botId}:`, error);
      }
    });

    // Authenticated
    client.on('authenticated', () => {
      console.log(`🔐 Bot ${botId} authenticated successfully`);
      botsDB.update({ id: botId }, { status: 'authenticated' });
    });

    // Ready event
    client.on('ready', async () => {
      console.log(`✅ Bot ${botId} is ready!`);
      
      // Update bot info
      const bot = this.bots.get(botId);
      if (bot) {
        bot.initialized = true;
      }
      
      botsDB.update({ id: botId }, { 
        status: 'active',
        connectedAt: new Date().toISOString()
      });

      // Clear QR code after successful connection
      this.qrCodes.delete(botId);

      // Set profile picture
      try {
        const response = await axios.get(BOT_PROFILE_PICTURE, { 
          responseType: 'arraybuffer',
          timeout: 30000 
        });
        const media = new MessageMedia(
          'image/jpeg', 
          Buffer.from(response.data).toString('base64')
        );
        await client.setProfilePicture(media);
        console.log(`✅ Profile picture set for bot ${botId}`);
      } catch (error) {
        console.log(`⚠️ Could not set profile picture for bot ${botId}`);
      }

      // Auto join channel
      const settings = this.getSettings(botId);
      if (settings.autoJoinChannel) {
        await this.autoJoinChannel(client, botId);
      }
    });

    // Authentication failure
    client.on('auth_failure', (msg) => {
      console.log(`❌ Authentication failed for bot ${botId}:`, msg);
      botsDB.update({ id: botId }, { 
        status: 'failed',
        error: msg 
      });
    });

    // Disconnected
    client.on('disconnected', (reason) => {
      console.log(`⚠️ Bot ${botId} disconnected:`, reason);
      botsDB.update({ id: botId }, { 
        status: 'disconnected',
        disconnectedAt: new Date().toISOString()
      });
      this.bots.delete(botId);
      this.qrCodes.delete(botId);
      this.pairingCodes.delete(botId);
    });

    // Handle messages
    client.on('message', async (message) => {
      try {
        await this.handleMessage(client, message, botId);
      } catch (error) {
        console.error(`❌ Message handling error for bot ${botId}:`, error);
      }
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

  async autoJoinChannel(client, botId) {
    try {
      const channelId = '0029VavLxme5PO0yDv3eUa47@newsletter';
      console.log(`📢 Attempting to join channel for bot ${botId}`);
    } catch (error) {
      console.error(`❌ Error joining channel for bot ${botId}:`, error);
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

    if (!isCommand) return;

    try {
      // Command handlers (same as before)
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
      else if (lowerBody.startsWith('.google ')) {
        const query = body.substring(8);
        await this.handleGoogleSearch(chat, query);
      }
      else if (lowerBody.startsWith('.ai ') || lowerBody.startsWith('.gpt ')) {
        const prompt = body.substring(lowerBody.startsWith('.ai ') ? 4 : 5);
        await this.handleAIChat(chat, prompt);
      }
      else if (lowerBody.startsWith('.c2i ')) {
        const text = body.substring(5);
        await this.handleTextToImage(chat, text);
      }
      else if (lowerBody.startsWith('.sticker') || lowerBody.startsWith('.s ')) {
        await this.handleSticker(message, chat);
      }
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
      else if (lowerBody.startsWith('.yts ')) {
        const query = body.substring(5);
        await this.handleYTSSearch(chat, query);
      }
      else if (lowerBody.startsWith('.movie ')) {
        const url = body.substring(7);
        await this.handleMovieInfo(chat, url);
      }
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

    } catch (error) {
      console.error(`❌ Command error for bot ${botId}:`, error);
      await chat.sendMessage('❌ An error occurred. Please try again later.');
    }
  }

  async sendMenu(chat) {
    const menu = `
╔════════════════════════════╗
║   👑 *QUEEN SELINA* 💞     ║
╚════════════════════════════╝

*🔍 SEARCH & AI*
.google <query> - Google search
.ai <message> - Chat with AI

*📥 DOWNLOADERS*
.tiktok <url> - TikTok video
.instagram <url> - Instagram
.facebook <url> - Facebook

*🎨 MEDIA & FUN*
.c2i <text> - Text to Image
.sticker - Make sticker
.weather <city> - Weather
.joke - Random joke
.quote - Inspiration

*🎬 MOVIES*
.yts <query> - Search movies
.movie <url> - Movie details

*ℹ️ INFO*
.menu - This menu
.settings - Bot settings
.alive - Check status
.owner - Developer info

💞 _Queen Selina - Your WhatsApp Bot_
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

💡 Change settings on dashboard
⚠️ Auto-react off by default (ban protection)
    `;
    await chat.sendMessage(settingsText);
  }

  async handleAlive(chat) {
    const uptime = process.uptime();
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    
    await chat.sendMessage(`
👑 *QUEEN SELINA* 💞

✅ *Status:* Online
⏱️ *Uptime:* ${hours}h ${minutes}m
🤖 *Version:* 4.0.0
⚡ *Speed:* Fast

_Bot is running perfectly!_
    `);
  }

  async handleOwner(chat) {
    await chat.sendMessage(`
👨‍💻 *DEVELOPER INFO*

*Name:* AshenEditZ
*Contact:* +94 76 873 8555
*Email:* ashen.editz@gmail.com

*Bot:* Queen Selina 💞
*Version:* 4.0.0
*Made in:* Sri Lanka 🇱🇰
    `);
  }

  async handleGoogleSearch(chat, query) {
    await chat.sendStateTyping();
    try {
      const results = await googleSearch(query);
      let resultText = `🔍 *Google Search*\n\n*Query:* ${query}\n\n`;
      results.forEach((result, index) => {
        resultText += `${index + 1}. *${result.title}*\n${result.link}\n\n`;
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
      await chat.sendMessage(`🤖 *AI:*\n\n${response}`);
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
      const media = new MessageMedia('image/png', Buffer.from(response.data).toString('base64'));
      await chat.sendMessage(media, { caption: `📝 ${text}` });
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
      } else {
        await chat.sendMessage('❌ Reply to an image with .sticker');
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
        await chat.sendMessage(`🎵 Downloading...`);
        const response = await axios.get(result.video, { responseType: 'arraybuffer', timeout: 60000 });
        const media = new MessageMedia('video/mp4', Buffer.from(response.data).toString('base64'));
        await chat.sendMessage(media);
      } else {
        await chat.sendMessage('❌ ' + result.error);
      }
    } catch (error) {
      await chat.sendMessage('❌ Download failed.');
    }
  }

  async handleInstagramDownload(chat, url) {
    await chat.sendStateTyping();
    try {
      const result = await instagramDownload(url);
      if (result.success) {
        await chat.sendMessage(`📸 Downloading...`);
        const response = await axios.get(result.url, { responseType: 'arraybuffer', timeout: 60000 });
        const media = new MessageMedia('video/mp4', Buffer.from(response.data).toString('base64'));
        await chat.sendMessage(media);
      } else {
        await chat.sendMessage('❌ ' + result.error);
      }
    } catch (error) {
      await chat.sendMessage('❌ Download failed.');
    }
  }

  async handleFacebookDownload(chat, url) {
    await chat.sendStateTyping();
    try {
      const result = await facebookDownload(url);
      if (result.success) {
        await chat.sendMessage(`📘 *Links:*\n\n*HD:* ${result.video_hd}\n*SD:* ${result.video_sd}`);
      } else {
        await chat.sendMessage('❌ ' + result.error);
      }
    } catch (error) {
      await chat.sendMessage('❌ Download failed.');
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
      let resultText = `🎬 *YTS Search*\n\n`;
      if (response.data && response.data.data) {
        response.data.data.slice(0, 5).forEach((movie, index) => {
          resultText += `${index + 1}. *${movie.title}* (${movie.year})\n⭐ ${movie.rating}/10\n${movie.url}\n\n`;
        });
      } else {
        resultText = '❌ No results found.';
      }
      await chat.sendMessage(resultText);
    } catch (error) {
      await chat.sendMessage('❌ Search failed.');
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
      await chat.sendMessage(`🎬 *${movie.title || 'Movie'}*\n\n*Year:* ${movie.year || 'N/A'}\n*Genre:* ${movie.genre || 'N/A'}\n*Rating:* ${movie.rating || 'N/A'}`);
    } catch (error) {
      await chat.sendMessage('❌ Fetch failed.');
    }
  }

  async handleWeather(chat, city) {
    await chat.sendStateTyping();
    try {
      const response = await axios.get(`https://wttr.in/${encodeURIComponent(city)}?format=j1`, { timeout: 10000 });
      const current = response.data.current_condition[0];
      await chat.sendMessage(`🌤️ *${city}*\n\n*Temp:* ${current.temp_C}°C\n*Feels:* ${current.FeelsLikeC}°C\n*Humidity:* ${current.humidity}%`);
    } catch (error) {
      await chat.sendMessage('❌ Weather fetch failed.');
    }
  }

  async handleJoke(chat) {
    await chat.sendStateTyping();
    try {
      const response = await axios.get('https://official-joke-api.appspot.com/random_joke');
      await chat.sendMessage(`😂 ${response.data.setup}\n\n${response.data.punchline}`);
    } catch (error) {
      await chat.sendMessage('❌ Joke fetch failed.');
    }
  }

  async handleQuote(chat) {
    await chat.sendStateTyping();
    try {
      const response = await axios.get('https://api.quotable.io/random');
      await chat.sendMessage(`💭 "${response.data.content}"\n\n- ${response.data.author}`);
    } catch (error) {
      await chat.sendMessage('❌ Quote fetch failed.');
    }
  }

  async sendBroadcast(botId, message) {
    const bot = this.bots.get(botId);
    if (!bot || !bot.initialized) return 0;

    try {
      const chats = await bot.client.getChats();
      let sent = 0;
      for (const chat of chats) {
        if (!chat.isGroup) {
          try {
            await chat.sendMessage(`📢 *BROADCAST*\n\n${message}\n\n_From Queen Selina_`);
            sent++;
            await new Promise(resolve => setTimeout(resolve, 3000));
          } catch (error) {
            console.error(`Error sending to chat:`, error);
          }
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
    if (!bot || !bot.client) {
      console.log(`❌ Bot ${botId} not found or client not initialized`);
      return null;
    }

    try {
      console.log(`🔗 Generating pairing code for ${phoneNumber}...`);
      
      // Request pairing code
      const code = await bot.client.requestPairingCode(phoneNumber);
      
      console.log(`✅ Pairing code generated: ${code}`);
      
      // Store pairing code
      this.pairingCodes.set(botId, code);
      
      // Update database
      botsDB.update({ id: botId }, { 
        pairingCode: code,
        pairingPhoneNumber: phoneNumber,
        pairingGeneratedAt: new Date().toISOString()
      });
      
      return code;
    } catch (error) {
      console.error(`❌ Pairing code error for bot ${botId}:`, error);
      return null;
    }
  }

  getStatus(botId) {
    const bot = this.bots.get(botId);
    if (!bot) return 'inactive';
    return bot.initialized ? 'active' : 'initializing';
  }

  async stopBot(botId) {
    const bot = this.bots.get(botId);
    if (!bot) return false;

    try {
      if (bot.client) {
        await bot.client.destroy();
      }
      this.bots.delete(botId);
      this.qrCodes.delete(botId);
      this.pairingCodes.delete(botId);
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
