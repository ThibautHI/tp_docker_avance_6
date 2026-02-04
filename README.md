# ☁️ CloudShop - Plateforme E-Commerce Microservices

Plateforme e-commerce moderne basée sur une architecture microservices Cloud Native.

## 🏗️ Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                         Frontend                                │
│                      (React + Vite)                            │
│                        Port: 3000                              │
└────────────────────────────┬───────────────────────────────────┘
                             │
                             ▼
┌────────────────────────────────────────────────────────────────┐
│                       API Gateway                               │
│                    (Node.js Express)                           │
│                  Rate Limiting • CORS                          │
│                        Port: 8080                              │
└───────┬────────────────────┼────────────────────┬──────────────┘
        │                    │                    │
        ▼                    ▼                    ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ Auth Service │    │ Products API │    │  Orders API  │
│   Node.js    │    │   FastAPI    │    │      Go      │
│   JWT Auth   │    │    CRUD      │    │    CRUD      │
│  Port: 8081  │    │  Port: 8082  │    │  Port: 8083  │
└──────┬───────┘    └──────┬───────┘    └──────┬───────┘
       │                   │                   │
       └───────────────────┴───────────────────┘
                           │
                           ▼
               ┌───────────────────────┐
               │      PostgreSQL       │
               │     Port: 5432        │
               └───────────────────────┘
```

## 🚀 Démarrage Rapide

### Prérequis
- Docker & Docker Compose
- Git

### Lancer la plateforme

```bash
# Cloner le projet et se placer dans le dossier
cd TD-Jour6

# Lancer tous les services
docker-compose up --build

# Ou en arrière-plan
docker-compose up -d --build
```

### Accéder aux services

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost:3000 | Interface utilisateur |
| **API Gateway** | http://localhost:8080 | Point d'entrée API |
| **Auth Service** | http://localhost:8081 | Authentification JWT |
| **Products API** | http://localhost:8082 | Gestion produits |
| **Orders API** | http://localhost:8083 | Gestion commandes |

## 📡 API Endpoints

### Health Checks
```bash
curl http://localhost:8080/health
curl http://localhost:8081/health
curl http://localhost:8082/health
curl http://localhost:8083/health
```

### Auth Service (via Gateway)
```bash
# Inscription
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","password":"secret","name":"Test User"}'

# Connexion
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@cloudshop.com","password":"password123"}'
```

### Products API (via Gateway)
```bash
# Liste des produits
curl http://localhost:8080/api/products/

# Recherche
curl "http://localhost:8080/api/products/?search=macbook"

# Créer un produit
curl -X POST http://localhost:8080/api/products/ \
  -H "Content-Type: application/json" \
  -d '{"name":"New Product","description":"Description","price":99.99,"category":"electronics","stock":10}'
```

### Orders API (via Gateway)
```bash
# Liste des commandes
curl http://localhost:8080/api/orders/

# Créer une commande
curl -X POST http://localhost:8080/api/orders/ \
  -H "Content-Type: application/json" \
  -d '{"user_id":"user-1","items":[{"product_id":"p1","name":"Product","quantity":2,"price":49.99}]}'

# Statistiques
curl http://localhost:8080/api/orders/stats/summary
```

## 🛠️ Structure du Projet

```
TD-Jour6/
├── docker-compose.yml          # Orchestration des services
├── .env                        # Variables d'environnement
│
├── frontend/                   # React + Vite (Port 3000)
│   ├── Dockerfile
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       └── index.css
│
├── api-gateway/                # Express Gateway (Port 8080)
│   ├── Dockerfile
│   ├── package.json
│   └── server.js
│
├── auth-service/               # Node.js Auth (Port 8081)
│   ├── Dockerfile
│   ├── package.json
│   └── server.js
│
├── products-api/               # FastAPI Python (Port 8082)
│   ├── Dockerfile
│   ├── requirements.txt
│   └── main.py
│
└── orders-api/                 # Go API (Port 8083)
    ├── Dockerfile
    ├── go.mod
    ├── go.sum
    └── main.go
```

## 🔧 Configuration

Variables d'environnement (`.env`) :
```env
POSTGRES_PASSWORD=cloudshop-secure-password-2024
JWT_SECRET=cloudshop-jwt-secret-key-change-in-production
```

## 🧪 Tests

### Test utilisateur par défaut
- **Email**: `admin@cloudshop.com`
- **Password**: `password123`

### Commandes utiles
```bash
# Voir les logs
docker-compose logs -f

# Logs d'un service spécifique
docker-compose logs -f api-gateway

# Redémarrer un service
docker-compose restart auth-service

# Reconstruire un service
docker-compose up -d --build products-api

# Arrêter tous les services
docker-compose down

# Supprimer les volumes (données)
docker-compose down -v
```

## 📊 Observabilité

Chaque service expose un endpoint `/health` pour les healthchecks.

L'API Gateway expose également `/metrics` pour les métriques de base.

## 🔒 Sécurité

- **Rate Limiting**: 100 requêtes / 15 minutes par IP
- **CORS**: Configuré pour accepter les requêtes du frontend
- **JWT**: Tokens d'authentification avec expiration 24h
- **Utilisateurs non-root**: Tous les conteneurs tournent avec des utilisateurs sans privilèges

## 🎯 SLO Cibles

- **Disponibilité**: 99.9%
- **Latence P99**: < 200ms
- **Temps de déploiement**: < 5 minutes
