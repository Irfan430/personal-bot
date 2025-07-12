import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';

export default {
  config: {
    name: 'ai',
    aliases: ['gpt', 'chatgpt', 'openai'],
    version: '2.0.0',
    author: 'Enhanced SecretBot Team',
    shortDescription: 'Advanced AI chat with GPT-4',
    longDescription: 'Chat with OpenAI GPT-4 with conversation memory and context awareness',
    category: 'ai',
    role: 0, // Everyone can use
    coolDown: 5,
    countDown: 0,
    guide: {
      en: '{pn} <message> - Chat with AI\n{pn} clear - Clear conversation history\n{pn} model <model> - Switch AI model\n{pn} system <prompt> - Set system prompt'
    }
  },

  // Conversation storage
  conversations: new Map(),
  
  // Available models
  models: {
    'gpt-4': 'gpt-4',
    'gpt-3.5-turbo': 'gpt-3.5-turbo',
    'gpt-3.5': 'gpt-3.5-turbo',
    'gpt-4-turbo': 'gpt-4-turbo-preview'
  },

  onStart: async function ({ message, args, event, api, configManager, databaseManager, logger }) {
    try {
      const userID = event.senderID;
      const threadID = event.threadID;
      const messageID = event.messageID;
      
      // Check if OpenAI API key is configured
      const openaiConfig = configManager.getAIConfig();
      if (!openaiConfig.openai.apiKey) {
        return message.reply('⚠️ OpenAI API key not configured. Please contact the administrator.');
      }

      // Initialize OpenAI client
      const openai = new OpenAI({
        apiKey: openaiConfig.openai.apiKey
      });

      // Get conversation ID
      const conversationId = `${threadID}_${userID}`;
      
      // Handle subcommands
      if (args[0]) {
        switch (args[0].toLowerCase()) {
          case 'clear':
            return this.clearConversation(conversationId, message);
          
          case 'model':
            return this.switchModel(args[1], conversationId, message);
          
          case 'system':
            return this.setSystemPrompt(args.slice(1).join(' '), conversationId, message);
          
          case 'help':
            return this.showHelp(message);
        }
      }

      // Get user input
      const userInput = args.join(' ').trim();
      if (!userInput) {
        return message.reply('🤖 Please provide a message to chat with AI.\n\nExample: ai Hello, how are you?');
      }

      // Set typing indicator
      await api.sendTypingIndicator(threadID);

      // Get or create conversation
      let conversation = this.conversations.get(conversationId);
      if (!conversation) {
        conversation = {
          id: conversationId,
          userID,
          threadID,
          model: openaiConfig.openai.model || 'gpt-3.5-turbo',
          systemPrompt: 'You are a helpful, friendly, and knowledgeable AI assistant. Provide clear, concise, and helpful responses.',
          messages: [],
          createdAt: new Date(),
          lastUsed: new Date()
        };
        this.conversations.set(conversationId, conversation);
      }

      // Update last used time
      conversation.lastUsed = new Date();

      // Add user message to conversation
      conversation.messages.push({
        role: 'user',
        content: userInput,
        timestamp: new Date()
      });

      // Keep conversation history manageable (last 10 messages)
      if (conversation.messages.length > 20) {
        conversation.messages = conversation.messages.slice(-10);
      }

      // Prepare messages for OpenAI
      const messages = [
        { role: 'system', content: conversation.systemPrompt },
        ...conversation.messages.map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      ];

      // Call OpenAI API
      const completion = await openai.chat.completions.create({
        model: conversation.model,
        messages: messages,
        max_tokens: 1000,
        temperature: 0.7,
        top_p: 0.9,
        frequency_penalty: 0.0,
        presence_penalty: 0.0
      });

      const aiResponse = completion.choices[0].message.content;

      // Add AI response to conversation
      conversation.messages.push({
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date()
      });

      // Cache conversation in database
      await databaseManager.cacheSet(
        `ai_conversation_${conversationId}`,
        conversation,
        3600 // 1 hour
      );

      // Send response with formatting
      const response = `🤖 **AI Response**\n\n${aiResponse}\n\n💬 *Reply to continue the conversation*\n📝 *Type "ai clear" to reset*`;
      
      await message.reply(response, (err, info) => {
        if (!err) {
          // Set up reply handler for continuation
          global.GoatBot.onReply.set(info.messageID, {
            commandName: 'ai',
            messageID: info.messageID,
            author: userID,
            conversationId: conversationId
          });
        }
      });

      // Log usage
      logger.command(`AI command used by ${userID} in ${threadID} with model ${conversation.model}`);

    } catch (error) {
      logger.error('AI command error:', error);
      
      let errorMessage = '❌ An error occurred while processing your request.';
      
      if (error.code === 'insufficient_quota') {
        errorMessage = '⚠️ OpenAI API quota exceeded. Please try again later.';
      } else if (error.code === 'rate_limit_exceeded') {
        errorMessage = '⚠️ Rate limit exceeded. Please wait a moment and try again.';
      } else if (error.code === 'invalid_api_key') {
        errorMessage = '⚠️ Invalid OpenAI API key. Please contact the administrator.';
      }
      
      await message.reply(errorMessage);
    }
  },

  onReply: async function ({ message, event, Reply, api, configManager, databaseManager, logger }) {
    try {
      const { author, conversationId } = Reply;
      
      // Check if the reply is from the original user
      if (event.senderID !== author) {
        return;
      }

      const userInput = event.body.trim();
      if (!userInput) {
        return message.reply('🤖 Please provide a message to continue the conversation.');
      }

      // Handle special commands in reply
      if (userInput.toLowerCase() === 'clear') {
        return this.clearConversation(conversationId, message);
      }

      // Get OpenAI config
      const openaiConfig = configManager.getAIConfig();
      const openai = new OpenAI({
        apiKey: openaiConfig.openai.apiKey
      });

      // Set typing indicator
      await api.sendTypingIndicator(event.threadID);

      // Get conversation
      let conversation = this.conversations.get(conversationId);
      if (!conversation) {
        // Try to get from cache
        conversation = await databaseManager.cacheGet(`ai_conversation_${conversationId}`);
        if (conversation) {
          this.conversations.set(conversationId, conversation);
        }
      }

      if (!conversation) {
        return message.reply('🤖 Conversation not found. Please start a new conversation with the ai command.');
      }

      // Update last used time
      conversation.lastUsed = new Date();

      // Add user message
      conversation.messages.push({
        role: 'user',
        content: userInput,
        timestamp: new Date()
      });

      // Keep conversation manageable
      if (conversation.messages.length > 20) {
        conversation.messages = conversation.messages.slice(-10);
      }

      // Prepare messages
      const messages = [
        { role: 'system', content: conversation.systemPrompt },
        ...conversation.messages.map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      ];

      // Call OpenAI API
      const completion = await openai.chat.completions.create({
        model: conversation.model,
        messages: messages,
        max_tokens: 1000,
        temperature: 0.7,
        top_p: 0.9,
        frequency_penalty: 0.0,
        presence_penalty: 0.0
      });

      const aiResponse = completion.choices[0].message.content;

      // Add AI response
      conversation.messages.push({
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date()
      });

      // Update cache
      await databaseManager.cacheSet(
        `ai_conversation_${conversationId}`,
        conversation,
        3600
      );

      // Send response
      const response = `🤖 **AI Response**\n\n${aiResponse}\n\n💬 *Reply to continue the conversation*`;
      
      await message.reply(response, (err, info) => {
        if (!err) {
          global.GoatBot.onReply.set(info.messageID, {
            commandName: 'ai',
            messageID: info.messageID,
            author: event.senderID,
            conversationId: conversationId
          });
        }
      });

    } catch (error) {
      logger.error('AI reply error:', error);
      await message.reply('❌ An error occurred while processing your message.');
    }
  },

  // Helper methods
  clearConversation(conversationId, message) {
    this.conversations.delete(conversationId);
    return message.reply('🧹 Conversation history cleared successfully!');
  },

  switchModel(modelName, conversationId, message) {
    if (!modelName || !this.models[modelName.toLowerCase()]) {
      const availableModels = Object.keys(this.models).join(', ');
      return message.reply(`🤖 Available models: ${availableModels}`);
    }

    const conversation = this.conversations.get(conversationId);
    if (conversation) {
      conversation.model = this.models[modelName.toLowerCase()];
      return message.reply(`🔧 Model switched to: ${conversation.model}`);
    } else {
      return message.reply('🤖 No active conversation found. Start a new conversation first.');
    }
  },

  setSystemPrompt(prompt, conversationId, message) {
    if (!prompt) {
      return message.reply('🤖 Please provide a system prompt.\n\nExample: ai system You are a helpful coding assistant.');
    }

    const conversation = this.conversations.get(conversationId);
    if (conversation) {
      conversation.systemPrompt = prompt;
      return message.reply('🔧 System prompt updated successfully!');
    } else {
      return message.reply('🤖 No active conversation found. Start a new conversation first.');
    }
  },

  showHelp(message) {
    const helpText = `
🤖 **AI Command Help**

**Basic Usage:**
• \`ai <message>\` - Chat with AI
• Reply to AI messages to continue conversation

**Advanced Features:**
• \`ai clear\` - Clear conversation history
• \`ai model <model>\` - Switch AI model
• \`ai system <prompt>\` - Set system prompt
• \`ai help\` - Show this help

**Available Models:**
• gpt-4 - Most capable model
• gpt-3.5-turbo - Fast and efficient
• gpt-4-turbo - Latest GPT-4 model

**Features:**
✅ Conversation memory
✅ Context awareness
✅ Multiple AI models
✅ Custom system prompts
✅ Rate limiting protection
`;

    return message.reply(helpText);
  }
};