import { RestClient, RestApiError } from '../bittrex'
import * as assert from 'assert'
import * as nock from 'nock'

// Replace these with real values and comment out backend.configure() to use the
// real Bittrex API - just be careful not to commit real keys!
const apikey = 'an-api-key-should-go-here'
const apisecret = 'an-api-secret-should-go-here'

/**
 * Validates the query of a request contains the default required params
 * @param query
 */
const defaultQuery = (query: any) => {
  expect(query.apikey).toEqual(apikey)

  // Jest doesn't seem to support checking toBeA(String) - Odd...
  expect(typeof query.nonce).toEqual('string')

  expect(query.nonce).toHaveLength(24)

  return true
}

// We mock out API request endpoints using nock in each test case
const api = nock('https://bittrex.com/api/v1.1', {
  reqheaders: {
    'apisign': (value: string) => {
      expect(value).toHaveLength(128)

      return true;
    }
  }
})

// This is our Bittrex client that access the rest API, but requests will
// actually be served by nock for these tests
const client = new RestClient({
  apikey: apikey,
  apisecret: apisecret
})

describe('http error handling', () => {
  it('should return a BittrexRestApiError instance when status code is not 200', async () => {
    api
      .get('/missing/endpoint')
      .query(defaultQuery)
      .reply(404, {})

    try {
      const balanceBtc = await client.http('/missing/endpoint')
      assert(false, 'API call should have failed');
    } catch (e) {
      expect(e).toBeInstanceOf(RestApiError)
      expect(e.toString()).toEqual(
        'BittrexRestApiError: received status code 404 and text "null"'
      )
    }
  })

  it('should return a BittrexRestApiError instance when response.success is false', async () => {
    api
      .get('/valid/endpoint')
      .query(defaultQuery)
      .reply(200, {
        success: false,
        message: 'something went wrong'
      })

    try {
      const balanceBtc = await client.http('/valid/endpoint')
      assert(false, 'API call should have failed');
    } catch (e) {
      expect(e).toBeInstanceOf(RestApiError)
      expect(e.toString()).toEqual(
        'BittrexRestApiError: body.success was false with message "something went wrong"'
      )
    }
  })

  it('should wrap errors bubbled up from axios such as timeouts', async () => {
    const delay = 200
    const timeout = delay * 0.5

    api
      .get('/slow/endpoint')
      .delay(delay)
      .delayConnection(delay)
      .query(defaultQuery)
      .reply(200, {})

    try {
      await client.http('/slow/endpoint', {
        timeout: timeout
      })
      assert(false, 'API call should have timed out');
    } catch (e) {
      expect(e).toBeInstanceOf(RestApiError)
      expect(e.toString()).toContain(`timeout of ${timeout}ms exceeded`)
    }
  })
})

describe('#getBalance()', () => {
  it('should return BTC balance for the account', async () => {
    api
      .get('/account/getbalance')
      .query((query: any) => {
        expect(query.currency.toLowerCase()).toEqual('btc')
        return defaultQuery(query)
      })
      .reply(200, require('./fixtures/get-account-btc-balance.json'))

    const balanceBtc = await client.getBalance('btc')

    expect(balanceBtc).toEqual({
      Currency: 'BTC',
      Balance: 5,
      Available: 3,
      Pending: 0,
      CryptoAddress: 'FAKE_BTC_ADDRESS'
    })
  })
})

describe('#getBalances()', () => {
  it('should return all account balances', async () => {
    api
      .get('/account/getbalances')
      .query(defaultQuery)
      .reply(200, require('./fixtures/get-account-balances.json'))

    const balances = await client.getBalances()

    expect(balances).toBeInstanceOf(Array)
    expect(balances).toHaveLength(3)
  })
})

describe('#getCurrencies', () => {
  it('should return array of currency objects', async () => {
    api
      .get('/public/getcurrencies')
      .query(defaultQuery)
      .reply(200, require('./fixtures/get-currencies.json'))

    const markets = await client.getCurrencies()

    expect(markets).toBeInstanceOf(Array)
    expect(markets).toHaveLength(3)
  })
})

