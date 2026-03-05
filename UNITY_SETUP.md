# Unity Client Setup Guide

## Полная инструкция по настройке Unity клиента

### Шаг 1: Установка Unity

1. Скачай **Unity Hub**: https://unity.com/download
2. Установи **Unity 2022.3 LTS**
3. Добавь модули:
   - ✅ iOS Build Support
   - ✅ Android Build Support
   - ✅ WebGL Build Support (опционально)

---

### Шаг 2: Открытие проекта

```bash
# 1. Открой Unity Hub
# 2. Нажми "Add" → "Add project from disk"
# 3. Выбери папку: c:/Users/Aser/Downloads/CATEC/Stexiel Corparation/Sparkaph/client
# 4. Открой проект
```

---

### Шаг 3: Установка зависимостей

#### 3.1 NativeWebSocket (WebSocket клиент)

```
1. Window → Package Manager
2. Нажми "+" → Add package from git URL
3. Вставь: https://github.com/endel/NativeWebSocket.git#upm
4. Нажми Add
```

#### 3.2 MessagePack (Сериализация)

**Вариант A: Через NuGet (рекомендуется)**

1. Скачай NuGetForUnity: https://github.com/GlitchEnzo/NuGetForUnity/releases
2. Импортируй в Unity
3. `NuGet → Manage NuGet Packages`
4. Найди "MessagePack"
5. Install

**Вариант B: Вручную**

1. Скачай: https://www.nuget.org/packages/MessagePack/
2. Распакуй `.nupkg` (это zip архив)
3. Найди DLL в `lib/netstandard2.0/`
4. Скопируй в `Assets/Plugins/MessagePack/`

Нужные DLL:
- `MessagePack.dll`
- `MessagePack.Annotations.dll`
- `System.Runtime.CompilerServices.Unsafe.dll`
- `System.Buffers.dll`
- `System.Memory.dll`

#### 3.3 TextMeshPro (UI)

```
1. Window → TextMeshPro → Import TMP Essential Resources
2. Нажми Import
```

---

### Шаг 4: Создание сцен

#### 4.1 Main Menu Scene

```
1. File → New Scene
2. Сохрани как: Assets/Scenes/MainMenu.unity
3. Создай UI:
   - Canvas
   - EventSystem
   - Panel (Main Menu)
   - Buttons (Solo, Duo, Squad)
   - InputField (Username)
```

#### 4.2 Game Scene

```
1. File → New Scene
2. Сохрани как: Assets/Scenes/Game.unity
3. Создай:
   - Main Camera
   - EventSystem
   - Canvas (Game HUD)
   - Empty GameObject → NetworkManager
   - Empty GameObject → GameManager
```

---

### Шаг 5: Настройка префабов

#### 5.1 Player Prefab

```
1. Create → 2D Object → Sprite → Circle
2. Rename: Player
3. Add Component → PlayerController (скрипт уже создан)
4. Add Component → Trail Renderer
5. Настрой Trail Renderer:
   - Width: 0.2
   - Time: 2
   - Material: Default-Particle
6. Drag в Assets/Prefabs/Player.prefab
```

#### 5.2 NetworkManager Prefab

```
1. Create Empty GameObject → NetworkManager
2. Add Component → NetworkManager (скрипт)
3. Настрой:
   - Server URL: ws://localhost:8080/ws
   - Auto Connect: true
4. Drag в Assets/Prefabs/NetworkManager.prefab
```

---

### Шаг 6: Настройка сцен

#### MainMenu Scene

```
1. Открой MainMenu.unity
2. Drag NetworkManager prefab в сцену
3. Создай UI:

Canvas
├── MainMenuPanel
│   ├── Title (TextMeshPro)
│   ├── UsernameInput (TMP_InputField)
│   ├── SoloButton (Button)
│   ├── DuoButton (Button)
│   └── SquadButton (Button)
└── MatchmakingPanel (disabled)
    ├── StatusText (TextMeshPro)
    └── CancelButton (Button)

4. Add Component → UIManager
5. Привяжи все UI элементы к UIManager
```

#### Game Scene

```
1. Открой Game.unity
2. Drag NetworkManager prefab в сцену
3. Create Empty → GameManager
4. Add Component → GameManager
5. Настрой GameManager:
   - Player Prefab: Assets/Prefabs/Player.prefab
   - Player Colors: (добавь 20 цветов)
6. Создай UI:

Canvas
├── GameHUD
│   ├── TerritoryText (TextMeshPro)
│   ├── KillsText (TextMeshPro)
│   ├── TimeText (TextMeshPro)
│   └── PingText (TextMeshPro)
└── ResultsPanel (disabled)
    ├── RankText (TextMeshPro)
    ├── TerritoryResultText (TextMeshPro)
    └── PlayAgainButton (Button)

7. Add Component → UIManager
8. Привяжи UI элементы
```

