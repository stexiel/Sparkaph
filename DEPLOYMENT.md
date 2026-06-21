# Sparkaph Deployment Guide

## 📋 Pre-Deployment Checklist

### ✅ Что уже готово:
- [x] Backend API полностью функционален
- [x] Frontend React приложение собирается
- [x] Prisma схема настроена
- [x] Socket.io для real-time
- [x] OAuth (GitHub, Google)
- [x] Система уведомлений
- [x] SDK для разработчиков
- [x] Docker конфигурация
- [x] Nginx конфигурация

### ⚠️ Что нужно настроить перед деплоем:

1. **Environment Variables**
   - JWT секреты (сгенерируйте новые!)
   - OAuth credentials (GitHub, Google)
   - Database URL (production)
   - Redis URL (production)
   - AWS S3 (опционально, для файлов)

2. **Database**
   - PostgreSQL 14+ сервер
   - Запустить миграции Prisma
   - Настроить бэкапы

3. **Redis**
   - Redis 6+ сервер
   - Настроить persistence

4. **Domain & SSL**
   - Купить домен
   - Настроить DNS
   - Получить SSL сертификат (Let's Encrypt)

5. **OAuth Apps**
   - Создать GitHub OAuth App
   - Создать Google OAuth App
   - Обновить redirect URIs

## 🚀 Deployment Options

### Option 1: Oracle Cloud Always Free (Рекомендуется для продакшена)

**Почему Oracle Cloud?**
- Навсегда бесплатно (2 CPU, 24GB RAM, 200GB storage)
- Подходит для 5-10 пользователей
- Постоянная работа (не спит)
- Можно перенести на другой сервер с бэкапами

**Настройка:**

1. **Создайте аккаунт Oracle Cloud**
   - Зарегистрируйтесь на https://www.oracle.com/cloud/free/
   - Нужна кредитная карта (не списывают деньги)
   - Создайте "Always Free" инстанс

2. **Настройте SSH ключи**
   ```bash
   # На локальной машине
   ssh-keygen -t rsa -b 4096 -C "your-email@example.com"
   
   # Добавьте публичный ключ в Oracle Cloud Console
   # Compute → Instances → Instance Details → SSH Keys
   ```

3. **Подключитесь к серверу**
   ```bash
   ssh -i ~/.ssh/your-key opc@your-oracle-ip
   ```

4. **Установите зависимости**
   ```bash
   sudo apt update
   sudo apt install -y git nodejs npm postgresql postgresql-contrib nginx certbot
   ```

5. **Клонируйте репозиторий**
   ```bash
   cd /home/opc
   git clone https://github.com/stexiel/Sparkaph.git
   cd Sparkaph
   ```

6. **Настройте окружение**
   ```bash
   # Backend
   cd backend
   cp .env.production .env
   # Отредактируйте .env с вашими credentials
   
   # Frontend
   cd ../frontend
   cp .env.production .env.local
   # Отредактируйте .env.local
   ```

7. **Настройте базу данных**
   ```bash
   sudo -u postgres createdb sparkaph
   cd backend
   npx prisma migrate deploy
   npx prisma generate
   ```

8. **Установите PM2**
   ```bash
   npm install -g pm2
   ```

9. **Запустите сервисы**
   ```bash
   # Backend
   cd backend
   pm2 start npm --name "sparkaph-backend" -- start
   
   # Frontend
   cd ../frontend
   pm2 start npm --name "sparkaph-frontend" -- start
   
   pm2 save
   pm2 startup
   ```

10. **Настройте Nginx**
    ```bash
    sudo cp frontend/nginx.conf /etc/nginx/sites-available/sparkaph
    sudo ln -s /etc/nginx/sites-available/sparkaph /etc/nginx/sites-enabled/
    sudo nginx -t
    sudo systemctl restart nginx
    ```

11. **Настройте SSL**
    ```bash
    sudo certbot --nginx -d sparkaph.com -d www.sparkaph.com
    ```

### Option 2: GitHub Actions Auto-Deploy (Oracle Cloud)

**Автоматический деплой при пуш в GitHub:**

1. **Добавьте секреты в GitHub Settings → Secrets:**
   - `SSH_HOST` - IP адрес Oracle Cloud
   - `SSH_USER` - username (обычно `opc`)
   - `SSH_PRIVATE_KEY` - приватный SSH ключ
   - `SSH_PORT` - порт (обычно 22)

2. **Workflow уже настроен в `.github/workflows/deploy.yml`**
   - При пуш в `main` автоматически деплоится
   - Выполняет: git pull → npm install → build → pm2 restart

### Option 3: Docker Compose (Рекомендуется для локального тестирования)

```bash
# 1. Клонируйте репозиторий
git clone https://github.com/yourusername/sparkaph.git
cd sparkaph

# 2. Создайте .env файл
cp .env.example .env
# Отредактируйте .env с вашими credentials

# 3. Запустите все сервисы
docker-compose up -d

# 4. Запустите миграции
docker-compose exec backend npx prisma migrate deploy

# 5. Проверьте логи
docker-compose logs -f
```

### Option 2: Manual Deployment

#### Backend

```bash
cd backend

# 1. Установите зависимости
npm ci --only=production

# 2. Настройте .env
cp .env.example .env
# Отредактируйте .env

# 3. Запустите миграции
npx prisma migrate deploy
npx prisma generate

# 4. Соберите TypeScript
npm run build

# 5. Запустите с PM2
npm install -g pm2
pm2 start dist/index.js --name sparkaph-backend
pm2 save
pm2 startup
```

#### Frontend

```bash
cd frontend

# 1. Установите зависимости
npm ci

# 2. Обновите config.ts с production URLs
# frontend/src/config.ts

# 3. Соберите production build
npm run build

# 4. Деплой на Nginx/Apache
# Скопируйте dist/ в /var/www/sparkaph
```

### Option 3: Cloud Platforms

#### Vercel (Frontend)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd frontend
vercel --prod
```

#### Railway/Render (Backend)
1. Подключите GitHub репозиторий
2. Настройте environment variables
3. Добавьте build command: `npm run build`
4. Добавьте start command: `npm start`

## 🔧 Production Configuration

### 1. Environment Variables

**Backend (.env):**
```env
# Production Database
DATABASE_URL=postgresql://user:pass@your-db-host:5432/sparkaph

# Production Redis
REDIS_URL=redis://your-redis-host:6379

# Server
PORT=3000
NODE_ENV=production

# JWT (ВАЖНО: Сгенерируйте новые!)
JWT_SECRET=your-production-jwt-secret-min-32-chars
JWT_REFRESH_SECRET=your-production-refresh-secret-min-32-chars

# OAuth
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=https://yourdomain.com/login/google/callback

# AWS S3 (Рекомендуется для production)
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_REGION=us-east-1
AWS_S3_BUCKET=sparkaph-uploads
```

**Frontend (config.ts):**
```typescript
export const API_URL = 'https://api.yourdomain.com';
export const APPS_URL = 'https://yourdomain.com';
export const WS_URL = 'https://api.yourdomain.com';
export const GITHUB_CLIENT_ID = 'your-github-client-id';
export const GOOGLE_CLIENT_ID = 'your-google-client-id';
export const OAUTH_REDIRECT_URI = 'https://yourdomain.com';
```

### 2. Nginx Configuration (Production)

```nginx
# /etc/nginx/sites-available/sparkaph

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS Server
server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json;

    # Client max body size
    client_max_body_size 100M;

    # Frontend
    location / {
        root /var/www/sparkaph/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Socket.io
    location /socket.io {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }

    # HOSTED Apps
    location ~ ^/[a-zA-Z0-9_-]+$ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### 3. SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal (crontab)
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### 4. Database Setup

```bash
# Create production database
createdb sparkaph

# Run migrations
cd backend
npx prisma migrate deploy

# (Optional) Seed data
npx prisma db seed
```

## 💾 Backup & Migration

### Автоматические бэкапы

**Настройка cron для ежедневных бэкапов:**
```bash
# На сервере
crontab -e

# Добавьте строку для ежедневного бэкапа в 2:00 ночи
0 2 * * * /home/opc/sparkaph/scripts/backup.sh
```

**Ручной бэкап:**
```bash
cd /home/opc/sparkaph
./scripts/backup.sh
```

**Миграция на другой сервер:**
```bash
# 1. Скачать бэкапы с текущего сервера
scp opc@oracle-ip:/home/opc/backups/* ./

# 2. Восстановить на новом сервере
psql sparkaph < sparkaph_db_YYYYMMDD_HHMMSS.sql
tar -xzf uploads_YYYYMMDD_HHMMSS.tar.gz
tar -xzf apps_YYYYMMDD_HHMMSS.tar.gz

# 3. Запустить deploy script
./scripts/deploy.sh
```

## 📊 Admin Dashboard & Statistics

### Автоматическое обновление статистики

**Настройка cron для ежедневного обновления статистики:**
```bash
# На сервере
crontab -e

# Добавьте строку для обновления статистики в 1:00 ночи
0 1 * * * cd /home/opc/sparkaph/backend && npm run update-stats
```

**Ручное обновление статистики:**
```bash
cd backend
npm run update-stats
```

### Создание первого админа

```bash
cd backend
npm run create-admin
```

Это создаст админа с:
- Username: zentriel
- Password: ASER2007

### Доступ к админ-панели

1. Войти как админ: `/login` с username `zentriel` и password `ASER2007`
2. Перейти на `/admin` для доступа к статистике
3. Только админы могут создавать других админов

### Метрики

- **DAU** (Daily Active Users) - Пользователи активные за последние 24 часа
- **MAU** (Monthly Active Users) - Пользователи активные за последние 30 дней
- **WAU** (Weekly Active Users) - Пользователи активные за последние 7 дней
- Статистика отслеживается: новые пользователи, сообщения, приложения, платежи, доход

## 📊 Monitoring & Logs

```bash
# PM2 Monitoring
pm2 monit

# View logs
pm2 logs sparkaph-backend

# Docker logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

## 🔒 Security Checklist

- [ ] Сгенерированы новые JWT секреты (минимум 32 символа)
- [ ] Настроен HTTPS с валидным SSL сертификатом
- [ ] Обновлены OAuth redirect URIs на production домен
- [ ] Настроены CORS правила
- [ ] Включен rate limiting
- [ ] Настроены security headers в Nginx
- [ ] Database credentials в безопасности
- [ ] AWS credentials (если используется) в безопасности
- [ ] Настроены бэкапы базы данных
- [ ] Настроен мониторинг и алерты

## 📊 Performance Optimization

1. **Database:**
   - Настройте connection pooling
   - Добавьте индексы для частых запросов
   - Настройте регулярные VACUUM

2. **Redis:**
   - Настройте maxmemory policy
   - Включите persistence (AOF или RDB)

3. **Frontend:**
   - Включите CDN для статики
   - Настройте browser caching
   - Минифицируйте assets

4. **Backend:**
   - Используйте PM2 cluster mode
   - Настройте load balancing
   - Кэшируйте частые запросы

## 🆘 Troubleshooting

### Backend не запускается
```bash
# Проверьте логи
pm2 logs sparkaph-backend

# Проверьте переменные окружения
pm2 env 0

# Проверьте подключение к БД
psql $DATABASE_URL
```

### Socket.io не работает
- Проверьте Nginx конфигурацию для WebSocket
- Убедитесь что CORS настроен правильно
- Проверьте firewall правила

### OAuth не работает
- Проверьте redirect URIs в OAuth приложениях
- Убедитесь что client ID/secret правильные
- Проверьте HTTPS настройки

## 📞 Support

Если возникли проблемы:
1. Проверьте логи
2. Проверьте environment variables
3. Проверьте документацию
4. Создайте issue на GitHub

---

**Готово к деплою! 🚀**
