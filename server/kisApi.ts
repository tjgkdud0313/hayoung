/**
 * 한국투자증권 Open API 클라이언트
 * 실시간 주가 조회 기능
 * KRX 기준 현재가 및 장 마감 후 종가 표시
 */

/**
 * 한국 시장 시간 관련 유틸리티
 */
function getKoreanTime(): Date {
  // UTC에서 KST(+9시간)로 변환
  const now = new Date();
  const kstOffset = 9 * 60 * 60 * 1000;
  return new Date(now.getTime() + kstOffset);
}

function isMarketClosed(): boolean {
  const kst = getKoreanTime();
  const hours = kst.getUTCHours();
  const minutes = kst.getUTCMinutes();
  const day = kst.getUTCDay();
  
  // 주말 (토요일=6, 일요일=0)
  if (day === 0 || day === 6) {
    return true;
  }
  
  // 장 마감: 15:30 이후 또는 09:00 이전
  const timeInMinutes = hours * 60 + minutes;
  const marketOpen = 9 * 60;      // 09:00
  const marketClose = 15 * 60 + 30; // 15:30
  
  return timeInMinutes >= marketClose || timeInMinutes < marketOpen;
}

function getMarketStatus(): { isOpen: boolean; message: string } {
  const kst = getKoreanTime();
  const hours = kst.getUTCHours();
  const minutes = kst.getUTCMinutes();
  const day = kst.getUTCDay();
  
  if (day === 0 || day === 6) {
    return { isOpen: false, message: '주말 휴장' };
  }
  
  const timeInMinutes = hours * 60 + minutes;
  const marketOpen = 9 * 60;
  const marketClose = 15 * 60 + 30;
  
  if (timeInMinutes < marketOpen) {
    return { isOpen: false, message: '장 시작 전' };
  } else if (timeInMinutes >= marketClose) {
    return { isOpen: false, message: '장 마감 (종가 표시)' };
  } else if (timeInMinutes >= 15 * 60 + 20) {
    return { isOpen: true, message: '동시호가 진행 중' };
  } else {
    return { isOpen: true, message: '장중' };
  }
}

interface KISTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface KISPriceResponse {
  rt_cd: string;
  msg_cd: string;
  msg1: string;
  output?: {
    stck_prpr: string;      // 현재가
    prdy_vrss: string;      // 전일대비
    prdy_vrss_sign: string; // 전일대비부호 (1:상한, 2:상승, 3:보합, 4:하한, 5:하락)
    prdy_ctrt: string;      // 전일대비율
    stck_oprc: string;      // 시가
    stck_hgpr: string;      // 고가
    stck_lwpr: string;      // 저가
    acml_vol: string;       // 누적거래량
    acml_tr_pbmn: string;   // 누적거래대금
    hts_kor_isnm: string;   // HTS 한글 종목명
    stck_shrn_iscd: string; // 주식 단축 종목코드
  };
}

// 종목코드 매핑 (종목명 -> 종목코드)
const STOCK_CODE_MAP: Record<string, string> = {
  // 금융지주
  'JB금융지주': '175330',
  'iM금융지주': '139130',  // DGB금융지주 리브랜딩
  'BNK금융지주': '138930',
  'DGB금융지주': '139130',
  '하나금융지주': '086790',
  '우리금융지주': '316140',
  'KB금융': '105560',
  '신한지주': '055550',
  '메리츠금융지주': '138040',
  '한국금융지주': '071050',
  
  // 보험사
  '한화생명': '088350',
  '한화손해보험': '000370',
  '삼성생명': '032830',
  '삼성화재': '000810',
  'DB손해보험': '005830',
  
  // 증권사
  'NH투자증권': '005940',
  '키움증권': '039490',
  '미래에셋증권': '006800',
  'DB증권': '016610', // DB금융투자(구 DB증권)
  'LS증권': '030610',
  
  // 대기업
  'SK하이닉스': '000660',
  '삼성전자': '005930',
  'LG전자': '066570',
  'LG': '003550',
  '현대차': '005380',
  '기아': '000270',
  '현대모비스': '012330',
  '카카오': '035720',
  'NAVER': '035420',
  'LG에너지솔루션': '373220',
  '삼성SDI': '006400',
  '포스코홀딩스': '005490',
  'SK이노베이션': '096770',
  'SK': '034730',
  
  // 기타 상장사
  'NICE': '034310',
  'SGI서울보증': '001020',
  'HDC': '012630',
  'KG이니시스': '035600',
  'KG모빌리언스': '046440',
  'KCC': '002380',
  '한국전력': '015760',
  '풍산': '103140',
  '한화': '000880',
  'OCI홀딩스': '010060',
  'E1': '017940',
  '리드코프': '012700',
  '상상인': '038540',
  '티와이홀딩스': '363280',
  '세방전지': '004490',
  '세방': '004360',
  '세아제강': '306200',
  '태광산업': '003240',
  'LS': '006260',
  
  // 일본 주식 (원화 환산 - KIS API에서 미지원, Mock 데이터 사용)
  'J Trust(원화)': '', // KIS API 미지원
};

