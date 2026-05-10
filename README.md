# Mon agenda

Application d'agenda installable comme PWA avec rappels 30 minutes avant les programmes.

## Utilisation sur ordinateur

Ouvre l'application avec le serveur local:

```text
http://127.0.0.1:8765/index.html
```

## Installation sur téléphone

Pour installer l'application sur Android ou iPhone, il faut la publier sur une adresse HTTPS.
Exemples: GitHub Pages, Netlify, Vercel ou un autre hébergement web.

Une fois l'application ouverte sur le téléphone:

1. Ouvre le menu du navigateur.
2. Choisis "Ajouter à l'écran d'accueil" ou "Installer l'application".
3. Ouvre l'application installée.
4. Appuie sur "Activer" dans la section "Rappels téléphone".
5. Autorise les notifications.

## Rappels

L'application programme une notification 30 minutes avant chaque événement.
Les notifications web dépendent du navigateur et du système du téléphone. Pour des rappels garantis même quand l'application est complètement fermée, il faudra ajouter plus tard un service de notifications push avec serveur.

## Publier avec GitHub Pages

1. Crée un nouveau dépôt sur GitHub, par exemple `mon-agenda`.
2. Envoie ces fichiers dans le dépôt.
3. Sur GitHub, ouvre `Settings` puis `Pages`.
4. Dans `Build and deployment`, choisis `Deploy from a branch`.
5. Sélectionne la branche `main` et le dossier `/root`.
6. Clique sur `Save`.

L'adresse sera généralement:

```text
https://TON-NOM-GITHUB.github.io/mon-agenda/
```
