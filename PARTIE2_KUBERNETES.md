# Install

- Activer le kubernetes dans docker desktop (permet d'avoir un cluster local)
- Installer kubectl.exe

# Modification

Ajouter dans C:\Windows\System32\drivers\etc\hosts

127.0.0.1 shop.local
127.0.0.1 api.local

# Commandes

- kubectl apply -f k8s/namespaces/
- kubectl apply -f k8s/configs/configmaps/
- kubectl apply -f k8s/configs/secrets/
- kubectl apply -f k8s/statefulsets/
- kubectl apply -f k8s/services/
- kubectl apply -f k8s/deployments/

- kubectl get all -n cloudshop-prod

- kubectl logs -l app=frontend -n cloudshop-prod

## Tunnel de test

- kubectl port-forward svc/frontend 3000:80 -n cloudshop-prod
- kubectl port-forward svc/api-gateway 8080:8080 -n cloudshop-prod
