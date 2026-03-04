import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Subsidiary, SubsidiaryHolding, GroupSummary } from "@shared/schema";

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

export default function SubsidiaryHoldings() {
  const [selectedSubsidiary, setSelectedSubsidiary] = useState<string>("all");

  const { data: subsidiaries } = useQuery<Subsidiary[]>({
    queryKey: ["/api/subsidiaries"],
  });

  const { data: summary } = useQuery<GroupSummary>({
    queryKey: ["/api/summary"],
  });

  const { data: allHoldings } = useQuery<SubsidiaryHolding[]>({
    queryKey: ["/api/holdings"],
  });

  const okSubsidiaries = subsidiaries?.filter(s => 
    ["OK", "OC", "OKH", "OT", "OKIP", "OFI"].includes(s.code)
  ) || [];

  const filteredHoldings = selectedSubsidiary === "all" 
    ? allHoldings?.filter(h => okSubsidiaries.some(s => s.id === h.subsidiaryId))
    : allHoldings?.filter(h => h.subsidiaryId === selectedSubsidiary);

  const totalEvalAmount = filteredHoldings?.reduce((sum, h) => sum + h.evalAmount, 0) || 0;
  const totalProfitLoss = filteredHoldings?.reduce((sum, h) => sum + h.profitLoss, 0) || 0;
  const totalBuyAmount = filteredHoldings?.reduce((sum, h) => sum + h.buyPrice, 0) || 0;
  const profitLossPercent = totalBuyAmount > 0 ? (totalProfitLoss / totalBuyAmount) * 100 : 0;

  return (
    <div className="max-w-lg mx-auto p-4">
      <header className="text-center py-4 border-b border-border mb-4">
        <h1 className="text-lg font-semibold text-foreground" data-testid="text-header">
          계열사 주식 보유 현황
        </h1>
      </header>

      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <Select value={selectedSubsidiary} onValueChange={setSelectedSubsidiary}>
            <SelectTrigger className="w-24" data-testid="select-subsidiary">
              <SelectValue placeholder="전체" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              {okSubsidiaries.map((sub) => (
                <SelectItem key={sub.id} value={sub.id}>
                  {sub.code}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="text-right">
            <div className="flex items-baseline gap-2 justify-end flex-wrap">
              <span className="text-xl font-bold text-foreground" data-testid="text-total-value">
                {formatKoreanCurrency(selectedSubsidiary === "all" && summary ? summary.totalEvalAmount : totalEvalAmount)}
              </span>
            </div>
            <div className="flex items-center gap-2 justify-end">
              <span className={`text-sm font-medium ${totalProfitLoss >= 0 ? "stock-up" : "stock-down"}`}>
                {formatKoreanCurrency(totalProfitLoss)}
              </span>
              <span className={`text-sm font-medium ${profitLossPercent >= 0 ? "stock-up" : "stock-down"}`}>
                {profitLossPercent >= 0 ? "+" : ""}{profitLossPercent.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-1 text-muted-foreground font-medium">종목명</th>
                <th className="text-right py-2 px-1 text-muted-foreground font-medium whitespace-nowrap">매수가<br/>주식수</th>
                <th className="text-right py-2 px-1 text-muted-foreground font-medium">평가금액</th>
                <th className="text-right py-2 px-1 text-muted-foreground font-medium whitespace-nowrap">평가손익<br/>수익률</th>
                <th className="text-right py-2 px-1 text-muted-foreground font-medium">지분율</th>
              </tr>
            </thead>
            <tbody>
              {filteredHoldings?.map((holding) => (
                <tr 
                  key={holding.id} 
                  className="border-b border-border/50 hover-elevate"
                  data-testid={`holding-row-${holding.id}`}
                >
                  <td className="py-3 px-1 font-medium text-foreground">{holding.stockNameKr}</td>
                  <td className="py-3 px-1 text-right">
                    <div className="text-foreground">{formatEok(holding.buyPrice)}</div>
                    <div className="text-muted-foreground text-xs">{holding.shares.toLocaleString()}주</div>
                  </td>
                  <td className="py-3 px-1 text-right text-foreground">{formatEok(holding.evalAmount)}</td>
                  <td className="py-3 px-1 text-right">
                    <div className={holding.profitLoss >= 0 ? "stock-up" : "stock-down"}>
                      {formatEok(holding.profitLoss)}
                    </div>
                    <div className={`text-xs ${holding.profitLossPercent >= 0 ? "stock-up" : "stock-down"}`}>
                      {holding.profitLossPercent >= 0 ? "+" : ""}{holding.profitLossPercent.toFixed(1)}%
                    </div>
                  </td>
                  <td className="py-3 px-1 text-right text-foreground">{holding.shareRatio.toFixed(2)}%</td>
                </tr>
              ))}
              {(!filteredHoldings || filteredHoldings.length === 0) && (
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
