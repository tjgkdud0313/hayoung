import type { 
  Subsidiary,
  HoldingCompany,
  SubsidiaryHolding,
  Transaction, 
  GroupSummary,
  SubsidiarySummary,
  StockByName,
  HoldingCompanyGroup,
  OrderRequest,
  StockPrice,
  CSVTransactionRow,
  UploadResult
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getHoldingCompanies(): Promise<HoldingCompany[]>;
  getSubsidiaries(): Promise<Subsidiary[]>;
  getSubsidiaryByCode(code: string): Promise<Subsidiary | undefined>;
  getSubsidiariesByHoldingCompany(holdingCompanyId: string): Promise<Subsidiary[]>;
  getHoldings(): Promise<SubsidiaryHolding[]>;
  getHoldingsBySubsidiary(subsidiaryId: string): Promise<SubsidiaryHolding[]>;
  getGroupSummary(): Promise<GroupSummary>;
  getSubsidiarySummaries(): Promise<SubsidiarySummary[]>;
  getStocksByName(): Promise<StockByName[]>;
  getHoldingCompanyGroups(): Promise<HoldingCompanyGroup[]>;
  getTransactions(): Promise<Transaction[]>;
  getTodayTransactions(): Promise<Transaction[]>;
  executeOrder(order: OrderRequest): Promise<Transaction>;
  importTransactions(rows: CSVTransactionRow[]): Promise<UploadResult>;
  applyTransaction(row: CSVTransactionRow): Promise<Transaction>;
  updateHoldingPrice(stockName: string, newPrice: number, changePercent: number): Promise<void>;
  getStockPrice(stockName: string): Promise<StockPrice | null>;
}

const holdingCompanies: HoldingCompany[] = [
  { id: "hc1", code: "JB", name: "JB Financial Group", nameKr: "JB금융지주" },
  { id: "hc2", code: "OK", name: "OK Financial Group", nameKr: "OK금융그룹" },
  { id: "hc3", code: "iM", name: "iM Financial Group", nameKr: "iM금융지주" },
  { id: "hc4", code: "하나", name: "Hana Financial Group", nameKr: "하나금융지주" },
  { id: "hc5", code: "BNK", name: "BNK Financial Group", nameKr: "BNK금융지주" },
  { id: "hc6", code: "DGB", name: "DGB Financial Group", nameKr: "DGB금융지주" },
];

const subsidiaries: Subsidiary[] = [
  { id: "s1", code: "OK", name: "OK", nameKr: "OK저축은행", holdingCompanyId: "hc2" },
  { id: "s2", code: "OC", name: "OC", nameKr: "OC저축은행", holdingCompanyId: "hc2" },
  { id: "s3", code: "OKH", name: "OKH", nameKr: "OK홀딩스", holdingCompanyId: "hc2" },
  { id: "s4", code: "OT", name: "OT", nameKr: "OK캐피탈", holdingCompanyId: "hc2" },
  { id: "s5", code: "OKIP", name: "OKIP", nameKr: "OK인베스트먼트파트너스", holdingCompanyId: "hc2" },
  { id: "s6", code: "OFI", name: "OFI", nameKr: "OK금융지주", holdingCompanyId: "hc2" },
];


