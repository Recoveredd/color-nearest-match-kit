# Draft Report: color-nearest-match-kit

## Verdict

Promu en vraie librairie le 2026-05-14. Le candidat reste spécialisé, mais il a maintenant les garanties minimales attendues pour un outil UI: deux passes utilisateur avancé, diagnostics runtime plus solides, CI, README public, smoke `dist` et preview portfolio.

## Candidat source

- Package signal: `nearest-color`
- Version observée: `0.4.4`
- Licence observée: MIT
- Dernière publication npm visible: il y a 7 ans selon npm / npm.io
- Usage observé: npm affiche environ 47 014 téléchargements hebdomadaires et 56 dependents sur la page du package; npm.io indiquait aussi un ordre de grandeur à cinq chiffres.
- Repository observé: `github.com/dtao/nearest-color`

Ce brouillon est clean-room: aucun code, README ou test du package signal n'a été repris.

## Grille anti-emballement

- Usage actuel vérifié: 2/2. Téléchargements hebdomadaires encore significatifs et dépendants visibles.
- Abandon ou maintenance faible: 2/2. Dernière version publique ancienne, package CommonJS historique.
- Scope livrable en 1 journée: 2/2. Parser hex, compiler une palette, calculer des distances, retourner des résultats structurés.
- Douleur utilisateur visible: 1/2. Besoin clair pour design tokens et palettes, mais douleur simple et non critique.
- Différenciation non triviale: 2/2. Résultats classés, distances configurables, diagnostics structurés, API sans exception pour les cas attendus.

Score total: 9/10.

## Différenciation en 1 journée

`color-nearest-match-kit` fournit un matcher de palette browser-friendly avec classement top-N, choix explicite entre distance RGB simple et distance RGB pondérée, et diagnostics structurés pour couleurs ou palettes invalides.

Cette différenciation est visible en moins de 30 secondes avec `matcher.rank("#ef4444", { limit: 3 })` et les retours `{ ok: false, error, message }`.

## Alternatives maintenues

- `culori`: beaucoup plus large, actif, centré sur conversions et espaces colorimétriques complets. Excellent leader pour les besoins colorimétriques avancés, mais plus large que le besoin minimal de matching de palette.
- `@lostelk/nearest-color`: publié plus récemment, mais très faible usage observé et surface plus orientée classe / palette par défaut multilingue.
- `extract-colors`: actif, mais traite l'extraction de palettes depuis images, pas le matching d'une couleur vers une palette métier.
- `@soybeanjs/color-palette`: récent, mais orienté génération de palettes Tailwind / Ant Design, pas remplacement direct du besoin.

Conclusion: il existe des alternatives, mais pas un leader récent clairement meilleur sur le micro-besoin "matcher une couleur contre une petite palette nommée avec diagnostics".

## Nom retenu

Nom: `color-nearest-match-kit`

Justification: le nom décrit explicitement le domaine (`color`), l'action (`nearest-match`) et le format attendu des librairies Recoveredd (`kit`). Il évite la confusion directe avec `nearest-color`, reste lisible dans une liste npm/GitHub, et ne dépend pas d'un branding opaque.

Vérification rapide: `npm view color-nearest-match-kit name version --json` a retourné un 404 npm, donc aucun package public de ce nom n'a été trouvé au moment du run.

## Compatibilité navigateur

Le coeur utilise seulement chaînes, tableaux, objets et `Math`. Il n'importe aucune API Node obligatoire: pas de `fs`, `path`, `node:url`, `Buffer`, `process`, module natif ou accès réseau implicite.

## CLI

Pas de CLI dans ce brouillon. L'usage naturel est embarqué dans des outils UI, validateurs de tokens ou dashboards. Une CLI ajouterait une surface Node sans gain évident pour la version 0.1.

## API proposée

- `parseHexColor(input)` pour parser `#rgb`, `rgb`, `#rrggbb`, `rrggbb`.
- `toHexColor(rgb)` pour normaliser un RGB vers hex.
- `createColorMatcher(palette, options?)` pour compiler une palette.
- `matcher.match(input, options?)` pour retourner le match unique le plus proche.
- `matcher.rank(input, options?)` pour retourner les N meilleurs matches.
- `findNearestColor(input, palette, options?)` pour un usage one-shot.

## Risques et limites

- Le calcul reste volontairement simple et ne prétend pas remplacer CIEDE2000, OKLab ou d'autres distances perceptuelles avancées.
- Le parser accepte uniquement les couleurs hex et RGB objet; pas de CSS named colors, HSL, OKLCH ou `rgb(...)`.
- Les performances sont linéaires en taille de palette; c'est acceptable pour les palettes UI classiques.
- Le mode pondéré RGB est pratique mais approximatif.

## Ce qui manque avant publication

- Revue humaine du nom et de l'angle face aux alternatives.
- Décider si un mode perceptuel minimal vaut l'ajout de complexité.
- Ajouter une matrice CI réelle seulement si un dépôt distant est créé plus tard par un humain.
- Vérifier une nouvelle fois la disponibilité npm juste avant toute publication humaine éventuelle.

## Requalification 2026-05-14

Décision: GO local plus tard, surtout si l'on veut une lib visuelle facile à démontrer sur le portfolio. Ne pas élargir vers une librairie couleur généraliste.

Passe utilisateur avancé 1: outil de design tokens. Les résultats `match` et `rank` restent simples, avec distances et métadonnées de palette conservées.

Passe utilisateur avancé 2: import UI depuis données imparfaites. Les entrées runtime invalides (`null`, RGB incomplet, palette non-array) retournent maintenant des diagnostics au lieu de provoquer des exceptions.

Passe robustesse: ajout de `invalid-distance` pour éviter qu'une option distance inconnue retombe silencieusement sur le mode pondéré.

## État du Git local du brouillon

- `git init`: OK dans le dossier du brouillon.
- `git branch -M main`: échec sandbox/permissions avec impossibilité de créer `.git/HEAD.lock`.
- `git config user.name "Recoveredd"`: OK.
- `git config user.email "recoveredd@users.noreply.github.com"`: OK.
- `git add .`: échec sandbox/permissions avec impossibilité de créer `.git/index.lock`.
- `git commit -m "Create color-nearest-match-kit draft"`: non réalisé car `git add` a échoué.
- Aucun remote ajouté.

Le workspace parent n'a pas été modifié par des commandes Git.

## Validations locales

- `npm install`: OK. npm a signalé 4 vulnérabilités modérées dans l'arbre dev complet.
- `npm audit --omit=dev --json`: OK, 0 vulnérabilité runtime / production.
- `npm run typecheck`: OK après requalification.
- `npm test`: OK, 10 tests passés.
- `npm run build`: OK.
- `npm pack --dry-run`: premier essai échoué à cause du cache npm global inaccessible (`/Users/guillaumepapinutti/.npm/_cacache/tmp/...`); essai OK avec `npm_config_cache=/private/tmp/color-nearest-match-kit-npm-cache`, 10.7 kB packed.
- Smoke `dist`: OK, nearest match, input `null` et distance invalide diagnostiqués.

## Verdict humain recommandé

Relire comme brouillon intéressant mais spécialisé. Publier seulement si la promesse reste strictement "palette matching avec diagnostics", sans dériver vers une librairie couleur généraliste.
