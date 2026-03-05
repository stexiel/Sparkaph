# Sparkaph Unity Client

Unity client for Sparkaph multiplayer territory game.

## Requirements

- Unity 2022.3 LTS or later
- .NET Standard 2.1

## Dependencies

### Required Packages

Install these via Unity Package Manager or manually:

1. **NativeWebSocket** (for WebSocket connection)
   ```
   https://github.com/endel/NativeWebSocket.git#upm
   ```

2. **MessagePack for C#** (for binary serialization)
   - Download from: https://github.com/neuecc/MessagePack-CSharp/releases
   - Add DLLs to `Assets/Plugins/`

3. **TextMeshPro** (included in Unity)

## Project Structure

```
Assets/
├── Scripts/
│   ├── Network/
│   │   ├── NetworkManager.cs      # WebSocket client & connection
│   │   └── Protocol.cs            # Message definitions
│   ├── Game/
│   │   ├── GameManager.cs         # Main game controller
│   │   ├── PlayerController.cs    # Player movement & input
│   │   └── TerritoryRenderer.cs   # Territory visualization
│   ├── UI/
│   │   └── UIManager.cs           # UI controller
│   └── Utils/
│       ├── ObjectPool.cs          # Object pooling
│       └── MobileInput.cs         # Touch controls
├── Scenes/
│   ├── MainMenu.unity             # Main menu scene
│   └── Game.unity                 # Game scene
├── Prefabs/
│   ├── Player.prefab              # Player prefab
│   └── NetworkManager.prefab      # Network manager
└── Resources/
    └── GameConfig.asset           # Game configuration
```

## Setup Instructions

### 1. Install Dependencies

#### NativeWebSocket
```bash
# Via Package Manager
Window > Package Manager > + > Add package from git URL
https://github.com/endel/NativeWebSocket.git#upm
```

#### MessagePack
1. Download from https://github.com/neuecc/MessagePack-CSharp/releases
2. Extract `MessagePack.dll` and `MessagePack.Annotations.dll`
3. Copy to `Assets/Plugins/MessagePack/`

### 2. Configure Server URL

Edit `NetworkManager` component:
- **Development:** `ws://localhost:8080/ws`
- **Production:** `wss://your-server.com/ws`

### 3. Build Settings

#### iOS
- Minimum iOS Version: 12.0
- Architecture: ARM64
- Strip Engine Code: Disabled (for MessagePack)

#### Android
- Minimum API Level: 21 (Android 5.0)
- Target API Level: 33 (Android 13)
- Scripting Backend: IL2CPP
- ARM64: Enabled

### 4. Player Settings

- **Company Name:** Stexiel Corporation
- **Product Name:** Sparkaph
- **Bundle Identifier:** com.stexiel.sparkaph
- **Version:** 1.0.0

## How to Run

### In Unity Editor

1. Open project in Unity 2022.3 LTS
2. Open scene: `Assets/Scenes/MainMenu.unity`
3. Make sure backend server is running (`docker-compose up`)
4. Press Play
5. Enter username and select game mode

### Build for Mobile

#### iOS
```
File > Build Settings
- Platform: iOS
- Switch Platform
- Build
```

Then open in Xcode and run on device.

#### Android
```
File > Build Settings
- Platform: Android
- Switch Platform
- Build and Run
```

## Testing

### Local Testing (Editor)

1. Start backend server:
   ```bash
   cd ../server
   docker-compose up
   ```

2. Open Unity project
3. Press Play
4. Should auto-connect to `ws://localhost:8080/ws`

### Multiplayer Testing

1. Build for mobile device
2. Run on device
3. Run another instance in Unity Editor
4. Both should connect and see each other

## Controls

### Desktop (Editor)
- **WASD / Arrow Keys:** Move player
- **Mouse:** Alternative movement (click and drag)

### Mobile
- **Touch & Drag:** Move player (virtual joystick)
- **Swipe:** Quick direction change

## Network Protocol

Client communicates with Go backend via WebSocket using MessagePack binary protocol.

### Message Flow

```
Client                          Server
  |                               |
  |--- Connect Message ---------->|
  |<-- Welcome Message ------------|
  |                               |
  |--- Input Message (60Hz) ----->|
  |<-- Game State (60Hz) ---------|
  |                               |
  |<-- Match Start ---------------|
  |<-- Match End -----------------|
```

### Message Types

- **Connect:** Initial connection with player info
- **Input:** Player movement direction
- **Ping:** Latency measurement
- **GameState:** Full game state update
- **MatchStart:** Match begins
- **MatchEnd:** Match results

## Performance Optimization

### Network
- Binary protocol (MessagePack) for minimal bandwidth
- Delta compression for game state
- Client-side prediction for smooth movement
- Interpolation for remote players

### Rendering
- Object pooling for players/effects
- Mesh batching for territory
- LOD for distant objects
- Occlusion culling

### Mobile
- Target 60 FPS on mid-range devices
- Adaptive quality settings
- Battery optimization mode

## Troubleshooting

### Cannot Connect to Server

1. Check server is running: `curl http://localhost:8080/health`
2. Check firewall settings
3. Verify WebSocket URL in NetworkManager
4. Check Unity console for errors

### MessagePack Errors

1. Ensure MessagePack DLLs are in `Assets/Plugins/`
2. Check .NET compatibility level: `.NET Standard 2.1`
3. Rebuild project

### Build Errors (iOS/Android)

1. Check minimum OS versions
2. Enable IL2CPP for ARM64
3. Strip Engine Code: Disabled
4. Check bundle identifier

## Next Steps

1. ✅ Network layer complete
2. ✅ Player controller complete
3. ✅ Territory rendering complete
4. ✅ UI system complete
5. ⬜ Add visual effects (particles, animations)
6. ⬜ Add sound effects
7. ⬜ Optimize for mobile
8. ⬜ Add analytics
9. ⬜ Beta testing

## Support

- Documentation: `/docs`
- Backend: `../server`
- Issues: GitHub Issues