describe('#getDepositAddress()', () => {
  it('should return a deposit address for BTC', async () => {
    api
      .get('/account/getdepositaddress')
      .query((query: any) => {
        expect(query.currency.toLowerCase()).toEqual('btc')
        return defaultQuery(query)
      })
      .reply(200, require('./fixtures/get-deposit-address.json'))

    const address = await client.getDepositAddress('BTC')

    expect(address).toEqual({
      Currency: 'BTC',
      Address: 'SOME BTC ADDRESS'
    })
  })
})

describe('#getDepositHistory()', () => {
  it('should return deposit history for the account', async () => {
    api
      .get('/account/getdeposithistory')
      .query(defaultQuery)
      .reply(200, require('./fixtures/get-deposit-history.json'))

    const deposits = await client.getDepositHistory();

    expect(deposits).toBeInstanceOf(Array)
    expect(deposits).toHaveLength(2)
    expect(deposits).toContainEqual({
      PaymentUuid: '554ec664-8842-4fe9-b491-06225becbd59',
      Currency: 'BTC',
      Amount: 0.00156121,
      Address: '1K37yQZaGrPKNTZ5KNP792xw8f7XbXxetE',
      Opened: '2014-07-11T03:41:25.323',
      Authorized: true,
      PendingPayment: false,
      TxCost: 0.0002,
      TxId: '70cf6fdccb9bd38e1a930e13e4ae6299d678ed6902da710fa3cc8d164f9be126',
      Canceled: false,
      InvalidAddress: false
    })
  })
})

describe('#getMarketHistory()', () => {
  it('should return market history for BTC-DOGE pair', async () => {
    api
      .get('/public/getmarkethistory')
      .query((query: any) => {
        expect(query.market).toEqual('BTC-DOGE')
        return defaultQuery(query)
      })
      .reply(200, require('./fixtures/get-market-history.json'))

    const mktHistory = await client.getMarketHistory('BTC', 'DOGE')

    expect(mktHistory).toBeInstanceOf(Array)
    expect(mktHistory).toContainEqual({
      Id: 10313129,
      TimeStamp: '2017-12-19T21:12:01.683',
      Quantity: 43911.28,
      Price: 3.2e-7,
      Total: 0.0140516,
      FillType: 'PARTIAL_FILL',
      OrderType: 'SELL'
    })
  })
})

describe('#getMarkets()', () => {
  it('should return array of market objects', async () => {
    api
      .get('/public/getmarkets')
      .query(defaultQuery)
      .reply(200, require('./fixtures/get-markets.json'))

    const markets = await client.getMarkets()

    expect(markets).toBeInstanceOf(Array)
    expect(markets).toHaveLength(3)
  })
})

describe('#getMarketSummaries()', () => {
  it('should return array of market summary objects', async () => {
    api
      .get('/public/getmarketsummaries')
      .query(defaultQuery)
      .reply(200, require('./fixtures/get-market-summaries.json'))

    const marketSummaries = await client.getMarketSummaries()

    expect(marketSummaries).toBeInstanceOf(Array)
    expect(marketSummaries).toHaveLength(3)
    expect(marketSummaries).toContainEqual({
      MarketName: 'BTC-1ST',
      High: 0.00004862,
      Low: 0.00003921,
      Volume: 12098827.98901271,
      Last: 0.0000447,
      BaseVolume: 527.9783083,
      TimeStamp: '2017-12-19T21:19:23.17',
      Bid: 0.00004466,
      Ask: 0.0000447,
      OpenBuyOrders: 591,
      OpenSellOrders: 4246,
      PrevDay: 0.00003945,
      Created: '2017-06-06T01:22:35.727'
    })
  })
})