const initialHoldings: SubsidiaryHolding[] = [
  {
    id: "h1",
    subsidiaryId: "s1",
    subsidiaryCode: "OK",
    subsidiaryName: "OK저축은행",
    stockName: "JB금융지주",
    stockNameKr: "JB금융지주",
    currentPrice: 24300,
    changePercent: 3.4,
    shares: 14235775,
    buyPrice: 106674332255,
    buyPricePerShare: 7493,
    evalAmount: 345929332500,
    profitLoss: 239255000245,
    profitLossPercent: 224.29,
    shareRatio: 7.5,
  },
  {
    id: "h2",
    subsidiaryId: "s1",
    subsidiaryCode: "OK",
    subsidiaryName: "OK저축은행",
    stockName: "iM금융지주",
    stockNameKr: "iM금융지주",
    currentPrice: 14930,
    changePercent: 3.82,
    shares: 5599220,
    buyPrice: 42376024919,
    buyPricePerShare: 7568,
    evalAmount: 83596354600,
    profitLoss: 41220329681,
    profitLossPercent: 97.27,
    shareRatio: 3.49,
  },
  {
    id: "h3",
    subsidiaryId: "s1",
    subsidiaryCode: "OK",
    subsidiaryName: "OK저축은행",
    stockName: "NICE",
    stockNameKr: "NICE",
    currentPrice: 13280,
    changePercent: -0.38,
    shares: 3475069,
    buyPrice: 52871718714,
    buyPricePerShare: 15215,
    evalAmount: 46148916320,
    profitLoss: -6722802394,
    profitLossPercent: -12.72,
    shareRatio: 9.45,
  },
  {
    id: "h4",
    subsidiaryId: "s1",
    subsidiaryCode: "OK",
    subsidiaryName: "OK저축은행",
    stockName: "BNK금융지주",
    stockNameKr: "BNK금융지주",
    currentPrice: 16150,
    changePercent: 1.44,
    shares: 4271123,
    buyPrice: 63345640375,
    buyPricePerShare: 14831,
    evalAmount: 68978636450,
    profitLoss: 5632996075,
    profitLossPercent: 8.89,
    shareRatio: 1.38,
  },
  {
    id: "h5",
    subsidiaryId: "s1",
    subsidiaryCode: "OK",
    subsidiaryName: "OK저축은행",
    stockName: "LG",
    stockNameKr: "LG",
    currentPrice: 91100,
    changePercent: 1.67,
    shares: 108244,
    buyPrice: 8818645140,
    buyPricePerShare: 81470,
    evalAmount: 9861028400,
    profitLoss: 1042383260,
    profitLossPercent: 11.82,
    shareRatio: 0.07,
  },
  {
    id: "h6",
    subsidiaryId: "s1",
    subsidiaryCode: "OK",
    subsidiaryName: "OK저축은행",
    stockName: "HDC",
    stockNameKr: "HDC",
    currentPrice: 18320,
    changePercent: 0.11,
    shares: 283128,
    buyPrice: 5005957465,
    buyPricePerShare: 17681,
    evalAmount: 5186904960,
    profitLoss: 180947495,
    profitLossPercent: 3.61,
    shareRatio: 0.47,
  },
  {
    id: "h7",
    subsidiaryId: "s1",
    subsidiaryCode: "OK",
    subsidiaryName: "OK저축은행",
    stockName: "SK하이닉스",
    stockNameKr: "SK하이닉스",
    currentPrice: 800000,
    changePercent: 8.7,
    shares: 17049,
    buyPrice: 9824345270,
    buyPricePerShare: 576242,
    evalAmount: 13639200000,
    profitLoss: 3814854730,
    profitLossPercent: 38.83,
    shareRatio: 0.0,
  },
  {
    id: "h8",
    subsidiaryId: "s1",
    subsidiaryCode: "OK",
    subsidiaryName: "OK저축은행",
    stockName: "삼성전자",
    stockNameKr: "삼성전자",
    currentPrice: 159500,
    changePercent: 4.87,
    shares: 98799,
    buyPrice: 9707288410,
    buyPricePerShare: 98253,
    evalAmount: 15758440500,
    profitLoss: 6051152090,
    profitLossPercent: 62.34,
    shareRatio: 0.0,
  },
  {
    id: "h9",
    subsidiaryId: "s1",
    subsidiaryCode: "OK",
    subsidiaryName: "OK저축은행",
    stockName: "한화생명",
    stockNameKr: "한화생명",
    currentPrice: 3455,
    changePercent: -2.12,
    shares: 3448751,
    buyPrice: 10875840818,
    buyPricePerShare: 3154,
    evalAmount: 11915434705,
    profitLoss: 1039593887,
    profitLossPercent: 9.56,
    shareRatio: 0.4,
  },
  {
    id: "h10",
    subsidiaryId: "s1",
    subsidiaryCode: "OK",
    subsidiaryName: "OK저축은행",
    stockName: "한화손해보험",
    stockNameKr: "한화손해보험",
    currentPrice: 5970,
    changePercent: 1.53,
    shares: 991869,
    buyPrice: 5415277250,
    buyPricePerShare: 5460,
    evalAmount: 5921457930,
    profitLoss: 506180680,
    profitLossPercent: 9.35,
    shareRatio: 0.85,
  },
  {
    id: "h11",
    subsidiaryId: "s1",
    subsidiaryCode: "OK",
    subsidiaryName: "OK저축은행",
    stockName: "KG이니시스",
    stockNameKr: "KG이니시스",
    currentPrice: 11110,
    changePercent: 4.12,
    shares: 28425,
    buyPrice: 311003340,
    buyPricePerShare: 10941,
    evalAmount: 315801750,
    profitLoss: 4798410,
    profitLossPercent: 1.54,
    shareRatio: 0.1,
  },
  {
    id: "h12",
    subsidiaryId: "s1",
    subsidiaryCode: "OK",
    subsidiaryName: "OK저축은행",
    stockName: "KG모빌리언스",
    stockNameKr: "KG모빌리언스",
    currentPrice: 5160,
    changePercent: 3.51,
    shares: 42629,
    buyPrice: 218863910,
    buyPricePerShare: 5134,
    evalAmount: 219965640,
    profitLoss: 1101730,
    profitLossPercent: 0.5,
    shareRatio: 0.11,
  },
  {
    id: "h13",
    subsidiaryId: "s3",
    subsidiaryCode: "OKH",
    subsidiaryName: "OK홀딩스",
    stockName: "J Trust(원화)",
    stockNameKr: "J Trust(원화)",
    currentPrice: 4584,
    changePercent: 0.88,
    shares: 8105100,
    buyPrice: 33323580798,
    buyPricePerShare: 4111,
    evalAmount: 37161316143,
    profitLoss: 3837735345,
    profitLossPercent: 11.52,
    shareRatio: 6.07,
  },
  {
    id: "h14",
    subsidiaryId: "s3",
    subsidiaryCode: "OKH",
    subsidiaryName: "OK홀딩스",
    stockName: "BNK금융지주",
    stockNameKr: "BNK금융지주",
    currentPrice: 16150,
    changePercent: 0.0,
    shares: 818280,
    buyPrice: 6654719270,
    buyPricePerShare: 8133,
    evalAmount: 13215222000,
    profitLoss: 6560502730,
    profitLossPercent: 98.58,
    shareRatio: 0,
  },
  {
    id: "h15",
    subsidiaryId: "s2",
    subsidiaryCode: "OC",
    subsidiaryName: "OC저축은행",
    stockName: "BNK금융지주",
    stockNameKr: "BNK금융지주",
    currentPrice: 16150,
    changePercent: 0,
    shares: 5549390,
    buyPrice: 66580634940,
    buyPricePerShare: 11998,
    evalAmount: 89622648500,
    profitLoss: 23042013560,
    profitLossPercent: 34.61,
    shareRatio: 0,
  },
  {
    id: "h16",
    subsidiaryId: "s2",
    subsidiaryCode: "OC",
    subsidiaryName: "OC저축은행",
    stockName: "신한지주",
    stockNameKr: "신한지주",
    currentPrice: 86100,
    changePercent: 0.0,
    shares: 1953353,
    buyPrice: 111996469635,
    buyPricePerShare: 57335,
    evalAmount: 168183693300,
    profitLoss: 56187223665,
    profitLossPercent: 50.17,
    shareRatio: 0,
  },
  {
    id: "h17",
    subsidiaryId: "s5",
    subsidiaryCode: "OKIP",
    subsidiaryName: "OK인베스트먼트파트너스",
    stockName: "JB금융지주",
    stockNameKr: "JB금융지주",
    currentPrice: 24300,
    changePercent: 0.0,
    shares: 1086847,
    buyPrice: 19999984590,
    buyPricePerShare: 18402,
    evalAmount: 26410382100,
    profitLoss: 6410397510,
    profitLossPercent: 32.05,
    shareRatio: 0,
  },
  {
    id: "h18",
    subsidiaryId: "s4",
    subsidiaryCode: "OT",
    subsidiaryName: "OK캐피탈",
    stockName: "JB금융지주",
    stockNameKr: "JB금융지주",
    currentPrice: 24300,
    changePercent: 0,
    shares: 716407,
    buyPrice: 9797420050,
    buyPricePerShare: 13676,
    evalAmount: 17408690100,
    profitLoss: 7611270050,
    profitLossPercent: 77.69,
    shareRatio: 0,
  },
  {
    id: "h19",
    subsidiaryId: "s2",
    subsidiaryCode: "OC",
    subsidiaryName: "OC저축은행",
    stockName: "JB금융지주",
    stockNameKr: "JB금융지주",
    currentPrice: 24300,
    changePercent: 0,
    shares: 1109645,
    buyPrice: 22869193740,
    buyPricePerShare: 20609,
    evalAmount: 26964373500,
    profitLoss: 4095179760,
    profitLossPercent: 17.91,
    shareRatio: 0,
  },
  {
    id: "h20",
    subsidiaryId: "s2",
    subsidiaryCode: "OC",
    subsidiaryName: "OC저축은행",
    stockName: "iM금융지주",
    stockNameKr: "iM금융지주",
    currentPrice: 14930,
    changePercent: 0.0,
    shares: 5220338,
    buyPrice: 75320244390,
    buyPricePerShare: 14428,
    evalAmount: 77939646340,
    profitLoss: 2619401950,
    profitLossPercent: 3.48,
    shareRatio: 0,
  },
  {
    id: "h21",
    subsidiaryId: "s6",
    subsidiaryCode: "OFI",
    subsidiaryName: "OK금융지주",
    stockName: "iM금융지주",
    stockNameKr: "iM금융지주",
    currentPrice: 14930,
    changePercent: 0,
    shares: 5220000,
    buyPrice: 76898289060,
    buyPricePerShare: 14731,
    evalAmount: 77934600000,
    profitLoss: 1036310940,
    profitLossPercent: 1.35,
    shareRatio: 0,
  },
  {
    id: "h22",
    subsidiaryId: "s2",
    subsidiaryCode: "OC",
    subsidiaryName: "OC저축은행",
    stockName: "하나금융지주",
    stockNameKr: "하나금융지주",
    currentPrice: 105000,
    changePercent: 0.0,
    shares: 469772,
    buyPrice: 37745219430,
    buyPricePerShare: 80348,
    evalAmount: 49326060000,
    profitLoss: 11580840570,
    profitLossPercent: 30.68,
    shareRatio: 0,
  },
  {
    id: "h23",
    subsidiaryId: "s3",
    subsidiaryCode: "OKH",
    subsidiaryName: "OK홀딩스",
    stockName: "KCC",
    stockNameKr: "KCC",
    currentPrice: 459500,
    changePercent: 0.0,
    shares: 28876,
    buyPrice: 8030857880,
    buyPricePerShare: 278115,
    evalAmount: 13268522000,
    profitLoss: 5237664120,
    profitLossPercent: 65.22,
    shareRatio: 0,
  },
  {
    id: "h24",
    subsidiaryId: "s4",
    subsidiaryCode: "OT",
    subsidiaryName: "OK캐피탈",
    stockName: "KCC",
    stockNameKr: "KCC",
    currentPrice: 459500,
    changePercent: 0,
    shares: 7000,
    buyPrice: 1948769890,
    buyPricePerShare: 278396,
    evalAmount: 3216500000,
    profitLoss: 1267730110,
    profitLossPercent: 65.05,
    shareRatio: 0,
  },
  {
    id: "h25",
    subsidiaryId: "s3",
    subsidiaryCode: "OKH",
    subsidiaryName: "OK홀딩스",
    stockName: "현대차",
    stockNameKr: "현대차",
    currentPrice: 488500,
    changePercent: 0.0,
    shares: 33769,
    buyPrice: 8253876340,
    buyPricePerShare: 244422,
    evalAmount: 16496156500,
    profitLoss: 8242280160,
    profitLossPercent: 99.86,
    shareRatio: 0,
  },
  {
    id: "h26",
    subsidiaryId: "s4",
    subsidiaryCode: "OT",
    subsidiaryName: "OK캐피탈",
    stockName: "현대차",
    stockNameKr: "현대차",
    currentPrice: 488500,
    changePercent: 0,
    shares: 7800,
    buyPrice: 1943587800,
    buyPricePerShare: 249178,
    evalAmount: 3810300000,
    profitLoss: 1866712200,
    profitLossPercent: 96.04,
    shareRatio: 0,
  },
  {
    id: "h27",
    subsidiaryId: "s3",
    subsidiaryCode: "OKH",
    subsidiaryName: "OK홀딩스",
    stockName: "포스코홀딩스",
    stockNameKr: "포스코홀딩스",
    currentPrice: 359500,
    changePercent: 0.0,
    shares: 22700,
    buyPrice: 9859353690,
    buyPricePerShare: 434333,
    evalAmount: 8160650000,
    profitLoss: -1698703690,
    profitLossPercent: -17.23,
    shareRatio: 0,
  },
  {
    id: "h28",
    subsidiaryId: "s4",
    subsidiaryCode: "OT",
    subsidiaryName: "OK캐피탈",
    stockName: "포스코홀딩스",
    stockNameKr: "포스코홀딩스",
    currentPrice: 359500,
    changePercent: 0,
    shares: 4500,
    buyPrice: 1970796900,
    buyPricePerShare: 437955,
    evalAmount: 1617750000,
    profitLoss: -353046900,
    profitLossPercent: -17.91,
    shareRatio: 0,
  },
  {
    id: "h29",
    subsidiaryId: "s3",
    subsidiaryCode: "OKH",
    subsidiaryName: "OK홀딩스",
    stockName: "한국전력",
    stockNameKr: "한국전력",
    currentPrice: 60500,
    changePercent: 0.0,
    shares: 340957,
    buyPrice: 7835403260,
    buyPricePerShare: 22981,
    evalAmount: 20627898500,
    profitLoss: 12792495240,
    profitLossPercent: 163.27,
    shareRatio: 0,
  },
  {
    id: "h30",
    subsidiaryId: "s4",
    subsidiaryCode: "OT",
    subsidiaryName: "OK캐피탈",
    stockName: "한국전력",
    stockNameKr: "한국전력",
    currentPrice: 60500,
    changePercent: 0,
    shares: 80000,
    buyPrice: 1999484340,
    buyPricePerShare: 24994,
    evalAmount: 4840000000,
    profitLoss: 2840515660,
    profitLossPercent: 142.06,
    shareRatio: 0,
  },
  {
    id: "h31",
    subsidiaryId: "s3",
    subsidiaryCode: "OKH",
    subsidiaryName: "OK홀딩스",
    stockName: "KB금융",
    stockNameKr: "KB금융",
    currentPrice: 143000,
    changePercent: 0.0,
    shares: 133881,
    buyPrice: 10012452210,
    buyPricePerShare: 74786,
    evalAmount: 19144983000,
    profitLoss: 9132530790,
    profitLossPercent: 91.21,
    shareRatio: 0,
  },
  {
    id: "h32",
    subsidiaryId: "s4",
    subsidiaryCode: "OT",
    subsidiaryName: "OK캐피탈",
    stockName: "KB금융",
    stockNameKr: "KB금융",
    currentPrice: 143000,
    changePercent: 0,
    shares: 26400,
    buyPrice: 2004613600,
    buyPricePerShare: 75932,
    evalAmount: 3775200000,
    profitLoss: 1770586400,
    profitLossPercent: 88.33,
    shareRatio: 0,
  },
  {
    id: "h33",
    subsidiaryId: "s2",
    subsidiaryCode: "OC",
    subsidiaryName: "OC저축은행",
    stockName: "KB금융",
    stockNameKr: "KB금융",
    currentPrice: 143000,
    changePercent: 0,
    shares: 177886,
    buyPrice: 13941119739,
    buyPricePerShare: 78371,
    evalAmount: 25437698000,
    profitLoss: 11496578261,
    profitLossPercent: 82.47,
    shareRatio: 0,
  },
  {
    id: "h34",
    subsidiaryId: "s4",
    subsidiaryCode: "OT",
    subsidiaryName: "OK캐피탈",
    stockName: "풍산",
    stockNameKr: "풍산",
    currentPrice: 123400,
    changePercent: 0.0,
    shares: 227304,
    buyPrice: 10032830594,
    buyPricePerShare: 44138,
    evalAmount: 28049313600,
    profitLoss: 18016483006,
    profitLossPercent: 179.58,
    shareRatio: 0,
  },
  {
    id: "h35",
    subsidiaryId: "s4",
    subsidiaryCode: "OT",
    subsidiaryName: "OK캐피탈",
    stockName: "한화",
    stockNameKr: "한화",
    currentPrice: 113800,
    changePercent: 0.0,
    shares: 339974,
    buyPrice: 10010042715,
    buyPricePerShare: 29444,
    evalAmount: 38689041200,
    profitLoss: 28678998485,
    profitLossPercent: 286.5,
    shareRatio: 0,
  },
  {
    id: "h36",
    subsidiaryId: "s2",
    subsidiaryCode: "OC",
    subsidiaryName: "OC저축은행",
    stockName: "LG",
    stockNameKr: "LG",
    currentPrice: 91100,
    changePercent: 0.0,
    shares: 100320,
    buyPrice: 7916039520,
    buyPricePerShare: 78908,
    evalAmount: 9139152000,
    profitLoss: 1223112480,
    profitLossPercent: 15.45,
    shareRatio: 0,
  },
  {
    id: "h37",
    subsidiaryId: "s2",
    subsidiaryCode: "OC",
    subsidiaryName: "OC저축은행",
    stockName: "OCI홀딩스",
    stockNameKr: "OCI홀딩스",
    currentPrice: 119100,
    changePercent: 0.0,
    shares: 376298,
    buyPrice: 27733958980,
    buyPricePerShare: 73702,
    evalAmount: 44817091800,
    profitLoss: 17083132820,
    profitLossPercent: 61.6,
    shareRatio: 0,
  },
  {
    id: "h38",
    subsidiaryId: "s4",
    subsidiaryCode: "OT",
    subsidiaryName: "OK캐피탈",
    stockName: "E1",
    stockNameKr: "E1",
    currentPrice: 88300,
    changePercent: 0.0,
    shares: 63507,
    buyPrice: 4142636030,
    buyPricePerShare: 65231,
    evalAmount: 5607668100,
    profitLoss: 1465032070,
    profitLossPercent: 35.36,
    shareRatio: 0,
  },
  {
    id: "h39",
    subsidiaryId: "s3",
    subsidiaryCode: "OKH",
    subsidiaryName: "OK홀딩스",
    stockName: "E1",
    stockNameKr: "E1",
    currentPrice: 88300,
    changePercent: 0,
    shares: 2244,
    buyPrice: 148388150,
    buyPricePerShare: 66127,
    evalAmount: 198145200,
    profitLoss: 49757050,
    profitLossPercent: 33.53,
    shareRatio: 0,
  },
  {
    id: "h40",
    subsidiaryId: "s2",
    subsidiaryCode: "OC",
    subsidiaryName: "OC저축은행",
    stockName: "리드코프",
    stockNameKr: "리드코프",
    currentPrice: 3625,
    changePercent: 0.0,
    shares: 2344132,
    buyPrice: 9471240300,
    buyPricePerShare: 4040,
    evalAmount: 8497478500,
    profitLoss: -973761800,
    profitLossPercent: -10.28,
    shareRatio: 0,
  },
  {
    id: "h41",
    subsidiaryId: "s2",
    subsidiaryCode: "OC",
    subsidiaryName: "OC저축은행",
    stockName: "상상인",
    stockNameKr: "상상인",
    currentPrice: 1934,
    changePercent: 0.0,
    shares: 8478,
    buyPrice: 16918680,
    buyPricePerShare: 1996,
    evalAmount: 16396452,
    profitLoss: -522228,
    profitLossPercent: -3.09,
    shareRatio: 0,
  },
  {
    id: "h42",
    subsidiaryId: "s2",
    subsidiaryCode: "OC",
    subsidiaryName: "OC저축은행",
    stockName: "티와이홀딩스",
    stockNameKr: "티와이홀딩스",
    currentPrice: 2600,
    changePercent: 0.0,
    shares: 176812,
    buyPrice: 468598650,
    buyPricePerShare: 2650,
    evalAmount: 459711200,
    profitLoss: -8887450,
    profitLossPercent: -1.9,
    shareRatio: 0,
  },
  {
    id: "h43",
    subsidiaryId: "s2",
    subsidiaryCode: "OC",
    subsidiaryName: "OC저축은행",
    stockName: "세방전지",
    stockNameKr: "세방전지",
    currentPrice: 63700,
    changePercent: 0.0,
    shares: 70000,
    buyPrice: 4746474600,
    buyPricePerShare: 67807,
    evalAmount: 4459000000,
    profitLoss: -287474600,
    profitLossPercent: -6.06,
    shareRatio: 0,
  },
  {
    id: "h44",
    subsidiaryId: "s4",
    subsidiaryCode: "OT",
    subsidiaryName: "OK캐피탈",
    stockName: "세방",
    stockNameKr: "세방",
    currentPrice: 14350,
    changePercent: 0.0,
    shares: 28295,
    buyPrice: 360101270,
    buyPricePerShare: 12727,
    evalAmount: 406033250,
    profitLoss: 45931980,
    profitLossPercent: 12.76,
    shareRatio: 0,
  },
  {
    id: "h45",
    subsidiaryId: "s2",
    subsidiaryCode: "OC",
    subsidiaryName: "OC저축은행",
    stockName: "세방",
    stockNameKr: "세방",
    currentPrice: 14350,
    changePercent: 0,
    shares: 130417,
    buyPrice: 1882105500,
    buyPricePerShare: 14431,
    evalAmount: 1871483950,
    profitLoss: -10621550,
    profitLossPercent: -0.56,
    shareRatio: 0,
  },
  {
    id: "h46",
    subsidiaryId: "s4",
    subsidiaryCode: "OT",
    subsidiaryName: "OK캐피탈",
    stockName: "기아",
    stockNameKr: "기아",
    currentPrice: 153500,
    changePercent: 0.0,
    shares: 919,
    buyPrice: 110911020,
    buyPricePerShare: 120687,
    evalAmount: 141066500,
    profitLoss: 30155480,
    profitLossPercent: 27.19,
    shareRatio: 0,
  },
  {
    id: "h47",
    subsidiaryId: "s4",
    subsidiaryCode: "OT",
    subsidiaryName: "OK캐피탈",
    stockName: "삼성생명",
    stockNameKr: "삼성생명",
    currentPrice: 187100,
    changePercent: 0.0,
    shares: 1077,
    buyPrice: 108695220,
    buyPricePerShare: 100924,
    evalAmount: 201506700,
    profitLoss: 92811480,
    profitLossPercent: 85.39,
    shareRatio: 0,
  },
  {
    id: "h48",
    subsidiaryId: "s4",
    subsidiaryCode: "OT",
    subsidiaryName: "OK캐피탈",
    stockName: "삼성화재",
    stockNameKr: "삼성화재",
    currentPrice: 502000,
    changePercent: 0.0,
    shares: 281,
    buyPrice: 81428190,
    buyPricePerShare: 289780,
    evalAmount: 141062000,
    profitLoss: 59633810,
    profitLossPercent: 73.23,
    shareRatio: 0,
  },
  {
    id: "h49",
    subsidiaryId: "s4",
    subsidiaryCode: "OT",
    subsidiaryName: "OK캐피탈",
    stockName: "현대모비스",
    stockNameKr: "현대모비스",
    currentPrice: 460000,
    changePercent: 0.0,
    shares: 284,
    buyPrice: 69071010,
    buyPricePerShare: 243208,
    evalAmount: 130640000,
    profitLoss: 61568990,
    profitLossPercent: 89.14,
    shareRatio: 0,
  },
  {
    id: "h50",
    subsidiaryId: "s2",
    subsidiaryCode: "OC",
    subsidiaryName: "OC저축은행",
    stockName: "세아제강",
    stockNameKr: "세아제강",
    currentPrice: 119200,
    changePercent: 0.0,
    shares: 343,
    buyPrice: 54416110,
    buyPricePerShare: 158648,
    evalAmount: 40885600,
    profitLoss: -13530510,
    profitLossPercent: -24.86,
    shareRatio: 0,
  },
  {
    id: "h51",
    subsidiaryId: "s2",
    subsidiaryCode: "OC",
    subsidiaryName: "OC저축은행",
    stockName: "메리츠금융지주",
    stockNameKr: "메리츠금융지주",
    currentPrice: 110000,
    changePercent: 0.0,
    shares: 40000,
    buyPrice: 4308430800,
    buyPricePerShare: 107711,
    evalAmount: 4400000000,
    profitLoss: 91569200,
    profitLossPercent: 2.13,
    shareRatio: 0,
  },
  {
    id: "h52",
    subsidiaryId: "s2",
    subsidiaryCode: "OC",
    subsidiaryName: "OC저축은행",
    stockName: "태광산업",
    stockNameKr: "태광산업",
    currentPrice: 819000,
    changePercent: 0.0,
    shares: 35362,
    buyPrice: 38837908340,
    buyPricePerShare: 1098295,
    evalAmount: 28961478000,
    profitLoss: -9876430340,
    profitLossPercent: -25.43,
    shareRatio: 0,
  },
  {
    id: "h53",
    subsidiaryId: "s2",
    subsidiaryCode: "OC",
    subsidiaryName: "OC저축은행",
    stockName: "DB증권",
    stockNameKr: "DB증권",
    currentPrice: 12200,
    changePercent: 0.0,
    shares: 1755871,
    buyPrice: 18877500810,
    buyPricePerShare: 10751,
    evalAmount: 21421626200,
    profitLoss: 2544125390,
    profitLossPercent: 13.48,
    shareRatio: 0,
  },
  {
    id: "h54",
    subsidiaryId: "s2",
    subsidiaryCode: "OC",
    subsidiaryName: "OC저축은행",
    stockName: "SK",
    stockNameKr: "SK",
    currentPrice: 298000,
    changePercent: 0.0,
    shares: 30786,
    buyPrice: 8220683980,
    buyPricePerShare: 267027,
    evalAmount: 9174228000,
    profitLoss: 953544020,
    profitLossPercent: 11.6,
    shareRatio: 0,
  },
  {
    id: "h55",
    subsidiaryId: "s2",
    subsidiaryCode: "OC",
    subsidiaryName: "OC저축은행",
    stockName: "LS",
    stockNameKr: "LS",
    currentPrice: 224000,
    changePercent: 0.0,
    shares: 38137,
    buyPrice: 6872974620,
    buyPricePerShare: 180218,
    evalAmount: 8542688000,
    profitLoss: 1669713380,
    profitLossPercent: 24.29,
    shareRatio: 0,
  },
  {
    id: "h56",
    subsidiaryId: "s2",
    subsidiaryCode: "OC",
    subsidiaryName: "OC저축은행",
    stockName: "LS증권",
    stockNameKr: "LS증권",
    currentPrice: 5410,
    changePercent: 0.0,
    shares: 2198565,
    buyPrice: 10741064015,
    buyPricePerShare: 4885,
    evalAmount: 11894236650,
    profitLoss: 1153172635,
    profitLossPercent: 10.74,
    shareRatio: 0,
  },
];

