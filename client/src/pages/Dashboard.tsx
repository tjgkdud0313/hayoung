import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight, LogIn, LogOut, User, Circle } from "lucide-react";
import { Link } from "wouter";
import type { GroupSummary, SubsidiarySummary, Transaction } from "@shared/schema";
import { TransactionUploadModal } from "@/components/TransactionUploadModal";
import { ManualTransactionForm } from "@/components/ManualTransactionForm";
import { StockPriceRefreshButton } from "@/components/StockPriceRefreshButton";
import { useAuth } from "@/hooks/use-auth";
import { useAdmin } from "@/hooks/use-admin";

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

export default function Dashboard() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { isAdmin } = useAdmin();

  const { data: summary } = useQuery<GroupSummary>({
    queryKey: ["/api/summary"],
    refetchInterval: 30000,
  });

  const { data: subsidiaries } = useQuery<SubsidiarySummary[]>({
    queryKey: ["/api/subsidiary-summaries"],
    refetchInterval: 30000,
  });

  const { data: transactions } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions/today"],
  });

  const { data: marketStatus } = useQuery<MarketStatus>({
    queryKey: ["/api/market/status"],
    refetchInterval: 60000, // 1분마다 새로고침
  });

  return (
    <div className="max-w-lg mx-auto p-4">
      <header className="py-4 border-b border-border mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold text-foreground" data-testid="text-header">
              주식 현황판
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
          <div className="flex items-center gap-2">
            {authLoading ? (
              <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
            ) : isAuthenticated ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">{user?.firstName || user?.email || "사용자"}</span>
                  {isAdmin && (
                    <span className="text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded">관리자</span>
                  )}
                </div>
                <Button variant="ghost" size="sm" asChild data-testid="button-logout">
                  <a href="/api/logout">
                    <LogOut className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            ) : (
              <Button variant="outline" size="sm" asChild data-testid="button-login">
                <a href="/api/login">
                  <LogIn className="h-4 w-4 mr-1" />
                  로그인
                </a>
              </Button>
            )}
          </div>
        </div>
        {isAdmin && (
          <div className="flex items-center justify-center gap-2">
            <ManualTransactionForm />
            <TransactionUploadModal />
            <StockPriceRefreshButton />
          </div>
        )}
      </header>

      <Card className="p-4 mb-4">
        <h2 className="text-sm font-medium text-muted-foreground mb-2 border-b border-primary pb-1 inline-block">
          그룹사 총 주식 현황
        </h2>
        {summary && (
          <div className="space-y-2">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-2xl font-bold text-foreground" data-testid="text-total-value">
                {formatKoreanCurrency(summary.totalEvalAmount)}
              </span>
              <span className={`text-lg font-semibold ${summary.totalProfitLoss >= 0 ? "stock-up" : "stock-down"}`}>
                {formatKoreanCurrency(summary.totalProfitLoss)}
              </span>
              <span className={`text-lg font-semibold ${summary.totalProfitLossPercent >= 0 ? "stock-up" : "stock-down"}`}>
                {summary.totalProfitLossPercent >= 0 ? "+" : ""}{summary.totalProfitLossPercent.toFixed(1)}%
              </span>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">일일손익 </span>
              <span className={summary.dailyProfitLoss >= 0 ? "stock-up" : "stock-down"}>
                {summary.dailyProfitLoss >= 0 ? "+" : ""}{formatKoreanCurrency(summary.dailyProfitLoss)}
                ({summary.dailyProfitLossPercent >= 0 ? "+" : ""}{summary.dailyProfitLossPercent.toFixed(1)}%)
              </span>
            </div>
          </div>
        )}
      </Card>

      <Card className="p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-muted-foreground border-b border-primary pb-1 inline-block">
            계열사별 주식 현황
          </h2>
          <Link href="/subsidiary">
            <button className="flex items-center text-xs text-muted-foreground hover:text-foreground" data-testid="button-view-more">
              <ChevronRight className="h-4 w-4" />
              더보기
            </button>
          </Link>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between py-2 px-3 text-xs text-muted-foreground border-b">
            <span className="min-w-[60px]">계열사</span>
            <div className="flex items-center gap-3">
              <span className="w-20 text-right">평가금액</span>
              <span className="w-20 text-right">평가손익</span>
              <span className="w-14 text-right">수익률</span>
            </div>
          </div>
          {subsidiaries?.map((sub) => (
            <Link key={sub.id} href="/subsidiary">
              <div
                className="flex items-center justify-between py-3 px-3 bg-muted/30 rounded-lg hover-elevate cursor-pointer"
                data-testid={`subsidiary-card-${sub.code}`}
              >
                <span className="font-medium text-foreground min-w-[60px]">{sub.code}</span>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-foreground font-medium w-20 text-right">
                    {formatKoreanCurrency(sub.evalAmount)}
                  </span>
                  <span className={`font-medium w-20 text-right ${sub.profitLoss >= 0 ? "stock-up" : "stock-down"}`}>
                    {sub.profitLoss >= 0 ? "+" : ""}{formatKoreanCurrency(sub.profitLoss)}
                  </span>
                  <span className={`font-medium w-14 text-right ${sub.profitLossPercent >= 0 ? "stock-up" : "stock-down"}`}>
                    {sub.profitLossPercent >= 0 ? "+" : ""}{sub.profitLossPercent.toFixed(1)}%
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <h2 className="text-sm font-medium text-muted-foreground mb-3 border-b border-primary pb-1 inline-block">
          금일 매매내역
        </h2>
        <div className="space-y-2">
          {transactions?.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              오늘 매매내역이 없습니다
            </p>
          )}
          {transactions?.map((tx) => (
            <div
              key={tx.id}
              className="flex items-center justify-between py-3 px-3 bg-muted/30 rounded-lg"
              data-testid={`transaction-${tx.id}`}
            >
              <div className="flex items-center gap-3">
                <span className={`text-sm font-medium px-2 py-0.5 rounded ${
                  tx.type === "buy" ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" : "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                }`}>
                  {tx.type === "buy" ? "매수" : "매도"}
                </span>
                <span className="font-medium text-foreground">{tx.stockName}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className="text-muted-foreground">{tx.shares.toLocaleString()}주</span>
                <span className="text-muted-foreground">{tx.pricePerShare.toLocaleString()}원</span>
                <span className="font-medium text-foreground">{formatKoreanCurrency(tx.totalAmount)}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
