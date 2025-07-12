#!/usr/bin/env node

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { createInterface } from 'readline';
import crypto from 'crypto';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const rl = createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function setup() {
  console.log(chalk.cyan(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║   🤖 Enhanced SecretBot Setup Wizard                        ║
║                                                              ║
║   This wizard will help you configure your bot              ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
`));

  try {
    // Check if .env already exists
    const envPath = join(__dirname, '../.env');
    if (existsSync(envPath)) {
      console.log(chalk.yellow('⚠️  .env file already exists!'));
      const overwrite = await question('Do you want to overwrite it? (y/N): ');
      if (overwrite.toLowerCase() !== 'y') {
        console.log(chalk.blue('Setup cancelled.'));
        process.exit(0);
      }
    }

    console.log(chalk.blue('\n📋 Let\'s gather the required information...\n'));

    // Bot Configuration
    console.log(chalk.green('🤖 Bot Configuration'));
    const botName = await question('Bot name (Enhanced SecretBot): ') || 'Enhanced SecretBot';
    const botPrefix = await question('Bot prefix (>): ') || '>';
    const botLanguage = await question('Bot language (en/vi) [en]: ') || 'en';

    // Facebook Configuration
    console.log(chalk.green('\n📱 Facebook Configuration'));
    console.log(chalk.yellow('⚠️  Use a secondary Facebook account for safety!'));
    const facebookEmail = await question('Facebook email: ');
    const facebookPassword = await question('Facebook password: ');
    const facebook2FA = await question('2FA secret (optional): ');

    // Database Configuration
    console.log(chalk.green('\n🗄️  Database Configuration'));
    const mongoUri = await question('MongoDB URI (mongodb://localhost:27017/enhanced_secretbot): ') || 'mongodb://localhost:27017/enhanced_secretbot';
    const redisUrl = await question('Redis URL (redis://localhost:6379) [optional]: ') || '';

    // Admin Configuration
    console.log(chalk.green('\n👑 Admin Configuration'));
    const adminIds = await question('Admin Facebook IDs (comma-separated): ');

    // AI Configuration
    console.log(chalk.green('\n🧠 AI Configuration'));
    const openaiApiKey = await question('OpenAI API Key (optional): ');
    const openaiModel = await question('OpenAI Model (gpt-3.5-turbo): ') || 'gpt-3.5-turbo';

    // Email Configuration
    console.log(chalk.green('\n📧 Email Configuration (optional)'));
    const gmailEmail = await question('Gmail email: ');
    const gmailClientId = await question('Gmail client ID: ');
    const gmailClientSecret = await question('Gmail client secret: ');
    const gmailRefreshToken = await question('Gmail refresh token: ');

    // Generate security keys
    console.log(chalk.green('\n🔐 Generating security keys...'));
    const jwtSecret = crypto.randomBytes(32).toString('hex');
    const encryptionKey = crypto.randomBytes(32).toString('hex');
    const sessionSecret = crypto.randomBytes(32).toString('hex');

    // Create .env content
    const envContent = `# Bot Configuration
BOT_NAME=${botName}
BOT_PREFIX=${botPrefix}
BOT_LANGUAGE=${botLanguage}
NODE_ENV=development

# Facebook Account (Use a secondary account for safety)
FACEBOOK_EMAIL=${facebookEmail}
FACEBOOK_PASSWORD=${facebookPassword}
FACEBOOK_2FA_SECRET=${facebook2FA}

# Database Configuration
DB_TYPE=mongodb
MONGODB_URI=${mongoUri}
REDIS_URL=${redisUrl}

# Security (Auto-generated)
JWT_SECRET=${jwtSecret}
ENCRYPTION_KEY=${encryptionKey}
SESSION_SECRET=${sessionSecret}

# Email Configuration (Gmail)
GMAIL_EMAIL=${gmailEmail}
GMAIL_CLIENT_ID=${gmailClientId}
GMAIL_CLIENT_SECRET=${gmailClientSecret}
GMAIL_REFRESH_TOKEN=${gmailRefreshToken}

# OpenAI Configuration
OPENAI_API_KEY=${openaiApiKey}
OPENAI_MODEL=${openaiModel}

# Dashboard Configuration
DASHBOARD_PORT=3000
DASHBOARD_HOST=localhost
DASHBOARD_ENABLE=true

# Admin Configuration
ADMIN_IDS=${adminIds}

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100

# Auto Features
AUTO_RESTART=false
AUTO_RESTART_TIME=86400000
AUTO_BACKUP=true
BACKUP_INTERVAL=3600000

# Security Features
WHITELIST_MODE=false
WHITELIST_IDS=
ADMIN_ONLY_MODE=false

# Logging
LOG_LEVEL=info
LOG_FILE=logs/bot.log

# API Keys for various services
WEATHER_API_KEY=
YOUTUBE_API_KEY=
SPOTIFY_API_KEY=

# Notification Settings
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
DISCORD_WEBHOOK_URL=
`;

    // Write .env file
    writeFileSync(envPath, envContent);
    console.log(chalk.green('\n✅ .env file created successfully!'));

    // Create default config file
    const configPath = join(__dirname, '../config/config.json');
    if (!existsSync(configPath)) {
      const defaultConfig = {
        version: '2.0.0',
        features: {
          aiChat: true,
          webDashboard: true,
          autoRestart: false,
          rateLimiting: true,
          caching: true
        },
        limits: {
          maxMessageLength: 2000,
          maxAttachmentSize: 10485760,
          commandCooldown: 3000
        },
        security: {
          enableEncryption: true,
          logSecurityEvents: true,
          maxLoginAttempts: 3
        }
      };

      writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));
      console.log(chalk.green('✅ Default config file created!'));
    }

    // Validation
    console.log(chalk.blue('\n🔍 Validating configuration...'));
    
    const validation = {
      facebookEmail: !!facebookEmail,
      facebookPassword: !!facebookPassword,
      mongoUri: !!mongoUri,
      adminIds: !!adminIds,
      securityKeys: !!(jwtSecret && encryptionKey && sessionSecret)
    };

    let isValid = true;
    
    if (!validation.facebookEmail) {
      console.log(chalk.red('❌ Facebook email is required'));
      isValid = false;
    }
    
    if (!validation.facebookPassword) {
      console.log(chalk.red('❌ Facebook password is required'));
      isValid = false;
    }
    
    if (!validation.mongoUri) {
      console.log(chalk.red('❌ MongoDB URI is required'));
      isValid = false;
    }
    
    if (!validation.adminIds) {
      console.log(chalk.red('❌ Admin IDs are required'));
      isValid = false;
    }

    if (isValid) {
      console.log(chalk.green('✅ Configuration validated successfully!'));
    } else {
      console.log(chalk.red('❌ Configuration validation failed. Please check the errors above.'));
    }

    // Next steps
    console.log(chalk.cyan(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║   🎉 Setup Complete!                                        ║
║                                                              ║
║   Next steps:                                                ║
║   1. Review your .env file                                   ║
║   2. Start MongoDB and Redis (if using)                     ║
║   3. Run: npm start                                          ║
║                                                              ║
║   Dashboard will be available at:                           ║
║   http://localhost:3000                                      ║
║                                                              ║
║   Need help? Check the README.md file                       ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
`));

    // Ask if user wants to start the bot
    const startBot = await question('Would you like to start the bot now? (y/N): ');
    if (startBot.toLowerCase() === 'y') {
      console.log(chalk.blue('Starting the bot...'));
      const { spawn } = await import('child_process');
      const child = spawn('npm', ['start'], { stdio: 'inherit' });
      
      child.on('close', (code) => {
        console.log(`Bot process exited with code ${code}`);
      });
    }

  } catch (error) {
    console.error(chalk.red('❌ Setup failed:'), error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Run setup
setup();