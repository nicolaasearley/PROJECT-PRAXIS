# Project Praxis

An adaptive training engine for hybrid athletes built with Expo React Native and TypeScript.

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm or yarn
- Expo CLI (installed globally or via npx)

### Installation

```bash
npm install
```

### Running the App

```bash
# Start the development server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android

# Run on Web
npm run web
```

## Project Structure

```
praxis-app/
├── app/                    # Expo Router app directory
│   ├── _layout.tsx        # Root layout
│   └── index.tsx          # Home screen
├── stores/                 # Zustand state management
│   └── useAppStore.ts     # Main app store
├── assets/                 # Images, fonts, etc.
└── ...
```

## Scripts

- `npm start` - Start Expo development server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors automatically
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting

## Tech Stack

- **Expo** - React Native framework
- **TypeScript** - Type safety
- **Expo Router** - File-based routing
- **Zustand** - State management
- **React Navigation** - Navigation library (installed, ready to use)
- **ESLint** - Code linting
- **Prettier** - Code formatting

## Development

This project uses:
- Expo Router for navigation (file-based routing in `/app` folder)
- Zustand for global state management (stores in `/stores` folder)
- ESLint + Prettier for code quality

Operational runbooks for builds, releases, and OTA updates live in [`docs/ops.md`](docs/ops.md).

## Next Steps

1. Add more screens in the `/app` directory
2. Create additional Zustand stores in `/stores` directory
3. Set up React Navigation if needed for complex navigation patterns
