// tri_friends.mjs

import { Client, Intents } from 'discord.js-selfbot-v13';
import readline from 'readline';
import chalk from 'chalk';
import figlet from 'figlet';
import ora from 'ora';
import path from 'path';
import { fileURLToPath } from 'url';

// Configuration pour obtenir le __dirname en ES Module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Fonction pour afficher un message dans la console avec la date et l'heure
function logMessage(message, color = 'white') {
  const now = new Date();
  const timestamp = `[${now.toLocaleTimeString()}]`;
  console.log(chalk[color](`${timestamp} ${message}`));
}

// Fonction pour centrer le texte dans la console
function centerText(text) {
  const columns = process.stdout.columns || 80;
  const lines = text.split('\n');
  return lines.map(line => {
    const padding = Math.max(0, Math.floor((columns - line.length) / 2));
    return ' '.repeat(padding) + line;
  }).join('\n');
}

// Afficher le logo ASCII centré
function displayLogo() {
  const logo = figlet.textSync('Friend Trimmer', {
    horizontalLayout: 'default',
    verticalLayout: 'default'
  });
  console.log(centerText(chalk.blue(logo)));
}

// Fonction pour masquer l'entrée du token
async function promptToken() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.stdoutMuted = true;

  const token = await new Promise((resolve) => {
    rl.question(centerText('🔑 Entrez votre token Discord : '), (answer) => {
      rl.close();
      resolve(answer.trim());
    });

    rl._writeToOutput = function _writeToOutput(stringToWrite) {
      if (rl.stdoutMuted)
        rl.output.write("*");
      else
        rl.output.write(stringToWrite);
    };

    rl.stdoutMuted = true;
  });

  if (!token) {
    logMessage('❌ Aucun token fourni. Veuillez réessayer.', 'red');
    process.exit(1);
  }

  logMessage('✅ Token reçu.', 'green');
  return token;
}

// Fonction pour demander le seuil de temps en mois
async function promptThreshold() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const threshold = await new Promise((resolve) => {
    rl.question(centerText('🕒 Depuis combien de mois sans message souhaitez-vous retirer un ami ? (ex. 2) : '), (input) => {
      rl.close();
      resolve(parseInt(input.trim()));
    });
  });

  if (isNaN(threshold) || threshold <= 0) {
    logMessage('❌ Seuil invalide. Veuillez entrer un nombre positif.', 'red');
    process.exit(1);
  }

  logMessage(`✅ Seuil défini à ${threshold} mois.`, 'green');
  return threshold;
}

// Fonction principale
(async () => {
  displayLogo();
  const token = await promptToken();
  const thresholdMonths = await promptThreshold();
  triFriends(token, thresholdMonths);
})();

