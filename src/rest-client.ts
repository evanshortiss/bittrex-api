import * as Models from "./models";
import * as url from 'url-join'
import axios, { AxiosInstance, AxiosResponse, AxiosRequestConfig } from "axios";
import { getNonce, getHmac } from "./utils"
import { getLogger } from './log'
import { stringify } from 'querystring'
import { BittrexRestApiError, BittrexHttpError } from './errors'

const log = getLogger('rest-client')

const AXIOS_DEFAULTS: AxiosRequestConfig = {
  timeout: 15000
}

export class RestClient {
  protected options: Models.BittrexApiOptions
  protected axios: AxiosInstance

  constructor (options: Models.BittrexApiOptions) {
    this.options = options

    this.axios = axios.create(Object.assign(AXIOS_DEFAULTS, options.axiosOptions || {}))

    // Log outgoing requests
    this.axios.interceptors.request.use((config: AxiosRequestConfig) => {
      log(`making request with url ${config.url}`)

      return config
    })

    // Log incoming responses
    this.axios.interceptors.response.use((resp) => {
      log(`received ${resp.status} response for request to ${resp.config.url}. response data %j`, resp.data)

      return resp;
    })
  }

  /**
   * Perform a request to the given REST endpoint with the passed options.
   * @param uri Relative path to call.
   * @param options AxiosRequestConfig options.
   */
  async http (path: string, options: AxiosRequestConfig = {}) {
    // Need to manually build querystring to generate hmac for the request
    const querystring = stringify(
      Object.assign(
        options.params || {},
        {
          apikey: this.options.apikey,
          nonce: getNonce()
        }
      )
    )

    // Don't allow axios to overwrite our querystring using it's internal logic
    delete options.params

    // Join the URL parts safely to generate the entire endpoint, e.g:
    // https://bittrex.com/api/v1.1/$path?apikey=$apikey&nonce=$nonce;
    const fullUrl = url(
      'https://bittrex.com/api/',
      this.options.apiVersion || 'v1.1',
      path,
      `?${querystring}`
    )

    let result: AxiosResponse;

    const requestOptions = Object.assign({
      url: fullUrl,
      headers: {
        apisign: getHmac(fullUrl, this.options.apisecret)
      },
      // We don't want axios to throw errors for unexpected status codes, we'd
      // rather handle those ourselves and emit our own error instances
      validateStatus: () => { return true }
    }, options)

    // If axios throws an error, e.g a timeout, we catch it and bubble up
    try {
      result = await this.axios.request(requestOptions)
    } catch (e) {
      throw new BittrexHttpError(e)
    }

    // Erorr handling here is a little odd due to the way Bittrex handles
    // responses. Bittrex, why you no use HTTP status codes!?

    if (result.status !== 200) {
      throw new BittrexHttpError(
        `received http ${result.status} from bittrex with message "${result.statusText}"`,
        result.statusText,
        result.status
      )
    } else  {
      const body: Models.ApiResponse = result.data

      if (body.success) {
        return result
      } else {
        throw new BittrexRestApiError(
          body.message
        )
      }
    }
  }

  /**
   * Used to get the open and available trading markets at Bittrex along with
   * other meta data.
   */
  async getMarkets () {
    const ret = await this.http('/public/getmarkets')

    return ret.data.result as Models.Market[]
  }

  /**
   * Used to get all supported currencies at Bittrex along with other meta data.
   */
  async getCurrencies () {
    const ret = await this.http('/public/getcurrencies')

    return ret.data.result as Models.Currency[]
  }

  /**
   * Used to get the current tick values for a market.
   * @param tickerA The left hand ticker, e.g "BTC" in "BTC-LTC"
   * @param tickerB The right hand ticker, e.g "LTC" in "BTC-LTC"
   */
  async getTicker (tickerA: string, tickerB: string) {
    const market = `${tickerA}-${tickerB}`

    const ret = await this.http('/public/getticker', {
      params: {market}
    })

    return ret.data.result as Models.Ticker
  }

  /**
   * Used to get the last 24 hour summary of all active exchanges
   */
  async getMarketSummaries () {
    const ret = await this.http('/public/getmarketsummaries')

    return ret.data.result as Models.MarketSummaryEntry[]
  }

  /**
   * Used to get the last 24 hour summary of the given exchanges.
   *
   * The Bittrex API returns an Array, but this function returns the sole Object
   * that the Array contains to simplify things for you.
   *
   * @param tickerA The left hand ticker, e.g "BTC" in "BTC-LTC"
   * @param tickerB The right hand ticker, e.g "LTC" in "BTC-LTC"
   */
  async getMarketSummary (tickerA: string, tickerB: string) {
    const ret = await this.http('/public/getmarketsummary', {
      params: {
        market: `${tickerA}-${tickerB}`
      }
    })

    return ret.data.result[0] as Models.MarketSummaryEntry
  }

  /**
   * Used to retrieve the orderbook for a given market.
   * @param tickerA The left hand ticker, e.g "BTC" in "BTC-LTC"
   * @param tickerB The right hand ticker, e.g "LTC" in "BTC-LTC"
   * @param type "BUY", "SELL", or "BOTH"
   */
  async getOrderBook (tickerA: string, tickerB: string, type: Models.OrderBookType|'BOTH') {
    const ret = await this.http('/public/getorderbook', {
      params: {
        market: `${tickerA}-${tickerB}`,
        type: type.toLowerCase()
      }
    })

    return ret.data.result as Models.OrderBook
  }

