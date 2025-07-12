import 'dotenv/config';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import chalk from 'chalk';
import { createLogger } from './utils/logger.js';
import { BotManager } from './core/BotManager.js';
import { DatabaseManager } from './database/DatabaseManager.js';
import { ConfigManager } from './utils/ConfigManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize logger
const logger = createLogger();

// Global error handlers
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

class EnhancedSecretBot {
  constructor() {
    this.logger = logger;
    this.configManager = new ConfigManager();
    this.databaseManager = new DatabaseManager();
    this.botManager = null;
    this.isRunning = false;
  }

  async initialize() {
    try {
      // Display startup banner
      this.displayBanner();
      
      // Initialize configuration
      await this.configManager.initialize();
      this.logger.info('Configuration loaded successfully');
      
      // Initialize database
      await this.databaseManager.initialize();
      this.logger.info('Database connected successfully');
      
      // Initialize bot manager
      this.botManager = new BotManager(this.configManager, this.databaseManager, this.logger);
      await this.botManager.initialize();
      
      this.isRunning = true;
      this.logger.info('Enhanced SecretBot initialized successfully');
      
    } catch (error) {
      this.logger.error('Failed to initialize bot:', error);
      process.exit(1);
    }
  }

  async start() {
    try {
      await this.initialize();
      await this.botManager.start();
      
      this.logger.info(chalk.green('🚀 Enhanced SecretBot is now running!'));
      
      // Auto-restart functionality
      if (this.configManager.get('AUTO_RESTART')) {
        this.setupAutoRestart();
      }
      
    } catch (error) {
      this.logger.error('Failed to start bot:', error);
      process.exit(1);
    }
  }

  async stop() {
    try {
      this.isRunning = false;
      
      if (this.botManager) {
        await this.botManager.stop();
      }
      
      if (this.databaseManager) {
        await this.databaseManager.disconnect();
      }
      
      this.logger.info('Bot stopped successfully');
      
    } catch (error) {
      this.logger.error('Error stopping bot:', error);
    }
  }

  setupAutoRestart() {
    const restartTime = this.configManager.get('AUTO_RESTART_TIME', 86400000); // 24 hours
    
    setTimeout(() => {
      this.logger.info('Auto-restart initiated...');
      process.exit(2); // Exit code 2 for restart
    }, restartTime);
  }

  displayBanner() {
    const banner = `
${chalk.cyan('╔══════════════════════════════════════════════════════════════╗')}
${chalk.cyan('║')}                                                              ${chalk.cyan('║')}
${chalk.cyan('║')}   ${chalk.bold.magenta('🤖 Enhanced SecretBot v2.0.0')}                           ${chalk.cyan('║')}
${chalk.cyan('║')}                                                              ${chalk.cyan('║')}
${chalk.cyan('║')}   ${chalk.yellow('🔧 Modern Facebook Messenger Bot')}                      ${chalk.cyan('║')}
${chalk.cyan('║')}   ${chalk.green('⚡ Enhanced Security & Performance')}                     ${chalk.cyan('║')}
${chalk.cyan('║')}   ${chalk.blue('🚀 AI-Powered Features')}                                ${chalk.cyan('║')}
${chalk.cyan('║')}                                                              ${chalk.cyan('║')}
${chalk.cyan('║')}   ${chalk.gray('Environment:')} ${chalk.white(process.env.NODE_ENV || 'development')}                               ${chalk.cyan('║')}
${chalk.cyan('║')}   ${chalk.gray('Node.js:')} ${chalk.white(process.version)}                                     ${chalk.cyan('║')}
${chalk.cyan('║')}                                                              ${chalk.cyan('║')}
${chalk.cyan('╚══════════════════════════════════════════════════════════════╝')}
`;
    
    console.log(banner);
  }
}

// Start the bot
const bot = new EnhancedSecretBot();
bot.start().catch((error) => {
  logger.error('Failed to start Enhanced SecretBot:', error);
  process.exit(1);
});

export default EnhancedSecretBot;