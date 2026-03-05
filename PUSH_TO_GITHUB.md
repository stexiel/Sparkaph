# Push Sparkaph to GitHub

## Команды для выполнения

```bash
# 1. Перейди в папку проекта
cd "c:/Users/Aser/Downloads/CATEC/Stexiel Corparation/Sparkaph"

# 2. Инициализируй Git (если еще не сделано)
git init

# 3. Добавь все файлы
git add .

# 4. Создай первый коммит
git commit -m "Initial commit: Production-ready Sparkaph backend

- Authoritative game server (Go)
- Matchmaking system (Solo/Duo/Squad/Arena/Infinite)
- Territory system with flood fill
- PostgreSQL schema with triggers
- Redis integration
- Docker deployment
- Scales from 10 to 10M MAU
- Complete documentation"

# 5. Добавь remote репозиторий
git remote add origin https://github.com/stexiel/Sparkaph.git

# 6. Push в GitHub
git push -u origin main

# Если main не работает, попробуй master:
# git branch -M main
# git push -u origin main
```

## Если репозиторий уже существует на GitHub

```bash
# Если нужно force push (ОСТОРОЖНО - перезапишет историю)
git push -u origin main --force
```

## Альтернатива: Через GitHub Desktop

1. Открой GitHub Desktop
2. File → Add Local Repository
3. Выбери папку: `c:/Users/Aser/Downloads/CATEC/Stexiel Corparation/Sparkaph`
4. Commit to main
5. Push origin

## Проверка после push

```bash
# Открой в браузере
https://github.com/stexiel/Sparkaph

# Должны увидеть:
- README.md
- server/
- docker-compose.yml
- ARCHITECTURE.md
- и все остальные файлы
```

## Что будет запушено

```
Sparkaph/
├── .gitignore
├── README.md
├── ARCHITECTURE.md
├── GETTING_STARTED.md
├── SUMMARY.md
├── docker-compose.yml
└── server/
    ├── go.mod
    ├── Dockerfile
    ├── .env.example
    ├── pkg/
    ├── cmd/
    └── migrations/
```

**Всего:** ~3,000+ строк production-ready кода