const initialTransactions: Transaction[] = [
  {
    id: "t1",
    type: "buy",
    stockName: "BNK금융지주",
    shares: 55000,
    pricePerShare: 15300,
    totalAmount: 841500000,
    timestamp: new Date().toISOString(),
  },
  {
    id: "t2",
    type: "sell",
    stockName: "한화생명",
    shares: 78000,
    pricePerShare: 3150,
    totalAmount: 245700000,
    timestamp: new Date().toISOString(),
  },
];

export class MemStorage implements IStorage {
  private holdings: SubsidiaryHolding[];
  private transactions: Transaction[];

  constructor() {
    this.holdings = [...initialHoldings];
    this.transactions = [...initialTransactions];
  }

  async getHoldingCompanies(): Promise<HoldingCompany[]> {
    return holdingCompanies;
  }

  async getSubsidiaries(): Promise<Subsidiary[]> {
    return subsidiaries;
  }

  async getSubsidiariesByHoldingCompany(holdingCompanyId: string): Promise<Subsidiary[]> {
    return subsidiaries.filter(s => s.holdingCompanyId === holdingCompanyId);
  }

  async getHoldings(): Promise<SubsidiaryHolding[]> {
    return this.holdings;
  }

  async getHoldingsBySubsidiary(subsidiaryId: string): Promise<SubsidiaryHolding[]> {
    return this.holdings.filter(h => h.subsidiaryId === subsidiaryId);
  }

