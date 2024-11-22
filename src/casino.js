import { BOT_CONFIG, RANKS } from './config.js';

export class CasinoManager {
  constructor() {
    this.users = new Map();
    this.houseBalance = 0;
  }

  getUserInfo(userId) {
    return this.users.get(userId) || this.createNewUser(userId);
  }

  createNewUser(userId) {
    const newUser = {
      balance: BOT_CONFIG.startingBalance,
      totalBets: 0,
      wins: 0,
      losses: 0
    };
    this.users.set(userId, newUser);
    return newUser;
  }

  calculateWinChance(betAmount) {
    // Dynamic win chance based on bet size and house edge
    const baseChance = 0.48; // Less than 50% for house edge
    const betFactor = Math.min(betAmount / BOT_CONFIG.maxBet, 1);
    return baseChance - (betFactor * BOT_CONFIG.houseEdge);
  }

  calculatePayout(betAmount, winChance) {
    // Higher risk bets get higher potential payouts
    const basePayout = betAmount * (1 / winChance);
    return Math.floor(basePayout * (1 - BOT_CONFIG.houseEdge));
  }

  async placeBet(userId, betAmount) {
    const userInfo = this.getUserInfo(userId);
    
    if (betAmount < BOT_CONFIG.minBet || betAmount > BOT_CONFIG.maxBet) {
      return {
        success: false,
        message: `Bet must be between ${BOT_CONFIG.minBet} and ${BOT_CONFIG.maxBet} coins`
      };
    }

    if (userInfo.balance < betAmount) {
      return {
        success: false,
        message: 'Insufficient balance'
      };
    }

    const winChance = this.calculateWinChance(betAmount);
    const win = Math.random() < winChance;
    const payout = this.calculatePayout(betAmount, winChance);

    userInfo.totalBets++;
    
    if (win) {
      userInfo.balance += payout;
      userInfo.wins++;
      this.houseBalance -= payout;
      return {
        success: true,
        win: true,
        amount: payout,
        message: `won ${payout} coins!`
      };
    } else {
      userInfo.balance -= betAmount;
      userInfo.losses++;
      this.houseBalance += betAmount;
      return {
        success: true,
        win: false,
        amount: betAmount,
        message: `lost ${betAmount} coins`
      };
    }
  }

  getRank(userId) {
    const balance = this.getUserInfo(userId).balance;
    let currentRank = 'Beginner';
    
    for (const [rank, requirement] of Object.entries(RANKS)) {
      if (balance >= requirement) {
        currentRank = rank;
      }
    }
    
    return currentRank;
  }

  getLeaderboard() {
    return Array.from(this.users.entries())
      .sort(([, a], [, b]) => b.balance - a.balance)
      .slice(0, 5);
  }

  getHouseStats() {
    return {
      balance: this.houseBalance,
      totalUsers: this.users.size,
      totalBets: Array.from(this.users.values()).reduce((sum, user) => sum + user.totalBets, 0)
    };
  }
}