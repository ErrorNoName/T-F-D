# T-F-D (Tri Friends Discord)

## 📋 **Table des Matières**
- [📖 Description](#-description)
- [🚀 Fonctionnalités](#-fonctionnalités)
- [🔧 Installation](#-installation)
- [🛠️ Utilisation](#️-utilisation)
- [⚙️ Configuration](#-configuration)
- [🐞 Résolution des Problèmes](#-résolution-des-problèmes)
- [⚠️ Avertissements Importants](#️-avertissements-importants)
- [📄 Licence](#-licence)
- [🙏 Remerciements](#-remerciements)

## 📖 **Description**

**T-F-D (Tri Friends Discord)** est un script JavaScript conçu pour gérer automatiquement votre liste d'amis sur Discord. Basé sur un **selfbot**, il permet de trier vos amis en fonction de la date de votre dernier échange de messages, en supprimant ceux qui sont inactifs depuis une période définie.

> **⚠️ Remarque :** L'utilisation de selfbots est **strictement contre les [Conditions d'Utilisation de Discord](https://discord.com/terms)**. L'utilisation de ce script peut entraîner la suspension ou la suppression de votre compte Discord. **Utilisez-le à vos propres risques.**

## 🚀 **Fonctionnalités**

- **Connexion Automatique :** Se connecte à votre compte Discord en utilisant votre token.
- **Tri des Amis :** Analyse la liste de vos amis et supprime ceux avec lesquels vous n'avez pas échangé de messages depuis une période spécifiée.
- **Double Vérification :** Effectue une vérification supplémentaire pour s'assurer que toutes les suppressions ont été correctement effectuées.
- **Interface Élégante :** Affiche des messages colorés et un logo ASCII pour une meilleure expérience utilisateur.
- **Dashboard Résumé :** Fournit un résumé des actions effectuées, incluant le nombre total d'amis, le nombre d'amis supprimés et conservés.
- **Gestion des Erreurs :** Gère les erreurs de manière robuste, assurant une exécution fluide du script.

## 🔧 **Installation**

### **Prérequis**
- **Node.js** (version 14 ou supérieure)
- **NPM** (Node Package Manager)

### **Étapes d'Installation**

1. **Cloner le Répertoire :**
   ```bash
   git clone https://github.com/ErrorNoName/T-F-D.git
   cd T-F-D
   ```

2. **Installer les Dépendances :**
   ```bash
   npm install
   ```

## 🛠️ **Utilisation**

1. **Lancer le Script :**
   ```bash
   npm start
   ```
   *ou*
   ```bash
   node tri_friends.mjs
   ```

2. **Entrer le Token Discord :**
   - Lorsque vous y êtes invité, entrez votre token Discord. **L'entrée sera masquée par des astérisques (`*`) pour des raisons de sécurité.**

3. **Définir le Seuil de Temps :**
   - Indiquez la période en mois après laquelle vous souhaitez supprimer des amis inactifs (par exemple, `2` pour 2 mois).

4. **Observer le Processus :**
   - Le script affichera les logs et les étapes de tri, indiquant quels amis sont supprimés ou conservés.

5. **Double Vérification :**
   - Après le tri initial, une double vérification sera effectuée pour s'assurer qu'aucun ami inactif n'a été omis.

6. **Finalisation :**
   - Une fois toutes les vérifications terminées, le script se terminera automatiquement.

## ⚙️ **Configuration**

### **Token Discord**
- **Obtenir votre Token Discord :**
  - Allez sur [Discord Developer Portal](https://discord.com/developers/applications).
  - Sélectionnez votre application ou créez-en une nouvelle.
  - Naviguez vers l'onglet "Bot" et créez un bot si ce n'est pas déjà fait.
  - Copiez le **Token** du bot et utilisez-le pour vous connecter via le script.

> **⚠️ Attention :** Ne partagez jamais votre token Discord. Toute personne ayant accès à celui-ci peut contrôler votre compte.

### **Seuil de Temps**
- **Définir la Période d'Inactivité :**
  - Le script vous demandera de spécifier combien de mois d'inactivité avant de supprimer un ami.
  - Par exemple, entrer `2` supprimera les amis avec lesquels vous n'avez pas échangé de messages depuis plus de 2 mois.

## 🐞 **Résolution des Problèmes**

### **a. Duplication de la Demande de Token et Masquage Incorrect**
- **Symptôme :** La demande de token s'affiche plusieurs fois et l'entrée n'est pas masquée correctement.
- **Solution :** Assurez-vous d'utiliser la dernière version du script corrigé. La version actuelle surcharge correctement la méthode `_writeToOutput` pour masquer l'entrée sans duplication des invites.

### **b. Erreur : `Cannot read properties of undefined (reading 'tag')`**
- **Cause :** Le script tente d'accéder à la propriété `tag` d'un utilisateur indéfini ou incomplet.
- **Solution :** Le script a été mis à jour pour vérifier l'existence de `user` et `user.tag` avant d'y accéder. Si ces propriétés sont manquantes, l'utilisateur est ignoré avec un message d'avertissement.

### **c. Erreur de Connexion : `Invalid Token`**
- **Cause :** Le token Discord fourni est invalide ou mal formaté.
- **Solution :** Vérifiez que vous avez saisi le token correctement sans espaces supplémentaires et que le token est valide.

### **d. Problèmes de Permissions**
- **Cause :** Le selfbot n'a pas les permissions nécessaires pour accéder aux messages ou supprimer des amis.
- **Solution :** Assurez-vous que votre compte Discord dispose des permissions nécessaires. Les selfbots ont accès aux mêmes permissions que votre compte utilisateur.

### **e. Limites de Rate Limit de Discord**
- **Cause :** Le script envoie trop de requêtes en peu de temps, dépassant les limites de Discord.
- **Solution :** Le script inclut des délais (`delay`) entre les actions pour éviter les dépassements. Si les problèmes persistent, augmentez le délai dans la fonction `delay`.

## ⚠️ **Avertissements Importants**

- **Violation des Conditions d'Utilisation de Discord :**
  - L'utilisation de selfbots est **contre les [Conditions d'Utilisation de Discord](https://discord.com/terms)**. Cela peut entraîner la suspension ou la suppression permanente de votre compte Discord.
  
- **Sécurité du Token :**
  - **Ne partagez jamais votre token Discord.** Toute personne ayant accès à celui-ci peut contrôler votre compte Discord.

- **Utilisation Responsable :**
  - Utilisez ce script uniquement avec des comptes que vous contrôlez entièrement.
  - **À vos propres risques.**

## 📄 **Licence**

Ce projet est sous licence **MIT**. Consultez le fichier [LICENSE](https://github.com/ErrorNoName/T-F-D/blob/main/LICENSE) pour plus de détails.

## 🙏 **Remerciements**

- **[Discord.js](https://discord.js.org/):** Pour fournir une API puissante pour interagir avec Discord.
- **[Chalk](https://github.com/chalk/chalk):** Pour les logs colorés.
- **[Figlet](https://github.com/patorjk/figlet.js):** Pour générer des logos ASCII.
- **[Ora](https://github.com/sindresorhus/ora):** Pour les spinners élégants dans le terminal.
