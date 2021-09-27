/* eslint-disable no-undef */
require('dotenv').config();
const ytdl = require('ytdl-core');
const ytpl = require('ytpl');
const Discord = require('discord.js');
const client = new Discord.Client();

// All playlists import
const rapUS2000 = require('./assets/playlists/rapUS2000.json');
const rapFRChill = require('./assets/playlists/rapFRChill.json');
const watiSon = require('./assets/playlists/watiSon.json');

// Libraries
const { formatSongs, loopPlaylist, styleMyText } = require('./libs/songs');
const { sendMessage } = require('./libs/messages');

// Playlists object
const playlists = {
  rapUS2000,
  rapFRChill,
  watiSon,
};

// Commands params
let commandMusicIdentifier = null; // First argument of a command like 'play', 'next' etc ...
let commandMusicParam = null; // Second argument of a command like the URL or the name of the playlist
let modifiers = { // The third argument of a command who will change the playlist behavior
  loop: false,
  loopAll: false
};

// Global vars
let songs = [];
let shouldStartPlayMethod = true;

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`); // Display a log when the bot is ready
});

// Event listener when a new message is wrote in any discord channels
client.on('message', async msg => {
  const voiceChannel = msg.member.voice.channel; // Get the user current channel who wrote the message
  if (voiceChannel === null) {
    return;
  }
  commandMusicIdentifier = msg.content.startsWith('play') || msg.content.startsWith('p'); // Check if the command start with play
  commandMusicParam = msg.content.startsWith('play') ? msg.content.replace(/play /, '') : msg.content.replace(/p /, ''); // Get all the string after 'play'

  if (commandMusicIdentifier) {
    commandMusicParam = commandMusicParam.split('*'); // Create an array with [0] as an url or a playlist name and [1] as a modifier
    if (playlists[`${commandMusicParam[0]}`]) {
      checkModifier(commandMusicParam);
      songs = formatSongs(playlists[`${commandMusicParam[0]}`]);
      loopPlaylist({ songs, playYoutubeSong, voiceChannel, leaveChannel, msg });
    } else if (commandMusicParam[0].startsWith('https://')) {
      checkModifier(commandMusicParam);
      if (commandMusicParam[0].match('playlist')) {
        const playlist = await ytpl(commandMusicParam[0])
          .catch((err) => {
            msg.channel.send(sendMessage('notFound'));
          });
        if (playlist && playlist.items && playlist.items.length) {
          playlist.items.forEach((song) => {
            if (song.shortUrl.startsWith('https://')) {
              songs.push({
                title: song.title,
                url: song.shortUrl,
                channelLink: song.author.url,
                author: song.author.name,
                channelPic: song.thumbnails[0].url,
                songPic: song.thumbnails[0].url,
                description: song.author.name
              });
            }
          });
        }
      } else {
        const songObject = await ytdl.getBasicInfo(commandMusicParam[0])
          .catch((err) => {
            msg.channel.send(sendMessage('notFound'));
          });
        if (songObject && songObject.videoDetails) {
          songs.push({
            title: songObject.videoDetails.title,
            url: songObject.videoDetails.video_url,
            channelLink: songObject.videoDetails.ownerProfileUrl,
            author: songObject.videoDetails.ownerChannelName,
            channelPic: songObject.videoDetails.author.thumbnails[0].url,
            songPic: songObject.videoDetails.thumbnails[0].url,
            description: `${songObject.videoDetails.description.slice(0, 200)} ...`
          });
        }
      }
      if (shouldStartPlayMethod && (songs && songs.length)) {
        shouldStartPlayMethod = false;
        loopPlaylist({ songs, playYoutubeSong, voiceChannel, leaveChannel, msg });
      }
    } else {
      msg.channel.send(sendMessage('notFound'));
    }
  }

  const msgList = await msg.channel.messages.fetch({ limit: 10 });
  msgList.forEach(el => el.content.startsWith('play ') || el.content.startsWith('p ') && el.delete());

  if (msg.content === 'stop') {
    modifiers.loop = false;
    modifiers.loopAll = false;
    shouldStartPlayMethod = true;
    songs = [];
    voiceChannel.leave(); // The bot will leave the channel
  } else if (msg.content === 'next') {
    if (songs && songs.length) {
      songs.shift();
      if (songs.length) {
        msgList.forEach(el => el.author.id === '777560805448613899' && el.delete());
        msg.channel.send(styleMyText('#0099ff', songs[0]));
        playYoutubeSong(voiceChannel, msg);
      } else leaveChannel(voiceChannel, msg, 0);
    } else leaveChannel(voiceChannel, msg, 2000);
  } else if (msg.content === 'replay') {
    playYoutubeSong(voiceChannel, msg);
    msg.channel.send(styleMyText('#0099ff', songs[0]));
  } else if (msg.content === 'bruh-help') {
    msg.channel.send(sendMessage('help'));
  } else if (msg.content === 'stopLoop') {
    modifiers.loop = false;
  } else if (msg.content === 'stopLoopAll') {
    modifiers.loopAll = false;
  }
});

// playYoutubeSong will play your playlist songs
const playYoutubeSong = async(voiceChannel, msg) => {
  try {
    if (songs && songs[0] === undefined) {
      leaveChannel(voiceChannel, msg, 300000);
    }
    const connection = await voiceChannel.join(); // Join the user vocal channel
    if (songs && songs.length && songs[0].url.startsWith('https://')) {
      await connection.play(ytdl(songs[0].url, { filter: 'audioonly' })).on('finish', () => {
        if (msg.content === 'replay') {
          playYoutubeSong(voiceChannel, msg);
        }
        if (modifiers.loopAll) {
          modifiers.loop ? songs.unshift(songs.shift()) : songs.push(songs.shift());
        } else {
          modifiers.loop ? songs.unshift(songs.shift()) : songs.shift();
        }
        if (modifiers.loop) {
          playYoutubeSong(voiceChannel, msg);
        } else if (songs && songs.length) {
          loopPlaylist({ songs, playYoutubeSong, voiceChannel, leaveChannel, msg });
        } else {
          shouldStartPlayMethod = true;
          leaveChannel(voiceChannel, msg, 300000);
        }
      });
    }
  } catch (e) {
    console.log("L'url ne correspond à aucune vidéo youtube", e);
    msg.channel.send(sendMessage('notFound'));
    leaveChannel(voiceChannel, msg, 2000);
  }
};

const leaveChannel = (voiceChannel, msg, timer) => {
  setTimeout(() => {
    modifiers.loop = false;
    shouldStartPlayMethod = true;
    songs = [];
    voiceChannel.leave();
    return msg.channel.send(sendMessage('leave'));
  }, timer);
};

// checkModifier will check if a modifier has been called by the user
const checkModifier = (commandMusicParam) => {
  if (commandMusicParam[1]) {
    switch (commandMusicParam[1]) {
      case 'loop':
        modifiers.loop = true;
        break;
      case 'loopAll':
        modifiers.loopAll = true;
        break;
    }
  }
};

client.login(process.env.TOKEN);