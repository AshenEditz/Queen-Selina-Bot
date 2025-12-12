const axios = require('axios');
const cheerio = require('cheerio');

async function googleSearch(query) {
  try {
    const url = `https://www.google.com/search?q=${encodeURIComponent(query)}&num=5`;
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      timeout: 10000
    });

    const $ = cheerio.load(response.data);
    const results = [];

    $('.g').each((i, element) => {
      if (i < 5) {
        const title = $(element).find('h3').text();
        const link = $(element).find('a').attr('href');
        const description = $(element).find('.VwiC3b, .lyLwlc').text();

        if (title && link) {
          results.push({
            title: title,
            link: link,
            description: description || 'No description available'
          });
        }
      }
    });

    return results.length > 0 ? results : [{ title: 'No results found', link: '', description: '' }];
  } catch (error) {
    console.error('Google search error:', error.message);
    return [{ title: 'Search error', link: '', description: 'Unable to perform search at this time' }];
  }
}

module.exports = { googleSearch };
