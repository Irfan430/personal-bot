import { EventEmitter } from 'events';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readdirSync, statSync } from 'fs';
import { CommandManager } from './CommandManager.js';
import { EventManager } from './EventManager.js';
import { SecurityManager } from './SecurityManager.js';
import { RateLimiter } from '../middleware/RateLimiter.js';
import { MessageHandler } from './MessageHandler.js';
import { FacebookAPI } from '../api/FacebookAPI.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class BotManager extends EventEmitter {
  constructor(configManager, databaseManager, logger) {
    super();
    
    this.configManager = configManager;
    this.databaseManager = databaseManager;
    this.logger = logger;
    
    // Core managers
    this.commandManager = null;
    this.eventManager = null;
    this.securityManager = null;
    this.messageHandler = null;
    this.facebookAPI = null;
    
    // Middleware
    this.rateLimiter = null;
    
    // State
    this.isRunning = false;
    this.botInfo = null;
    this.startTime = Date.now();
    
    // Statistics
    this.stats = {
      messagesProcessed: 0,
      commandsExecuted: 0,
      errors: 0,
      uptime: 0
    };
    
    // Setup event handlers
    this.setupEventHandlers();
  }

  async initialize() {
    try {
      this.logger.info('Initializing BotManager...');
      
      // Initialize security manager first
      this.securityManager = new SecurityManager(this.configManager, this.logger);
      await this.securityManager.initialize();
      
      // Initialize rate limiter
      this.rateLimiter = new RateLimiter(this.configManager, this.databaseManager);
      
      // Initialize Facebook API
      this.facebookAPI = new FacebookAPI(this.configManager, this.logger);
      await this.facebookAPI.initialize();
      
      // Initialize command manager
      this.commandManager = new CommandManager(this.configManager, this.databaseManager, this.logger);
      await this.commandManager.initialize();
      
      // Initialize event manager
      this.eventManager = new EventManager(this.configManager, this.databaseManager, this.logger);
      await this.eventManager.initialize();
      
      // Initialize message handler
      this.messageHandler = new MessageHandler(
        this.configManager,
        this.databaseManager,
        this.commandManager,
        this.eventManager,
        this.securityManager,
        this.rateLimiter,
        this.logger
      );
      
      this.logger.success('BotManager initialized successfully');
      
    } catch (error) {
      this.logger.error('Failed to initialize BotManager:', error);
      throw error;
    }
  }

  async start() {
    try {
      if (this.isRunning) {
        this.logger.warning('Bot is already running');
        return;
      }
      
      this.logger.info('Starting Enhanced SecretBot...');
      
      // Start Facebook API connection
      await this.facebookAPI.connect();
      
      // Get bot information
      this.botInfo = await this.facebookAPI.getBotInfo();
      this.logger.info(`Bot connected as: ${this.botInfo.name} (${this.botInfo.id})`);
      
      // Set up message listeners
      this.setupMessageListeners();
      
      // Start periodic tasks
      this.startPeriodicTasks();
      
      this.isRunning = true;
      this.startTime = Date.now();
      
      this.logger.success('Enhanced SecretBot started successfully');
      this.emit('started');
      
    } catch (error) {
      this.logger.error('Failed to start bot:', error);
      throw error;
    }
  }

  async stop() {
    try {
      if (!this.isRunning) {
        this.logger.warning('Bot is not running');
        return;
      }
      
      this.logger.info('Stopping Enhanced SecretBot...');
      
      // Stop periodic tasks
      this.stopPeriodicTasks();
      
      // Disconnect from Facebook
      if (this.facebookAPI) {
        await this.facebookAPI.disconnect();
      }
      
      this.isRunning = false;
      
      this.logger.success('Enhanced SecretBot stopped successfully');
      this.emit('stopped');
      
    } catch (error) {
      this.logger.error('Error stopping bot:', error);
      throw error;
    }
  }

  setupEventHandlers() {
    // Handle process signals
    process.on('SIGINT', async () => {
      this.logger.info('Received SIGINT, shutting down gracefully...');
      await this.stop();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      this.logger.info('Received SIGTERM, shutting down gracefully...');
      await this.stop();
      process.exit(0);
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      this.logger.error('Uncaught exception:', error);
      this.stats.errors++;
    });

    process.on('unhandledRejection', (reason, promise) => {
      this.logger.error('Unhandled promise rejection:', reason);
      this.stats.errors++;
    });
  }

  setupMessageListeners() {
    if (!this.facebookAPI) {
      throw new Error('Facebook API not initialized');
    }

    // Listen for messages
    this.facebookAPI.on('message', async (message) => {
      try {
        await this.handleMessage(message);
      } catch (error) {
        this.logger.error('Error handling message:', error);
        this.stats.errors++;
      }
    });

    // Listen for events
    this.facebookAPI.on('event', async (event) => {
      try {
        await this.handleEvent(event);
      } catch (error) {
        this.logger.error('Error handling event:', error);
        this.stats.errors++;
      }
    });

    // Listen for reactions
    this.facebookAPI.on('reaction', async (reaction) => {
      try {
        await this.handleReaction(reaction);
      } catch (error) {
        this.logger.error('Error handling reaction:', error);
        this.stats.errors++;
      }
    });

    // Listen for connection events
    this.facebookAPI.on('connected', () => {
      this.logger.success('Facebook API connected');
    });

    this.facebookAPI.on('disconnected', () => {
      this.logger.warning('Facebook API disconnected');
    });

    this.facebookAPI.on('error', (error) => {
      this.logger.error('Facebook API error:', error);
      this.stats.errors++;
    });
  }

  async handleMessage(message) {
    this.stats.messagesProcessed++;
    
    try {
      // Security check
      if (!await this.securityManager.checkMessage(message)) {
        this.logger.security(`Message blocked by security check: ${message.senderID}`);
        return;
      }
      
      // Rate limiting
      if (!await this.rateLimiter.checkLimit(message.senderID)) {
        this.logger.security(`Rate limit exceeded for user: ${message.senderID}`);
        return;
      }
      
      // Process message
      await this.messageHandler.handle(message);
      
    } catch (error) {
      this.logger.error('Error in message handler:', error);
      this.stats.errors++;
    }
  }

  async handleEvent(event) {
    try {
      await this.eventManager.handle(event);
    } catch (error) {
      this.logger.error('Error in event handler:', error);
      this.stats.errors++;
    }
  }

  async handleReaction(reaction) {
    try {
      await this.messageHandler.handleReaction(reaction);
    } catch (error) {
      this.logger.error('Error in reaction handler:', error);
      this.stats.errors++;
    }
  }

  startPeriodicTasks() {
    // Update statistics every minute
    this.statsInterval = setInterval(() => {
      this.updateStats();
    }, 60000);

    // Health check every 5 minutes
    this.healthInterval = setInterval(async () => {
      await this.performHealthCheck();
    }, 300000);

    // Cleanup old data every hour
    this.cleanupInterval = setInterval(async () => {
      await this.performCleanup();
    }, 3600000);
  }

  stopPeriodicTasks() {
    if (this.statsInterval) {
      clearInterval(this.statsInterval);
    }
    if (this.healthInterval) {
      clearInterval(this.healthInterval);
    }
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }

  updateStats() {
    this.stats.uptime = Date.now() - this.startTime;
    this.emit('stats', this.stats);
  }

  async performHealthCheck() {
    try {
      const health = {
        bot: this.isRunning,
        database: await this.databaseManager.healthCheck(),
        facebook: this.facebookAPI ? this.facebookAPI.isConnected() : false,
        timestamp: Date.now()
      };

      this.logger.info('Health check completed:', health);
      this.emit('health', health);

    } catch (error) {
      this.logger.error('Health check failed:', error);
    }
  }

  async performCleanup() {
    try {
      this.logger.info('Performing periodic cleanup...');
      
      // Clear old rate limit data
      await this.rateLimiter.cleanup();
      
      // Clear old cache data
      await this.databaseManager.cacheFlush();
      
      // Clear old log files if needed
      // Add your cleanup logic here
      
      this.logger.info('Cleanup completed');
      
    } catch (error) {
      this.logger.error('Cleanup failed:', error);
    }
  }

  // Getter methods
  getStats() {
    return {
      ...this.stats,
      uptime: Date.now() - this.startTime,
      isRunning: this.isRunning,
      botInfo: this.botInfo
    };
  }

  getBotInfo() {
    return this.botInfo;
  }

  getCommandManager() {
    return this.commandManager;
  }

  getEventManager() {
    return this.eventManager;
  }

  getSecurityManager() {
    return this.securityManager;
  }

  getFacebookAPI() {
    return this.facebookAPI;
  }

  isReady() {
    return this.isRunning && this.facebookAPI && this.facebookAPI.isConnected();
  }

  // Send message method
  async sendMessage(threadID, message, options = {}) {
    if (!this.facebookAPI) {
      throw new Error('Facebook API not initialized');
    }
    
    return await this.facebookAPI.sendMessage(threadID, message, options);
  }

  // Reply to message method
  async replyMessage(messageID, message, options = {}) {
    if (!this.facebookAPI) {
      throw new Error('Facebook API not initialized');
    }
    
    return await this.facebookAPI.replyMessage(messageID, message, options);
  }

  // React to message method
  async reactMessage(messageID, reaction) {
    if (!this.facebookAPI) {
      throw new Error('Facebook API not initialized');
    }
    
    return await this.facebookAPI.reactMessage(messageID, reaction);
  }
}

export default BotManager;