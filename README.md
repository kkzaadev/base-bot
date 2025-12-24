# Base Bot

Base Bot is a high-performance, modular WhatsApp bot engineered for speed, scalability, and maintainability. Built on top of the robust Baileys library, it is designed to handle heavy loads with minimal resource consumption. This project prioritizes clean code architecture and efficient data handling, making it an ideal foundation for both simple and complex WhatsApp automation projects.

## Design Philosophy & Performance

This bot is not just another script; it is a framework designed with performance as a first-class citizen.

- **Speed & Efficiency**: The core is optimized for low latency. Event handlers are streamlined to ensure messages are processed in milliseconds. Unnecessary overhead has been stripped away.
- **Advanced Caching System**: We implement a sophisticated in-memory caching layer for group metadata and user data. This significantly reduces the need for repeated network requests to WhatsApp servers, resulting in faster response times and lower bandwidth usage.
- **Memory Management**: The application is built to run for extended periods without memory leaks. Resource cleanup and garbage collection strategies are implemented in the caching logic.
- **Fail-Safe Architecture**: The bot includes automatic reconnection logic and error boundary handling. If a plugin crashes, it does not bring down the entire bot.

## detailed Architecture

The codebase follows a strict separation of concerns to ensure maintainability:

### 1. Core (`src/Core`)

This is the heart of the application. It handles the raw connection to WhatsApp, session management, and the initial event loop.

- **Client.js**: Manages the socket connection, credential updates, and global event listeners.
- **BaseBot.js**: Abstract base class defining the standard bot behaviors.
- **Startup.js**: Handles system initialization checks and banner display.

### 2. Library (`src/Lib`)

Contains the business logic and specialized classes that power the bot's features.

- **Group.js**: A powerful wrapper for Group operations. It integrates seamlessly with the cache system to provide methods like `promote`, `demote`, and `kick` with minimal API calls.
- **Serialize.js**: Normalizes the complex raw data from WhatsApp into a simplified, developer-friendly object structure.
- **Plugins.js**: A dynamic loader that scans and hot-reloads commands without restarting the bot.
- **Handler.js**: A priority-based message processor that routes incoming messages to the correct plugins.

### 3. Utilities (`src/Utils`)

Helper functions and tools used throughout the application.

- **Logger.js**: A custom logging solution that provides grouped, color-coded, and timestamped logs for better debugging.
- **Debugging.js**: Tools for inspecting cache states and memory usage during development.

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- NPM or Yarn

### Installation

1.  **Clone the repository**
2.  **Install dependencies**:
    ```bash
    npm install
    ```
3.  **Configuration**:
    Open `config.js` and customize your settings. valid settings include your bot name, owner number, and session path.

### Running the Bot

To start the bot in production mode:

```bash
npm start
```

## Development Guide

### Creating Plugins

Plugins are the primary way to add features. Located in `src/Plugins`, each plugin is a standalone module.

**Example Structure:**

```javascript
export default {
	// Array of commands that trigger this plugin
	Commands: ['ping', 'speed'],

	// Access control flags
	OnlyOwner: false,
	OnlyGroup: false,

	// Main execution function
	handle: async (m, { sock }) => {
		const start = Date.now()
		await m.reply('Pong!')
		const end = Date.now()
		await m.reply(`Latency: ${end - start}ms`)
	}
}
```

### Understanding Handlers

Handlers live in `src/Handlers` and are useful for logic that must run on _every_ message, such as anti-spam, auto-downloaders, or logging.

**Example Handler:**

```javascript
export default {
	priority: 10, // Lower numbers run first
	process: async (sock, m) => {
		// Return false to stop processing other handlers asking the chain to break
		if (m.key.remoteJid.includes('status')) return false
		return true
	}
}
```

## Troubleshooting

- **Session Issues**: If the bot fails to connect loop, try deleting the `session` folder and re-scanning the QR code.
- **Cache Misses**: If group names are outdated, use the debug tools to flush the cache.
- **Update Errors**: Ensure `node_modules` are up to date by running `npm update`.

## License

Private Script. Unauthorized distribution is prohibited.
