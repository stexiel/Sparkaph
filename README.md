# Sparkaph - Mini Apps Platform

> Платформа для создания и хостинга мини-приложений с социальными функциями

## 🚀 Возможности

- **Мини-приложения**: Создавайте HOSTED (статические) или EXTERNAL (API) приложения
- **Социальная сеть**: Чаты, группы, подписки, друзья
- **Уведомления**: Real-time система уведомлений через Socket.io
- **OAuth**: Вход через GitHub и Google
- **Платежи**: Внутренняя валюта Sparks
- **AI Ассистент**: Генерация приложений с помощью AI
- **SDK**: JavaScript SDK для разработчиков
- **Публичные группы**: Группы с уникальными @handle

## 📋 Требования

- Node.js 18+
- PostgreSQL 14+
- Redis 6+
- npm или yarn

## 🛠 Установка

### 1. Клонирование репозитория

```bash
git clone https://github.com/yourusername/sparkaph.git
cd sparkaph
```

### 2. Backend Setup

```bash
cd backend
npm install

# Создайте .env файл
cp .env.example .env

# Настройте переменные окружения в .env:
# - DATABASE_URL (PostgreSQL)
# - REDIS_URL
# - JWT_SECRET
# - GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
# - GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET

# Запустите миграции Prisma
npx prisma migrate dev
npx prisma generate

# Запустите сервер
npm run dev
```

### 3. Frontend Setup

```bash
cd frontend
npm install

# Создайте .env файл (если нужно)
# Обновите src/config.ts с вашими URL

# Запустите dev сервер
npm run dev
```

## 🔧 Конфигурация

### Backend Environment Variables

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/sparkaph"
REDIS_URL="redis://localhost:6379"

# Server
PORT=3000
NODE_ENV=development

# JWT
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret

# OAuth
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-secret
GOOGLE_REDIRECT_URI=http://localhost:5173/login/google/callback

# AWS S3 (Optional)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-1
AWS_S3_BUCKET=
```

### Frontend Configuration

Обновите `frontend/src/config.ts`:

```typescript
export const API_URL = 'http://localhost:3000';
export const APPS_URL = 'http://localhost:3000';
export const WS_URL = 'http://localhost:3000';
export const GITHUB_CLIENT_ID = 'your-github-client-id';
export const GOOGLE_CLIENT_ID = 'your-google-client-id';
export const OAUTH_REDIRECT_URI = 'http://localhost:5173';
```

## 🚀 Деплой

### Production Build

**Backend:**
```bash
cd backend
npm run build
npm start
```

**Frontend:**
```bash
cd frontend
npm run build
# Файлы будут в dist/
```

### Docker (Рекомендуется)

```bash
# Создайте docker-compose.yml
docker-compose up -d
```

### Nginx Configuration

```nginx
server {
    listen 80;
    server_name sparkaph.com;

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
        proxy_cache_bypass $http_upgrade;
    }

    # Socket.io
    location /socket.io {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
    }

    # HOSTED Apps
    location ~ ^/[a-zA-Z0-9_-]+$ {
        proxy_pass http://localhost:3000;
    }
}
```

## 📚 Документация

- [API Documentation](http://localhost:5173/developer-docs)
- [SDK Documentation](./sdk/README.md)
- [Public API](http://localhost:5173/docs)

## 🏗 Архитектура

```
sparkaph/
├── backend/          # Node.js + Express + Prisma
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── utils/
│   │   └── app.ts
│   ├── prisma/
│   │   └── schema.prisma
│   └── package.json
├── frontend/         # React + TypeScript + Vite
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── context/
│   │   └── config.ts
│   └── package.json
└── sdk/             # JavaScript SDK
    ├── sparkaph-sdk.js
    └── README.md
```

## 🔑 Основные Фичи

### 1. Типы Приложений

**HOSTED:**
- Статические HTML/CSS/JS файлы
- Хостинг на Sparkaph серверах
- Загрузка через ZIP
- Доступ по `sparkaph.com/appname`

**EXTERNAL:**
- Работает на вашем сервере
- API интеграция (как Telegram Bot)
- Webhook или Long Polling
- Собственный URL

### 2. Система Уведомлений

- Real-time через Socket.io
- 12 типов уведомлений
- Browser notifications
- Счётчик непрочитанных

### 3. Социальные Функции

- Приватные чаты
- Групповые чаты
- Публичные группы с @handle
- Подписки и друзья
- Блокировка пользователей

### 4. Платежи

- Внутренняя валюта Sparks
- Покупка приложений
- Вывод средств разработчикам
- История транзакций

## 🛡 Безопасность

- JWT аутентификация
- Rate limiting
- CORS настройки
- Валидация с Zod
- Хеширование паролей (bcrypt)
- OAuth 2.0

## 📊 База Данных

Prisma ORM с PostgreSQL:
- Users
- Apps
- Deployments
- Messages
- Chats
- Notifications
- Payments
- Friends/Followers

## 🤝 Вклад

1. Fork репозиторий
2. Создайте feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit изменения (`git commit -m 'Add AmazingFeature'`)
4. Push в branch (`git push origin feature/AmazingFeature`)
5. Откройте Pull Request

## 📝 Лицензия

MIT License - см. [LICENSE](LICENSE)

## 👥 Авторы

- Stexiel - Initial work

## 🙏 Благодарности

- React
- Express
- Prisma
- Socket.io
- Tailwind CSS
- Google Gemini AI

## 📞 Поддержка

- Email: support@sparkaph.com
- Telegram: @sparkaph
- Discord: [Join Server](https://discord.gg/sparkaph)

---

Made with ❤️ by Sparkaph Team
