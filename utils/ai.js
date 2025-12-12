const axios = require('axios');

async function chatAI(message) {
  const apis = [
    // API 1: PopCat
    async () => {
      const response = await axios.post('https://api.popcat.xyz/chatbot', {
        msg: message,
        owner: 'User',
        botname: 'Queen Selina'
      });
      return response.data.response;
    },
    // API 2: Simsimi
    async () => {
      const response = await axios.get('https://api.simsimi.vn/v1/simtalk', {
        params: { text: message, lc: 'en' }
      });
      return response.data.message;
    },
    // API 3: Hercai AI
    async () => {
      const response = await axios.get(`https://hercai.onrender.com/v3/hercai?question=${encodeURIComponent(message)}`);
      return response.data.reply;
    }
  ];

  for (const api of apis) {
    try {
      const result = await api();
      if (result) return result;
    } catch (error) {
      continue;
    }
  }

  return "I'm having trouble connecting right now. Please try again later! 💞";
}

module.exports = { chatAI };