  async getGroupSummary(): Promise<GroupSummary> {
    const totalEvalAmount = this.holdings.reduce((sum, h) => sum + h.evalAmount, 0);
    const totalBuyAmount = this.holdings.reduce((sum, h) => sum + h.buyPrice, 0);
    const totalProfitLoss = totalEvalAmount - totalBuyAmount;
    const totalProfitLossPercent = totalBuyAmount > 0 ? (totalProfitLoss / totalBuyAmount) * 100 : 0;
    
    const dailyProfitLoss = 508200000000;
    const dailyProfitLossPercent = 0.6;

    return {
      totalEvalAmount,
      totalProfitLoss,
      totalProfitLossPercent,
      dailyProfitLoss,
      dailyProfitLossPercent,
    };
  }

  async getSubsidiarySummaries(): Promise<SubsidiarySummary[]> {
    const okSubsidiaries = subsidiaries.filter(s => s.holdingCompanyId === "hc2");
    
    return okSubsidiaries.map(sub => {
      const subHoldings = this.holdings.filter(h => h.subsidiaryId === sub.id);
      const buyAmount = subHoldings.reduce((sum, h) => sum + h.buyPrice, 0);
      const evalAmount = subHoldings.reduce((sum, h) => sum + h.evalAmount, 0);
      const profitLoss = evalAmount - buyAmount;
      const profitLossPercent = buyAmount > 0 ? (profitLoss / buyAmount) * 100 : 0;

      return {
        id: sub.id,
        code: sub.code,
        name: sub.nameKr,
        buyAmount,
        evalAmount,
        profitLoss,
        profitLossPercent,
      };
    });
  }