  /**
   * Used to retrieve the latest trades that have occured for a specific market.
   * @param tickerA The left hand ticker, e.g "BTC" in "BTC-LTC"
   * @param tickerB The right hand ticker, e.g "LTC" in "BTC-LTC"
   */
  async getMarketHistory (tickerA: string, tickerB: string) {
    const ret = await this.http('/public/getmarkethistory', {
      params: {
        market: `${tickerA}-${tickerB}`
      }
    })

    return ret.data.result as Models.MarketHistoryEntry[]
  }

  /**
   * Used to retrieve all balances from your account.
   */
  async getBalances () {
    const ret = await this.http('/account/getbalances')

    return ret.data.result as Models.AccountBalanceEntry[]
  }

  /**
   * Used to retrieve the balance from your account for a specific currency.
   * @param currency
   */
  async getBalance (currency: string) {
    const ret = await this.http('/account/getbalance', {
      params: {currency}
    })

    return ret.data.result as Models.AccountBalanceEntry
  }


  /**
   * Used to retrieve your order history.
   */
  async getOrderHistory (): Promise<Models.AccountOrderEntry[]>

  /**
   * Used to retrieve your order history.
   * @param tickerA The left hand ticker, e.g "BTC" in "BTC-LTC"
   * @param tickerB The right hand ticker, e.g "LTC" in "BTC-LTC"
   */
  async getOrderHistory (tickerA: string, tickerB: string): Promise<Models.AccountOrderEntry[]>

  async getOrderHistory (tickerA?: string, tickerB?: string) {
    let opts;

    if (tickerA && tickerB) {
      opts = {
        params: {
          market: `${tickerA}-${tickerB}`
        }
      }
    }

    const ret = await this.http('/account/getorderhistory', opts)

    return ret.data.result as Models.AccountOrderEntry[]
  }

  /**
   * Used to retrieve your deposit history.
   * Can filter by passing a currency.
   * @param currency
   */
  async getDepositHistory (currency?: string) {
    const ret = await this.http('/account/getdeposithistory', {
      params: { currency }
    })

    return ret.data.result as Models.AccountOrderEntry[]
  }

  /**
   * Used to retrieve or generate an address for a specific currency.
   * If one does not exist, the call will fail and return ADDRESS_GENERATING until one is available.
   * @param currency
   */
  async getDepositAddress (currency: string) {
    const ret = await this.http('/account/getdepositaddress', {
      params: { currency }
    })

    return ret.data.result as Models.AccountDepositAddress
  }

  /**
   * Used to retrieve a single order by uuid.
   * @param uuid
   */
  async getOrder (uuid: string) {
    const ret = await this.http('/account/getorder', {
      params: {uuid}
    })

    return ret.data.result as Models.AccountOrderEntry
  }

  /**
   * Used to withdraw funds from your account.
   * Note: Please account for transaction fees.
   * @param params
   */
  async withdraw (params: Models.WithdrawlParams) {
    const ret = await this.http('/account/withdraw', { params })

    return ret.data.result as Models.WithdrawlResult
  }

  /**
   * Used to retrieve your withdrawal history.
   * @param currency
   */
  async getWithdrawlHistory (currency?: string) {
    const ret = await this.http('/account/getwithdrawalhistory', { params: { currency } })

    return ret.data.result as Models.WithdrawlHistoryEntry[]
  }

  /**
   * Used to place a buy order in a specific market. Use buylimit to place limit orders.
   * Make sure you have the proper permissions set on your API keys for this call to work.
   * @param tickerA The left hand ticker, e.g "BTC" in "BTC-LTC"
   * @param tickerB The right hand ticker, e.g "LTC" in "BTC-LTC"
   * @param quantity The amount to purchase.
   * @param rate The rate at which to place the order.
   */
  async buyLimit (tickerA: string, tickerB: string, quantity: string, rate: string) {
    const market = `${tickerA}-${tickerB}`

    const ret = await this.http('/market/buylimit', {
      params: {
        market,
        quantity,
        rate
      }
    })

    return ret.data.result as Models.BuyLimitResult
  }

  /**
   * Used to place a buy order in a specific market. Use buylimit to place limit orders.
   * Make sure you have the proper permissions set on your API keys for this call to work.
   * @param tickerA The left hand ticker, e.g "BTC" in "BTC-LTC"
   * @param tickerB The right hand ticker, e.g "LTC" in "BTC-LTC"
   * @param quantity The amount to purchase.
   * @param rate The rate at which to place the order.
   */
  async sellLimit (tickerA: string, tickerB: string, quantity: string, rate: string) {
    const market = `${tickerA}-${tickerB}`

    const ret = await this.http('/market/selllimit', {
      params: {
        market,
        quantity,
        rate
      }
    })

    return ret.data.result as Models.SellLimitResult
  }

  /**
   * Used to cancel a buy or sell order.
   * @param uuid The order identifier
   */
  async cancelOrder (uuid: string): Promise<void> {
    await this.http('/market/cancel', {
      params: { uuid }
    })
  }


  /**
   * Get all orders that you currently have opened.
   * A specific market can be requested.
   */
  async getOpenOrders (): Promise<Models.OpenOrder[]>

  /**
   * Get all orders that you currently have opened.
   * A specific market can be requested.
   * @param tickerA The left hand ticker, e.g "BTC" in "BTC-LTC"
   * @param tickerB The right hand ticker, e.g "LTC" in "BTC-LTC"
   */
  async getOpenOrders (tickerA: string, tickerB: string): Promise<Models.OpenOrder[]>

  async getOpenOrders (tickerA?: string, tickerB?: string) {
    const market = `${tickerA}-${tickerB}`

    let opts;

    if (tickerA && tickerB) {
      opts = {
        params: {
          market: `${tickerA}-${tickerB}`
        }
      }
    }

    const ret = await this.http('/market/getopenorders', opts)

    return ret.data.result as Models.OpenOrder[]
  }
}

