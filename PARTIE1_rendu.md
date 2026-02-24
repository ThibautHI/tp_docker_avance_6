# Connexion au front :

admin@cloudshop.com
password123

# Commande : docker images

## Attendu :

cloudshop-gateway < 150MB
cloudshop-auth < 150MB
cloudshop-frontend < 50MB
cloudshop-orders < 20MB
cloudshop-products < 180MB

# Résultat :

td-jour6-api-gateway 100MB
td-jour6-auth-service 97MB
td-jour6-frontend 20.8MB
td-jour6-orders-api 13.5MB
td-jour6-products-api 175MB

# Commande Trivy

## trivy image td-jour6-frontend:latest

┌──────────────────────────────────────────┬────────┬─────────────────┬─────────┐
│ Target │ Type │ Vulnerabilities │ Secrets │
├──────────────────────────────────────────┼────────┼─────────────────┼─────────┤
│ td-jour6-frontend:latest (alpine 3.23.3) │ alpine │ 0 │ - │
└──────────────────────────────────────────┴────────┴─────────────────┴─────────┘

## trivy image td-jour6-api-gateway:latest

# Node.js (node-pkg)

Total: 7 (UNKNOWN: 0, LOW: 2, MEDIUM: 0, HIGH: 5, CRITICAL: 0)

## trivy image td-jour6-auth-service:latest

# Node.js (node-pkg)

Total: 7 (UNKNOWN: 0, LOW: 2, MEDIUM: 0, HIGH: 5, CRITICAL: 0)

## trivy image td-jour6-products-api:latest

# Python (python-pkg)

Total: 7 (UNKNOWN: 0, LOW: 1, MEDIUM: 2, HIGH: 4, CRITICAL: 0)

## trivy image td-jour6-orders-api:latest

# orders-api (gobinary)

Total: 27 (UNKNOWN: 0, LOW: 0, MEDIUM: 21, HIGH: 6, CRITICAL: 0)

# Whoami

## td-jour6-frontend

docker exec 46e91ede098d whoami (td-jour6-frontend)
appuser

## td-jour6-api-gateway

docker exec a4fac7d09396 whoami (td-jour6-api-gateway)
nodejs

## td-jour6-auth-service

docker exec 786588acb248 whoami (td-jour6-auth-service)
nodejs

## td-jour6-products-api

docker exec 3f4876e61d67 whoami (td-jour6-products-api)
appuser

## td-jour6-orders-api

docker exec 404a1a7e333a whoami (td-jour6-orders-api)
appuser
