import WebSocket from 'ws';
import { ICECAST_CONFIG } from './config.js';

export class MusicPlayer {
  constructor() {
    this.playing = false;
    this.ws = null;
  }

  async toggle() {
    if (this.playing) {
      await this.stop();
    } else {
      await this.play();
    }
    return this.playing;
  }

  async play() {
    try {
      const url = `ws://${ICECAST_CONFIG.host}:${ICECAST_CONFIG.port}${ICECAST_CONFIG.mount}`;
      this.ws = new WebSocket(url);
      
      this.ws.on('open', () => {
        this.ws.send(`SOURCE ${ICECAST_CONFIG.auth}`);
        this.playing = true;
      });

      this.ws.on('error', (error) => {
        console.error('Music player error:', error);
        this.playing = false;
      });
    } catch (error) {
      console.error('Failed to start music:', error);
      this.playing = false;
    }
  }

  async stop() {
    if (this.ws) {
      try {
        this.ws.close();
        this.ws = null;
      } catch (error) {
        console.error('Failed to stop music:', error);
      }
    }
    this.playing = false;
  }
}