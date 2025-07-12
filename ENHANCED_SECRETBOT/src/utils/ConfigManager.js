import Joi from 'joi';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration schema validation
const configSchema = Joi.object({
  // Bot Configuration
  BOT_NAME: Joi.string().default('Enhanced SecretBot'),
  BOT_PREFIX: Joi.string().default('>'),
  BOT_LANGUAGE: Joi.string().valid('en', 'vi').default('en'),
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  
  // Facebook Configuration
  FACEBOOK_EMAIL: Joi.string().email().required(),
  FACEBOOK_PASSWORD: Joi.string().min(6).required(),
  FACEBOOK_2FA_SECRET: Joi.string().allow('').optional(),
  
  // Database Configuration
  DB_TYPE: Joi.string().valid('mongodb', 'sqlite').default('mongodb'),
  MONGODB_URI: Joi.string().when('DB_TYPE', {
    is: 'mongodb',
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  REDIS_URL: Joi.string().uri().optional(),
  
  // Security Configuration
  JWT_SECRET: Joi.string().min(32).required(),
  ENCRYPTION_KEY: Joi.string().min(32).required(),
  SESSION_SECRET: Joi.string().min(32).required(),
  
  // Email Configuration
  GMAIL_EMAIL: Joi.string().email().optional(),
  GMAIL_CLIENT_ID: Joi.string().when('GMAIL_EMAIL', {
    is: Joi.exist(),
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  GMAIL_CLIENT_SECRET: Joi.string().when('GMAIL_EMAIL', {
    is: Joi.exist(),
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  GMAIL_REFRESH_TOKEN: Joi.string().when('GMAIL_EMAIL', {
    is: Joi.exist(),
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  
  // AI Configuration
  OPENAI_API_KEY: Joi.string().optional(),
  OPENAI_MODEL: Joi.string().default('gpt-3.5-turbo'),
  
  // Dashboard Configuration
  DASHBOARD_PORT: Joi.number().integer().min(1).max(65535).default(3000),
  DASHBOARD_HOST: Joi.string().default('localhost'),
  DASHBOARD_ENABLE: Joi.boolean().default(true),
  
  // Admin Configuration
  ADMIN_IDS: Joi.string().required(),
  
  // Rate Limiting
  RATE_LIMIT_WINDOW: Joi.number().integer().min(1).default(15),
  RATE_LIMIT_MAX: Joi.number().integer().min(1).default(100),
  
  // Auto Features
  AUTO_RESTART: Joi.boolean().default(false),
  AUTO_RESTART_TIME: Joi.number().integer().min(60000).default(86400000),
  AUTO_BACKUP: Joi.boolean().default(true),
  BACKUP_INTERVAL: Joi.number().integer().min(60000).default(3600000),
  
  // Security Features
  WHITELIST_MODE: Joi.boolean().default(false),
  WHITELIST_IDS: Joi.string().allow('').optional(),
  ADMIN_ONLY_MODE: Joi.boolean().default(false),
  
  // Logging
  LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug').default('info'),
  LOG_FILE: Joi.string().default('logs/bot.log'),
  
  // API Keys
  WEATHER_API_KEY: Joi.string().optional(),
  YOUTUBE_API_KEY: Joi.string().optional(),
  SPOTIFY_API_KEY: Joi.string().optional(),
  
  // Notification Settings
  TELEGRAM_BOT_TOKEN: Joi.string().optional(),
  TELEGRAM_CHAT_ID: Joi.string().optional(),
  DISCORD_WEBHOOK_URL: Joi.string().uri().optional()
});

export class ConfigManager {
  constructor() {
    this.config = {};
    this.configPath = join(__dirname, '../../config/config.json');
    this.isInitialized = false;
  }

  async initialize() {
    try {
      // Load configuration from environment variables
      this.loadFromEnv();
      
      // Validate configuration
      await this.validate();
      
      // Load additional config from file if exists
      this.loadFromFile();
      
      // Process configuration
      this.processConfig();
      
      this.isInitialized = true;
      
    } catch (error) {
      throw new Error(`Configuration initialization failed: ${error.message}`);
    }
  }

  loadFromEnv() {
    // Load all environment variables
    this.config = { ...process.env };
    
    // Convert boolean strings to actual booleans
    const booleanFields = [
      'DASHBOARD_ENABLE', 'AUTO_RESTART', 'AUTO_BACKUP', 
      'WHITELIST_MODE', 'ADMIN_ONLY_MODE'
    ];
    
    booleanFields.forEach(field => {
      if (this.config[field]) {
        this.config[field] = this.config[field].toLowerCase() === 'true';
      }
    });
    
    // Convert numeric strings to numbers
    const numericFields = [
      'DASHBOARD_PORT', 'RATE_LIMIT_WINDOW', 'RATE_LIMIT_MAX',
      'AUTO_RESTART_TIME', 'BACKUP_INTERVAL'
    ];
    
    numericFields.forEach(field => {
      if (this.config[field]) {
        this.config[field] = parseInt(this.config[field], 10);
      }
    });
  }

  loadFromFile() {
    if (existsSync(this.configPath)) {
      try {
        const fileConfig = JSON.parse(readFileSync(this.configPath, 'utf8'));
        this.config = { ...this.config, ...fileConfig };
      } catch (error) {
        throw new Error(`Failed to load config file: ${error.message}`);
      }
    }
  }

  async validate() {
    const { error, value } = configSchema.validate(this.config, {
      allowUnknown: true,
      abortEarly: false
    });

    if (error) {
      const errors = error.details.map(detail => detail.message).join(', ');
      throw new Error(`Configuration validation failed: ${errors}`);
    }

    this.config = value;
  }

  processConfig() {
    // Process admin IDs
    if (this.config.ADMIN_IDS) {
      this.config.ADMIN_IDS = this.config.ADMIN_IDS.split(',').map(id => id.trim());
    }
    
    // Process whitelist IDs
    if (this.config.WHITELIST_IDS) {
      this.config.WHITELIST_IDS = this.config.WHITELIST_IDS.split(',').map(id => id.trim());
    }
    
    // Process notification settings
    if (this.config.TELEGRAM_CHAT_ID) {
      this.config.TELEGRAM_CHAT_ID = this.config.TELEGRAM_CHAT_ID.split(',').map(id => id.trim());
    }
  }

  get(key, defaultValue = null) {
    if (!this.isInitialized) {
      throw new Error('ConfigManager not initialized. Call initialize() first.');
    }
    
    return this.config[key] !== undefined ? this.config[key] : defaultValue;
  }

  set(key, value) {
    if (!this.isInitialized) {
      throw new Error('ConfigManager not initialized. Call initialize() first.');
    }
    
    this.config[key] = value;
  }

  getAll() {
    if (!this.isInitialized) {
      throw new Error('ConfigManager not initialized. Call initialize() first.');
    }
    
    return { ...this.config };
  }

  // Save configuration to file
  async saveToFile() {
    try {
      const configDir = dirname(this.configPath);
      if (!existsSync(configDir)) {
        mkdirSync(configDir, { recursive: true });
      }
      
      writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
    } catch (error) {
      throw new Error(`Failed to save config to file: ${error.message}`);
    }
  }

  // Check if feature is enabled
  isFeatureEnabled(feature) {
    return this.get(feature, false) === true;
  }

  // Get database configuration
  getDatabaseConfig() {
    return {
      type: this.get('DB_TYPE'),
      mongodb: {
        uri: this.get('MONGODB_URI')
      },
      redis: {
        url: this.get('REDIS_URL')
      }
    };
  }

  // Get email configuration
  getEmailConfig() {
    return {
      email: this.get('GMAIL_EMAIL'),
      clientId: this.get('GMAIL_CLIENT_ID'),
      clientSecret: this.get('GMAIL_CLIENT_SECRET'),
      refreshToken: this.get('GMAIL_REFRESH_TOKEN')
    };
  }

  // Get AI configuration
  getAIConfig() {
    return {
      openai: {
        apiKey: this.get('OPENAI_API_KEY'),
        model: this.get('OPENAI_MODEL')
      }
    };
  }
}

export default ConfigManager;