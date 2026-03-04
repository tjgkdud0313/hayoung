import WebSocket from 'ws';
import { kisApiClient } from './kisApi';

interface StockPriceUpdate {
  stockCode: string;
  stockName: string;
  currentPrice: number;
  changeAmount: number;
  changePercent: number;
  volume: number;
  timestamp: string;
}

type PriceUpdateCallback = (update: StockPriceUpdate) => void;

class KISWebSocketClient {
  private ws: WebSocket | null = null;
  private isConnected: boolean = false;
  private subscribedStocks: Set<string> = new Set();
  private callbacks: PriceUpdateCallback[] = [];
  private reconnectTimer: NodeJS.Timeout | null = null;
  private pingInterval: NodeJS.Timeout | null = null;
  private approvalKey: string | null = null;

  private readonly wsUrl = 'ws://ops.koreainvestment.com:21000';
  private readonly appKey = process.env.KIS_APP_KEY || '';
  private readonly appSecret = process.env.KIS_APP_SECRET || '';

  async connect(): Promise<void> {
    if (!this.appKey || !this.appSecret) {
      console.log('[KIS WebSocket] API 키가 설정되지 않음, 연결 건너뜀');
      return;
    }

    try {
      this.approvalKey = await this.getApprovalKey();
      if (!this.approvalKey) {
        console.error('[KIS WebSocket] Approval Key 발급 실패');
        return;
      }

      this.ws = new WebSocket(this.wsUrl);

      this.ws.on('open', () => {
        console.log('[KIS WebSocket] 연결됨');
        this.isConnected = true;
        this.resubscribeAll();
        this.startPing();
      });

      this.ws.on('message', (data: WebSocket.Data) => {
        this.handleMessage(data.toString());
      });

      this.ws.on('close', () => {
        console.log('[KIS WebSocket] 연결 종료됨');
        this.isConnected = false;
        this.stopPing();
        this.scheduleReconnect();
      });

      this.ws.on('error', (error) => {
        console.error('[KIS WebSocket] 오류:', error.message);
      });

    } catch (error) {
      console.error('[KIS WebSocket] 연결 실패:', error);
      this.scheduleReconnect();
    }
  }

  private async getApprovalKey(): Promise<string | null> {
    try {
      const response = await fetch('https://openapi.koreainvestment.com:9443/oauth2/Approval', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
        body: JSON.stringify({
          grant_type: 'client_credentials',
          appkey: this.appKey,
          secretkey: this.appSecret,
        }),
      });

      if (!response.ok) {
        console.error('[KIS WebSocket] Approval Key 요청 실패:', response.status);
        return null;
      }

      const data = await response.json();
      console.log('[KIS WebSocket] Approval Key 발급 완료');
      return data.approval_key;
    } catch (error) {
      console.error('[KIS WebSocket] Approval Key 발급 오류:', error);
      return null;
    }
  }

  private handleMessage(data: string): void {
    try {
      if (data.startsWith('{')) {
        const json = JSON.parse(data);
        if (json.header?.tr_id === 'PINGPONG') {
          return;
        }
        if (json.body?.msg_cd === 'OPSP0000') {
          console.log('[KIS WebSocket] 구독 성공:', json.body.msg1);
          return;
        }
        // 기타 JSON 메시지 로깅 (에러 등)
        if (json.body?.msg_cd && json.body.msg_cd !== 'OPSP0000') {
          console.log('[KIS WebSocket] 메시지:', json.body.msg_cd, json.body.msg1);
        }
        return;
      }

      if (data.includes('|')) {
        const parts = data.split('|');
        if (parts.length >= 4) {
          const trId = parts[1];
          const dataCount = parseInt(parts[2]);
          const priceData = parts[3];

          if (trId === 'H0STCNT0' && priceData) {
            this.parseRealtimePrice(priceData);
          }
        }
      }
    } catch (error) {
      console.error('[KIS WebSocket] 메시지 파싱 오류:', error);
    }
  }

  private parseRealtimePrice(data: string): void {
    const fields = data.split('^');
    if (fields.length < 20) {
      console.log('[KIS WebSocket] 체결가 데이터 필드 부족:', fields.length);
      return;
    }

    const stockCode = fields[0];
    const currentPrice = parseInt(fields[2]) || 0;
    const changeSign = fields[3];
    const changeAmount = parseInt(fields[4]) || 0;
    const changePercent = parseFloat(fields[5]) || 0;
    const volume = parseInt(fields[12]) || 0;

    const signMultiplier = ['1', '2'].includes(changeSign) ? 1 : ['4', '5'].includes(changeSign) ? -1 : 1;

    const stockName = this.getStockNameByCode(stockCode);

    const update: StockPriceUpdate = {
      stockCode,
      stockName: stockName || stockCode,
      currentPrice,
      changeAmount: Math.abs(changeAmount) * signMultiplier,
      changePercent: Math.abs(changePercent) * signMultiplier,
      volume,
      timestamp: new Date().toISOString(),
    };

    console.log(`[KIS WebSocket] 실시간 체결: ${stockName || stockCode} = ${currentPrice.toLocaleString()}원`);
    this.callbacks.forEach(callback => callback(update));
  }

  private getStockNameByCode(stockCode: string): string | null {
    // kisApiClient의 전체 종목코드 매핑 사용
    return kisApiClient.getStockNameByCode(stockCode);
  }

  subscribe(stockCode: string): void {
    if (!this.isConnected || !this.ws || !this.approvalKey) {
      this.subscribedStocks.add(stockCode);
      return;
    }

    const request = {
      header: {
        approval_key: this.approvalKey,
        custtype: 'P',
        tr_type: '1',
        'content-type': 'utf-8',
      },
      body: {
        input: {
          tr_id: 'H0STCNT0',
          tr_key: stockCode,
        },
      },
    };

    this.ws.send(JSON.stringify(request));
    this.subscribedStocks.add(stockCode);
    console.log(`[KIS WebSocket] ${stockCode} 구독 요청`);
  }

  subscribeByName(stockName: string): void {
    const stockCode = kisApiClient.getStockCode(stockName);
    if (stockCode) {
      this.subscribe(stockCode);
    }
  }

  subscribeMultiple(stockNames: string[]): void {
    stockNames.forEach(name => this.subscribeByName(name));
  }

  private resubscribeAll(): void {
    this.subscribedStocks.forEach(stockCode => {
      setTimeout(() => this.subscribe(stockCode), 100);
    });
  }

  onPriceUpdate(callback: PriceUpdateCallback): void {
    this.callbacks.push(callback);
  }

  private startPing(): void {
    this.pingInterval = setInterval(() => {
      if (this.ws && this.isConnected) {
        const pingRequest = {
          header: {
            tr_id: 'PINGPONG',
            datetime: new Date().toISOString(),
          },
        };
        this.ws.send(JSON.stringify(pingRequest));
      }
    }, 30000);
  }

  private stopPing(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;
    
    console.log('[KIS WebSocket] 5초 후 재연결 시도...');
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, 5000);
  }

  disconnect(): void {
    this.stopPing();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }
}

export const kisWebSocketClient = new KISWebSocketClient();
