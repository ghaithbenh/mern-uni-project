# Le Panneau

Tableau d'annonces pour un club étudiant (projet MERN, EPS 2025/2026).
Les visiteurs lisent les annonces ; les membres connectés publient, suppriment leurs annonces et laissent des avis.

- **Front** : React 18 + Vite + TypeScript, Axios (`client/`)
- **API** : Node.js + Express + TypeScript, JWT, bcrypt (`server/`)
- **Base** : MongoDB Atlas via Mongoose

## Modèles (Mongoose)

| Modèle | Champs | Relations |
|---|---|---|
| `User` | nom, email (unique), motDePasse (hash bcrypt), role (`user` ou `admin`) | — |
| `Event` | titre, description, lieu, date | `auteur` → User (1 → N) |
| `Feedback` | texte, note (1–5) | `evenement` → Event (1 → N), `auteur` → User (1 → N) |

Les routes de lecture utilisent `.populate('auteur', 'nom')` pour afficher le nom de l'auteur.

## Routes API

| Méthode | Route | Accès |
|---|---|---|
| POST | `/api/auth/register` | public |
| POST | `/api/auth/login` | public |
| GET | `/api/events` | public |
| POST | `/api/events` | protégé (JWT) |
| DELETE | `/api/events/:id` | protégé, auteur ou admin |
| GET | `/api/events/:id/feedbacks` | public |
| POST | `/api/feedbacks` | protégé (JWT) |
| DELETE | `/api/feedbacks/:id` | protégé, auteur ou admin |
| GET | `/api/users` | admin seulement |
| PATCH | `/api/users/:id/role` | admin seulement |
| GET | `/api/admin/stats?days=14` | admin seulement (`7`, `14`, `30` ou `90` jours) |

Le guard `createAuthGuard` (`server/src/auth/auth.guard.ts`) lit `Authorization: Bearer <token>`, vérifie le JWT et place l'utilisateur dans `req.user`.

## Rôles

| Rôle | Droits |
|---|---|
| `user` | publier des annonces, supprimer ses propres annonces et avis |
| `admin` | tout ce que fait un `user`, plus supprimer n'importe quelle annonce ou n'importe quel avis |

Les admins sont définis via `ADMIN_EMAILS` dans `server/.env` (emails séparés par des virgules). La promotion s'applique à l'inscription et à la connexion d'un compte existant.

## Limitation de débit

Les routes `/api` sont protégées par `express-rate-limit` dans `server/src/common/middleware/rate-limit.ts` :

| Portée | Limite |
|---|---|
| Toutes les routes `/api` | 240 requêtes / minute / IP |
| `POST /api/auth/login` | 10 échecs / 15 minutes / IP |
| `POST /api/auth/register` | 10 inscriptions / heure / IP |
| Écritures (`POST`, `DELETE`, changement de rôle) | 20 / minute / IP |

Les connexions réussies ne sont pas comptées : seules les tentatives échouées consomment le quota. Les compteurs sont en mémoire, donc remis à zéro au redémarrage du serveur.

Derrière un proxy (Render, Railway…), définis `TRUST_PROXY=1` pour que `req.ip` soit l'adresse réelle du client ; sinon tous les visiteurs partagent le quota du proxy.

Un admin connecté peut ouvrir le **tableau de bord** depuis l'en-tête (`administration`). Il y trouve des indicateurs clés (comptes, annonces, avis, note moyenne), une courbe d'activité sur 7/14/30/90 jours, la répartition des rôles, la distribution des notes, les annonces les plus commentées, la gestion des rôles et la modération des annonces.

## Architecture API (inspirée de NestJS)

```text
server/src/
  main.ts                  # bootstrap : connexion MongoDB + démarrage HTTP
  app.ts                   # création de l'application Express
  app.module.ts            # module racine : assemble les modules
  config/                  # variables d'environnement typées
  common/                  # erreurs, middlewares, validation, JWT
  admin/
    admin.module.ts        # statistiques du tableau de bord
    admin.controller.ts
    admin.service.ts
  auth/
    auth.module.ts         # routes du module + injection des dépendances
    auth.controller.ts
    auth.service.ts
    auth.guard.ts
    current-user.ts
    dto/
  users/
    users.module.ts        # gestion admin des utilisateurs et rôles
    users.controller.ts
    users.service.ts
    user.model.ts
    dto/
  events/
    events.module.ts
    events.controller.ts
    events.service.ts
    event.model.ts
    dto/
  feedbacks/
    feedbacks.module.ts
    feedbacks.controller.ts
    feedbacks.service.ts
    feedback.model.ts
    dto/
```

Chaque fonctionnalité suit le même trio que Nest CLI : `X.module.ts`, `X.controller.ts`, `X.service.ts`, avec ses DTO dans `dto/`. Le module déclare ses routes et injecte ses dépendances dans le contrôleur et le service. Les contrôleurs restent fins, la validation est faite dans les DTO, et les erreurs sont centralisées dans un middleware unique.

Côté client, le tableau de bord admin est dans `client/src/pages/AdminDashboard.tsx` et n'est accessible qu'aux utilisateurs ayant le rôle `admin`. Les graphiques sont des composants SVG typés dans `client/src/components/charts/` (aucune librairie de charts supplémentaire).

Le style est géré avec **Tailwind v4** (`@tailwindcss/vite`) :

- `client/src/index.css` : déclaration `@import 'tailwindcss'` + tokens du thème (`@theme` : couleurs, polices, ombre carte) ;
- `client/src/ui.ts` : classes Tailwind partagées (boutons, champs, badges, carte, `cx()`) appliquées directement dans les composants ;
- aucune classe CSS maison : tout passe par des utilitaires Tailwind.

## Lancer en local

```bash
# API
cd server
cp .env.example .env     # puis remplir MONGO_URI et JWT_SECRET
npm install
npm run dev              # http://localhost:5000

# Front (autre terminal)
cd client
cp .env.example .env
npm install
npm run dev              # http://localhost:5173
```

## Déploiement

1. **MongoDB Atlas** : cluster gratuit M0, utilisateur de base, Network Access `0.0.0.0/0`, copier l'URI.
2. **Render** (Web Service, dossier `server/`) : Build `npm install && npm run build`, Start `npm start`.
   Variables : `MONGO_URI`, `JWT_SECRET`, `CLIENT_URL` (l'URL Vercel, sans slash final).
3. **Vercel** (dossier `client/`, preset Vite) : variable `VITE_API_URL` = `https://<ton-api>.onrender.com/api`.
4. Une fois l'URL Vercel connue, la mettre dans `CLIENT_URL` sur Render puis redéployer.

Aucun `.env` n'est versionné (voir `.gitignore`).
