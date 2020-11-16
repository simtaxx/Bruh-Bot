const { sendMessage } = require('./messages')
const ytdl = require("ytdl-core");

const formatSongs = (songs, playlist) => {
  const formattedSongs = JSON.parse(JSON.stringify(playlist.songs)).sort(() => Math.random() - 0.5)
  return formattedSongs
}


const loopPlaylist = async ({ songs, tryPlayMusic, voiceChannel, leaveChannel, msg }) => {
  if (songs && songs.length) {
    msg.channel.send(`Musique suivante - ${songs[0].title}`);
    tryPlayMusic(voiceChannel, msg);
  } else leaveChannel(voiceChannel, msg);
}

const playSongFromUrl = async (voiceChannel, msg, commandMusicParam) => {
  try {
    const connection = await voiceChannel.join();
    await connection.play(ytdl(commandMusicParam, { filter: 'audioonly' })).on('finish', () => {
      leaveChannel(voiceChannel, msg);
    })
  } catch (e) {
    console.error("L'url ne correspond à aucune vidéo youtube", e);
    voiceChannel.leave();
    return msg.channel.send(sendMessage('notFound'));
  }
}

module.exports = {
  formatSongs,
  loopPlaylist,
  playSongFromUrl,
}