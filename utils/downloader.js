const axios = require('axios');
const cheerio = require('cheerio');

// TikTok Downloader
async function tiktokDownload(url) {
  try {
    const response = await axios.get(`https://api.tiklydown.eu.org/api/download?url=${encodeURIComponent(url)}`);
    return {
      success: true,
      video: response.data.video.noWatermark,
      music: response.data.music.play_url,
      title: response.data.title,
      author: response.data.author.unique_id
    };
  } catch (error) {
    return { success: false, error: 'Failed to download TikTok video' };
  }
}

// Instagram Downloader
async function instagramDownload(url) {
  try {
    const response = await axios.get(`https://api.instantdown.tech/download?url=${encodeURIComponent(url)}`);
    return {
      success: true,
      url: response.data.download_url,
      thumbnail: response.data.thumbnail,
      title: response.data.title
    };
  } catch (error) {
    return { success: false, error: 'Failed to download Instagram content' };
  }
}

// Facebook Downloader
async function facebookDownload(url) {
  try {
    const response = await axios.get(`https://api.fdownloader.net/api/facebook?url=${encodeURIComponent(url)}`);
    return {
      success: true,
      video_hd: response.data.hd,
      video_sd: response.data.sd,
      title: response.data.title
    };
  } catch (error) {
    return { success: false, error: 'Failed to download Facebook video' };
  }
}

// Spotify Downloader
async function spotifyDownload(url) {
  try {
    const response = await axios.get(`https://api.spotifydown.com/download/${url}`);
    return {
      success: true,
      download: response.data.link,
      title: response.data.title,
      artist: response.data.artist
    };
  } catch (error) {
    return { success: false, error: 'Failed to download Spotify track' };
  }
}

// APK Downloader
async function apkDownload(appName) {
  try {
    const searchUrl = `https://apkpure.com/search?q=${encodeURIComponent(appName)}`;
    const response = await axios.get(searchUrl);
    const $ = cheerio.load(response.data);
    
    const firstResult = $('.first').find('a').attr('href');
    if (firstResult) {
      return {
        success: true,
        url: `https://apkpure.com${firstResult}`,
        name: appName
      };
    }
    return { success: false, error: 'App not found' };
  } catch (error) {
    return { success: false, error: 'Failed to search APK' };
  }
}

// MediaFire Downloader
async function mediaFireDownload(url) {
  try {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);
    
    const downloadLink = $('#downloadButton').attr('href');
    const fileName = $('.filename').text();
    const fileSize = $('.details li').first().text();
    
    return {
      success: true,
      download: downloadLink,
      filename: fileName,
      size: fileSize
    };
  } catch (error) {
    return { success: false, error: 'Failed to get MediaFire link' };
  }
}

module.exports = {
  tiktokDownload,
  instagramDownload,
  facebookDownload,
  spotifyDownload,
  apkDownload,
  mediaFireDownload
};
