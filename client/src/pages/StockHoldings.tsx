import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { RefreshCw, Wifi, Circle } from "lucide-react";
import { useStockWebSocket } from "@/hooks/useStockWebSocket";
import type { StockByName, GroupSummary, StockPrice } from "@shared/schema";

interface MarketStatus {
  isOpen: boolean;
  message: string;
  isClosed: boolean;
}

function formatKoreanCurrency(value: number): string {
  const absValue = Math.abs(value);
  if (absValue >= 1000000000000) {
    const jo = Math.floor(absValue / 1000000000000);
    const eok = Math.floor((absValue % 1000000000000) / 100000000);
    const man = Math.floor((absValue % 100000000) / 10000);
    if (man > 0) {
      return `${jo}조 ${eok.toLocaleString()}억 ${man.toLocaleString()}만원`;
    }
    return `${jo}조 ${eok.toLocaleString()}억원`;
  } else if (absValue >= 100000000) {
    const eok = Math.floor(absValue / 100000000);
    const man = Math.floor((absValue % 100000000) / 10000);
    if (man > 0) {
      return `${eok.toLocaleString()}억 ${man.toLocaleString()}만원`;
    }
    return `${eok.toLocaleString()}억원`;
  } else if (absValue >= 10000) {
    const man = Math.floor(absValue / 10000);
    return `${man.toLocaleString()}만원`;
  }
  return `${absValue.toLocaleString()}원`;
}

function formatEok(value: number): string {
  const eok = Math.floor(value / 100000000);
  return `${eok.toLocaleString()}억`;
}

