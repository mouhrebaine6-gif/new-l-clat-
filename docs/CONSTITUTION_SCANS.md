# L'ECLAT - Constitution des scans

## Principe

Le client Unity ne garantit jamais seul l'anti-triche. Il prepare les signaux utiles
et affiche l'experience AR, mais le serveur decide toujours de l'identite, du comptage,
des paliers et du niveau d'acces.

- QR cache dans le col: autorisation, fragment, futur token serveur.
- Logo brode suivi par Vuforia: ancrage visuel uniquement.
- Telephone: `device_id` local stable, nonce de scan, mode apercu si le serveur est absent.

## Regles serveur

1. Le proprietaire est le premier compte qui active le QR d'un t-shirt.
2. Tout autre telephone devient visiteur.
3. Un visiteur peut ajouter `+1` au compteur du proprietaire.
4. Un couple `(device_id, t-shirt)` ne compte qu'une seule fois a vie.
5. Un `device_id` ne peut compter que 5 scans maximum par jour.
6. Les scans du proprietaire sur son propre t-shirt ne comptent pas.
7. Le token QR est reclamable une seule fois; toute reutilisation est refusee.
8. Compteur, paliers, `access_level` et droits narratifs sont 100% serveur.
9. Le nonce rend chaque scan idempotent: un meme scan ne compte qu'une fois.
10. Hors-ligne, Unity peut montrer l'AR locale, mais rien ne compte avant validation serveur.
11. Plus tard, le serveur ajoute une detection simple d'anomalies: IP, frequence, device suspect, token trop partage.

## Non-menaces assumees

- Scanner une photo du logo peut afficher un visuel local, mais ne doit jamais compter.
- Partager un QR peut faire de la visibilite, mais l'activation unique et les plafonds serveur limitent l'abus.
- Effacer les donnees de l'application peut regenerer un `device_id`; le serveur recoupe avec les plafonds et signaux secondaires.

## Payload client prepare

```json
{
  "fragment": "eveil",
  "token": "future-token",
  "device_id": "stable-local-device-id",
  "nonce": "single-use-scan-nonce"
}
```

Le backend du prochain chantier doit appliquer ces regles avant toute progression definitive.
