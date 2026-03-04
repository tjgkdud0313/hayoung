# OK Financial Group Stock Trading App

## Overview

A Korean stock trading mobile web application for OK Financial Group (OK금융그룹). The app provides corporate B2B stock portfolio management for viewing group-level holdings by subsidiary, stock name, and holding company. Mobile-first design optimized for Korean users with table-based layouts.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes (January 2026)

- Redesigned UI based on reference images with 4-tab navigation
- Updated data model to support subsidiary and holding company structure
- Implemented table-based layouts for all portfolio views
- Changed color system: Red for profit (수익), Blue for loss (손실)
- Added Korean currency formatting (조/억/만원 units)
- **CSV Transaction Import** - Upload CSV files to update holdings (admin only)
- **Replit Auth Integration** - Role-based access control with admin/user separation
- **Admin Panel** - CSV upload and price refresh features visible only to admins
- **한국투자증권 Open API 연동** - 실시간 주가 조회 기능 구현 (2026.01.28)
  - KIS_APP_KEY, KIS_APP_SECRET 환경변수로 API 키 관리
  - 자동 토큰 발급 및 갱신 (24시간 유효)
  - 주가 새로고침 버튼으로 보유 종목 실시간 가격 업데이트
  - API 연동 상태 표시 (KIS API / Mock 데이터)
- **WebSocket 실시간 시세 연동** - 진정한 실시간 주가 업데이트 (2026.01.28)
  - KIS WebSocket API를 통한 체결가 실시간 수신
  - 프론트엔드 WebSocket 클라이언트로 즉시 UI 반영
  - 평가금액, 손익률 실시간 자동 계산
  - 연결 상태 표시 (실시간 연결 / 자동 갱신)
  - **폴링 폴백 기능** (2026.02.05): WebSocket 연결 실패 시 30초마다 API 폴링으로 가격 업데이트
  - 배포환경(Production) WebSocket 연결 이슈 대응
- **종목코드 매핑 확장 및 안정성 개선** (2026.01.28)
  - 40개 이상 종목코드 매핑 추가 (LG, HDC, 한화손해보험, KG이니시스, 풍산, 한화, SK, LS, 기아 등)
  - 네트워크 에러 자동 재시도 로직 (최대 2회)
  - API 호출 간격 안정화 (200ms)
  - Vite HMR과 WebSocket 충돌 해결 (noServer 모드)
- **시장 상태 표시 및 종가 기능** (2026.01.28)
  - KRX 기준 실시간 현재가 표시
  - 장 마감 후 (15:30 이후) KRX 종가 표시
  - 시장 상태 표시 (장중/동시호가/장 마감/주말 휴장/장 시작 전)
  - Dashboard 및 StockHoldings 페이지에 시장 상태 인디케이터 추가
  - `/api/market/status` 엔드포인트 추가

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state and caching
- **Styling**: Tailwind CSS with CSS variables for theming
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Build Tool**: Vite with custom plugins for Replit integration

The frontend follows a page-based architecture with shared components:
- Pages: Dashboard, SubsidiaryHoldings, StockHoldings, HoldingCompanyView
- Components: BottomNav, TransactionUploadModal, StockPriceRefreshButton
- Mobile-first design with bottom navigation pattern

### Navigation Structure (4 tabs)
1. **Stock Dashboard** (`/`) - Main dashboard with group total summary, subsidiary cards, today's transactions, CSV upload, price refresh
2. **계열사 보유현황** (`/subsidiary`) - Holdings filtered by subsidiary with dropdown selector
3. **종목별 보유현황** (`/stocks`) - Holdings aggregated by stock name with current prices
4. **금융지주 보유현황** (`/holding-company`) - Holdings grouped by holding company

### Backend Architecture
- **Runtime**: Node.js with Express 5
- **Language**: TypeScript with ESM modules
- **API Style**: RESTful JSON APIs under `/api/*` prefix
- **Development**: Vite dev server with HMR proxied through Express

API endpoints include:
- `GET /api/summary` - Get group total summary
- `GET /api/subsidiary-summaries` - Get OK subsidiary summaries
- `GET /api/subsidiaries` - Get all subsidiaries
- `GET /api/holdings` - Get all holdings
- `GET /api/holdings/subsidiary/:id` - Get holdings by subsidiary
- `GET /api/stocks-by-name` - Get holdings grouped by stock
- `GET /api/holding-company-groups` - Get holdings by holding company
- `GET /api/transactions/today` - Get today's transactions
- `POST /api/orders` - Execute buy/sell orders
- `POST /api/import/transactions` - **NEW** Import transactions from CSV file
- `GET /api/stock-prices` - Get all stock prices (uses KIS API if configured)
- `GET /api/stock-price/:stockName` - Get price for specific stock (uses KIS API if configured)
- `POST /api/stock-prices/refresh` - Refresh all holdings with latest prices (admin only, uses KIS API)
- `GET /api/kis/status` - Check KIS API connection status

### CSV Import Format
The transaction import supports two formats:

**1. Standard Format (기본 형식)**
- `구분` (type): 매수/매도 or buy/sell
- `계열사` (subsidiaryCode): OK, OC, OKH, OT, OKIP, OFI
- `종목명` (stockName): Stock name in Korean
- `수량` (shares): Number of shares
- `단가` (pricePerShare): Price per share
- `거래일` (date): Optional, transaction date