---

### Шаг 7: Build Settings

```
File → Build Settings

Add Scenes:
1. MainMenu.unity
2. Game.unity

Platform: Android или iOS
```

#### Android Settings

```
Player Settings:
- Company Name: Stexiel Corporation
- Product Name: Sparkaph
- Package Name: com.stexiel.sparkaph
- Version: 1.0.0
- Minimum API Level: 21
- Target API Level: 33
- Scripting Backend: IL2CPP
- ARM64: ✅
```

#### iOS Settings

```
Player Settings:
- Bundle Identifier: com.stexiel.sparkaph
- Minimum iOS Version: 12.0
- Architecture: ARM64
- Camera Usage Description: "Not used"
- Microphone Usage Description: "Not used"
```

---

### Шаг 8: Тестирование

#### Локальный тест

```bash
# 1. Запусти backend
cd ../server
docker-compose up

# 2. В Unity нажми Play
# 3. Введи username
# 4. Нажми Solo
# 5. Должен подключиться к серверу
```

#### Проверка подключения

```
Unity Console должен показать:
[Network] Connecting to ws://localhost:8080/ws...
[Network] Connected!
[Network] Welcome! PlayerId: xxx-xxx-xxx
[UI] Connected to server
```

---

### Шаг 9: Билд для мобильных

#### Android

```
1. File → Build Settings → Android
2. Switch Platform
3. Build and Run
4. Выбери папку для APK
5. Установи на устройство
```

#### iOS

```
1. File → Build Settings → iOS
2. Switch Platform
3. Build
4. Открой в Xcode
5. Подключи iPhone
6. Run
```

---

## Структура проекта (финальная)

```
client/
├── Assets/
│   ├── Scenes/
│   │   ├── MainMenu.unity          ✅ Создано
│   │   └── Game.unity              ✅ Создано
│   ├── Scripts/
│   │   ├── Network/
│   │   │   ├── NetworkManager.cs   ✅ Создано
│   │   │   └── Protocol.cs         ✅ Создано
│   │   ├── Game/
│   │   │   ├── GameManager.cs      ✅ Создано
│   │   │   ├── PlayerController.cs ✅ Создано
│   │   │   └── TerritoryRenderer.cs ✅ Создано
│   │   ├── UI/
│   │   │   └── UIManager.cs        ✅ Создано
│   │   └── Utils/
│   │       ├── ObjectPool.cs       ✅ Создано
│   │       └── MobileInput.cs      ✅ Создано
│   ├── Prefabs/
│   │   ├── Player.prefab           ⬜ Создай вручную
│   │   └── NetworkManager.prefab   ⬜ Создай вручную
│   ├── Plugins/
│   │   └── MessagePack/            ⬜ Установи DLL
│   └── Resources/
├── Packages/
│   └── manifest.json               ✅ Создано
└── ProjectSettings/
    └── ProjectVersion.txt          ✅ Создано
```

---

## Troubleshooting

### Ошибка: "MessagePack not found"

```
Решение:
1. Скачай MessagePack DLL
2. Положи в Assets/Plugins/MessagePack/
3. Restart Unity
```

### Ошибка: "NativeWebSocket not found"

```
Решение:
1. Window → Package Manager
2. Проверь что NativeWebSocket установлен
3. Если нет - добавь через git URL
```

### Не подключается к серверу

```
Проверь:
1. Сервер запущен: curl http://localhost:8080/health
2. URL правильный: ws://localhost:8080/ws
3. Firewall не блокирует
4. Unity Console для ошибок
```

### Build ошибки (IL2CPP)

```
Решение:
1. Player Settings → Scripting Backend → IL2CPP
2. Player Settings → Strip Engine Code → Disabled
3. Rebuild
```

---

## Следующие шаги

После настройки Unity:

1. ✅ Запусти backend: `docker-compose up`
2. ✅ Открой Unity проект
3. ✅ Нажми Play
4. ✅ Протестируй подключение
5. ⬜ Добавь визуальные эффекты
6. ⬜ Добавь звуки
7. ⬜ Оптимизируй для мобильных
8. ⬜ Beta тестирование
9. ⬜ Релиз!

---

## Полезные ссылки

- Unity Documentation: https://docs.unity3d.com/
- NativeWebSocket: https://github.com/endel/NativeWebSocket
- MessagePack: https://github.com/neuecc/MessagePack-CSharp
- Backend README: ../server/README.md
