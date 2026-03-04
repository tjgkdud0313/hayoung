import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, CheckCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { Subsidiary, SubsidiaryHolding } from "@shared/schema";

interface StockInfo {
  name: string;
  code: string;
}

interface TransactionFormData {
  type: "buy" | "sell";
  subsidiaryCode: string;
  stockName: string;
  shares: number;
  pricePerShare: number;
  date?: string;
}

export function ManualTransactionForm() {
  const [open, setOpen] = useState(false);
  const [success, setSuccess] = useState(false);
  const [selectedStock, setSelectedStock] = useState<string>("");
  const [newStockSearch, setNewStockSearch] = useState("");
  const [formData, setFormData] = useState({
    type: "buy" as "buy" | "sell",
    subsidiaryCode: "",
    shares: 0,
    settlementAmount: 0,
  });
  const queryClient = useQueryClient();

  const { data: subsidiaries } = useQuery<Subsidiary[]>({
    queryKey: ["/api/subsidiaries"],
  });

  const selectedSubsidiary = subsidiaries?.find(s => s.code === formData.subsidiaryCode);

  const { data: subsidiaryHoldings } = useQuery<SubsidiaryHolding[]>({
    queryKey: ["/api/holdings/subsidiary", selectedSubsidiary?.id],
    enabled: !!selectedSubsidiary?.id,
  });

  const { data: allStocks } = useQuery<StockInfo[]>({
    queryKey: ["/api/stocks/list"],
  });

  const holdingStocks = subsidiaryHoldings
    ? Array.from(new Map(subsidiaryHoldings.map(h => [h.stockName, h.stockName])).values())
    : [];

  const filteredNewStocks = allStocks?.filter(s => 
    s.name.toLowerCase().includes(newStockSearch.toLowerCase()) ||
    s.code.includes(newStockSearch)
  ) || [];

  const submitMutation = useMutation({
    mutationFn: async (data: TransactionFormData) => {
      const response = await apiRequest("POST", "/api/transactions/manual", data);
      return response.json();
    },
    onSuccess: () => {
      setSuccess(true);
      queryClient.invalidateQueries({ queryKey: ["/api/summary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/subsidiary-summaries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/holdings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions/today"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stocks-by-name"] });
      queryClient.invalidateQueries({ queryKey: ["/api/holding-company-groups"] });
      setTimeout(() => {
        setSuccess(false);
        resetForm();
      }, 1500);
    },
  });

  const resetForm = () => {
    setSelectedStock("");
    setNewStockSearch("");
    setFormData({
      type: "buy",
      subsidiaryCode: "",
      shares: 0,
      settlementAmount: 0,
    });
  };

  const handleClose = () => {
    setOpen(false);
    setSuccess(false);
    resetForm();
    submitMutation.reset();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedStock || !formData.subsidiaryCode || formData.shares <= 0 || formData.settlementAmount <= 0) {
      return;
    }

    const pricePerShare = Math.round(formData.settlementAmount / formData.shares);
    
    const submitData: TransactionFormData = {
      type: formData.type,
      subsidiaryCode: formData.subsidiaryCode,
      stockName: selectedStock,
      shares: formData.shares,
      pricePerShare: pricePerShare,
      date: new Date().toISOString().split("T")[0],
    };
    
    submitMutation.mutate(submitData);
  };

  const isValid = selectedStock && formData.subsidiaryCode && formData.shares > 0 && formData.settlementAmount > 0;
  
  const calculatedPricePerShare = formData.shares > 0 
    ? Math.round(formData.settlementAmount / formData.shares) 
    : 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" data-testid="button-manual-transaction">
          <Plus className="h-4 w-4 mr-1" />
          거래 입력
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>거래 수동 입력</DialogTitle>
          <DialogDescription>종목 매수/매도 거래를 직접 입력합니다.</DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="flex flex-col items-center justify-center py-8">
            <CheckCircle className="h-12 w-12 text-green-500 mb-3" />
            <p className="text-lg font-medium text-green-600">거래가 등록되었습니다!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">거래 구분</Label>
                <Select
                  value={formData.type}
                  onValueChange={(v) => setFormData({ ...formData, type: v as "buy" | "sell" })}
                >
                  <SelectTrigger data-testid="select-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="buy">매수</SelectItem>
                    <SelectItem value="sell">매도</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">계열사 구분</Label>
                <Select
                  value={formData.subsidiaryCode}
                  onValueChange={(v) => {
                    setFormData({ ...formData, subsidiaryCode: v });
                    setSelectedStock("");
                    setNewStockSearch("");
                  }}
                >
                  <SelectTrigger data-testid="select-subsidiary">
                    <SelectValue placeholder="선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {subsidiaries?.map((sub) => (
                      <SelectItem key={sub.code} value={sub.code}>
                        {sub.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">보유 종목</Label>
              <Select
                value={selectedStock}
                onValueChange={(v) => {
                  setSelectedStock(v);
                  setNewStockSearch("");
                }}
                disabled={!formData.subsidiaryCode || holdingStocks.length === 0}
              >
                <SelectTrigger data-testid="select-stock">
                  <SelectValue placeholder={
                    !formData.subsidiaryCode 
                      ? "계열사를 먼저 선택하세요" 
                      : holdingStocks.length === 0
                        ? "보유 종목 없음"
                        : "보유 종목 선택"
                  } />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {holdingStocks.map((stockName) => (
                    <SelectItem key={stockName} value={stockName}>
                      {stockName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">신규종목</Label>
              <div className="relative">
                <Input
                  type="text"
                  value={newStockSearch}
                  onChange={(e) => {
                    setNewStockSearch(e.target.value);
                    setSelectedStock("");
                  }}
                  placeholder="종목명 또는 종목코드 검색"
                  disabled={!formData.subsidiaryCode}
                  data-testid="input-new-stock-search"
                />
                {newStockSearch && filteredNewStocks.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-40 overflow-y-auto">
                    {filteredNewStocks.slice(0, 10).map((stock) => (
                      <button
                        key={stock.code}
                        type="button"
                        className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
                        onClick={() => {
                          setSelectedStock(stock.name);
                          setNewStockSearch(stock.name);
                        }}
                        data-testid={`option-stock-${stock.code}`}
                      >
                        {stock.name} ({stock.code})
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">수량 (주)</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.shares || ""}
                  onChange={(e) => setFormData({ ...formData, shares: parseInt(e.target.value) || 0 })}
                  placeholder="10,000"
                  data-testid="input-shares"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">정산금액 (원)</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.settlementAmount || ""}
                  onChange={(e) => setFormData({ ...formData, settlementAmount: parseInt(e.target.value) || 0 })}
                  placeholder="500,000,000"
                  data-testid="input-settlement"
                />
              </div>
            </div>

            <div className="text-sm text-muted-foreground bg-muted/50 p-2 rounded space-y-1">
              <div>
                정산금액: <span className="font-medium text-foreground">
                  {formData.settlementAmount.toLocaleString()}원
                </span>
              </div>
              <div>
                단가: <span className="font-medium text-foreground">
                  {calculatedPricePerShare.toLocaleString()}원/주
                </span>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button type="button" variant="outline" onClick={handleClose} data-testid="button-cancel">
                취소
              </Button>
              <Button
                type="submit"
                disabled={!isValid || submitMutation.isPending}
                data-testid="button-submit"
              >
                {submitMutation.isPending ? "등록 중..." : "등록"}
              </Button>
            </div>

            {submitMutation.isError && (
              <p className="text-sm text-red-500 text-center">
                오류가 발생했습니다. 다시 시도해주세요.
              </p>
            )}
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
