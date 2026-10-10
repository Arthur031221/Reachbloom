<div align="center">
<img src="assets/logo.svg" width="64" alt="Reachbloom">
<h1>Reachbloom</h1>
<p><a href="LICENSE"><img src="assets/license.svg" alt="MIT license" width="88" height="22"></a></p>
<p>Découvrez où les transports en commun peuvent vous mener en 30 minutes.</p>
<p><b>6 requêtes BART sélectionnées correspondent aux résultats d'une recherche indépendante d'événements dans le CSV.</b> Les deux utilisent le modèle de marche documenté. Cela vérifie le calcul, pas les durées réelles des trajets. <a href="benchmarks/reference-results.json">Cas et méthode</a>.</p>
<p><a href="https://arthur031221.github.io/Reachbloom/">Ouvrir la carte</a> / <a href="docs/accuracy.md">Lire les hypothèses</a></p>
<p><a href="README.md">English README</a> / <a href="README.zh-TW.md">繁體中文</a> / <a href="README.zh-CN.md">简体中文</a> / <a href="README.ja.md">日本語</a> / <a href="README.ko.md">한국어</a> / <a href="README.es.md">Español</a> / <a href="README.fr.md">Français</a> / <a href="README.de.md">Deutsch</a> / <a href="README.pt-BR.md">Português</a></p>
</div>

| Avant                                                   | Avec Reachbloom                                            |
| :------------------------------------------------------ | :--------------------------------------------------------- |
| Chercher les départs dans plusieurs tableaux d'horaires | Déplacer un repère pour voir les arrêts accessibles        |
| Comparer de mémoire deux logements ou heures de départ  | Placer A et B sur la même carte                            |
| Envoyer une capture d'écran sans contexte               | Partager la date, les origines et le temps de trajet prévu |

```sh
npx --yes git+https://github.com/Arthur031221/Reachbloom.git
```

![Une session BART réelle : modifier le temps de trajet, comparer les origines et examiner un itinéraire](assets/demo.gif)

Un horaire est un plan, pas la position en temps réel d'un véhicule.

## Train, bus et ferry sur une même carte

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/hero-dark.png">
  <img src="assets/hero-light.png" alt="Portée du BART depuis Civic Center, avec les commandes de départ et les arrêts accessibles" width="1200">
</picture>

_Nouveauté 1.0 : un horaire ferroviaire daté avec l'hypothèse de marche visible._

Ouvrez la [démo en ligne](https://arthur031221.github.io/Reachbloom/) sans compte ni clé API. Les exemples intégrés couvrent le réseau ferroviaire BART, Maywood Express Shuttle et Yurok River Otter Ferry. Ce sont des instantanés d'horaires datés, pas des positions de véhicules en temps réel. Importez votre propre ZIP GTFS pour explorer un autre réseau régional. Le fichier reste dans votre navigateur.

Suivez ces cinq étapes pour essayer la carte :

1. Gardez BART, avec la date du 2026-08-24 et l'heure de 08:00.
2. Placez l'origine A près de Civic Center, à San Francisco.
3. Essayez les budgets de 15, 30 et 45 minutes.
4. Activez l'origine B et modifiez son heure de départ.
5. Recherchez Powell et affichez les étapes de marche, d'attente et de trajet.

L'orange représente A, le bleu-vert B et le violet la zone accessible depuis les deux origines. La grille estime la marche en ligne droite et ignore les rues, les obstacles et l'eau. Une zone commune peut suggérer un lieu de rendez-vous. Elle ne recherche pas de logement permettant de rejoindre deux lieux de travail.

<table>
<tr><td><a href="assets/bus.png"><img src="assets/bus.png" alt="Carte de l'horaire de Maywood Express Shuttle" width="580"></a></td><td><a href="assets/ferry.png"><img src="assets/ferry.png" alt="Carte de l'horaire de River Otter Ferry" width="580"></a></td></tr>
<tr><td><i>Nouveauté 1.0 : une navette de quartier.</i></td><td><i>Nouveauté 1.0 : une traversée en ferry.</i></td></tr>
</table>

## Pourquoi je l'ai créé

> _Je sais lire un tableau de départs. Je veux quand même voir où ce départ peut me mener._

J'ai créé Reachbloom pour afficher la date, l'attente et les hypothèses de marche à côté de la carte. Je voulais déplacer un repère, comparer une autre heure de départ et partager la même vue. L'horaire peut être consulté et le calcul se fait dans le navigateur.

## Ce qui est produit

| Sortie               | Contenu associé                                                         |
| :------------------- | :---------------------------------------------------------------------- |
| Carte de portée      | Départs datés, estimation à pied et limite de trajets                   |
| Lien partagé         | Les deux origines, horaires, mode, thème et langue                      |
| PNG                  | Repères des origines, heures de départ, budget de trajet et attribution |
| Itinéraire par arrêt | Étapes minutées de marche, attente et trajet                            |

## Un horaire que vous pouvez parcourir

Lorsque le flux fournit des tracés de lignes, les véhicules prévus les suivent. La lecture fait avancer l'heure de départ pour montrer l'évolution des véhicules et de la zone accessible. Filtrez les trains, bus ou ferries, choisissez de un à huit trajets et passez du thème clair au thème sombre.

L'interface est disponible en anglais, chinois traditionnel, chinois simplifié, japonais, coréen, espagnol, français, allemand et portugais du Brésil. La mise en page s'adapte aux téléphones. Le partage d'un exemple intégré inclut la date, les heures de départ, les origines, le mode, le nombre de trajets, le budget, la langue et le thème. Un ZIP importé doit être ouvert à nouveau localement. Le partage est donc désactivé pour les flux privés.

L'export crée un PNG de 1080 x 1350 contenant la carte, les repères des origines, les heures de départ, le budget de trajet et l'attribution. Il inclut aussi une note sur l'estimation de marche. Les tuiles cartographiques nécessitent une connexion Internet. L'analyse des données et le calcul des itinéraires s'exécutent dans des workers.

## Lancer le projet sur votre ordinateur

Node.js 22.12 ou une version ultérieure et Git sont requis. La commande ci-dessus télécharge le code source depuis GitHub, le compile localement et démarre un serveur sur `http://127.0.0.1:4173`. Le premier lancement prend plus de temps que l'ouverture de la démo en ligne.

<details>
<summary>macOS et Linux</summary>

```sh
npx --yes git+https://github.com/Arthur031221/Reachbloom.git
```

Pour utiliser un autre port, ajoutez-le à la commande : `npx --yes git+https://github.com/Arthur031221/Reachbloom.git 4180`.

</details>

<details>
<summary>Windows PowerShell</summary>

```powershell
npx --yes git+https://github.com/Arthur031221/Reachbloom.git
```

Ouvrez `http://127.0.0.1:4173`. Appuyez sur Ctrl+C pour arrêter le serveur.

</details>

<details>
<summary>Compiler depuis une copie locale ou héberger une version statique</summary>

```sh
git clone https://github.com/Arthur031221/Reachbloom.git
cd Reachbloom
npm ci
npm run build
npx vite preview
```

Déployez `dist/` sur n'importe quel hébergement statique. GitHub Pages utilise le workflow fourni. Consultez les pages sur [l'installation](docs/install.md) et la [configuration](docs/config.md).

