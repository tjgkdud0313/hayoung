import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import type { HoldingCompanyGroup } from "@shared/schema";

function formatEok(value: number): string {
  const eok = Math.floor(Math.abs(value) / 100000000);
  return `${eok.toLocaleString()}억`;
}

export default function HoldingCompanyView() {
  const { data: groups } = useQuery<HoldingCompanyGroup[]>({
    queryKey: ["/api/holding-company-groups"],
  });

  const okGroupCodes = ["OK", "OC", "OKH", "OT", "OKIP", "OFI"];

  return (
    <div className="max-w-lg mx-auto p-4">
      <header className="text-center py-4 border-b border-border mb-4">
        <h1 className="text-lg font-semibold text-foreground" data-testid="text-header">
          금융지주 보유 현황
        </h1>
      </header>

      <Card className="p-4">
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
              {groups?.flatMap((group) =>
                group.subsidiaries.map((subGroup) => {
                    const isOKGroup = okGroupCodes.includes(subGroup.subsidiary.code);
                    return (
                      <tr 
                        key={subGroup.subsidiary.id}
                        className={`border-b border-border/50 hover-elevate ${
                          isOKGroup ? "border-l-2 border-l-red-500" : ""
                        }`}
                        data-testid={`holding-company-row-${subGroup.subsidiary.code}`}
                      >
                        <td className="py-3 px-1 font-medium text-foreground">
                          {subGroup.subsidiary.code}
                        </td>
                        <td className="py-3 px-1 text-right">
                          <div className="text-foreground">{formatEok(subGroup.totalBuyAmount)}</div>
                          <div className="text-muted-foreground text-xs">
                            {subGroup.holdings.reduce((sum, h) => sum + h.shares, 0).toLocaleString()}주
                          </div>
                        </td>
                        <td className="py-3 px-1 text-right text-foreground">
                          {formatEok(subGroup.totalEvalAmount)}
                        </td>
                        <td className="py-3 px-1 text-right">
                          <div className={subGroup.profitLoss >= 0 ? "stock-up" : "stock-down"}>
                            {subGroup.profitLoss >= 0 ? "" : "-"}{formatEok(subGroup.profitLoss)}
                          </div>
                          <div className={`text-xs ${subGroup.profitLossPercent >= 0 ? "stock-up" : "stock-down"}`}>
                            {subGroup.profitLossPercent >= 0 ? "+" : ""}{subGroup.profitLossPercent.toFixed(2)}%
                          </div>
                        </td>
                        <td className="py-3 px-1 text-right text-foreground">
                          {subGroup.shareRatio.toFixed(2)}%
                        </td>
                      </tr>
                    );
                })
              )}
              {(!groups || groups.length === 0) && (
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