**2. HTS Format (증권사 HTS 매매내역)**
Automatically detected when file contains headers like 매매일, 약정금액, 정산금액
- `매매일` (date): Trade date (2026/01/28)
- `종목코드` (stockCode): Stock code with A prefix (A138930)
- `종목명` (stockName): Stock name in Korean
- `구분` (type): 거래소매수/코스닥매수/거래소매도/코스닥매도
- `수량` (shares): Number of shares
- `단가` (pricePerShare): Price per share
- `약정금액` (contractAmount): Contract amount
- `수수료` (commission): Commission fee
- `세금` (tax): Tax
- `정산금액` (settlementAmount): Settlement amount

**Note:** HTS files don't include subsidiary info, so users must select the subsidiary when uploading.

### Authentication & Authorization
- **Authentication**: Replit Auth with OpenID Connect (Google, GitHub, email login)
- **Session Storage**: PostgreSQL via connect-pg-simple
- **Role-Based Access Control**: Admin users have isAdmin=true in users table
- **Protected Endpoints**: CSV import and stock price refresh require admin role

Admin access control flow:
1. User logs in via Replit Auth (/api/login)
2. Session created with user info stored in users table
3. isAdmin field checked by middleware on protected routes
4. Dashboard UI shows admin features only to admins
5. First admin must be set manually: `UPDATE users SET "isAdmin" = true WHERE id = 'user-id'`

### Data Storage
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema**: Defined in `shared/schema.ts` with Zod validation via drizzle-zod
- **Current Implementation**: In-memory storage with sample data
- **Database**: PostgreSQL for user sessions and auth data

The schema includes:
- Subsidiary (계열사): OK, OC, OKH, OT, OKIP, OFI
- HoldingCompany (금융지주): JB금융지주, OK금융그룹, iM금융지주
- SubsidiaryHolding: Holdings with detailed financial data
- Transaction: Buy/sell transaction records
- StockPrice: Real-time stock price data (ready for external API)
- User: Auth users with isAdmin role field

### Color System
- **Profit (수익)**: Red color (`stock-up` class) - Korean stock market convention
- **Loss (손실)**: Blue color (`stock-down` class)

### Build System
- **Development**: `tsx` for TypeScript execution, Vite for frontend HMR
- **Production Build**: esbuild bundles server code, Vite builds client to `dist/public`
- **Output**: Single `dist/index.cjs` file with bundled dependencies for fast cold starts

## External Dependencies

### Database
- **PostgreSQL**: Connection via `DATABASE_URL` environment variable
- **Drizzle Kit**: Database migrations stored in `./migrations` directory
- **connect-pg-simple**: Session storage (configured but not fully implemented)

### UI Libraries
- **Radix UI**: Full suite of accessible primitives (dialog, dropdown, tabs, etc.)
- **Lucide React**: Icon library
- **Embla Carousel**: For carousel components
- **date-fns**: Date formatting utilities

### File Processing
- **multer**: File upload handling for CSV import
- **papaparse**: CSV parsing with Korean header support

### Development Tools
- **Replit Plugins**: Runtime error overlay, cartographer, dev banner
- **TypeScript**: Strict mode with path aliases (@/, @shared/)

### Key npm Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run db:push` - Push schema changes to database

## External API Integration

### 한국투자증권 Open API (KIS API)
- **Base URL**: `https://openapi.koreainvestment.com:9443` (실전투자)
- **인증 방식**: OAuth 2.0 (client_credentials)
- **환경변수**:
  - `KIS_APP_KEY`: 한국투자증권에서 발급받은 App Key
  - `KIS_APP_SECRET`: 한국투자증권에서 발급받은 App Secret
- **구현 파일**: `server/kisApi.ts`
- **지원 기능**:
  - 자동 토큰 발급 및 갱신 (23시간 캐싱)
  - 주식 현재가 조회 (TR ID: FHKST01010100)
  - 종목명 → 종목코드 매핑 (STOCK_CODE_MAP)
  - 여러 종목 일괄 조회 (API Rate Limit 고려, 100ms 간격)
- **Fallback**: API 키가 없거나 종목코드를 찾지 못하면 Mock 데이터 사용

### 지원 종목 코드 매핑
- JB금융지주: 175330
- iM금융지주: 016610
- BNK금융지주: 138930
- DGB금융지주: 139130
- NICE: 034310
- 한화생명: 088350
- 하나금융지주: 086790 등

### KIS WebSocket 실시간 시세
- **WebSocket URL**: `ws://ops.koreainvestment.com:21000` (실전투자)
- **인증**: Approval Key 발급 후 구독 요청
- **TR ID**: `H0STCNT0` (실시간 체결가)
- **구현 파일**:
  - `server/kisWebSocket.ts` - KIS WebSocket 클라이언트
  - `server/wsServer.ts` - 클라이언트 브로드캐스트 서버
  - `client/src/hooks/useStockWebSocket.ts` - React 훅
- **기능**:
  - 서버 시작 시 자동 연결 및 보유종목 구독
  - 체결가 수신 시 모든 클라이언트에 브로드캐스트
  - 자동 재연결 (5초 후)
  - 평가금액/손익률 실시간 계산

## Future Enhancements
- **신한투자증권 indi API**: ActiveX 기반으로 웹 환경에서는 제한적 (HTS 프로그램 필요)
