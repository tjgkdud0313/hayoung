import { z } from "zod";

// Re-export auth models
export * from "./models/auth";

// Subsidiary (계열사) type
export interface Subsidiary {
  id: string;
  code: string;
  name: string;
  nameKr: string;
  holdingCompanyId: string;
}

// Financial Holding Company (금융지주) type
export interface HoldingCompany {
  id: string;
  code: string;
  name: string;
  nameKr: string;
}

// Stock holding by subsidiary
export interface SubsidiaryHolding {
  id: string;
  subsidiaryId: string;
  subsidiaryCode: string;
  subsidiaryName: string;
  stockName: string;
  stockNameKr: string;
  currentPrice: number;
  changePercent: number;
  shares: number;
  buyPrice: number;
  buyPricePerShare: number;
  evalAmount: number;
  profitLoss: number;
  profitLossPercent: number;
  shareRatio: number;
}

// Transaction type
export interface Transaction {
  id: string;
  type: 'buy' | 'sell';
  stockName: string;
  shares: number;
  pricePerShare: number;
  totalAmount: number;
  timestamp: string;
}

// Group total summary
export interface GroupSummary {
  totalEvalAmount: number;
  totalProfitLoss: number;
  totalProfitLossPercent: number;
  dailyProfitLoss: number;
  dailyProfitLossPercent: number;
}

// Subsidiary summary for dashboard
export interface SubsidiarySummary {
  id: string;
  code: string;
  name: string;
  buyAmount: number;
  evalAmount: number;
  profitLoss: number;
  profitLossPercent: number;
}

// Stock by name aggregation
export interface StockByName {
  stockName: string;
  totalShares: number;
  totalBuyAmount: number;
  totalEvalAmount: number;
  profitLoss: number;
  profitLossPercent: number;
  subsidiaryHoldings: SubsidiaryHolding[];
}

// Holdings grouped by holding company
export interface HoldingCompanyGroup {
  holdingCompany: HoldingCompany;
  subsidiaries: {
    subsidiary: Subsidiary;
    holdings: SubsidiaryHolding[];
    totalBuyAmount: number;
    totalEvalAmount: number;
    profitLoss: number;
    profitLossPercent: number;
    shareRatio: number;
  }[];
  totalBuyAmount: number;
  totalEvalAmount: number;
  profitLoss: number;
  profitLossPercent: number;
}

// Order request type
export interface OrderRequest {
  subsidiaryId: string;
  stockName: string;
  type: 'buy' | 'sell';
  shares: number;
  pricePerShare: number;
}

export const orderRequestSchema = z.object({
  subsidiaryId: z.string(),
  stockName: z.string(),
  type: z.enum(['buy', 'sell']),
  shares: z.number().positive(),
  pricePerShare: z.number().positive(),
});

export type InsertOrder = z.infer<typeof orderRequestSchema>;

// CSV Transaction import row
export interface CSVTransactionRow {
  type: 'buy' | 'sell';
  subsidiaryCode: string;
  stockName: string;
  shares: number;
  pricePerShare: number;
  date?: string;
  stockCode?: string;
  commission?: number;
  tax?: number;
  settlementAmount?: number;
}

// Standard format schema (기존 형식)
export const csvTransactionRowSchema = z.object({
  type: z.enum(['buy', 'sell', '매수', '매도']).transform(val => {
    if (val === '매수') return 'buy';
    if (val === '매도') return 'sell';
    return val;
  }),
  subsidiaryCode: z.string(),
  stockName: z.string(),
  shares: z.coerce.number().positive(),
  pricePerShare: z.coerce.number().positive(),
  date: z.string().optional(),
});

// HTS format schema (증권사 HTS 매매내역 형식)
export const htsTransactionRowSchema = z.object({
  date: z.string().optional(),
  stockCode: z.string().optional(),
  stockName: z.string(),
  type: z.string().transform(val => {
    // 거래소매수, 코스닥매수 → buy / 거래소매도, 코스닥매도 → sell
    const normalized = val.replace(/\s/g, '');
    if (normalized.includes('매수') || normalized.toLowerCase().includes('buy')) return 'buy' as const;
    if (normalized.includes('매도') || normalized.toLowerCase().includes('sell')) return 'sell' as const;
    return null;
  }).refine((val): val is 'buy' | 'sell' => val === 'buy' || val === 'sell', {
    message: "거래 구분은 매수 또는 매도여야 합니다."
  }),
  shares: z.coerce.number().positive(),
  pricePerShare: z.coerce.number().positive(),
  contractAmount: z.coerce.number().optional(),
  commission: z.coerce.number().optional(),
  tax: z.coerce.number().optional(),
  settlementAmount: z.coerce.number().optional(),
});

// Stock price data from external API
export interface StockPrice {
  stockCode: string;
  stockName: string;
  currentPrice: number;
  changeAmount: number;
  changePercent: number;
  openPrice: number;
  highPrice: number;
  lowPrice: number;
  volume: number;
  timestamp: string;
}

// Upload result type
export interface UploadResult {
  success: boolean;
  imported: number;
  failed: number;
  errors: string[];
  transactions: Transaction[];
  format?: 'Standard' | 'HTS';
}
