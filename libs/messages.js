const sendMessage = (command, ...param) => {
  
  const messages = {
    help: `Voici les commandes dont tu as besoin:

    - COMMANDES GÉNÉRALES :
      - play "url de la vidéo youtube" OU "nom de la playlist"
      - next (passer à la prochaine musique d'une playlist)
      - replay (rejoue la musique actuelle)
      - stop (arrêter le bot)

    - LISTE DES PLAYLISTS DISPONIBLES :
      - rapUS2000 (playlist musique us hype des années 2000)

    - TIPS : 
      - ajouter "-loop" à la fin d'une commande playlist permet de la faire jouer infiniment`,
    notFound: 'Je ne trouve pas de musique fraté :/',
    leave: 'Je me casse',
    replay: `${param[0]} va être rejoué`,
  }
  return messages[command]
}

module.exports = { sendMessage }