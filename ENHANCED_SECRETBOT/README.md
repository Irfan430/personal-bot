# 🤖 Enhanced SecretBot v2.0.0

<div align="center">

![Enhanced SecretBot Banner](https://via.placeholder.com/800x200/2C3E50/ECF0F1?text=Enhanced+SecretBot+v2.0.0)

[![Node.js](https://img.shields.io/badge/Node.js-18.x+-green.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/Version-2.0.0-brightgreen.svg)](package.json)
[![Security](https://img.shields.io/badge/Security-Enhanced-red.svg)](src/core/SecurityManager.js)
[![AI Powered](https://img.shields.io/badge/AI-GPT--4-purple.svg)](src/commands/ai.js)

**A modern, secure, and feature-rich Facebook Messenger bot with advanced AI capabilities**

[🚀 Quick Start](#-quick-start) • [📚 Documentation](#-documentation) • [🎯 Features](#-features) • [💡 Commands](#-commands) • [🛡️ Security](#️-security)

</div>

## 🎯 Features

### 🔥 What's New in v2.0.0

- **🤖 Advanced AI Integration**: OpenAI GPT-4 with conversation memory
- **🛡️ Enhanced Security**: Rate limiting, input validation, and threat detection
- **⚡ Better Performance**: Redis caching, connection pooling, and optimized database queries
- **🏗️ Modern Architecture**: ES6 modules, TypeScript support, and modular design
- **📊 Real-time Analytics**: Comprehensive logging and monitoring
- **🔧 Easy Configuration**: Environment variables with validation
- **🐳 Docker Support**: Containerized deployment
- **🔄 Auto-restart**: Graceful error handling and recovery

### 📋 Core Features

#### 🤖 AI & Automation
- **Multi-model AI Support**: GPT-4, GPT-3.5 Turbo, and more
- **Conversation Memory**: Context-aware responses across sessions
- **Smart Auto-responses**: Intelligent message processing
- **Custom AI Prompts**: Personalized AI behavior

#### 🛡️ Security & Privacy
- **Rate Limiting**: Advanced protection against spam and abuse
- **Input Validation**: Comprehensive message sanitization
- **Admin Controls**: Role-based permissions and access control
- **Audit Logging**: Complete activity tracking
- **Whitelist/Blacklist**: User and thread management

#### 🎨 User Experience
- **Rich Message Formatting**: Beautiful, interactive responses
- **Reaction Support**: Emoji reactions and interactive elements
- **Multi-language Support**: English and Vietnamese (extensible)
- **Custom Prefixes**: Personalized command prefixes per group
- **Help System**: Interactive command documentation

#### 🔧 Administration
- **Web Dashboard**: Real-time monitoring and control
- **Database Management**: MongoDB with Redis caching
- **Configuration Management**: Dynamic settings with validation
- **Health Monitoring**: System status and performance metrics
- **Backup & Recovery**: Automated data protection

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18.x or higher
- **MongoDB** 4.4 or higher
- **Redis** (optional, for caching)
- **Facebook Account** (secondary recommended)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/enhanced-secretbot/enhanced-secretbot.git
   cd enhanced-secretbot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Run setup script**
   ```bash
   npm run setup
   ```

5. **Start the bot**
   ```bash
   npm start
   ```

### 🐳 Docker Deployment

```bash
# Build the image
docker build -t enhanced-secretbot .

# Run with Docker Compose
docker-compose up -d
```

### ⚡ Quick Configuration

```env
# Essential Configuration
FACEBOOK_EMAIL=your_facebook_email
FACEBOOK_PASSWORD=your_facebook_password
MONGODB_URI=mongodb://localhost:27017/enhanced_secretbot
ADMIN_IDS=your_facebook_id

# AI Configuration
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4

# Security
JWT_SECRET=your_jwt_secret_32_chars_min
ENCRYPTION_KEY=your_encryption_key_32_chars_min
```

## 💡 Commands

### 🤖 AI Commands

#### `ai` - Advanced AI Chat
```
ai <message>           - Chat with AI
ai clear              - Clear conversation history
ai model <model>      - Switch AI model (gpt-4, gpt-3.5-turbo)
ai system <prompt>    - Set custom system prompt
ai help              - Show AI command help
```

**Features:**
- 🧠 Conversation memory across sessions
- 🔄 Multiple AI models support
- 🎭 Custom system prompts
- 📝 Context-aware responses
- ⚡ Typing indicators

### 🛠️ Utility Commands

#### `help` - Interactive Help System
```
help                  - Show all commands
help <command>        - Show specific command help
help category <cat>   - Show commands by category
```

#### `info` - System Information
```
info                  - Show bot information
info stats            - Show usage statistics
info health           - Show system health
```

#### `admin` - Administration
```
admin ban <user>      - Ban a user
admin unban <user>    - Unban a user
admin whitelist <id>  - Add to whitelist
admin config <key>    - Show configuration
admin restart         - Restart the bot
```

### 🎮 Fun Commands

#### `meme` - Meme Generator
```
meme                  - Random meme
meme <text>          - Generate meme with text
meme templates       - Show available templates
```

#### `quote` - Inspirational Quotes
```
quote                 - Random quote
quote <category>      - Quote by category
quote daily          - Daily quote
```

### 📊 Analytics Commands

#### `stats` - Usage Statistics
```
stats                 - Show bot statistics
stats user            - Show user statistics
stats commands        - Show command usage
```

## 🏗️ Architecture

### Project Structure

```
enhanced-secretbot/
├── src/
│   ├── api/                 # External API integrations
│   ├── commands/            # Command modules
│   ├── core/               # Core bot functionality
│   ├── database/           # Database management
│   ├── events/             # Event handlers
│   ├── middleware/         # Middleware functions
│   ├── utils/              # Utility functions
│   └── index.js            # Main entry point
├── config/                 # Configuration files
├── logs/                   # Log files
├── scripts/               # Utility scripts
├── tests/                 # Test files
├── docker-compose.yml     # Docker configuration
├── Dockerfile             # Docker image
└── package.json           # Dependencies
```

### Core Components

#### 🧠 BotManager
- Central orchestration of all bot components
- Event handling and message routing
- Health monitoring and statistics

#### 🔐 SecurityManager
- Rate limiting and spam protection
- Input validation and sanitization
- Admin controls and permissions

#### 💾 DatabaseManager
- MongoDB integration with connection pooling
- Redis caching for performance
- Automated backup and recovery

#### 🎯 CommandManager
- Dynamic command loading and execution
- Permission and role management
- Cooldown and rate limiting

## 🛡️ Security

### 🔒 Security Features

- **Input Validation**: All user inputs are sanitized and validated
- **Rate Limiting**: Configurable limits to prevent abuse
- **Authentication**: Secure admin authentication with JWT
- **Encryption**: Sensitive data encryption at rest
- **Audit Logging**: Complete activity tracking
- **Permission System**: Role-based access control

### 🚨 Security Best Practices

1. **Use Secondary Facebook Account**: Never use your main Facebook account
2. **Strong Passwords**: Use complex passwords and 2FA
3. **Regular Updates**: Keep dependencies updated
4. **Monitor Logs**: Regularly check security logs
5. **Backup Data**: Maintain regular backups

### 🔐 Environment Security

```env
# Security Configuration
JWT_SECRET=your_jwt_secret_32_chars_minimum
ENCRYPTION_KEY=your_encryption_key_32_chars_minimum
SESSION_SECRET=your_session_secret_32_chars_minimum

# Rate Limiting
RATE_LIMIT_WINDOW=15      # Minutes
RATE_LIMIT_MAX=100        # Requests per window

# Security Features
WHITELIST_MODE=false      # Enable whitelist mode
ADMIN_ONLY_MODE=false     # Admin-only mode
```

## 📊 Monitoring & Analytics

### 🔍 Real-time Monitoring

- **Live Dashboard**: Web-based monitoring interface
- **Performance Metrics**: Response times, memory usage, CPU usage
- **Error Tracking**: Comprehensive error logging and alerting
- **Usage Analytics**: Command usage, user activity, trends

### 📈 Analytics Dashboard

- **User Statistics**: Active users, message counts, engagement
- **Command Analytics**: Most used commands, success rates
- **Performance Monitoring**: System health, database performance
- **Security Metrics**: Rate limiting events, security violations

## 🔧 Configuration

### 🎛️ Configuration Options

#### Bot Configuration
```env
BOT_NAME=Enhanced SecretBot
BOT_PREFIX=>
BOT_LANGUAGE=en
```

#### Database Configuration
```env
DB_TYPE=mongodb
MONGODB_URI=mongodb://localhost:27017/enhanced_secretbot
REDIS_URL=redis://localhost:6379
```

#### AI Configuration
```env
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4
```

#### Security Configuration
```env
WHITELIST_MODE=false
ADMIN_ONLY_MODE=false
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
```

## 🤝 Contributing

We welcome contributions! Please read our [Contributing Guidelines](CONTRIBUTING.md) for details.

### 📋 Development Setup

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Install dependencies**
   ```bash
   npm install
   ```
4. **Run tests**
   ```bash
   npm test
   ```
5. **Commit changes**
   ```bash
   git commit -m 'Add amazing feature'
   ```
6. **Push to branch**
   ```bash
   git push origin feature/amazing-feature
   ```
7. **Open a Pull Request**

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Original SecretBot inspiration
- OpenAI for GPT API
- Facebook for Messenger API
- MongoDB and Redis teams
- All contributors and users

## 🔗 Links

- **Documentation**: [docs.enhanced-secretbot.com](https://docs.enhanced-secretbot.com)
- **Support**: [support@enhanced-secretbot.com](mailto:support@enhanced-secretbot.com)
- **Discord**: [Join our Discord](https://discord.gg/enhanced-secretbot)
- **GitHub**: [GitHub Repository](https://github.com/enhanced-secretbot/enhanced-secretbot)

## 📞 Support

- 📧 **Email**: support@enhanced-secretbot.com
- 💬 **Discord**: [Join our Discord server](https://discord.gg/enhanced-secretbot)
- 📖 **Documentation**: [docs.enhanced-secretbot.com](https://docs.enhanced-secretbot.com)
- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/enhanced-secretbot/enhanced-secretbot/issues)

---

<div align="center">

**Made with ❤️ by the Enhanced SecretBot Team**

⭐ **Star this repository if you find it helpful!** ⭐

</div>