const { sendMessage } = require('./messages')
const ytdl = require("ytdl-core");

const formatSongs = (playlist) => {
  const formattedSongs = JSON.parse(JSON.stringify(playlist.songs)).sort(() => Math.random() - 0.5)
  return formattedSongs
}

const loopPlaylist = async ({ songs, playYoutubeSong, voiceChannel, leaveChannel, msg }) => {
  if (songs && songs.length) {
    msg.channel.send(`Musique en cours - ${songs[0].title}`);
    playYoutubeSong(voiceChannel, msg);
  } else leaveChannel(voiceChannel, msg);
}

module.exports = {
  formatSongs,
  loopPlaylist,
}