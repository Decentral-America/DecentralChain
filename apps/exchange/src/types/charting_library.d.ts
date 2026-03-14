/**
 * Minimal TradingView Charting Library type declarations
 * The actual library is loaded at runtime from /public/trading-view/
 */

declare module 'charting_library' {
  export interface Bar {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume?: number;
  }

  export type ResolutionString = string;

  export interface LibrarySymbolInfo {
    name: string;
    full_name?: string;
    ticker?: string;
    description: string;
    type: string;
    session: string;
    exchange: string;
    listed_exchange?: string;
    timezone: string;
    format: string;
    pricescale: number;
    minmov: number;
    has_intraday: boolean;
    has_daily?: boolean;
    has_weekly_and_monthly?: boolean;
    supported_resolutions: ResolutionString[];
    volume_precision: number;
    data_status: string;
  }

  export type OnReadyCallback = (config: DatafeedConfiguration) => void;
  export type ResolveCallback = (symbolInfo: LibrarySymbolInfo) => void;
  export type ErrorCallback = (reason: string) => void;
  export type HistoryCallback = (bars: Bar[], meta: { noData: boolean }) => void;
  export type SubscribeBarsCallback = (bar: Bar) => void;
  export type SearchSymbolsCallback = (items: SearchSymbolResultItem[]) => void;

  export interface SearchSymbolResultItem {
    symbol: string;
    full_name: string;
    description: string;
    exchange: string;
    ticker?: string;
    type: string;
  }

  export interface DatafeedConfiguration {
    supported_resolutions?: ResolutionString[];
    exchanges?: Array<{ value: string; name: string; desc: string }>;
    symbols_types?: Array<{ name: string; value: string }>;
  }

  export interface IBasicDataFeed {
    onReady: (callback: OnReadyCallback) => void;
    searchSymbols: (userInput: string, exchange: string, symbolType: string, onResult: SearchSymbolsCallback) => void;
    resolveSymbol: (symbolName: string, onResolve: ResolveCallback, onError: ErrorCallback) => void;
    getBars: (symbolInfo: LibrarySymbolInfo, resolution: ResolutionString, periodParams: { from: number; to: number; firstDataRequest: boolean }, onResult: HistoryCallback, onError: ErrorCallback) => void;
    subscribeBars: (symbolInfo: LibrarySymbolInfo, resolution: ResolutionString, onTick: SubscribeBarsCallback, listenerGuid: string, onResetCacheNeededCallback: () => void) => void;
    unsubscribeBars: (listenerGuid: string) => void;
  }
}