  async getStocksByName(): Promise<StockByName[]> {
    const stockMap = new Map<string, SubsidiaryHolding[]>();
    
    this.holdings.forEach(h => {
      const existing = stockMap.get(h.stockName) || [];
      existing.push(h);
      stockMap.set(h.stockName, existing);
    });

    const result: StockByName[] = [];
    stockMap.forEach((holdings, stockName) => {
      const totalShares = holdings.reduce((sum, h) => sum + h.shares, 0);
      const totalBuyAmount = holdings.reduce((sum, h) => sum + h.buyPrice, 0);
      const totalEvalAmount = holdings.reduce((sum, h) => sum + h.evalAmount, 0);
      const profitLoss = totalEvalAmount - totalBuyAmount;
      const profitLossPercent = totalBuyAmount > 0 ? (profitLoss / totalBuyAmount) * 100 : 0;

      result.push({
        stockName,
        totalShares,
        totalBuyAmount,
        totalEvalAmount,
        profitLoss,
        profitLossPercent,
        subsidiaryHoldings: holdings,
      });
    });

    return result;
  }

  async getHoldingCompanyGroups(): Promise<HoldingCompanyGroup[]> {
    return holdingCompanies.map(hc => {
      const hcSubsidiaries = subsidiaries.filter(s => s.holdingCompanyId === hc.id);
      
      const subGroups = hcSubsidiaries.map(sub => {
        const subHoldings = this.holdings.filter(h => h.subsidiaryId === sub.id);
        const totalBuyAmount = subHoldings.reduce((sum, h) => sum + h.buyPrice, 0);
        const totalEvalAmount = subHoldings.reduce((sum, h) => sum + h.evalAmount, 0);
        const profitLoss = totalEvalAmount - totalBuyAmount;
        const profitLossPercent = totalBuyAmount > 0 ? (profitLoss / totalBuyAmount) * 100 : 0;
        const shareRatio = subHoldings.reduce((sum, h) => sum + h.shareRatio, 0);

        return {
          subsidiary: sub,
          holdings: subHoldings,
          totalBuyAmount,
          totalEvalAmount,
          profitLoss,
          profitLossPercent,
          shareRatio,
        };
      }).filter(g => g.holdings.length > 0);

      const totalBuyAmount = subGroups.reduce((sum, g) => sum + g.totalBuyAmount, 0);
      const totalEvalAmount = subGroups.reduce((sum, g) => sum + g.totalEvalAmount, 0);
      const profitLoss = totalEvalAmount - totalBuyAmount;
      const profitLossPercent = totalBuyAmount > 0 ? (profitLoss / totalBuyAmount) * 100 : 0;

      return {
        holdingCompany: hc,
        subsidiaries: subGroups,
        totalBuyAmount,
        totalEvalAmount,
        profitLoss,
        profitLossPercent,
      };
    }).filter(g => g.subsidiaries.length > 0);
  }

