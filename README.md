# Blogify – Plateforme de blogging Headless (Serverless)

## Présentation

Blogify est une plateforme de blogging headless entièrement serverless, offrant une API sécurisée permettant :

- l’authentification des utilisateurs (JWT),
- la création, modification et suppression d’articles,
- la gestion des médias (upload via URL pré-signée S3),
- l’association d’un média à un article,
- la recherche textuelle sur le contenu des articles.

Le projet utilise exclusivement des services AWS :

- AWS Lambda (Node.js)
- AWS API Gateway (HTTP API)
- AWS DynamoDB (NoSQL)
- AWS S3 (stockage d’objets)
- Serverless Framework

## Architecture générale

Modèle serverless classique fonctionnant entièrement à l’événement :

![blogify architecture](./assets/blogify-architecture.png)

Tous les accès S3 sont privés.  
Aucun fichier n’est public.  
Le client doit utiliser une URL pré-signée générée par Lambda.

## Structure du projet

```
.
├── src/
│   ├── lambda/
│   │   ├── auth.ts
│   │   ├── posts.ts
│   │   └── media.ts
│   ├── helpers/
│   │   ├── buildJsonResponse.ts
│   │   └── verifyJwt.ts
│   ├── middleware/
│   │   ├── auth/
│   │   │   ├── requireRole.ts
│   │   │   ├── validateLoginPayload.ts
│   │   │   └── validateRegisterPayload.ts
│   │   ├── media/
│   │   │   └── validateMediaPayload.ts
│   │   └── posts/
│   │       ├── validatePostPayload.ts
│   │       └── canModifyPost.ts
│   ├── config/
│   │   ├── s3Clients.ts
│   │   └── dynamoDbClient.ts
│   └── types/
│       ├── userTypes.ts
│       ├── postTypes.ts
│       ├── mediaTypes.ts
│       ├── jwtTypes.ts
│       ├── httpTypes.ts
│       └── validationTypes.ts
│
├── serverless.yml
├── package.json
├── swagger.yml
├── tsconfig.json
└── README.md
```

## Prérequis

Outils nécessaires :

| Outil                | Version                     |
| -------------------- | --------------------------- |
| Node.js              | 20.x ou supérieur           |
| Serverless Framework | `npm install -g serverless` |

Vérification :

```bash
node -v
sls -v
```

---

# Installation, développement et options de Test

Ce projet peut être testé ou exécuté de trois manières différentes.  
La méthode la plus simple est la première (API déjà déployée).

---

## 1. Utiliser directement l’API déjà déployée (aucune installation requise)

L’API Blogify est déjà en ligne :

```
https://87tbxkg5wg.execute-api.eu-west-3.amazonaws.com/{...}
```

### Tester l’API avec Swagger local

Même si l’API est déjà déployée, vous pouvez afficher le Swagger **en local** :

1. Installer les dépendances :

```bash
npm install
```

2. Démarrer Swagger UI :

```bash
npm run swagger
```

Swagger sera accessible à :

```
http://localhost:3000
```

---

## 2. Tester en local avec Serverless Dev Mode

Permet d’exécuter les Lambdas **en local**, avec rechargement automatique.

### Étapes

1. Dézipper le projet
2. Installer les dépendances :

```bash
npm install
```

3. Lancer le mode dev :

```bash
serverless dev
```

Ce mode :

- démarre une API locale,
- recharge automatiquement le code,

---

## 3. Déployer votre propre instance AWS

Pour tester la plateforme avec **votre propre infrastructure AWS**.

### Étapes

1. Installer les dépendances :

```bash
npm install
```

2. Se connecter à Serverless Framework :

```bash
serverless login
```

3. Déployer :

```bash
serverless deploy
```

Le déploiement crée automatiquement :

- une API Gateway HTTP,
- les Lambdas,
- les tables DynamoDB,
- un bucket S3 privé,
- les variables d’environnement.

Les URLs de l’API seront affichées dans le terminal après déploiement. Vous devrez cependant avoir lié votre compte AWS à Serverless Framework au préalable.

---

## Documentation API (Swagger)

Le fichier de spécification OpenAPI :

```
swagger.yml
```

peut être utilisé avec :

- Swagger UI
- Postman
- Insomnia

Ou visualisé via :

```bash
npm install
npm run swagger
```

---

## Modèles DynamoDB (détaillés)

### Table Users – `<stage>-blogify-users`

Stocke les comptes utilisateurs.

**Clés :**

- PK : `userId`
- GSI : `email-index` (email)

**Champs :**

| Champ        | Type   | Obligatoire | Description                         |
| ------------ | ------ | ----------- | ----------------------------------- |
| userId       | string | Oui         | Identifiant unique (UUID)           |
| email        | string | Oui         | Email unique, utilisé pour le login |
| passwordHash | string | Oui         | Mot de passe hashé (bcrypt)         |
| name         | string | Non         | Nom affiché                         |
| role         | string | Oui         | `ADMIN`, `EDITOR`, `AUTHOR`         |
| createdAt    | string | Oui         | Timestamp ISO                       |
| updatedAt    | string | Oui         | Timestamp ISO                       |

---

### Table Posts – `<stage>-blogify-posts`

Stocke les articles.

**Clés :**

- PK : `postId`

**Champs :**

| Champ     | Type   | Obligatoire | Description          |
| --------- | ------ | ----------- | -------------------- |
| postId    | string | Oui         | Identifiant unique   |
| authorId  | string | Oui         | Référence à `userId` |
| title     | string | Oui         | Titre                |
| content   | string | Oui         | Contenu              |
| createdAt | string | Oui         | Timestamp ISO        |
| updatedAt | string | Oui         | Timestamp ISO        |

---

### Table Medias – `<stage>-blogify-media-metadata`

Stocke les métadonnées des médias.

**Clés :**

- PK : `mediaId`
- GSI : `postId-index` (postId)

**Champs :**

| Champ     | Type   | Obligatoire | Description               |
| --------- | ------ | ----------- | ------------------------- |
| mediaId   | string | Oui         | Identifiant unique        |
| ownerId   | string | Oui         | Propriétaire (userId)     |
| postId    | string | Non         | Article associé           |
| type      | string | Oui         | `IMAGE`, `VIDEO`, `OTHER` |
| mimeType  | string | Oui         | Type MIME                 |
| fileName  | string | Oui         | Nom d’origine             |
| fileSize  | number | Oui         | Taille en octets          |
| bucketKey | string | Oui         | Clé S3 complète           |
| createdAt | string | Oui         | Timestamp ISO             |

---

## Variables d’environnement

```
USERS_TABLE
POSTS_TABLE
MEDIA_BUCKET
MEDIA_TABLE
JWT_SECRET
```

---

## Nettoyage

```bash
serverless remove
```
