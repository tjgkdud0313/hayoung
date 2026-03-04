import { useState, useRef } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Upload, FileSpreadsheet, Download, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import type { UploadResult, Subsidiary } from "@shared/schema";

export function TransactionUploadModal() {
  const [open, setOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [isHtsFormat, setIsHtsFormat] = useState(false);
  const [selectedSubsidiary, setSelectedSubsidiary] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const { data: subsidiaries } = useQuery<Subsidiary[]>({
    queryKey: ["/api/subsidiaries"],
  });

  const detectHtsFormat = async (file: File) => {
    // Read only first 1KB for header detection to avoid loading large files
    const slice = file.slice(0, 1024);
    const text = await slice.text();
    // Strip BOM and get first line
    const firstLine = (text.split('\n')[0] || '').replace(/^\uFEFF/, '').trim();
    return firstLine.includes('매매일') || firstLine.includes('약정금액') || firstLine.includes('정산금액');
  };

  const uploadMutation = useMutation({
    mutationFn: async ({ file, subsidiaryCode }: { file: File; subsidiaryCode?: string }) => {
      const formData = new FormData();
      formData.append("file", file);
      if (subsidiaryCode) {
        formData.append("subsidiaryCode", subsidiaryCode);
      }

      const response = await fetch("/api/import/transactions", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "업로드 실패");
      }

      return response.json() as Promise<UploadResult>;
    },
    onSuccess: (result) => {
      setUploadResult(result);
      queryClient.invalidateQueries({ queryKey: ["/api/summary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/subsidiary-summaries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/holdings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions/today"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stocks-by-name"] });
      queryClient.invalidateQueries({ queryKey: ["/api/holding-company-groups"] });
    },
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadResult(null);
      const isHts = await detectHtsFormat(file);
      setIsHtsFormat(isHts);
      if (!isHts) {
        setSelectedSubsidiary("");
      }
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      uploadMutation.mutate({ 
        file: selectedFile, 
        subsidiaryCode: isHtsFormat ? selectedSubsidiary : undefined 
      });
    }
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedFile(null);
    setUploadResult(null);
    setIsHtsFormat(false);
    setSelectedSubsidiary("");
    uploadMutation.reset();
  };

  const downloadSampleCSV = () => {
    const sampleData = `구분,계열사,종목명,수량,단가,거래일
매수,OK,BNK금융지주,10000,15300,2026-01-26
매도,OC,한화생명,5000,3150,2026-01-26
매수,OKH,JB금융지주,20000,23800,2026-01-26`;
    
    const blob = new Blob(["\uFEFF" + sampleData], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "거래내역_샘플.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const canUpload = selectedFile && (!isHtsFormat || selectedSubsidiary);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" data-testid="button-upload-transactions">
          <Upload className="h-4 w-4 mr-1" />
          거래 업로드
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>거래내역 업로드</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            CSV 파일로 거래내역을 업로드하여 보유현황을 업데이트합니다.
            <br />
            <span className="text-xs">HTS 매매내역 파일도 지원합니다.</span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={downloadSampleCSV}
            className="text-xs"
            data-testid="button-download-sample"
          >
            <Download className="h-3 w-3 mr-1" />
            샘플 파일 다운로드
          </Button>

          <div
            className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
            data-testid="dropzone-upload"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
              data-testid="input-file"
            />
            <FileSpreadsheet className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            {selectedFile ? (
              <div className="text-sm font-medium text-foreground">
                {selectedFile.name}
                {isHtsFormat && (
                  <span className="block text-xs text-blue-600 dark:text-blue-400 mt-1">
                    HTS 형식 감지됨
                  </span>
                )}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                클릭하여 CSV 파일 선택<br />
                (.csv 파일만 지원)
              </div>
            )}
          </div>

          {isHtsFormat && (
            <div className="space-y-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-center gap-2 text-xs text-blue-700 dark:text-blue-300">
                <AlertCircle className="h-4 w-4" />
                HTS 파일에는 계열사 정보가 없습니다. 계열사를 선택해주세요.
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">계열사 선택</Label>
                <Select value={selectedSubsidiary} onValueChange={setSelectedSubsidiary}>
                  <SelectTrigger data-testid="select-subsidiary">
                    <SelectValue placeholder="계열사를 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {subsidiaries?.map((sub) => (
                      <SelectItem key={sub.code} value={sub.code}>
                        {sub.nameKr} ({sub.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {uploadResult && (
            <div className={`p-3 rounded-lg ${uploadResult.success ? "bg-green-100 dark:bg-green-900/30" : "bg-red-100 dark:bg-red-900/30"}`}>
              <div className="flex items-center gap-2 mb-2">
                {uploadResult.success ? (
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                )}
                <span className={`text-sm font-medium ${uploadResult.success ? "text-green-700 dark:text-green-300" : "text-red-700 dark:text-red-300"}`}>
                  {uploadResult.success ? "업로드 완료" : "일부 오류 발생"}
                  {uploadResult.format && <span className="text-xs ml-1">({uploadResult.format} 형식)</span>}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                성공: {uploadResult.imported}건 / 실패: {uploadResult.failed}건
              </div>
              {uploadResult.errors.length > 0 && (
                <div className="mt-2 text-xs text-red-600 dark:text-red-400 max-h-20 overflow-y-auto">
                  {uploadResult.errors.slice(0, 5).map((err, i) => (
                    <div key={i}>{err}</div>
                  ))}
                  {uploadResult.errors.length > 5 && (
                    <div>외 {uploadResult.errors.length - 5}건...</div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={handleClose} data-testid="button-cancel-upload">
              {uploadResult ? "닫기" : "취소"}
            </Button>
            {!uploadResult && (
              <Button
                onClick={handleUpload}
                disabled={!canUpload || uploadMutation.isPending}
                data-testid="button-confirm-upload"
              >
                {uploadMutation.isPending ? "업로드 중..." : "업로드"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