// Fonction pour trier les amis
async function triFriends(token, thresholdMonths) {
  const client = new Client({
    checkUpdate: false,
    intents: [
      Intents.FLAGS.GUILDS,
      Intents.FLAGS.GUILD_MESSAGES,
      Intents.FLAGS.DIRECT_MESSAGES,
    ],
    partials: ['MESSAGE', 'CHANNEL', 'REACTION'],
  });

  // Gestion de la connexion
  client.once('ready', async () => {
    logMessage(`✅ Connecté en tant que ${chalk.bold.cyan(client.user.tag)}.`, 'green');

    const spinnerStart = ora('🔍 Récupération de la liste des amis...').start();

    try {
      await client.relationships.fetch(); // Récupère toutes les relations
      spinnerStart.succeed('🔍 Liste des amis récupérée.');

      const friends = client.relationships.friendCache;

      if (friends.size === 0) {
        logMessage('📭 Aucun ami à trier.', 'yellow');
        client.destroy();
        process.exit(0);
      }

      logMessage(`📋 Vous avez ${chalk.bold.green(friends.size)} amis.`, 'green');

      const cutoffDate = new Date();
      cutoffDate.setMonth(cutoffDate.getMonth() - thresholdMonths);

      // Tableau pour le dashboard
      let removedFriends = 0;
      let keptFriends = 0;

      for (const [id, user] of friends) {
        try {
          // Vérifier si 'user' est défini et a la propriété 'tag'
          if (!user || !user.tag) {
            logMessage(`⚠️ Impossible d'accéder aux données de cet utilisateur. ID : ${id}`, 'yellow');

            // Tenter de récupérer l'utilisateur
            try {
              const fetchedUser = await client.users.fetch(id);
              if (fetchedUser && fetchedUser.tag) {
                logMessage(`✅ Utilisateur récupéré après tentative de fetch. Tag : ${fetchedUser.tag}`, 'green');
                await processFriend(fetchedUser, cutoffDate, thresholdMonths);
              } else {
                logMessage(`❌ Impossible de récupérer l'utilisateur avec l'ID : ${id}`, 'red');
              }
            } catch (fetchError) {
              logMessage(`❌ Erreur lors de la récupération de l'utilisateur avec l'ID : ${id} : ${fetchError.message}`, 'red');
            }

            continue;
          }

          await processFriend(user, cutoffDate, thresholdMonths);
        } catch (err) {
          logMessage(`❌ Erreur lors de la vérification de ${chalk.bold.cyan(user?.tag || id)} : ${err.message}`, 'red');
        }
      }

      logMessage('🎉 Tri des amis terminé.', 'blue');

      // Affichage du Dashboard
      displayDashboard(friends.size, removedFriends, keptFriends);

      // Deuxième Vérification
      logMessage('🔄 Lancement de la deuxième vérification pour s\'assurer...', 'blue');
      await doubleVerification(client, thresholdMonths);

      client.destroy();
      process.exit(0);
    } catch (err) {
      spinnerStart.fail(`❌ Erreur lors de la récupération des amis : ${err.message}`);
      client.destroy();
      process.exit(1);
    }
  });

  // Gestion des erreurs
  client.on('error', (err) => {
    logMessage(`❌ Erreur : ${err.message}`, 'red');
  });

  // Connexion
  logMessage('🔌 Connexion à Discord...', 'blue');
  client.login(token).catch(err => {
    logMessage(`❌ Erreur de connexion : ${err.message}`, 'red');
    process.exit(1);
  });

  // Fonction pour traiter chaque ami
  async function processFriend(user, cutoffDate, thresholdMonths) {
    logMessage(`🔎 Vérification de ${chalk.bold.cyan(user.tag)}...`, 'blue');

    // Obtenir le canal DM avec l'ami
    let dmChannel;
    try {
      dmChannel = await user.createDM();
    } catch (dmError) {
      logMessage(`❌ Impossible de créer un DM avec ${chalk.bold.cyan(user.tag)}. Erreur : ${dmError.message}`, 'red');
      return;
    }

    // Récupérer le dernier message
    let lastMessageDate;
    try {
      const messages = await dmChannel.messages.fetch({ limit: 1 });
      if (messages.size === 0) {
        logMessage(`📅 Aucun message trouvé avec ${chalk.bold.cyan(user.tag)}.`, 'yellow');
        // Définit une date très ancienne pour forcer la suppression
        lastMessageDate = new Date(0);
      } else {
        const lastMessage = messages.first();
        lastMessageDate = lastMessage.createdAt;
        logMessage(`📅 Dernier message avec ${chalk.bold.cyan(user.tag)} : ${chalk.bold(lastMessageDate.toLocaleString())}`, 'green');
      }
    } catch (msgError) {
      logMessage(`❌ Erreur lors de la récupération des messages avec ${chalk.bold.cyan(user.tag)} : ${msgError.message}`, 'red');
      // En cas d'erreur, définir une date ancienne pour forcer la suppression
      lastMessageDate = new Date(0);
    }

    if (lastMessageDate < cutoffDate) {
      // Supprime l'ami si le dernier message est plus ancien que le seuil
      logMessage(`🗑️ ${chalk.bold.cyan(user.tag)} n'a pas été contacté depuis ${thresholdMonths} mois. Suppression...`, 'magenta');
      try {
        const success = await client.relationships.deleteRelationship(user);
        if (success) {
          logMessage(`✅ ${chalk.bold.cyan(user.tag)} a été supprimé de votre liste d'amis.`, 'green');
          removedFriends++;
        } else {
          logMessage(`❌ Échec de la suppression de ${chalk.bold.cyan(user.tag)}.`, 'red');
        }
      } catch (deleteError) {
        logMessage(`❌ Erreur lors de la suppression de ${chalk.bold.cyan(user.tag)} : ${deleteError.message}`, 'red');
      }
    } else {
      logMessage(`✅ ${chalk.bold.cyan(user.tag)} est actif (dernier message le ${chalk.bold(lastMessageDate.toLocaleDateString())}).`, 'green');
      keptFriends++;
    }

    // Ajouter un délai pour éviter les rate limits
    await delay(1000); // 1 seconde
  }

  // Fonction pour afficher le Dashboard
  function displayDashboard(total, removed, kept) {
    console.log('\n' + centerText(chalk.bold.yellow('=== Dashboard de Tri des Amis ===')));
    console.log(centerText(chalk.blue('---------------------------------')));
    console.log(centerText(`Total d'amis initialement : ${chalk.bold.green(total)}`));
    console.log(centerText(`Amis supprimés : ${chalk.bold.red(removed)}`));
    console.log(centerText(`Amis conservés : ${chalk.bold.green(kept)}`));
    console.log(centerText(chalk.blue('---------------------------------\n')));
  }

  // Fonction pour effectuer une double vérification
  async function doubleVerification(client, thresholdMonths) {
    const spinnerVerify = ora('🔍 Double vérification de la liste des amis...').start();

    try {
      await client.relationships.fetch(); // Rafraîchit la liste des relations
      spinnerVerify.succeed('🔍 Double vérification réussie.');

      const friends = client.relationships.friendCache;

      if (friends.size === 0) {
        logMessage('📭 Aucun ami à vérifier.', 'yellow');
        return;
      }

      logMessage(`📋 Vous avez actuellement ${chalk.bold.green(friends.size)} amis.`, 'green');

      const cutoffDate = new Date();
      cutoffDate.setMonth(cutoffDate.getMonth() - thresholdMonths);

      let inconsistencies = 0;

      for (const [id, user] of friends) {
        try {
          // Vérifier si 'user' est défini et a la propriété 'tag'
          if (!user || !user.tag) {
            logMessage(`⚠️ Impossible d'accéder aux données de cet utilisateur. ID : ${id}`, 'yellow');

            // Tenter de récupérer l'utilisateur
            try {
              const fetchedUser = await client.users.fetch(id);
              if (fetchedUser && fetchedUser.tag) {
                logMessage(`✅ Utilisateur récupéré après tentative de fetch. Tag : ${fetchedUser.tag}`, 'green');
                await verifyFriend(fetchedUser, cutoffDate, thresholdMonths);
              } else {
                logMessage(`❌ Impossible de récupérer l'utilisateur avec l'ID : ${id}`, 'red');
                inconsistencies++;
              }
            } catch (fetchError) {
              logMessage(`❌ Erreur lors de la récupération de l'utilisateur avec l'ID : ${id} : ${fetchError.message}`, 'red');
              inconsistencies++;
            }

            continue;
          }

          const shouldBeRemoved = await verifyFriend(user, cutoffDate, thresholdMonths);
          if (shouldBeRemoved) inconsistencies++;
        } catch (err) {
          logMessage(`❌ Erreur lors de la vérification de ${chalk.bold.cyan(user?.tag || id)} : ${err.message}`, 'red');
          inconsistencies++;
        }
      }

      if (inconsistencies === 0) {
        logMessage('✅ Double vérification réussie. Aucun ami inactif manquant.', 'green');
      } else {
        logMessage(`⚠️ Double vérification terminée avec ${chalk.bold.red(inconsistencies)} incohérences détectées.`, 'yellow');
      }
    } catch (err) {
      spinnerVerify.fail(`❌ Erreur lors de la double vérification : ${err.message}`);
    }
  }

  // Fonction pour vérifier si un ami devrait être supprimé
  async function verifyFriend(user, cutoffDate, thresholdMonths) {
    logMessage(`🔎 Vérification de ${chalk.bold.cyan(user.tag)}...`, 'blue');

    // Obtenir le canal DM avec l'ami
    let dmChannel;
    try {
      dmChannel = await user.createDM();
    } catch (dmError) {
      logMessage(`❌ Impossible de créer un DM avec ${chalk.bold.cyan(user.tag)}. Erreur : ${dmError.message}`, 'red');
      return true; // Considérer comme incohérence
    }

    // Récupérer le dernier message
    let lastMessageDate;
    try {
      const messages = await dmChannel.messages.fetch({ limit: 1 });
      if (messages.size === 0) {
        lastMessageDate = new Date(0);
      } else {
        const lastMessage = messages.first();
        lastMessageDate = lastMessage.createdAt;
      }
    } catch (msgError) {
      logMessage(`❌ Erreur lors de la récupération des messages avec ${chalk.bold.cyan(user.tag)} : ${msgError.message}`, 'red');
      lastMessageDate = new Date(0); // Forcer la suppression en cas d'erreur
    }

    if (lastMessageDate < cutoffDate) {
      // Cet ami aurait dû être supprimé lors du premier tri
      logMessage(`⚠️ Incohérence détectée : ${chalk.bold.cyan(user.tag)} devrait être supprimé mais est toujours dans la liste.`, 'red');

      // Tenter de supprimer à nouveau
      try {
        const success = await client.relationships.deleteRelationship(user);
        if (success) {
          logMessage(`✅ ${chalk.bold.cyan(user.tag)} a été supprimé lors de la double vérification.`, 'green');
        } else {
          logMessage(`❌ Échec de la suppression de ${chalk.bold.cyan(user.tag)} lors de la double vérification.`, 'red');
          return true;
        }
      } catch (deleteError) {
        logMessage(`❌ Erreur lors de la suppression de ${chalk.bold.cyan(user.tag)} lors de la double vérification : ${deleteError.message}`, 'red');
        return true;
      }

      return false; // Suppression réussie
    } else {
      logMessage(`✅ ${chalk.bold.cyan(user.tag)} est actif (dernier message le ${chalk.bold(lastMessageDate.toLocaleDateString())}).`, 'green');
      return false;
    }
  }

  // Fonction de délai
  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