  async getTransactions(): Promise<Transaction[]> {
    return [...this.transactions].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  async getTodayTransactions(): Promise<Transaction[]> {
    const today = new Date().toDateString();
    return this.transactions.filter(t => 
      new Date(t.timestamp).toDateString() === today
    );
  }

  async executeOrder(order: OrderRequest): Promise<Transaction> {
    const transaction: Transaction = {
      id: randomUUID(),
      type: order.type,
      stockName: order.stockName,
      shares: order.shares,
      pricePerShare: order.pricePerShare,
      totalAmount: order.shares * order.pricePerShare,
      timestamp: new Date().toISOString(),
    };

    this.transactions.push(transaction);
    return transaction;
  }

  async getSubsidiaryByCode(code: string): Promise<Subsidiary | undefined> {
    return subsidiaries.find(s => s.code === code);
  }

  async importTransactions(rows: CSVTransactionRow[]): Promise<UploadResult> {
    const result: UploadResult = {
      success: true,
      imported: 0,
      failed: 0,
      errors: [],
      transactions: [],
    };

    for (const row of rows) {
      try {
        const subsidiary = subsidiaries.find(s => s.code === row.subsidiaryCode);
        if (!subsidiary) {
          result.errors.push(`계열사 코드 "${row.subsidiaryCode}"를 찾을 수 없습니다.`);
          result.failed++;
          continue;
        }

        const timestamp = row.date ? new Date(row.date).toISOString() : new Date().toISOString();
        const transaction: Transaction = {
          id: randomUUID(),
          type: row.type,
          stockName: row.stockName,
          shares: row.shares,
          pricePerShare: row.pricePerShare,
          totalAmount: row.shares * row.pricePerShare,
          timestamp,
        };

        this.transactions.push(transaction);
        result.transactions.push(transaction);
        result.imported++;

        // Update holdings based on transaction
        await this.updateHoldingsFromTransaction(subsidiary, row);
      } catch (error) {
        result.errors.push(`행 처리 오류: ${(error as Error).message}`);
        result.failed++;
      }
    }

    result.success = result.failed === 0;
    return result;
  }

  async applyTransaction(row: CSVTransactionRow): Promise<Transaction> {
    const subsidiary = subsidiaries.find(s => s.code === row.subsidiaryCode);
    if (!subsidiary) {
      throw new Error(`계열사 코드 "${row.subsidiaryCode}"를 찾을 수 없습니다.`);
    }

    const timestamp = row.date ? new Date(row.date).toISOString() : new Date().toISOString();
    const transaction: Transaction = {
      id: randomUUID(),
      type: row.type,
      stockName: row.stockName,
      shares: row.shares,
      pricePerShare: row.pricePerShare,
      totalAmount: row.shares * row.pricePerShare,
      timestamp,
    };

    this.transactions.push(transaction);
    await this.updateHoldingsFromTransaction(subsidiary, row);
    
    return transaction;
  }

  private async updateHoldingsFromTransaction(subsidiary: Subsidiary, row: CSVTransactionRow): Promise<void> {
    const existingHolding = this.holdings.find(
      h => h.subsidiaryId === subsidiary.id && h.stockName === row.stockName
    );

    if (existingHolding) {
      if (row.type === 'buy') {
        const newTotalShares = existingHolding.shares + row.shares;
        const newTotalBuyPrice = existingHolding.buyPrice + (row.shares * row.pricePerShare);
        existingHolding.shares = newTotalShares;
        existingHolding.buyPrice = newTotalBuyPrice;
        existingHolding.buyPricePerShare = Math.round(newTotalBuyPrice / newTotalShares);
        existingHolding.evalAmount = newTotalShares * existingHolding.currentPrice;
        existingHolding.profitLoss = existingHolding.evalAmount - existingHolding.buyPrice;
        existingHolding.profitLossPercent = existingHolding.buyPrice > 0 
          ? (existingHolding.profitLoss / existingHolding.buyPrice) * 100 
          : 0;
      } else {
        if (row.shares > existingHolding.shares) {
          throw new Error(`매도 수량(${row.shares})이 보유 수량(${existingHolding.shares})을 초과합니다.`);
        }
        const newTotalShares = existingHolding.shares - row.shares;
        if (newTotalShares <= 0) {
          const idx = this.holdings.indexOf(existingHolding);
          if (idx > -1) this.holdings.splice(idx, 1);
        } else {
          const sellRatio = row.shares / existingHolding.shares;
          existingHolding.shares = newTotalShares;
          existingHolding.buyPrice = Math.round(existingHolding.buyPrice * (1 - sellRatio));
          existingHolding.evalAmount = newTotalShares * existingHolding.currentPrice;
          existingHolding.profitLoss = existingHolding.evalAmount - existingHolding.buyPrice;
          existingHolding.profitLossPercent = existingHolding.buyPrice > 0 
            ? (existingHolding.profitLoss / existingHolding.buyPrice) * 100 
            : 0;
        }
      }
    } else if (row.type === 'buy') {
      const newHolding: SubsidiaryHolding = {
        id: randomUUID(),
        subsidiaryId: subsidiary.id,
        subsidiaryCode: subsidiary.code,
        subsidiaryName: subsidiary.nameKr,
        stockName: row.stockName,
        stockNameKr: row.stockName,
        currentPrice: row.pricePerShare,
        changePercent: 0,
        shares: row.shares,
        buyPrice: row.shares * row.pricePerShare,
        buyPricePerShare: row.pricePerShare,
        evalAmount: row.shares * row.pricePerShare,
        profitLoss: 0,
        profitLossPercent: 0,
        shareRatio: 0,
      };
      this.holdings.push(newHolding);
    }
  }

  async updateHoldingPrice(stockName: string, newPrice: number, changePercent: number): Promise<void> {
    this.holdings.forEach(h => {
      if (h.stockName === stockName) {
        h.currentPrice = newPrice;
        h.changePercent = changePercent;
        h.evalAmount = h.shares * newPrice;
        h.profitLoss = h.evalAmount - h.buyPrice;
        h.profitLossPercent = h.buyPrice > 0 ? (h.profitLoss / h.buyPrice) * 100 : 0;
      }
    });
  }

  async getStockPrice(stockName: string): Promise<StockPrice | null> {
    // Mock stock price data - in production, this would call external API
    const mockPrices: Record<string, StockPrice> = {
      'JB금융지주': {
        stockCode: '175330',
        stockName: 'JB금융지주',
        currentPrice: 23800,
        changeAmount: 190,
        changePercent: 0.8,
        openPrice: 23600,
        highPrice: 23900,
        lowPrice: 23500,
        volume: 1250000,
        timestamp: new Date().toISOString(),
      },
      'NICE': {
        stockCode: '034310',
        stockName: 'NICE',
        currentPrice: 12950,
        changeAmount: -105,
        changePercent: -0.8,
        openPrice: 13050,
        highPrice: 13100,
        lowPrice: 12900,
        volume: 890000,
        timestamp: new Date().toISOString(),
      },
      'BNK금융지주': {
        stockCode: '138930',
        stockName: 'BNK금융지주',
        currentPrice: 15300,
        changeAmount: 200,
        changePercent: 1.32,
        openPrice: 15100,
        highPrice: 15400,
        lowPrice: 15050,
        volume: 2100000,
        timestamp: new Date().toISOString(),
      },
      '한화생명': {
        stockCode: '088350',
        stockName: '한화생명',
        currentPrice: 3150,
        changeAmount: -25,
        changePercent: -0.79,
        openPrice: 3175,
        highPrice: 3200,
        lowPrice: 3140,
        volume: 3500000,
        timestamp: new Date().toISOString(),
      },
    };

    return mockPrices[stockName] || null;
  }
}

export const storage = new MemStorage();
