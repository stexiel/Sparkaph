# Sparkaph Deployment Guide

Полное руководство по развертыванию Sparkaph в production.

## Содержание

1. [Локальная разработка](#локальная-разработка)
2. [Docker Deployment](#docker-deployment)
3. [Kubernetes Deployment](#kubernetes-deployment)
4. [Cloud Deployment (GCP)](#cloud-deployment-gcp)
5. [Мониторинг](#мониторинг)
6. [Масштабирование](#масштабирование)

---

## Локальная разработка

### Быстрый старт

```bash
# 1. Клонировать репозиторий
git clone https://github.com/stexiel/Sparkaph.git
cd Sparkaph

# 2. Запустить с Docker Compose
cd server
docker-compose up -d

# 3. Проверить
curl http://localhost:8080/health
```

### Ручной запуск

```bash
# PostgreSQL
docker run -d \
  --name sparkaph-postgres \
  -e POSTGRES_USER=sparkaph \
  -e POSTGRES_PASSWORD=sparkaph \
  -e POSTGRES_DB=sparkaph \
  -p 5432:5432 \
  postgres:15-alpine

# Redis
docker run -d \
  --name sparkaph-redis \
  -p 6379:6379 \
  redis:7-alpine

# Миграции
psql postgres://sparkaph:sparkaph@localhost:5432/sparkaph < migrations/001_initial_schema.sql

# Запуск сервера
go run ./cmd/gameserver
```

---

## Docker Deployment

### Build образа

```bash
cd server
docker build -t sparkaph-server:latest .
```

### Docker Compose (Production)

```yaml
version: '3.8'

services:
  gameserver:
    image: stexiel/sparkaph:latest
    ports:
      - "8080:8080"
    environment:
      - POSTGRES_HOST=postgres
      - REDIS_HOST=redis
      - LOG_LEVEL=info
    depends_on:
      - postgres
      - redis
    restart: unless-stopped

  postgres:
    image: postgres:15-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_DB=sparkaph
      - POSTGRES_USER=sparkaph
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

---

## Kubernetes Deployment

### Предварительные требования

```bash
# Установить kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# Установить helm
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
```

### Развертывание

```bash
# 1. Создать namespace
kubectl apply -f infrastructure/kubernetes/namespace.yaml

# 2. Создать secrets
kubectl create secret generic sparkaph-secrets \
  --from-literal=postgres-password=YOUR_PASSWORD \
  --from-literal=redis-password=YOUR_PASSWORD \
  -n sparkaph

# 3. Deploy PostgreSQL
kubectl apply -f infrastructure/kubernetes/postgres.yaml

# 4. Deploy Redis
kubectl apply -f infrastructure/kubernetes/redis.yaml

# 5. Deploy Game Server
kubectl apply -f infrastructure/kubernetes/deployment.yaml

# 6. Deploy Monitoring
kubectl apply -f infrastructure/kubernetes/monitoring.yaml
```

### Проверка статуса

```bash
# Pods
kubectl get pods -n sparkaph

# Services
kubectl get svc -n sparkaph

# HPA
kubectl get hpa -n sparkaph

# Logs
kubectl logs -f deployment/sparkaph-gameserver -n sparkaph
```

---

## Cloud Deployment (GCP)

### Terraform Setup

```bash
cd infrastructure/terraform

# Инициализация
terraform init

# План
terraform plan -var="project_id=YOUR_PROJECT_ID" -var="db_password=YOUR_PASSWORD"

# Apply
terraform apply -var="project_id=YOUR_PROJECT_ID" -var="db_password=YOUR_PASSWORD"
```

### Подключение к кластеру

```bash
# Get credentials
gcloud container clusters get-credentials sparkaph-cluster --region us-central1

# Verify
kubectl get nodes
```

### Deploy приложения

```bash
# Build и push образа
docker build -t gcr.io/YOUR_PROJECT_ID/sparkaph:latest .
docker push gcr.io/YOUR_PROJECT_ID/sparkaph:latest

# Update deployment
kubectl set image deployment/sparkaph-gameserver \
  gameserver=gcr.io/YOUR_PROJECT_ID/sparkaph:latest \
  -n sparkaph
```

---

## Мониторинг

### Prometheus

```bash
# Port forward
kubectl port-forward svc/prometheus 9090:9090 -n sparkaph

# Открой http://localhost:9090
```

### Grafana

```bash
# Port forward
kubectl port-forward svc/grafana 3000:80 -n sparkaph

# Открой http://localhost:3000
# Login: admin / admin (измени после первого входа)
```

### Метрики

Основные метрики для мониторинга:

- `sparkaph_active_connections` - Активные подключения
- `sparkaph_active_matches` - Активные матчи
- `sparkaph_active_players` - Активные игроки
- `sparkaph_match_duration_seconds` - Длительность матчей
- `sparkaph_queue_size` - Размер очереди matchmaking
- `sparkaph_errors_total` - Количество ошибок

### Alerts

Создай alerts в Prometheus:

```yaml
groups:
- name: sparkaph
  rules:
  - alert: HighErrorRate
    expr: rate(sparkaph_errors_total[5m]) > 10
    for: 5m
    annotations:
      summary: "High error rate detected"
  
  - alert: HighMemoryUsage
    expr: sparkaph_memory_usage_bytes > 1e9
    for: 5m
    annotations:
      summary: "High memory usage"
```

---

## Масштабирование

### Horizontal Pod Autoscaling

HPA уже настроен в `deployment.yaml`:

```yaml
minReplicas: 3
maxReplicas: 100
targetCPUUtilizationPercentage: 70
```

### Ручное масштабирование

```bash
# Scale up
kubectl scale deployment sparkaph-gameserver --replicas=10 -n sparkaph

# Scale down
kubectl scale deployment sparkaph-gameserver --replicas=3 -n sparkaph
```

### Вертикальное масштабирование

Обнови `resources` в deployment:

```yaml
resources:
  requests:
    cpu: 200m
    memory: 256Mi
  limits:
    cpu: 1000m
    memory: 1Gi
```

### Database Scaling

```bash
# PostgreSQL - увеличь tier
gcloud sql instances patch sparkaph-postgres \
  --tier=db-n1-standard-2

# Redis - увеличь memory
gcloud redis instances update sparkaph-redis \
  --size=5
```

---

## Стоимость инфраструктуры

### Малая нагрузка (1K CCU)

```
GKE Nodes (3x e2-small):        $50/месяц
Cloud SQL (db-f1-micro):        $15/месяц
Redis (1GB):                    $25/месяц
Load Balancer:                  $20/месяц
-------------------------------------------
ИТОГО:                          ~$110/месяц
```

### Средняя нагрузка (10K CCU)

```
GKE Nodes (10x e2-standard-2):  $500/месяц
Cloud SQL (db-n1-standard-2):   $150/месяц
Redis (5GB):                    $100/месяц
Load Balancer:                  $20/месяц
-------------------------------------------
ИТОГО:                          ~$770/месяц
```

### Высокая нагрузка (50K CCU = 10M MAU)

```
GKE Nodes (50x e2-standard-4):  $2,000/месяц
Cloud SQL (db-n1-standard-8):   $500/месяц
Redis (20GB):                   $300/месяц
Load Balancer:                  $50/месяц
-------------------------------------------
ИТОГО:                          ~$2,850/месяц
```

---

## Backup & Recovery

### Database Backup

```bash
# Manual backup
kubectl exec -it postgres-0 -n sparkaph -- \
  pg_dump -U sparkaph sparkaph > backup_$(date +%Y%m%d).sql

# Restore
kubectl exec -i postgres-0 -n sparkaph -- \
  psql -U sparkaph sparkaph < backup_20260305.sql
```

### Automated Backups

Cloud SQL автоматически создает backups (настроено в Terraform).

---

## Troubleshooting

### Pods не запускаются

```bash
# Проверь events
kubectl describe pod POD_NAME -n sparkaph

# Проверь logs
kubectl logs POD_NAME -n sparkaph

# Проверь resources
kubectl top pods -n sparkaph
```

### Database connection issues

```bash
# Проверь connectivity
kubectl exec -it sparkaph-gameserver-XXX -n sparkaph -- \
  nc -zv postgres 5432

# Проверь credentials
kubectl get secret sparkaph-secrets -n sparkaph -o yaml
```

### High latency

```bash
# Проверь HPA
kubectl get hpa -n sparkaph

# Проверь node resources
kubectl top nodes

# Scale up если нужно
kubectl scale deployment sparkaph-gameserver --replicas=20 -n sparkaph
```

---

## Security Checklist

- [ ] Изменить все пароли по умолчанию
- [ ] Включить HTTPS/TLS
- [ ] Настроить Network Policies
- [ ] Включить Pod Security Policies
- [ ] Настроить RBAC
- [ ] Включить audit logging
- [ ] Регулярные security scans
- [ ] Backup encryption
- [ ] Secrets encryption at rest

---

## CI/CD

GitHub Actions уже настроен в `.github/workflows/ci.yml`.

### Manual Deploy

```bash
# Build
make docker-build

# Push
docker push stexiel/sparkaph:latest

# Deploy
kubectl rollout restart deployment/sparkaph-gameserver -n sparkaph

# Check status
kubectl rollout status deployment/sparkaph-gameserver -n sparkaph
```

---

## Поддержка

- **Документация:** `/docs`
- **Issues:** https://github.com/stexiel/Sparkaph/issues
- **Monitoring:** Grafana dashboard
- **Logs:** Kubernetes logs