describe('#getMarketSummary()', () => {
  it('should return array of market summary objects for BTC-LTC', async () => {
    api
      .get('/public/getmarketsummary')
      .query((query: any) => {
        expect(query.market).toEqual('btc-ltc')
        return defaultQuery(query)
      })
      .reply(200, require('./fixtures/get-market-summary.json'))

    const marketSummary = await client.getMarketSummary('btc', 'ltc')

    expect(marketSummary).toEqual({
      MarketName: 'BTC-LTC',
      High: 0.02,
      Low: 0.01790001,
      Volume: 320125.18706995,
      Last: 0.01966999,
      BaseVolume: 6117.00242171,
      TimeStamp: '2017-12-19T21:21:56.16',
      Bid: 0.0196,
      Ask: 0.01966999,
      OpenBuyOrders: 5598,
      OpenSellOrders: 4891,
      PrevDay: 0.01812,
      Created: '2014-02-13T00:00:00'
    })
  })
})

describe('#getOrder()', () => {
  it('should return a specific order', async () => {
    const uuid = '0cb4c4e4-bdc7-4e13-8c13-430e587d2cc1';

    api
      .get('/account/getorder')
      .query((query: any) => {
        expect(query.uuid).toEqual(uuid)

        return defaultQuery(query)
      })
      .reply(200, require('./fixtures/get-order.json'))

    const order = await client.getOrder(uuid)

    expect(order).toEqual(require('./fixtures/get-order.json').result)
  })
})

describe('#getOrderBook', () => {
  it('should return the order book for a given pair', async () => {
    api
      .get('/public/getorderbook')
      .query((query: any) => {
        expect(query.market).toEqual('BTC-XMR')
        expect(query.type).toEqual('both')

        return defaultQuery(query)
      })
      .reply(200, require('./fixtures/get-order-book.json'))

    const orderBook = await client.getOrderBook('BTC', 'XMR', 'BOTH')

    expect(orderBook.buy).toBeDefined()
    expect(orderBook.buy).toBeInstanceOf(Array)
    expect(orderBook.sell).toBeDefined()
    expect(orderBook.sell).toBeInstanceOf(Array)
  })
})

describe('#getOrderHistory()', () => {
  it('should return an array containing order history for the account', async () => {
    api
      .get('/account/getorderhistory')
      .query(defaultQuery)
      .reply(200, require('./fixtures/get-order-history.json'))

    const history = await client.getOrderHistory()

    expect(history).toBeInstanceOf(Array)
    expect(history).toHaveLength(2)
  })

  it('should return an array containing order history for BTC-XMR', async () => {
    api
      .get('/account/getorderhistory')
      .query(defaultQuery)
      .reply(200, require('./fixtures/get-order-history-btc-xlm.json'))

    const history = await client.getOrderHistory('btc', 'xlm')

    expect(history).toBeInstanceOf(Array)
    expect(history).toHaveLength(1)
  })
})

describe('#getTicker', () => {
  it('should return details for the given ticker', async () => {
    api
      .get('/public/getticker')
      .query((query: any) => {
        expect(query.market).toEqual('btc-ltc')
        return defaultQuery(query)
      })
      .reply(200, require('./fixtures/get-ticker.json'))

    const ticker = await client.getTicker('btc', 'ltc')

    expect(ticker).toEqual({
      Bid: 2.05670368,
      Ask: 3.35579531,
      Last: 3.35579531
    })
  })
})

describe('#getWithdrawlHistory()', () => {
  it('should return the withdrawl history for all tickers', async () => {
    api
      .get('/account/getwithdrawalhistory')
      .query(defaultQuery)
      .reply(200, require('./fixtures/get-withdrawl-history.json'))

    const withdrawls = await client.getWithdrawlHistory()

    expect(withdrawls).toBeInstanceOf(Array)
    expect(withdrawls).toHaveLength(2)
  })

  it('should return the account withdrawl history for BTC', async () => {
    api
      .get('/account/getwithdrawalhistory')
      .query((query: any) => {
        expect(query.currency).toEqual('btc')
        return defaultQuery(query)
      })
      .reply(200, require('./fixtures/get-withdrawl-history-btc.json'))

    const withdrawls = await client.getWithdrawlHistory('btc')

    expect(withdrawls).toBeInstanceOf(Array)
    expect(withdrawls).toHaveLength(1)
  })
})

