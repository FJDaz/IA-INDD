# Créer un importateur Markdown pour InDesign

Les étapes de notre travail, dans l'ordre où elles se sont posées — pas un tutoriel, mais le chemin réel d'une construction, avec ses détours.

**Ce qu'on construisait :** un plugin InDesign (script ExtendScript) qui prend un fichier `.md`, en lit le texte, et l'insère dans une page InDesign en appliquant automatiquement les bons styles — sans que l'utilisateur ait à copier-coller et remettre en forme à la main.

---

## 1. Cadrage — poser la question avant d'écrire une ligne de code

Avant tout, on a défini ce qu'on voulait exactement : importer un fichier Markdown, faire correspondre chaque élément (titre, paragraphe, liste, gras…) à un style InDesign déjà présent dans le document, et insérer le texte propre — sans les symboles `#`, `**`, `-` qui n'ont de sens qu'en Markdown.

**Leçon** : un cahier des charges clair, même informel, évite de coder la mauvaise chose vite plutôt que la bonne chose lentement.

## 2. Principe directeur — ne jamais coder un nom de style en dur

Décision structurante : le script ne doit connaître aucun nom de style à l'avance. Il doit toujours lire la charte de styles réellement présente dans le document ouvert, et laisser l'utilisateur faire correspondre chaque élément Markdown à un style existant.

**Leçon** : un outil générique (qui s'adapte à n'importe quel document) est plus robuste qu'un outil qui suppose une seule charte graphique.

## 3. Premiers essais — le script plante, et c'est normal

Les tout premiers lancements ont buté sur des erreurs de syntaxe : un mot de programmation réservé utilisé par erreur comme nom de variable, une fonction d'alerte qui n'existait pas sous cette forme. Rien de grave — ce sont les erreurs les plus faciles à corriger, parce que le logiciel les signale lui-même avec précision.

**Leçon** : un message d'erreur n'est pas un échec, c'est une information. Le pire bug est celui qui ne dit rien.

## 4. Diagnostic — arrêter de dépendre des captures d'écran

Montrer une capture d'écran à chaque erreur devenait lent. On a ajouté un système qui écrit chaque erreur dans un simple fichier texte, avec la date, le message, et l'endroit exact du problème — consultable directement, sans repasser par une image.

**Leçon** : investir un peu de temps dans les outils de diagnostic (ici : un fichier journal) accélère tout ce qui vient après.

## 5. Bug de structure — les styles étaient rangés dans des dossiers

Le dialogue de configuration s'affichait, mais les listes de styles restaient vides. Cause : les styles du document étaient organisés en groupes (des dossiers, comme dans un panneau InDesign), et le script ne regardait que la surface, pas l'intérieur des dossiers. Il a fallu apprendre à « descendre » dans chaque groupe.

**Leçon** : une liste vide n'est pas toujours une absence de données — parfois, on ne regarde simplement pas au bon endroit.

## 6. Confort d'usage — rendre chaque test rapide

Pour éviter de reconfigurer manuellement à chaque essai, deux choses ont été ajoutées : une présélection automatique (par défaut, ou par convention de nommage — si un style s'appelle exactement `H1`, il est proposé pour les titres de niveau 1), et un bouton « Réinitialiser » pour repartir à zéro en un clic.

**Leçon** : un outil qu'on doit tester dix fois par heure mérite qu'on investisse dans la rapidité du test lui-même, pas seulement dans le résultat final.

---

### Le vrai tournant de l'atelier

## 7. Le mur — le texte arrive, mais dans le désordre

À ce stade, le script fonctionnait presque : le texte s'insérait, avec les bons styles de titre et de paragraphe. Mais dès qu'un mot en gras apparaissait, tout se dérégla : des morceaux de phrase coupés au milieu, l'ordre des paragraphes mélangé. Plusieurs corrections successives ont chacune réglé un vrai problème (un caractère spécial mal compté, une méthode d'écriture non documentée) — sans faire disparaître le désordre.

**Leçon** : corriger un symptôme réel n'est pas la même chose que trouver la cause. On peut avoir raison plusieurs fois de suite sans avoir encore trouvé le bon problème.

## 8. Changement de méthode — isoler une seule variable à la fois

Plutôt que de tenter un quatrième correctif au hasard, on a pris une décision simple : retirer complètement le gras et l'italique, pour ne garder que le texte brut avec ses styles de titre/paragraphe. Si l'ordre redevenait correct sans le gras, la cause du problème se trouvait bien dans cette partie du code — pas ailleurs.

**Leçon** : face à un bug qui résiste, réduire le problème à sa version la plus simple révèle souvent en une seule étape ce que dix corrections ciblées n'avaient pas trouvé.

## 9. Vérification — tester en dehors d'InDesign avant de tester dans InDesign

Pour ne plus multiplier les allers-retours « je corrige → tu testes → ça casse encore », une partie de la logique (la lecture du fichier Markdown, le découpage en blocs) a été reproduite dans un simple script indépendant, exécutable sans même ouvrir InDesign. Cela permet de vérifier un raisonnement avant de faire perdre du temps à un test réel.

**Leçon** : tout ce qui peut être vérifié sans l'outil final doit l'être — cela rend chaque vrai test plus fiable et plus rare.

## 10. Reprise en confiance — réintroduire les fonctionnalités une par une

Une fois le texte brut stabilisé, on a pu réattaquer le reste dans l'ordre : d'abord réparer les espaces qui créaient des pages blanches, puis nettoyer les séparateurs Markdown parasites, puis — nouveauté — construire de vrais tableaux InDesign à partir des tableaux Markdown. Cette dernière étape, jamais tentée avant, a fonctionné du premier coup.

**Leçon** : une base stable rend les ajouts suivants beaucoup plus faciles — et beaucoup plus rapides à obtenir juste du premier coup.

## 11. Capitalisation — écrire ce qu'on a appris, pas seulement ce qu'on a fait

Chaque bug rencontré et sa cause réelle ont été notés dans un document de référence — pas comme un journal de bord, mais comme une base de connaissance réutilisable pour le prochain script InDesign. La méthode elle-même (comment tester, dans quel ordre, quand s'arrêter de deviner) a aussi été mise par écrit.

**Leçon** : un savoir qui reste seulement « dans la tête » pendant l'atelier se perd. L'écrire le rend transmissible — à soi-même la prochaine fois, ou à quelqu'un d'autre.

---

## Ce que cet atelier montre, au-delà du script

- Un cahier des charges clair évite de construire la mauvaise chose rapidement.
- Un message d'erreur est une information, pas un échec.
- Corriger un vrai problème plusieurs fois ne garantit pas d'avoir trouvé la bonne cause.
- Réduire un problème à sa forme la plus simple est souvent le raccourci le plus rapide.
- Vérifier avant de tester en vrai économise du temps à tout le monde.
- Ce qu'on apprend vaut la peine d'être écrit, pas seulement retenu.