export default function StockHoldings() {
  const { data: summary } = useQuery<GroupSummary>({
    queryKey: ["/api/summary"],
  });

  const { data: stocksByName } = useQuery<StockByName[]>({
    queryKey: ["/api/stocks-by-name"],
  });

  // 초기 주가 데이터 (폴백용)
  const { data: initialPrices } = useQuery<StockPrice[]>({
    queryKey: ["/api/stock-prices"],
  });

  // 시장 상태
  const { data: marketStatus } = useQuery<MarketStatus>({
    queryKey: ["/api/market/status"],
    refetchInterval: 60000,
  });

  // WebSocket 실시간 연결
  const { isConnected, prices: wsPrices, lastUpdate, getPrice: getWsPrice } = useStockWebSocket();

  // WebSocket 연결 실패 시 30초마다 가격 폴링 (배포환경 fallback)
  const { data: polledPrices } = useQuery<StockPrice[]>({
    queryKey: ["/api/stock-prices", "polling"],
    refetchInterval: isConnected ? false : 30000, // WebSocket 미연결시에만 30초 폴링
    enabled: !isConnected, // WebSocket 미연결시에만 활성화
    staleTime: 25000, // 25초 동안 fresh 상태 유지
  });

  // 실시간 가격 또는 폴링 가격 반환 (WebSocket > 폴링 > 초기값 순서)
  const getPriceForStock = (stockName: string): { currentPrice: number; changePercent: number } | undefined => {
    // 1. WebSocket 실시간 가격 우선
    const wsPrice = getWsPrice(stockName);
    if (wsPrice) {
      return { currentPrice: wsPrice.currentPrice, changePercent: wsPrice.changePercent };
    }
    // 2. 폴링 가격 (WebSocket 미연결시)
    const polledPrice = polledPrices?.find(p => p.stockName === stockName);
    if (polledPrice) {
      return { currentPrice: polledPrice.currentPrice, changePercent: polledPrice.changePercent };
    }
    // 3. 초기 가격 (fallback)
    const initialPrice = initialPrices?.find(p => p.stockName === stockName);
    if (initialPrice) {
      return { currentPrice: initialPrice.currentPrice, changePercent: initialPrice.changePercent };
    }
    return undefined;
  };

  // 실시간 현재가로 평가금액 계산
  const getRealtimeEval = (stock: StockByName) => {
    const price = getPriceForStock(stock.stockName);
    if (price && price.currentPrice > 0) {
      const evalAmount = price.currentPrice * stock.totalShares;
      const profitLoss = evalAmount - stock.totalBuyAmount;
      const profitLossPercent = (profitLoss / stock.totalBuyAmount) * 100;
      return { evalAmount, profitLoss, profitLossPercent, isRealtime: true, price };
    }
    return { 
      evalAmount: stock.totalEvalAmount, 
      profitLoss: stock.profitLoss, 
      profitLossPercent: stock.profitLossPercent,
      isRealtime: false,
      price: undefined
    };
  };

  // 전체 실시간 합계 계산
  const realtimeTotals = useMemo(() => {
    if (!stocksByName) return null;
    return stocksByName.reduce((acc, stock) => {
      const { evalAmount, profitLoss } = getRealtimeEval(stock);
      return {
        totalEval: acc.totalEval + evalAmount,
        totalProfit: acc.totalProfit + profitLoss,
        totalBuy: acc.totalBuy + stock.totalBuyAmount,
      };
    }, { totalEval: 0, totalProfit: 0, totalBuy: 0 });
  }, [stocksByName, wsPrices, polledPrices, initialPrices]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ko-KR', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  return (
    <div className="max-w-lg mx-auto p-4">
      <header className="text-center py-4 border-b border-border mb-4">
        <div className="flex items-center justify-center gap-2">
          <h1 className="text-lg font-semibold text-foreground" data-testid="text-header">
            종목별 보유 현황
          </h1>
          {marketStatus && (
            <div className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
              marketStatus.isOpen 
                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" 
                : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
            }`} data-testid="market-status">
              <Circle className={`h-2 w-2 ${marketStatus.isOpen ? "fill-green-500" : "fill-gray-400"}`} />
              {marketStatus.message}
            </div>
          )}
        </div>
        <div className="flex items-center justify-center gap-2 mt-1 text-xs text-muted-foreground">
          {isConnected ? (
            <Wifi className="h-3 w-3 text-green-500" />
          ) : (
            <RefreshCw className="h-3 w-3 text-blue-500" />
          )}
          <span data-testid="text-last-updated">
            {isConnected ? '실시간 연결' : '자동 갱신 (30초)'}
            {lastUpdate && ` · ${formatTime(lastUpdate)} 갱신`}
          </span>
        </div>
      </header>

      <Card className="p-4">
        <div className="mb-4 border-b border-primary pb-2 inline-block">
          <h2 className="text-sm font-medium text-muted-foreground">주식 보유 현황</h2>
        </div>
        
        {realtimeTotals && (
          <div className="mb-4">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-xl font-bold text-foreground" data-testid="text-total-value">
                {formatKoreanCurrency(realtimeTotals.totalEval)}
              </span>
              <span className={`text-sm font-medium ${realtimeTotals.totalProfit >= 0 ? "stock-up" : "stock-down"}`}>
                {realtimeTotals.totalProfit >= 0 ? "+" : ""}{formatKoreanCurrency(realtimeTotals.totalProfit)}
              </span>
              <span className={`text-sm font-medium ${realtimeTotals.totalProfit >= 0 ? "stock-up" : "stock-down"}`}>
                {realtimeTotals.totalBuy > 0 
                  ? `${realtimeTotals.totalProfit >= 0 ? "+" : ""}${((realtimeTotals.totalProfit / realtimeTotals.totalBuy) * 100).toFixed(1)}%`
                  : "0%"}
              </span>
            </div>
            {summary && (
              <div className="text-sm mt-1">
                <span className="text-muted-foreground">일일손익 </span>
                <span className={summary.dailyProfitLoss >= 0 ? "stock-up" : "stock-down"}>
                  {summary.dailyProfitLoss >= 0 ? "+" : ""}{formatKoreanCurrency(summary.dailyProfitLoss)}
                  ({summary.dailyProfitLossPercent >= 0 ? "+" : ""}{summary.dailyProfitLossPercent.toFixed(1)}%)
                </span>
              </div>
            )}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-1 text-muted-foreground font-medium">종목명</th>
                <th className="text-right py-2 px-1 text-muted-foreground font-medium whitespace-nowrap">현재가<br/>등락</th>
                <th className="text-right py-2 px-1 text-muted-foreground font-medium whitespace-nowrap">매수가<br/>주식수</th>
                <th className="text-right py-2 px-1 text-muted-foreground font-medium">평가금액</th>
                <th className="text-right py-2 px-1 text-muted-foreground font-medium whitespace-nowrap">평가손익<br/>수익률</th>
              </tr>
            </thead>
            <tbody>
              {stocksByName?.map((stock) => {
                const price = getPriceForStock(stock.stockName);
                const realtime = getRealtimeEval(stock);
                return (
                  <tr 
                    key={stock.stockName} 
                    className="border-b border-border/50 hover-elevate"
                    data-testid={`stock-row-${stock.stockName}`}
                  >
                    <td className="py-3 px-1 font-medium text-foreground">{stock.stockName}</td>
                    <td className="py-3 px-1 text-right">
                      {price ? (
                        <>
                          <div className="text-foreground">{price.currentPrice.toLocaleString()}원</div>
                          <div className={`text-xs ${price.changePercent >= 0 ? "stock-up" : "stock-down"}`}>
                            {price.changePercent >= 0 ? "+" : ""}{price.changePercent.toFixed(2)}%
                          </div>
                        </>
                      ) : (
                        <div className="text-muted-foreground">-</div>
                      )}
                    </td>
                    <td className="py-3 px-1 text-right">
                      <div className="text-foreground">{formatEok(stock.totalBuyAmount)}</div>
                      <div className="text-muted-foreground text-xs">{stock.totalShares.toLocaleString()}주</div>
                    </td>
                    <td className="py-3 px-1 text-right text-foreground">
                      {formatEok(realtime.evalAmount)}
                    </td>
                    <td className="py-3 px-1 text-right">
                      <div className={realtime.profitLoss >= 0 ? "stock-up" : "stock-down"}>
                        {realtime.profitLoss >= 0 ? "+" : ""}{formatEok(realtime.profitLoss)}
                      </div>
                      <div className={`text-xs ${realtime.profitLossPercent >= 0 ? "stock-up" : "stock-down"}`}>
                        {realtime.profitLossPercent >= 0 ? "+" : ""}{realtime.profitLossPercent.toFixed(1)}%
                      </div>
                    </td>
                  </tr>
                );
              })}
              {(!stocksByName || stocksByName.length === 0) && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted-foreground">
                    보유 현황이 없습니다
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
