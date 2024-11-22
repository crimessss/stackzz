import { HiberClient } from '@hiber/node-sdk';
import { BOT_CONFIG } from './config.js';
import { CasinoManager } from './casino.js';
import { MusicPlayer } from './music.js';

class CasinoBot {
  constructor() {
    this.client = new HiberClient({
      token: BOT_CONFIG.token,
      roomId: BOT_CONFIG.defaultRoom
    });
    this.casino = new CasinoManager();
    this.music = new MusicPlayer();
    this.currentRoom = BOT_CONFIG.defaultRoom;
  }

  async start() {
    try {
      await this.client.connect();
      await this.setupEventListeners();
      console.log('Bot connected successfully!');
    } catch (error) {
      console.error('Failed to start bot:', error);
    }
  }

  async setupEventListeners() {
    this.client.on('message', async (message) => {
      const { sender, content } = message;

      if (content.startsWith('room:')) {
        const newRoomId = content.split('room:')[1].trim();
        await this.changeRoom(newRoomId);
        return;
      }

      if (content.startsWith('!')) {
        await this.handleCommand(sender, content);
      }
    });
  }

  async changeRoom(newRoomId) {
    try {
      await this.client.leaveRoom(this.currentRoom);
      this.currentRoom = newRoomId;
      await this.client.joinRoom(newRoomId);
      await this.client.sendMessage("🎰 Casino Bot is active! Use !help for commands");
    } catch (error) {
      console.error('Failed to change room:', error);
    }
  }

  async handleCommand(user, message) {
    const [command, ...args] = message.toLowerCase().split(' ');
    
    switch(command) {
      case '!help':
        await this.client.sendMessage(`
          🎰 Casino Commands:
          !balance - Check your balance
          !rank - Check your rank
          !bet [amount] - Place a bet (${BOT_CONFIG.minBet}-${BOT_CONFIG.maxBet})
          !music - Toggle music
          !leaderboard - View top players
          !stats - View casino stats
        `);
        break;

      case '!balance':
        const userInfo = this.casino.getUserInfo(user.id);
        await this.client.sendMessage(`💰 ${user.username}'s balance: ${userInfo.balance} coins`);
        break;

      case '!rank':
        const rank = this.casino.getRank(user.id);
        await this.client.sendMessage(`🏆 ${user.username}'s rank: ${rank}`);
        break;

      case '!bet':
        const amount = parseInt(args[0]);
        if (isNaN(amount)) {
          await this.client.sendMessage('❌ Please specify a valid bet amount');
          return;
        }
        
        const result = await this.casino.placeBet(user.id, amount);
        if (result.success) {
          await this.client.sendMessage(`${result.win ? '🎉' : '😢'} ${user.username} ${result.message}`);
        } else {
          await this.client.sendMessage(`❌ ${result.message}`);
        }
        break;

      case '!music':
        const isPlaying = await this.music.toggle();
        await this.client.sendMessage(`🎵 Music ${isPlaying ? 'started' : 'stopped'}`);
        break;

      case '!leaderboard':
        const leaders = this.casino.getLeaderboard();
        const leaderBoard = leaders.map(([, user], index) => 
          `${index + 1}. ${user.balance} coins`
        ).join('\n');
        await this.client.sendMessage(`🏆 Top Players:\n${leaderBoard}`);
        break;

      case '!stats':
        const stats = this.casino.getHouseStats();
        await this.client.sendMessage(`
          📊 Casino Stats:
          House Balance: ${stats.balance} coins
          Total Players: ${stats.totalUsers}
          Total Bets: ${stats.totalBets}
        `);
        break;
    }
  }
}

const bot = new CasinoBot();
bot.start();