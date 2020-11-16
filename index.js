require("dotenv").config();
const ytdl = require("ytdl-core");
const Discord = require("discord.js");
const client = new Discord.Client();

// All playlists import
const rapUS2000 = require("./assets/playlists/rapUS2000.json");
const rapFRChill = require("./assets/playlists/rapFRChill.json");

// Libraries
const { formatSongs, loopPlaylist, playSongFromUrl } = require('./libs/songs');
const { sendMessage } = require('./libs/messages')

// Playlists object
const playlists = { 
  rapUS2000,
  rapFRChill,
};

// Commands params
let commandMusicIdentifier = null; // First argument of a command like 'play', 'next' etc ...
let commandMusicParam = null; // Second argument of a command like the URL or the name of the playlist
let modifiers = { loop: false }; // The third argument of a command who will change the playlist behavior

// Global vars
let songs = null;
let lastMessageBot = null;

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`); // Display a log when the bot is ready
})

// Event listener when a new message is wrote in any discord channels
client.on("message", async msg => {
  const voiceChannel = msg.member.voice.channel; // Get the user current channel who wrote the message
  commandMusicIdentifier = msg.content.startsWith('play'); // Check if the command start with play
  commandMusicParam = msg.content.replace(/play /, ""); // Get all the string after 'play'

  if (commandMusicIdentifier) {
    commandMusicParam = commandMusicParam.split('-')[0].trim(); // Create an array with [0] as an url or a playlist name and [1] as a modifier
    if (playlists[commandMusicParam]) {
      checkModifier(commandMusicParam);
      songs = formatSongs(songs, playlists[commandMusicParam]);
      loopPlaylist({ songs, tryPlayMusic, voiceChannel, leaveChannel, msg });
    } else {
      playSongFromUrl(voiceChannel, msg, commandMusicParam);
    }
  }

  if (msg.content === "stop") {
    modifiers.loop = false;
    voiceChannel.leave(); // The bot will leave the channel
  } else if (msg.content === "next") {
    setTimeout(() => { // TODO: SUE A REAL TIMEOUT WHO WILL WAIT 1 SECOND AFTER THE SONG NEXTED
      modifiers.loop ? songs.push(songs.shift()) : songs.shift();
      if (songs && songs.length) {
        msg.channel.send(`Musique en cours - ${songs[0].title}`) // Display a message in a text channel who the bot has been called
        tryPlayMusic(voiceChannel, msg);
      } else leaveChannel(voiceChannel, msg);
    }, 1000);
  } else if (msg.content === "replay") {
    tryPlayMusic(voiceChannel, msg);
    msg.channel.send(sendMessage('replay', songs[0].title));
  } else if (msg.content === "help") {
    msg.channel.send(sendMessage('help'));
  }
})

// tryPlayMusic will play your playlist songs
const tryPlayMusic = async (voiceChannel, msg) => {
  try {
    if (songs[0] === undefined) {
      leaveChannel(voiceChannel, msg);
    }
    const connection = await voiceChannel.join(); // Join the user vocal channel
    await connection.play(ytdl(songs[0].url, { filter: 'audioonly' })) // play the song in the queue
    .on('finish', () => { // when the song is over, the next song will be called
      modifiers.loop ? songs.push(songs.shift()) : songs.shift();
      loopPlaylist({ songs, tryPlayMusic, voiceChannel, leaveChannel, msg })
    })
  } catch (e) { 
    console.log("L'url ne correspond à aucune vidéo youtube", e);
    modifiers.loop ? songs.push(songs.shift()) : songs.shift();
    return msg.channel.send(sendMessage('notFound'));
  }
}

const leaveChannel = (voiceChannel, msg) => {
  setTimeout(() => {
    voiceChannel.leave();
    return msg.channel.send(sendMessage('leave'));
  }, 2000);
}

// checkModifier will check if a modifier has been called by the user
const checkModifier = (commandMusicParam) => {
  for (const property in modifiers) {
    modifiers[property] = false;
  }
  if (commandMusicParam[1]) {
    switch (commandMusicParam[1]) {
      case 'loop':
        modifiers.loop = true
        break;
    }
  }
}

client.login(process.env.TOKEN);