</details>

## Ce que signifie le résultat

Le calcul utilise les heures de départ et d'arrivée prévues pour une date donnée, les exceptions du calendrier et les services qui passent minuit. À chaque tour de trajet, il examine tous les voyages actifs, y compris ceux qui en dépassent d'autres. La mise en correspondance des transferts conserve le contexte de la ligne et du voyage, suit l'ordre de spécificité GTFS et respecte les durées minimales ainsi que les interdictions. Un changement générique nécessite au total deux minutes, marche de correspondance comprise. L'attente d'un véhicule pour assurer une correspondance et la continuation à bord entre voyages ne sont pas modélisées. Ces connexions utilisent une correspondance ordinaire selon les horaires.

La vitesse de marche est estimée à 4,8 km/h. Les trajets à pied d'accès et de sortie sont limités à 1 km. Une marche de correspondance entre deux trajets est autorisée, jusqu'à 400 m. La grille de 120 m affichée ne conserve que les cellules entièrement comprises dans le rayon de marche estimé. L'estimation est prudente à la limite et ne constitue pas une isochrone calculée à partir du réseau de rues. Les arrêts où la prise en charge ou la dépose doivent être convenues à l'avance sont exclus de ces actions. Les services à fréquence exacte sont développés. Les modèles de fréquence non exacte sont omis avec une note.

Les dates proches des changements d'heure sont refusées, car cette version utilise l'heure locale de l'agence. Il n'y a ni retards en temps réel, ni tarifs, ni itinéraires accessibles aux fauteuils roulants. L'outil ne revendique pas la précision d'un calculateur d'itinéraires d'exploitant. La page [Données prises en charge et limites](docs/data-support.md) décrit les données rejetées ou approximées.

L'instantané BART indique une date de fin au 2026-08-30, bien que son calendrier continue au-delà. La carte affiche les champs de validité et avertit lorsque la date se situe hors de cette plage. Chaque flux a sa propre licence. Consultez la [provenance des données](data/README.md) et les [mentions concernant les tiers](THIRD_PARTY_NOTICES.md).

## Vérifier le résultat

```sh
npm ci
npm run typecheck
npm test
npm run build
npm run check:ui
```

Le contrôle navigateur couvre la vraie carte, les erreurs d'importation, les trois exemples, les itinéraires, neuf langues, le partage, l'export PNG et les débordements sur mobile. Si Chrome n'est pas installé sur le système, installez d'abord Chromium avec `npx playwright install chromium`. Les tests unitaires et les builds sont exécutés avec Node 22 et 24 en CI. Les contrôles du navigateur, du paquet et de référence utilisent Node 22.

`npm run benchmark` mesure le flux intégré sur votre ordinateur. Pour le contrôle indépendant à partir du CSV d'origine, créez un environnement Python et exécutez `PYTHON=.venv/bin/python npm run verify:reference`. L'[implémentation de référence](tests/reference.py) utilise une recherche par événements plutôt que le parcours par tours de l'application. La réussite de six requêtes fixes ne prouve pas l'exactitude pour tous les flux.

[Utilisation](docs/usage.md) / [Architecture](docs/architecture.md) / [Précision](docs/accuracy.md) / [Contribution](CONTRIBUTING.md)

Le code source est sous licence MIT. Les données de transport et les tuiles cartographiques ont leurs propres conditions.

Assisted by Claude/Codex.
