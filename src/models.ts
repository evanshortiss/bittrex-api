
import { AxiosRequestConfig } from 'axios'

export interface BittrexApiOptions {
  apikey: string
  apisecret: string
  axiosOptions?: AxiosRequestConfig
  apiVersion?: string
}

// TODO: find all of these types
export type OrderBookType = 'BUY'|'SELL'
export type FillType = 'FILL'
export type OrderType = 'LIMIT_BUY'|'LIMIT_SELL'

/**
 * Returned from the /public/getmarkets
 */
export interface Market {
  MarketCurrency: string
  BaseCurrency: string
  MarketCurrencyLong: string
  BaseCurrencyLong: string
  MinTradeSize: number
  MarketName: string
  IsActive: true
  Created: string
}

/**
 * Returned from the /public/getcurrencies endpoint
 */
export interface Currency {
  Currency: string
  CurrencyLong: string
  MinConfirmation: number
  TxFee: number
  IsActive: boolean
  CoinType: string
  BaseAddress: string
}

/**
 * Returned from the /public/getticker endpoint
 */
export interface Ticker {
  Bid: number
  Ask: number
  Last: number
}

export interface MarketSummaryEntry {
  MarketName: string
  High: number
  Low: number
  Volume: number
  Last: number
  BaseVolume: number
  TimeStamp: string
  Bid: number
  Ask: number
  OpenBuyOrders: number,
  OpenSellOrders: number,
  PrevDay: number
  Created: string
  DisplayMarketName: string
}

export interface OpenOrder {
  Uuid: string|null
  OrderUuid: string
  Exchange: string
  OrderType: OrderType
  Quantity: number
  QuantityRemaining: number
  Limit: number
  CommissionPaid: number
  Price: number
  PricePerUnit: number|null
  Opened: "2014-07-09T03:55:48.77"
  Closed: boolean|null
  CancelInitiated: false
  ImmediateOrCancel: false
  IsConditional: false
  Condition: string|null
  ConditionTarget: string|null
}

export interface OrderBookEntry {
  Quantity: number
  Rate: number
}

export interface MarketHistoryEntry {
  Id: number
  TimeStamp: string
  Quantity: number
  Price: number
  Total: number
  FillType: string
  OrderType: OrderBookType
}

export interface OrderBook {
  buy?: OrderBookEntry
  sell?: OrderBookEntry
}

export interface AccountOrderEntry {
  OrderUuid: string
  Exchange: string
  TimeStamp: string
  OrderType: OrderType
  Limit: number
  Quantity: number
  QuantityRemaining: number
  Commission: number
  Price: number
  PricePerUnit: number
  IsConditional: boolean
  Condition: string
  ConditionTarget: string
  ImmediateOrCancel: boolean
}

export interface AccountBalanceEntry {
  Currency: string
  Balance: number
  Available: number
  Pending: number
  CryptoAddress: string
  Requested: boolean
  Uuid: string
}

export interface AccountDepositAddress {
  Currency: string
  Address: string
}

export interface DepositHistoryEntry {
  PaymentUuid: string
  Currency: string
  Amount: number
  Address: string
  Opened: string
  Authorized: boolean
  PendingPayment: boolean
  TxCost: number
  TxId: string
  Canceled: boolean
  InvalidAddress: false
}

export interface WithdrawlResult {
  uuid: string
}

export interface BuyLimitResult {
  uuid: string
}

export interface SellLimitResult {
  uuid: string
}

export interface CancelOrderResult {
  uuid: string
}

export interface WithdrawlParams {
  currency: string
  quantity: string
  address: string
  paymentid?: string
}

export interface WithdrawlHistoryEntry {
  PaymentUuid: string
  Currency: string
  Amount: number
  Address: string
  Opened: string
  Authorized: boolean
  PendingPayment: boolean
  TxCost: number
  TxId: string
  Canceled: boolean
  InvalidAddress: boolean
}

export interface ApiResponse {
  success: boolean
  message: string
  result: any
}
