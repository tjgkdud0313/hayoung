import type { Express, RequestHandler } from "express";
import type { Server } from "http";
import multer from "multer";
import Papa from "papaparse";
import { storage } from "./storage";
import { orderRequestSchema, csvTransactionRowSchema, htsTransactionRowSchema } from "@shared/schema";
import { setupAuth, registerAuthRoutes, isAuthenticated, authStorage } from "./replit_integrations/auth";
import { kisApiClient, getMarketStatus, isMarketClosed } from "./kisApi";

const upload = multer({ storage: multer.memoryStorage() });

// Admin-only middleware
const isAdmin: RequestHandler = async (req: any, res, next) => {
  if (!req.isAuthenticated() || !req.user?.claims?.sub) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  const userId = req.user.claims.sub;
  const user = await authStorage.getUser(userId);
  
  if (!user?.isAdmin) {
    return res.status(403).json({ message: "관리자 권한이 필요합니다." });
  }
  
  next();
};

export async function registerRoutes(server: Server, app: Express): Promise<void> {
  // Set up auth first
  await setupAuth(app);
  registerAuthRoutes(app);

  // Admin status check endpoint
  app.get("/api/auth/admin-status", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await authStorage.getUser(userId);
      res.json({ isAdmin: user?.isAdmin || false });
    } catch (error) {
      res.status(500).json({ message: "Failed to check admin status" });
    }
  });
  app.get("/api/holding-companies", async (req, res) => {
    const companies = await storage.getHoldingCompanies();
    res.json(companies);
  });

  app.get("/api/subsidiaries", async (req, res) => {
    const subs = await storage.getSubsidiaries();
    res.json(subs);
  });

  app.get("/api/subsidiaries/:holdingCompanyId", async (req, res) => {
    const subs = await storage.getSubsidiariesByHoldingCompany(req.params.holdingCompanyId);
    res.json(subs);
  });

  app.get("/api/holdings", async (req, res) => {
    const holdings = await storage.getHoldings();
    res.json(holdings);
  });

  app.get("/api/holdings/subsidiary/:subsidiaryId", async (req, res) => {
    const holdings = await storage.getHoldingsBySubsidiary(req.params.subsidiaryId);
    res.json(holdings);
  });

  app.get("/api/summary", async (req, res) => {
    const summary = await storage.getGroupSummary();
    res.json(summary);
  });

  app.get("/api/subsidiary-summaries", async (req, res) => {
    const summaries = await storage.getSubsidiarySummaries();
    res.json(summaries);
  });

  app.get("/api/stocks-by-name", async (req, res) => {
    const stocks = await storage.getStocksByName();
    res.json(stocks);
  });

  app.get("/api/holding-company-groups", async (req, res) => {
    const groups = await storage.getHoldingCompanyGroups();
    res.json(groups);
  });

  app.get("/api/transactions", async (req, res) => {
    const transactions = await storage.getTransactions();
    res.json(transactions);
  });

  app.get("/api/transactions/today", async (req, res) => {
    const transactions = await storage.getTodayTransactions();
    res.json(transactions);
  });

  app.post("/api/orders", async (req, res) => {
    const parsed = orderRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.message });
    }
    
    try {
      const transaction = await storage.executeOrder(parsed.data);
      res.status(201).json(transaction);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  });

  // Manual transaction entry (admin only)
  app.post("/api/transactions/manual", isAdmin, async (req, res) => {
    try {
      const { type, subsidiaryCode, stockName, shares, pricePerShare, date } = req.body;
      
      if (!type || !subsidiaryCode || !stockName || !shares || !pricePerShare) {
        return res.status(400).json({ error: "필수 항목이 누락되었습니다." });
      }
      
      if (type !== "buy" && type !== "sell") {
        return res.status(400).json({ error: "거래 구분은 매수 또는 매도여야 합니다." });
      }
      
      const transaction = await storage.applyTransaction({
        type,
        subsidiaryCode,
        stockName,
        shares: Number(shares),
        pricePerShare: Number(pricePerShare),
        date: date || new Date().toISOString().split("T")[0],
      });
      
      res.json({ success: true, transaction });
    } catch (error) {
      console.error("Manual transaction error:", error);
      res.status(500).json({ error: "거래 등록 중 오류가 발생했습니다." });
    }
  });

  // CSV file upload for transactions (admin only)
  // Supports two formats:
  // 1. Standard format: 구분,계열사,종목명,수량,단가,거래일
  // 2. HTS format: 매매일,종목코드,종목명,구분,수량,단가,약정금액,수수료,세금,정산금액
  app.post("/api/import/transactions", isAdmin, upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "파일이 업로드되지 않았습니다." });
      }

      // Get subsidiary code from form data (for HTS format which doesn't include it)
      const subsidiaryCode = req.body.subsidiaryCode as string | undefined;

      // Strip BOM (UTF-8 BOM) and normalize content
      const fileContent = req.file.buffer.toString("utf-8").replace(/^\uFEFF/, '');
      
      // Detect format by checking headers (strip BOM and normalize)
      const firstLine = (fileContent.split('\n')[0] || '').replace(/^\uFEFF/, '').trim();
      const isHtsFormat = firstLine.includes('매매일') || firstLine.includes('약정금액') || firstLine.includes('정산금액');
      
      const parsed = Papa.parse(fileContent, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header: string) => {
          const trimmed = header.trim();
          
          if (isHtsFormat) {
            // HTS format header mapping
            const htsHeaderMap: Record<string, string> = {
              '매매일': 'date',
              '종목코드': 'stockCode',
              '종목명': 'stockName',
              '구분': 'type',
              '수량': 'shares',
              '단가': 'pricePerShare',
              '약정금액': 'contractAmount',
              '수수료': 'commission',
              '세금': 'tax',
              '정산금액': 'settlementAmount',
              '채널': 'channel',
            };
            return htsHeaderMap[trimmed] || trimmed;
          } else {
            // Standard format header mapping
            const headerMap: Record<string, string> = {
              '구분': 'type',
              '거래유형': 'type',
              '계열사': 'subsidiaryCode',
              '계열사코드': 'subsidiaryCode',
              '종목명': 'stockName',
              '종목': 'stockName',
              '수량': 'shares',
              '주수': 'shares',
              '단가': 'pricePerShare',
              '매매단가': 'pricePerShare',
              '거래일': 'date',
              '일자': 'date',
            };
            return headerMap[trimmed] || trimmed;
          }
        },
      });

      if (parsed.errors.length > 0) {
        return res.status(400).json({ 
          error: "CSV 파싱 오류", 
          details: parsed.errors.map(e => e.message) 
        });
      }

      const rows = [];
      const parseErrors: string[] = [];

      for (let i = 0; i < parsed.data.length; i++) {
        const row = parsed.data[i] as Record<string, unknown>;
        
        // Clean numeric values (remove commas)
        if (row.shares) row.shares = String(row.shares).replace(/,/g, '');
        if (row.pricePerShare) row.pricePerShare = String(row.pricePerShare).replace(/,/g, '');
        if (row.contractAmount) row.contractAmount = String(row.contractAmount).replace(/,/g, '');
        if (row.commission) row.commission = String(row.commission).replace(/,/g, '');
        if (row.tax) row.tax = String(row.tax).replace(/,/g, '');
        if (row.settlementAmount) row.settlementAmount = String(row.settlementAmount).replace(/,/g, '');
        
        if (isHtsFormat) {
          // HTS format validation
          if (!subsidiaryCode) {
            return res.status(400).json({ 
              error: "HTS 형식 파일에는 계열사 선택이 필요합니다." 
            });
          }
          
          const validatedRow = htsTransactionRowSchema.safeParse(row);
          if (validatedRow.success) {
            // Add subsidiary code and convert to standard format
            rows.push({
              type: validatedRow.data.type as 'buy' | 'sell',
              subsidiaryCode: subsidiaryCode,
              stockName: validatedRow.data.stockName,
              shares: validatedRow.data.shares,
              pricePerShare: validatedRow.data.pricePerShare,
              date: validatedRow.data.date,
              stockCode: validatedRow.data.stockCode,
              commission: validatedRow.data.commission,
              tax: validatedRow.data.tax,
              settlementAmount: validatedRow.data.settlementAmount,
            });
          } else {
            parseErrors.push(`행 ${i + 2}: ${validatedRow.error.message}`);
          }
        } else {
          // Standard format validation
          const validatedRow = csvTransactionRowSchema.safeParse(row);
          if (validatedRow.success) {
            rows.push(validatedRow.data);
          } else {
            parseErrors.push(`행 ${i + 2}: ${validatedRow.error.message}`);
          }
        }
      }

      if (rows.length === 0) {
        return res.status(400).json({ 
          error: "유효한 거래 데이터가 없습니다.", 
          details: parseErrors 
        });
      }

      const result = await storage.importTransactions(rows);
      result.errors = [...parseErrors, ...result.errors];
      result.format = isHtsFormat ? 'HTS' : 'Standard';
      
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Get stock price (uses KIS API if configured, otherwise falls back to mock data)
  app.get("/api/stock-price/:stockName", async (req, res) => {
    try {
      const stockName = decodeURIComponent(req.params.stockName);
      
      // Try KIS API first if configured
      if (kisApiClient.isConfigured()) {
        const kisPrice = await kisApiClient.getStockPriceByName(stockName);
        if (kisPrice) {
          return res.json(kisPrice);
        }
      }
      
      // Fallback to mock data
      const price = await storage.getStockPrice(stockName);
      if (!price) {
        return res.status(404).json({ error: "주가 정보를 찾을 수 없습니다." });
      }
      res.json(price);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Get all available stock prices
  app.get("/api/stock-prices", async (req, res) => {
    try {
      const holdings = await storage.getHoldings();
      const stockNameSet = new Set(holdings.map(h => h.stockName));
      const stockNames = Array.from(stockNameSet);
      
      const prices = [];
      
      // Try KIS API first if configured
      if (kisApiClient.isConfigured()) {
        const kisPrices = await kisApiClient.getMultipleStockPrices(stockNames);
        kisPrices.forEach((price, name) => {
          // Use the original Korean stock name as stockName for frontend matching
          prices.push({ ...price, stockName: name });
        });
        
        // For stocks not found in KIS, use mock data
        for (const stockName of stockNames) {
          if (!kisPrices.has(stockName)) {
            const mockPrice = await storage.getStockPrice(stockName);
            if (mockPrice) prices.push(mockPrice);
          }
        }
      } else {
        // Fallback to mock data
        for (const stockName of stockNames) {
          const price = await storage.getStockPrice(stockName);
          if (price) prices.push(price);
        }
      }
      
      res.json(prices);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Check KIS API status (verifies actual connection)
  app.get("/api/kis/status", async (req, res) => {
    try {
      const { connected, message } = await kisApiClient.verifyConnection();
      const marketStatus = getMarketStatus();
      res.json({ 
        configured: kisApiClient.isConfigured(),
        connected,
        message,
        marketStatus: marketStatus.message,
        marketOpen: marketStatus.isOpen
      });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Market status endpoint
  app.get("/api/market/status", async (req, res) => {
    const status = getMarketStatus();
    res.json({
      isOpen: status.isOpen,
      message: status.message,
      isClosed: isMarketClosed()
    });
  });

  // Get all available stocks (name + code)
  app.get("/api/stocks/list", async (req, res) => {
    try {
      const stocks = kisApiClient.getAllStocks();
      res.json(stocks);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Refresh stock prices using KIS API (admin only)
  app.post("/api/stock-prices/refresh", isAdmin, async (req, res) => {
    try {
      const holdings = await storage.getHoldings();
      const stockNameSet = new Set(holdings.map(h => h.stockName));
      const stockNames = Array.from(stockNameSet);
      
      let updatedCount = 0;
      let failedCount = 0;
      const errors: string[] = [];
      
      // Use KIS API if configured
      if (kisApiClient.isConfigured()) {
        console.log('[API] 한국투자증권 API로 주가 업데이트 시작...');
        
        for (const stockName of stockNames) {
          try {
            const kisPrice = await kisApiClient.getStockPriceByName(stockName);
            if (kisPrice) {
              await storage.updateHoldingPrice(stockName, kisPrice.currentPrice, kisPrice.changePercent);
              updatedCount++;
              console.log(`[API] ${stockName}: ${kisPrice.currentPrice}원 (${kisPrice.changePercent > 0 ? '+' : ''}${kisPrice.changePercent}%)`);
            } else {
              // Fallback to mock data for stocks not in KIS
              const mockPrice = await storage.getStockPrice(stockName);
              if (mockPrice) {
                await storage.updateHoldingPrice(stockName, mockPrice.currentPrice, mockPrice.changePercent);
                updatedCount++;
              } else {
                failedCount++;
                errors.push(`${stockName}: 종목코드를 찾을 수 없습니다.`);
              }
            }
            // API 호출 간격
            await new Promise(resolve => setTimeout(resolve, 100));
          } catch (err) {
            failedCount++;
            errors.push(`${stockName}: ${(err as Error).message}`);
          }
        }
      } else {
        // Fallback to mock data
        for (const stockName of stockNames) {
          const price = await storage.getStockPrice(stockName);
          if (price) {
            await storage.updateHoldingPrice(stockName, price.currentPrice, price.changePercent);
            updatedCount++;
          }
        }
      }
      
      res.json({ 
        success: true, 
        message: `주가가 업데이트되었습니다. (성공: ${updatedCount}, 실패: ${failedCount})`,
        updatedCount,
        failedCount,
        errors: errors.length > 0 ? errors : undefined,
        source: kisApiClient.isConfigured() ? 'KIS API' : 'Mock Data'
      });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });
}
