# Sparkaph

Sparkaph is a modern messenger featuring a glassmorphism design. Built with React, TypeScript, and Vite, it provides a seamless real-time messaging experience with a beautiful, translucent interface inspired by Apple's design trends.

## Features

- 🎨 **iOS Glassmorphism Design** - Modern, translucent interface with blur effects and vibrant colors
- 💬 **Real-time Messaging** - Instant messaging with Socket.io
- 📞 **Voice & Video Calls** - Audio and video calling capabilities
- 🎤 **Voice Messages** - Record and send voice messages
- 😊 **Emoji & Sticker Support** - Rich messaging with emojis and stickers
- 📁 **File Sharing** - Share images and videos
- 👥 **Group Chats** - Create and manage group conversations
- 🎭 **User Profiles** - Customizable user profiles with avatars
- 🔔 **Notifications** - Desktop notifications for new messages
- 🌙 **Dark Mode** - Optimized dark theme with iOS color palette

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS v4 with custom iOS design tokens
- **Real-time**: Socket.io-client
- **Icons**: Lucide React
- **Media**: simple-peer for WebRTC calls, wavesurfer.js for audio
- **State Management**: React hooks

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install
```

### Development

```bash
# Start development server
npm run dev
```

The application will be available at `http://localhost:5173`

### Build

```bash
# Build for production
npm run build
```

### Preview

```bash
# Preview production build
npm run preview
```

## Design System

Sparkaph uses a custom iOS-inspired design system with:

- **Colors**: Apple's system colors (blue, green, indigo, orange, pink, purple, etc.)
- **Typography**: iOS system fonts (San Francisco, -apple-system)
- **Glassmorphism**: Frosted glass effects with backdrop blur
- **Border Radius**: iOS-standard rounded corners
- **Shadows**: Soft, diffuse shadows for depth

## License

MIT
