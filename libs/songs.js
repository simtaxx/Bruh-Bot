/* eslint-disable no-undef */
const Discord = require('discord.js');

const formatSongs = (playlist) => {
  const formattedSongs = JSON.parse(JSON.stringify(playlist.songs)).sort(() => Math.random() - 0.5);
  return formattedSongs;
};

const loopPlaylist = async({ songs, playYoutubeSong, voiceChannel, leaveChannel, msg }) => {
  if (songs && songs.length) {
    const msgList = await msg.channel.messages.fetch({ limit: 5 });
    msgList.forEach(el => el.author.id === '777560805448613899' && el.delete());
    msg.channel.send(styleMyText('#0099ff', songs[0]));
    playYoutubeSong(voiceChannel, msg);
  } else leaveChannel(voiceChannel, msg, 2000);
};

const styleMyText = (color, songObj) => {
  const { title, url, author, channelPic, channelLink, description, songPic } = songObj;
  return new Discord.MessageEmbed()
    .setColor(color)
    .setTitle(title)
    .setURL(url)
    .setAuthor(author, channelPic, channelLink)
    .setDescription(description)
    .setThumbnail(songPic)
    .setTimestamp()
}

module.exports = {
  formatSongs,
  loopPlaylist,
  styleMyText
};