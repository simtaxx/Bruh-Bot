/* eslint-disable no-undef */
const sendMessage = (command, ...param) => {

  const messages = {
    help: `Voici les commandes dont tu as besoin:

    - POUR ACTIVER LE BOT (BUG à CORRIGER) FAITES LA COMMANDE "stop"

    - COMMANDES GÉNÉRALES :
      - play "url de la vidéo youtube" OU "nom de la playlist"
      - next (passer à la prochaine musique d'une playlist)
      - replay (rejoue la musique actuelle)
      - stop (arrêter le bot)

    - LISTE DES PLAYLISTS DISPONIBLES :
      - rapUS2000 (playlist musique us hype des années 2000)
      - rapFRChill (playlist rap fr pour se détendre)
      - watiSon (une wati playlist)

    - BONUS : 
      - Ajouter "*loop" à la fin d'une commande "play <votre musique>" permet de la faire jouer infiniment
        exemple "play https://www.youtube.com/watch?v=PqIMNE7QBSQ *loop"
        - Pour annuler la loop utilisez "stopLoop"
      - Ajouter "*loopAll" lorsque vous ajoutez une nouvelle musique dans la file d'attente pour faire
        rejouer infiniment votre liste de musiques
        - Pour annuler loopAll utilisez "stopLoopAll"
        
    - INFOS :
      - Le bot est souvent mis à jour, pour être tenu au courrant des nouvelles features regardez si avec la commande bruh-help
        il y a des nouveautés
      - Si le bot à un problème pour rejoindre un salon ou autre, vérifier qu'il a bien un rôle lui permettant de rejoindre
        un channel et d'autres droits, n'hésitez pas à lui donner un rôle d'admin.`,
    notFound: 'Je ne trouve pas de musique fraté :/',
    leave: 'Je me casse',
    replay: `${param[0]} va être rejoué`,
  }
  return messages[command]
}

module.exports = { sendMessage }