describe('#withdraw', () => {
  it('should return the uuid after a successful withdrawl', async () => {
    const quantity = '1.5'
    const currency = 'btc'
    const address = 'btcwithdrawaddress'
    const paymentid = '1-2-3-4-5'

    api
      .get('/account/withdraw')
      .query((query: any) => {
        expect(query.currency).toEqual(currency)
        expect(query.quantity).toEqual(quantity)
        expect(query.address).toEqual(address)
        expect(query.paymentid).toEqual(paymentid
        )
        return defaultQuery(query)
      })
      .reply(200, require('./fixtures/withdraw.json'))

      const result = await client.withdraw({
        currency,
        quantity,
        address,
        paymentid
      })

      expect(result.uuid).toEqual(require('./fixtures/withdraw.json').result.uuid)
  })
})

describe('#getOpenOrders()', () => {
  it('should return an array of open orders', async () => {
    api
      .get('/market/getopenorders')
      .query(defaultQuery)
      .reply(200, require('./fixtures/get-open-orders.json'))

    const orders = await client.getOpenOrders();

    expect(orders).toBeInstanceOf(Array)
    expect(orders).toHaveLength(2)
  })

  it('should return an array of open orders for the specified market', async () => {
    api
      .get('/market/getopenorders')
      .query((query: any) => {
        expect(query.market).toEqual('btc-ltc')
        return defaultQuery(query)
      })
      .reply(200, require('./fixtures/get-open-orders-btc-ltc.json'))

    const orders = await client.getOpenOrders('btc', 'ltc');

    expect(orders).toBeInstanceOf(Array)
    expect(orders).toHaveLength(1)
  })
})

describe('#cancel()', () => {
  it('should return an array of open orders', async () => {
    const uuid = '12345'

    api
      .get('/market/cancel')
      .query((query: any) => {
        expect(query.uuid).toEqual(uuid)
        return defaultQuery(query)
      })
      .reply(200, require('./fixtures/cancel.json'))

    await client.cancelOrder(uuid)
  })
})

describe('#sellLimit()', () => {
  it('should create a sell order', async () => {
    const tickerA = 'BTC'
    const tickerB = 'LTC'
    const quantity = '0.25'
    const rate = '0.02'

    api
      .get('/market/selllimit')
      .query((query: any) => {
        expect(query.market).toEqual(`${tickerA}-${tickerB}`)
        expect(query.quantity).toEqual(quantity)
        expect(query.rate).toEqual(rate)

        return defaultQuery(query)
      })
      .reply(200, require('./fixtures/sell-limit.json'))

    const orderResult = await client.sellLimit(tickerA, tickerB, quantity, rate)

    expect(orderResult.uuid).toEqual(require('./fixtures/sell-limit.json').result.uuid)
  })
})

describe('#buyLimit()', () => {
  it('should create a buy order', async () => {
    const tickerA = 'BTC'
    const tickerB = 'LTC'
    const quantity = '0.50'
    const rate = '0.05'

    api
      .get('/market/buylimit')
      .query((query: any) => {
        expect(query.market).toEqual(`${tickerA}-${tickerB}`)
        expect(query.quantity).toEqual(quantity)
        expect(query.rate).toEqual(rate)

        return defaultQuery(query)
      })
      .reply(200, require('./fixtures/buy-limit.json'))

    const orderResult = await client.buyLimit(tickerA, tickerB, quantity, rate)

    expect(orderResult.uuid).toEqual(require('./fixtures/buy-limit.json').result.uuid)
  })
})
