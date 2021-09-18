/* eslint-disable no-undef */
require('dotenv').config();
const ytdl = require('ytdl-core');
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
let songs = null;
const songsQueue = [];

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`); // Display a log when the bot is ready
});

// Event listener when a new message is wrote in any discord channels
client.on('message', async msg => {
  const voiceChannel = msg.member.voice.channel; // Get the user current channel who wrote the message
  if (voiceChannel === null) {
    return;
  }
  commandMusicIdentifier = msg.content.startsWith('play'); // Check if the command start with play
  commandMusicParam = msg.content.replace(/play /, ''); // Get all the string after 'play'

  if (commandMusicIdentifier) {
    commandMusicParam = commandMusicParam.split('-'); // Create an array with [0] as an url or a playlist name and [1] as a modifier
    if (playlists[`${commandMusicParam[0]}`]) {
      checkModifier(commandMusicParam);
      songs = formatSongs(playlists[`${commandMusicParam[0]}`]);
      loopPlaylist({ songs, playYoutubeSong, voiceChannel, leaveChannel, msg });
    } else if (commandMusicParam[0].startsWith('https://')) {
      checkModifier(commandMusicParam);
      songsQueue.push(commandMusicParam[0]);
      if (songsQueue.length <= 1) {
        playYoutubeSong(voiceChannel, msg);
      }
    } else {
      msg.channel.send(sendMessage('notFound'));
    }
  }

  if (msg.content === 'stop') {
    modifiers.loop = false;
    voiceChannel.leave(); // The bot will leave the channel
  } else if (msg.content === 'next') {
    setTimeout(() => { // TODO: SUE A REAL TIMEOUT WHO WILL WAIT 1 SECOND AFTER THE SONG NEXTED
      if (songs) {
        modifiers.loop ? songs.push(songs.shift()) : songs.shift();
      }
      if (songsQueue) {
        modifiers.loop ? songsQueue.push(songsQueue.shift()) : songsQueue.shift();
      }
      if (songs && songs.length) {
        msg.channel.send(`Musique en cours - ${songs[0].title}`); // Display a message in a text channel who the bot has been called
        playYoutubeSong(voiceChannel, msg);
      } else if (songsQueue &&  songsQueue.length) {
        msg.channel.send(`Musique suivante`); // Display a message in a text channel who the bot has been called
        playYoutubeSong(voiceChannel, msg);
      } else leaveChannel(voiceChannel, msg);
    }, 1000);
  } else if (msg.content === 'replay' && songs) {
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
      leaveChannel(voiceChannel, msg);
    }
    const connection = await voiceChannel.join(); // Join the user vocal channel
    if (songsQueue && songsQueue[0].startsWith('https://')) {
      await connection.play(ytdl(songsQueue[0], { filter: 'audioonly' })).on('finish', () => {
        songsQueue.shift();
        if (modifiers.loop) {
          playYoutubeSong(voiceChannel, msg);
        } else if (songsQueue.length) {
          playYoutubeSong(voiceChannel, msg);
        } else leaveChannel(voiceChannel, msg);
      });
    } else {
      await connection.play(ytdl(songs[0].url, { filter: 'audioonly' })) // play the song in the queue
        .on('finish', () => { // when the song is over, the next song will be called
          modifiers.loop ? songs.push(songs.shift()) : songs.shift();
          loopPlaylist({ songs, playYoutubeSong, voiceChannel, leaveChannel, msg });
        });
    }
  } catch (e) {
    console.log("L'url ne correspond à aucune vidéo youtube", e);
    if (!commandMusicParam[0].startsWith('https://')) {
      modifiers.loop ? songs.push(songs.shift()) : songs.shift();
    }
    msg.channel.send(sendMessage('notFound'));
  }
};

const leaveChannel = (voiceChannel, msg) => {
  setTimeout(() => {
    voiceChannel.leave();
    return msg.channel.send(sendMessage('leave'));
  }, 2000);
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