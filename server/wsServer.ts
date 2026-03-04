import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'http';
import { kisWebSocketClient } from './kisWebSocket';
import { storage } from './storage';

interface ClientMessage {
  type: 'subscribe' | 'unsubscribe';
  stocks?: string[];
}

interface ServerMessage {
  type: 'price_update' | 'connection_status' | 'subscribed';
  data?: unknown;
}

class StockWebSocketServer {
  private wss: WebSocketServer | null = null;
  private clients: Set<WebSocket> = new Set();

  initialize(server: Server): void {
    // noServer 모드로 초기화하여 Vite HMR과 충돌 방지
    this.wss = new WebSocketServer({ noServer: true });

    // upgrade 이벤트를 수동으로 처리
    server.on('upgrade', (request, socket, head) => {
      const url = request.url || '';
      // 쿼리 파라미터 제거하여 순수 경로만 추출
      const pathname = url.split('?')[0];
      
      console.log('[WS Server] Upgrade 요청:', url, '-> 경로:', pathname);
      
      // /ws/prices 경로만 처리, 다른 경로 (Vite HMR 등)는 무시
      if (pathname === '/ws/prices') {
        console.log('[WS Server] /ws/prices 업그레이드 처리 중...');
        this.wss!.handleUpgrade(request, socket, head, (ws) => {
          this.wss!.emit('connection', ws, request);
        });
      }
      // 다른 경로는 Vite HMR 등 다른 핸들러가 처리하도록 무시
    });

    this.wss.on('connection', (ws: WebSocket) => {
      console.log('[WS Server] 클라이언트 연결됨');
      this.clients.add(ws);

      this.sendToClient(ws, {
        type: 'connection_status',
        data: { connected: kisWebSocketClient.getConnectionStatus() }
      });

      ws.on('message', (message: Buffer) => {
        try {
          const data: ClientMessage = JSON.parse(message.toString());
          this.handleClientMessage(ws, data);
        } catch (error) {
          console.error('[WS Server] 메시지 파싱 오류:', error);
        }
      });

      ws.on('close', () => {
        console.log('[WS Server] 클라이언트 연결 종료');
        this.clients.delete(ws);
      });

      ws.on('error', (error) => {
        console.error('[WS Server] 클라이언트 오류:', error);
        this.clients.delete(ws);
      });
    });

    kisWebSocketClient.onPriceUpdate((update) => {
      this.broadcast({
        type: 'price_update',
        data: update
      });
    });

    this.initializeKISConnection();

    console.log('[WS Server] WebSocket 서버 시작됨 (경로: /ws/prices)');
  }

  private async initializeKISConnection(): Promise<void> {
    await kisWebSocketClient.connect();

    const holdings = await storage.getHoldings();
    const stockNames = holdings.map(h => h.stockName);
    const uniqueStocks: string[] = Array.from(new Set(stockNames));
    
    console.log(`[WS Server] ${uniqueStocks.length}개 종목 구독 시작`);
    kisWebSocketClient.subscribeMultiple(uniqueStocks);
  }

  private handleClientMessage(ws: WebSocket, message: ClientMessage): void {
    switch (message.type) {
      case 'subscribe':
        if (message.stocks) {
          kisWebSocketClient.subscribeMultiple(message.stocks);
          this.sendToClient(ws, {
            type: 'subscribed',
            data: { stocks: message.stocks }
          });
        }
        break;
    }
  }

  private sendToClient(ws: WebSocket, message: ServerMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  private broadcast(message: ServerMessage): void {
    const data = JSON.stringify(message);
    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  }

  getClientCount(): number {
    return this.clients.size;
  }
}

export const stockWebSocketServer = new StockWebSocketServer();
