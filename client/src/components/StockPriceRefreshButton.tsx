import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { RefreshCw, Wifi, WifiOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface RefreshResult {
  success: boolean;
  message: string;
  updatedCount: number;
  failedCount: number;
  errors?: string[];
  source: string;
}

interface KISStatus {
  configured: boolean;
  connected: boolean;
  message: string;
}

export function StockPriceRefreshButton() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: kisStatus } = useQuery<KISStatus>({
    queryKey: ["/api/kis/status"],
  });

  const refreshMutation = useMutation({
    mutationFn: async (): Promise<RefreshResult> => {
      const response = await fetch("/api/stock-prices/refresh", {
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "주가 업데이트 실패");
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/summary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/subsidiary-summaries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/holdings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stocks-by-name"] });
      queryClient.invalidateQueries({ queryKey: ["/api/holding-company-groups"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stock-prices"] });
      toast({
        title: "주가 업데이트 완료",
        description: `${data.source}로 ${data.updatedCount}개 종목 업데이트${data.failedCount > 0 ? ` (${data.failedCount}개 실패)` : ""}`,
      });
    },
    onError: (error) => {
      toast({
        title: "업데이트 실패",
        description: (error as Error).message,
        variant: "destructive",
      });
    },
  });

  return (
    <div className="flex items-center gap-2">
      {kisStatus && (
        <div className="flex items-center gap-1 text-xs">
          {kisStatus.connected ? (
            <>
              <Wifi className="h-3 w-3 text-green-500" />
              <span className="text-green-600">KIS API</span>
            </>
          ) : kisStatus.configured ? (
            <>
              <WifiOff className="h-3 w-3 text-yellow-500" />
              <span className="text-yellow-600" title={kisStatus.message}>연결 오류</span>
            </>
          ) : (
            <>
              <WifiOff className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">Mock</span>
            </>
          )}
        </div>
      )}
      <Button
        variant="outline"
        size="sm"
        onClick={() => refreshMutation.mutate()}
        disabled={refreshMutation.isPending}
        data-testid="button-refresh-prices"
      >
        <RefreshCw className={`h-4 w-4 mr-1 ${refreshMutation.isPending ? "animate-spin" : ""}`} />
        {refreshMutation.isPending ? "업데이트 중..." : "주가 새로고침"}
      </Button>
    </div>
  );
}
