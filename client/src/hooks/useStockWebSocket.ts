import { useState, useEffect, useCallback, useRef } from 'react';

interface StockPriceUpdate {
  stockCode: string;
  stockName: string;
  currentPrice: number;
  changeAmount: number;
  changePercent: number;
  volume: number;
  timestamp: string;
}

interface WebSocketMessage {
  type: 'price_update' | 'connection_status' | 'subscribed';
  data?: StockPriceUpdate | { connected: boolean } | { stocks: string[] };
}

export function useStockWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [prices, setPrices] = useState<Map<string, StockPriceUpdate>>(new Map());
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/prices`;

    try {
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('[WS] 연결됨 - URL:', wsUrl);
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          
          if (message.type === 'price_update' && message.data) {
            const update = message.data as StockPriceUpdate;
            setPrices(prev => {
              const newMap = new Map(prev);
              newMap.set(update.stockName, update);
              return newMap;
            });
            setLastUpdate(new Date());
          } else if (message.type === 'connection_status') {
            const status = message.data as { connected: boolean };
            console.log('[WS] KIS 연결 상태:', status.connected);
            if (!status.connected) {
              console.warn('[WS] KIS 서버 연결 안됨 - 실시간 가격 업데이트 불가');
            }
          }
        } catch (error) {
          console.error('[WS] 메시지 파싱 오류:', error);
        }
      };

      ws.onclose = (event) => {
        console.log('[WS] 연결 종료됨 - 코드:', event.code, '이유:', event.reason || 'none');
        setIsConnected(false);
        wsRef.current = null;
        
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('[WS] 재연결 시도...');
          connect();
        }, 3000);
      };

      ws.onerror = (error) => {
        console.error('[WS] 연결 오류 발생');
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('[WS] 연결 실패:', error);
    }
  }, []);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  const subscribe = useCallback((stocks: string[]) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'subscribe',
        stocks
      }));
    }
  }, []);

  const getPrice = useCallback((stockName: string): StockPriceUpdate | undefined => {
    return prices.get(stockName);
  }, [prices]);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return {
    isConnected,
    prices,
    lastUpdate,
    getPrice,
    subscribe,
  };
}
