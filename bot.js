import { Highrise } from 'highrise-js-sdk';
import IcecastClient from 'icecast-stack';

const BOT_TOKEN = '91b5fb7cc69807c7de164f95854dcdf779d34b8966ee281b5709df10e42688d1';
let ROOM_ID = '673c94d2dcd373b9039e142c';

// Casino ranks and balances
const users = new Map();
const ranks = {
  'Beginner': 0,
  'Amateur': 1000,
  'Professional': 5000,
  'Expert': 10000,
  'Master': 50000
};

// Music player settings
const ICECAST_CONFIG = {
  host: 'master.shoutcast.com',
  port: 8000,
  mount: '/criimes',
  auth: 'source:g78K4MvU5VgS'
};

class CasinoBot {
  constructor() {
    this.bot = new Highrise(BOT_TOKEN);
    this.setupEventListeners();
    this.currentRoom = ROOM_ID;
    this.musicPlaying = false;
  }

  async setupEventListeners() {
    this.bot.on('ready', async () => {
      console.log('Bot is ready!');
      await this.joinRoom(this.currentRoom);
    });

    this.bot.on('messageCreate', async (user, message) => {
      // Check if it's a DM with a room ID
      if (message.startsWith('room:')) {
        const newRoomId = message.split('room:')[1].trim();
        await this.changeRoom(newRoomId);
        return;
      }

      // Casino commands
      if (message.startsWith('!')) {
        await this.handleCommand(user, message);
      }
    });
  }

  async joinRoom(roomId) {
    try {
      await this.bot.joinRoom(roomId);
      console.log(`Joined room: ${roomId}`);
      await this.bot.chat("🎰 Casino Bot is active! Use !help for commands");
    } catch (error) {
      console.error('Failed to join room:', error);
    }
  }

  async changeRoom(newRoomId) {
    try {
      await this.bot.leaveRoom();
      this.currentRoom = newRoomId;
      await this.joinRoom(newRoomId);
    } catch (error) {
      console.error('Failed to change room:', error);
    }
  }

  async handleCommand(user, message) {
    const command = message.toLowerCase().split(' ')[0];
    
    switch(command) {
      case '!help':
        await this.bot.chat(`
          🎰 Casino Commands:
          !balance - Check your balance
          !rank - Check your rank
          !bet [amount] - Place a bet
          !music - Toggle music
          !leaderboard - View top players
        `);
        break;

      case '!balance':
        const balance = users.get(user.id)?.balance || 0;
        await this.bot.chat(`💰 ${user.username}'s balance: ${balance} coins`);
        break;

      case '!rank':
        const userRank = this.getUserRank(user.id);
        await this.bot.chat(`🏆 ${user.username}'s rank: ${userRank}`);
        break;

      case '!music':
        await this.toggleMusic();
        break;

      case '!bet':
        const amount = parseInt(message.split(' ')[1]);
        if (isNaN(amount) || amount <= 0) {
          await this.bot.chat('❌ Please specify a valid bet amount');
          return;
        }
        await this.placeBet(user, amount);
        break;
    }
  }

  getUserRank(userId) {
    const balance = users.get(userId)?.balance || 0;
    let currentRank = 'Beginner';
    
    for (const [rank, requirement] of Object.entries(ranks)) {
      if (balance >= requirement) {
        currentRank = rank;
      }
    }
    
    return currentRank;
  }

  async placeBet(user, amount) {
    let userInfo = users.get(user.id) || { balance: 1000, rank: 'Beginner' };
    
    if (userInfo.balance < amount) {
      await this.bot.chat('❌ Insufficient balance');
      return;
    }

    // Simple 50/50 chance of winning
    const win = Math.random() >= 0.5;
    if (win) {
      userInfo.balance += amount;
      await this.bot.chat(`🎉 ${user.username} won ${amount} coins!`);
    } else {
      userInfo.balance -= amount;
      await this.bot.chat(`😢 ${user.username} lost ${amount} coins`);
    }

    users.set(user.id, userInfo);
  }

  async toggleMusic() {
    if (this.musicPlaying) {
      // Stop music logic here
      this.musicPlaying = false;
      await this.bot.chat('🎵 Music stopped');
    } else {
      // Start music logic here
      const client = new IcecastClient(ICECAST_CONFIG);
      this.musicPlaying = true;
      await this.bot.chat('🎵 Music started');
    }
  }
}

// Start the bot
const bot = new CasinoBot();