class KISApiClient {
  private baseUrl: string;
  private appKey: string;
  private appSecret: string;
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;

  constructor() {
    // 실전투자 URL (모의투자: https://openapivts.koreainvestment.com:29443)
    this.baseUrl = 'https://openapi.koreainvestment.com:9443';
    this.appKey = process.env.KIS_APP_KEY || '';
    this.appSecret = process.env.KIS_APP_SECRET || '';
  }

  /**
   * 액세스 토큰 발급
   */
  async getAccessToken(): Promise<string> {
    // 토큰이 유효하면 재사용
    if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
      return this.accessToken;
    }

    if (!this.appKey || !this.appSecret) {
      throw new Error('KIS API 키가 설정되지 않았습니다. KIS_APP_KEY와 KIS_APP_SECRET을 확인해주세요.');
    }

    const url = `${this.baseUrl}/oauth2/tokenP`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'client_credentials',
        appkey: this.appKey,
        appsecret: this.appSecret,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`토큰 발급 실패: ${response.status} - ${errorText}`);
    }

    const data: KISTokenResponse = await response.json();
    this.accessToken = data.access_token;
    // 토큰 만료 시간 설정 (여유있게 23시간으로 설정)
    this.tokenExpiry = new Date(Date.now() + 23 * 60 * 60 * 1000);
    
    console.log('[KIS API] 토큰 발급 완료');
    return this.accessToken;
  }

  /**
   * 종목코드 조회
   */
  getStockCode(stockName: string): string | null {
    return STOCK_CODE_MAP[stockName] || null;
  }

  /**
   * 종목코드로 종목명 조회 (역변환)
   */
  getStockNameByCode(stockCode: string): string | null {
    for (const [name, code] of Object.entries(STOCK_CODE_MAP)) {
      if (code === stockCode) {
        return name;
      }
    }
    return null;
  }

  /**
   * 전체 종목 목록 조회 (종목명 + 종목코드)
   */
  getAllStocks(): Array<{ name: string; code: string }> {
    return Object.entries(STOCK_CODE_MAP)
      .filter(([_, code]) => code !== '') // 빈 코드 제외
      .map(([name, code]) => ({ name, code }))
      .sort((a, b) => a.name.localeCompare(b.name, 'ko'));
  }

  /**
   * 토큰 무효화 (401 에러 시 재발급을 위해)
   */
  invalidateToken(): void {
    this.accessToken = null;
    this.tokenExpiry = null;
    console.log('[KIS API] 토큰 무효화됨');
  }

  /**
   * 주식 현재가 조회 (재시도 로직 포함)
   */
  async getStockPrice(stockCode: string, retryCount = 0): Promise<{
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
  } | null> {
    const maxRetries = 2;
    
    try {
      const token = await this.getAccessToken();
      
      // URL에 쿼리 파라미터 추가
      const url = new URL(`${this.baseUrl}/uapi/domestic-stock/v1/quotations/inquire-price`);
      url.searchParams.append('FID_COND_MRKT_DIV_CODE', 'J'); // 주식
      url.searchParams.append('FID_INPUT_ISCD', stockCode);

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'content-type': 'application/json; charset=utf-8',
          'authorization': `Bearer ${token}`,
          'appkey': this.appKey,
          'appsecret': this.appSecret,
          'tr_id': 'FHKST01010100', // 주식현재가 시세 조회
        } as HeadersInit,
      });

      // 401 에러 시 토큰 갱신 후 재시도
      if (response.status === 401 && retryCount < maxRetries) {
        console.log('[KIS API] 토큰 만료, 재발급 시도...');
        this.invalidateToken();
        await new Promise(resolve => setTimeout(resolve, 500));
        return this.getStockPrice(stockCode, retryCount + 1);
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[KIS API] 시세 조회 실패: ${response.status} - ${errorText}`);
        return null;
      }

      const data: KISPriceResponse = await response.json();
      
      // API 오류 응답 시 토큰 재발급 후 재시도
      if (data.rt_cd !== '0' && retryCount < maxRetries && (data.msg1?.includes('토큰') || data.msg1?.includes('TOKEN'))) {
        console.log('[KIS API] 토큰 관련 오류, 재발급 시도...');
        this.invalidateToken();
        await new Promise(resolve => setTimeout(resolve, 500));
        return this.getStockPrice(stockCode, retryCount + 1);
      }
      
      if (data.rt_cd !== '0' || !data.output) {
        console.error(`[KIS API] 시세 조회 오류: ${data.msg1}`);
        return null;
      }

      const output = data.output;
      
      // KIS API는 prdy_vrss, prdy_ctrt를 절대값으로 반환하므로 부호 적용 필요
      // 부호: 1=상한, 2=상승, 3=보합, 4=하한, 5=하락
      const sign = output.prdy_vrss_sign;
      const signMultiplier = ['1', '2'].includes(sign) ? 1 : ['4', '5'].includes(sign) ? -1 : 1;
      
      const changeAmount = Math.abs(parseInt(output.prdy_vrss) || 0) * signMultiplier;
      const changePercent = Math.abs(parseFloat(output.prdy_ctrt) || 0) * signMultiplier;
      
      console.log(`[KIS API] ${stockCode}: 현재가=${output.stck_prpr}, 등락=${changeAmount}, 등락률=${changePercent}%, 부호코드=${sign}`);
      
      return {
        stockCode: output.stck_shrn_iscd || stockCode,
        stockName: output.hts_kor_isnm || stockCode,
        currentPrice: parseInt(output.stck_prpr) || 0,
        changeAmount,
        changePercent,
        openPrice: parseInt(output.stck_oprc) || 0,
        highPrice: parseInt(output.stck_hgpr) || 0,
        lowPrice: parseInt(output.stck_lwpr) || 0,
        volume: parseInt(output.acml_vol) || 0,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      // 네트워크 에러 시 재시도
      if (error?.cause?.code === 'UND_ERR_SOCKET' && retryCount < maxRetries) {
        console.warn(`[KIS API] ${stockCode}: 네트워크 에러, 재시도 ${retryCount + 1}/${maxRetries}...`);
        await new Promise(resolve => setTimeout(resolve, 500));
        return this.getStockPrice(stockCode, retryCount + 1);
      }
      console.error('[KIS API] 시세 조회 중 오류:', error);
      return null;
    }
  }

  /**
   * 종목명으로 현재가 조회
   */
  async getStockPriceByName(stockName: string): Promise<{
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
  } | null> {
    const stockCode = this.getStockCode(stockName);
    if (!stockCode) {
      console.warn(`[KIS API] 종목코드를 찾을 수 없음: ${stockName}`);
      return null;
    }
    return this.getStockPrice(stockCode);
  }

  /**
   * 여러 종목의 현재가 일괄 조회
   */
  async getMultipleStockPrices(stockNames: string[]): Promise<Map<string, {
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
  }>> {
    const results = new Map();
    
    // API 호출 제한을 고려해 순차적으로 조회 (초당 5건 제한으로 안정성 확보)
    for (const stockName of stockNames) {
      try {
        const price = await this.getStockPriceByName(stockName);
        if (price) {
          results.set(stockName, price);
        }
      } catch (error: any) {
        // 네트워크 에러 시 잠시 대기 후 재시도
        if (error?.cause?.code === 'UND_ERR_SOCKET') {
          console.warn(`[KIS API] ${stockName}: 네트워크 에러, 500ms 후 재시도...`);
          await new Promise(resolve => setTimeout(resolve, 500));
          try {
            const price = await this.getStockPriceByName(stockName);
            if (price) {
              results.set(stockName, price);
            }
          } catch {
            console.error(`[KIS API] ${stockName}: 재시도 실패`);
          }
        } else {
          console.error(`[KIS API] ${stockName}: 조회 실패 - ${error.message}`);
        }
      }
      // API 호출 간격 (200ms로 증가 - 안정성 확보)
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    return results;
  }

  /**
   * API 키 설정 여부 확인
   */
  isConfigured(): boolean {
    return !!(this.appKey && this.appSecret);
  }

  /**
   * API 연결 상태 확인 (실제 토큰 발급으로 검증)
   */
  async verifyConnection(): Promise<{ connected: boolean; message: string }> {
    if (!this.isConfigured()) {
      return { connected: false, message: 'API 키가 설정되지 않았습니다.' };
    }

    try {
      await this.getAccessToken();
      return { connected: true, message: '한국투자증권 API 연결 성공' };
    } catch (error) {
      return { 
        connected: false, 
        message: `API 연결 실패: ${(error as Error).message}` 
      };
    }
  }
}


// 싱글톤 인스턴스
export const kisApiClient = new KISApiClient();

// 시장 상태 유틸리티 함수 export
export { isMarketClosed, getMarketStatus, getKoreanTime };
