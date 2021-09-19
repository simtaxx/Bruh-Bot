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
const { formatSongs, loopPlaylist } = require('./libs/songs');
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
let modifiers = { loop: false }; // The third argument of a command who will change the playlist behavior

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
              songs.push({title: song.title, url: song.shortUrl});
            }
          });
        }
      } else {
        const songObject = await ytdl.getBasicInfo(commandMusicParam[0])
          .catch((err) => {
            msg.channel.send(sendMessage('notFound'));
          });
        if (songObject && songObject.videoDetails) {
          songs.push({title: songObject.videoDetails.title, url: songObject.videoDetails.video_url});
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

  if (msg.content === 'stop') {
    modifiers.loop = false;
    shouldStartPlayMethod = true;
    songs = [];
    voiceChannel.leave(); // The bot will leave the channel
  } else if (msg.content === 'next') {
    setTimeout(() => { // TODO: SUE A REAL TIMEOUT WHO WILL WAIT 1 SECOND AFTER THE SONG NEXTED
      if (songs && songs.length) {
        modifiers.loop ? songs.push(songs.shift()) : songs.shift();
        if (songs.length) {
          msg.channel.send(`Musique en cours - ${songs[0].title}`); // Display a message in a text channel who the bot has been called
          playYoutubeSong(voiceChannel, msg);
        } else leaveChannel(voiceChannel, msg, 2000);
      } else leaveChannel(voiceChannel, msg, 2000);
    }, 1000);
  } else if (msg.content === 'replay') {
    playYoutubeSong(voiceChannel, msg);
    msg.channel.send(sendMessage('replay', songs[0].title));
  } else if (msg.content === 'help') {
    msg.channel.send(sendMessage('help'));
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
        modifiers.loop ? songs.push(songs.shift()) : songs.shift();
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
  for (const property in modifiers) {
    modifiers[property] = false;
  }
  if (commandMusicParam[1]) {
    switch (commandMusicParam[1]) {
      case 'loop':
        modifiers.loop = true;
        break;
    }
  }
};

client.login(process.env.TOKEN);