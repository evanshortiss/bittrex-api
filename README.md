# Bittrex.js - Bittrex API Wrapper

![https://travis-ci.org/evanshortiss/bittrex.js](https://travis-ci.org/evanshortiss/bittrex.js.svg) [![npm version](https://badge.fury.io/js/@evanshortiss/bittrex.js.svg)](https://badge.fury.io/js/@evanshortiss/bittrex.js) [![https://coveralls.io/repos/github/evanshortiss/bittrex.js](https://coveralls.io/repos/github/evanshortiss/bittrex.js/badge.svg?branch=master)](https://coveralls.io/github/evanshortiss/bittrex.js?branch=master)
[![TypeScript](https://badges.frapsoft.com/typescript/version/typescript-next.svg?v=101)](https://github.com/ellerbrock/typescript-badges/)

Lightweight JavaScript wrapper for the Bittrex API, written in TypeScript.

* Support for the Bittrex REST API.
* Compatible with Node.js (v5 and above) and Web Browsers.
* First class TypeScript support.
* Solid documentation.
* High code and test coverage.
* Support for Promises and Async/Await.
* Uses the native `crypto` module when used with Node.js to greatly improve
performance of HMAC generation vs. other modules.
* Straightforward. Doesn't alter the responses from Bittrex unless otherwise
noted.
* Lightweight wrapper. No wrapper Classes or large frameworks are forced on you.


## Node.js Quickstart

### Install

```
npm install bittrex.js --save
```

### Example

This is a Node.js example using ES5 syntax, but you can use ES6 and TypeScript
too.

```js
'use strict'

const Bittrex = require('bittrex.js')

const client = new Bittrex.RestClient({
  apikey: 'YOUR KEY GOES HERE',
  apisecret: 'YOUR KEY GOES HERE'
})

function getBalances () {
  return client.getBalances()
    .then((balances) => {
      // Do something with your account balance information
    })
}
```

## API Credentials
To use this library you'll need to get an API Key and Secret from the Settings
screen of your Bittrex account.

You can read the specific details for API credentials on the
[Bittrex Developers Guide](https://bittrex.com/home/api). It's just a single
paragraph - read it. It's important to understand the permission levels.

## Response Formats
All responses from this module are true to the original format specified in the
[Bittrex API](https://bittrex.com/home/api) docs - no magic, classes, or odd
stuff here!

As an example, the `/public/getticker` endpoint returns this format:

```json
{
  "success" : true,
  "message" : "",
  "result" : {
    "Bid" : 2.05670368,
    "Ask" : 3.35579531,
    "Last" : 3.35579531
  }
}
```

Using the `RestClient.getTicker()` function of this module you'll be returned
the `result` Object as shown. This is the same for all other functions.

```js
client.getTicker('BTC', 'LTC')
  .then((result) => {
    // Result will be:
    // {
    //  "Bid" : 2.05670368,
    //  "Ask" : 3.35579531,
    //  "Last" : 3.35579531
    // }
  })
```

## Browser Usage
To use this module in a browser you need to run a single script. There's
potential to make this more streamlined in the future.

Here are the steps:

```
$ git clone git@github.com:evanshortiss/bittrex.js.git bittrex.js
$ cd bittrex.js
$ npm install
$ npm run browserify
```

This will produce a file at `dist/bittrex.js` that you can add to your project.
You can `require('bittrex.js')` it, or access it via `window.Bittrex`.

## TypeScript
Since this module is written in TypeScript it works great in other TypeScript
projects and offers intellisense in VSCode, even if you don't use TypeScript.

```ts
import * as Bittrex from 'bittrex.js'

const client = new Bittrex.RestClient({
  apikey: 'YOUR KEY GOES HERE',
  apisecret: 'YOUR KEY GOES HERE'
})

async function getBalances () {
  const balances = await client.getBalances()
  return balances
}
```

## Debugging / Logging
Internally this module uses the `debug` module for logging. If you'd like to
enable logging just run your program with the environment variable `DEBUG` set
to `bittrex.js:*`.

For example, on macOS or Linux you can run:

```
$ DEBUG=bittrex.js:* node your-app.js
```

## API

### Models

This is only available for TypeScript users. Use these to interact with the
types used by this module.

```ts
import * as Bittrex from 'bittrex.js'

// Ensure only Bittrex API currency Objects can be pushed to the array
const tickers: Models.Currency = []

const client = new Bittrex.RestClient({
  apikey: 'YOUR API KEY'
  apisecret: 'YOUR API SECRET'
})

const btc = await client.getTicker('btc')

tickers.push(btc)
```

### RestApiError
This is a subclass of the standard JavaScript Error that will be thrown if the
Bittrex API returns an unexpected status code (anything besides HTTP 200), or if
the `success` field in their response JSON is not set to `true`.

Sample usage:

```ts
import * as Bittrex from 'bittrex.js'

const client = new Bittrex.RestClient({
  apikey: 'YOUR KEY'
  apisecret: 'YOUR SECRET'
})

client.getMarkets()
  .then((markets) => doSomethingWithMarkets(markets))
  .then((result) => doSomethingElse(result))
  .catch((e) => {
    if (e instanceof Bittrex.RestApiError) {
      console.log('bittrex api returned an error', e)
    } else {
      console.log('some other type of error occurred', e)
    }
  })
```


### RestClient(options)
The RestClient allows you to perform HTTPS requests against the Bittrex API. It
supports the following options:

* [required] apikey - Your Bittrex API key
* [required] apisecret - Your Bittrex API secret
* [optional] axiosOptions - Overrides to pass to each API request. For more
details, check the [Axios Docs](https://github.com/axios/axios#request-config)
* [optional] apiVersion - Bittrex API version to target. Defaults to `v1.1`

RestClient behaviours:

1. RestClient instance functions return Promises. This means they can be used
with Async/Await.
2. Instance functions return the `result` entry from Bittrex API responses
to save you the trouble of continuously typing `response.result`.
3. All function names are camelcase versions of the corresponding Bitrrex API
endpoints.
4. If a request returns a non 200 response an error is thrown, so be sure to use
`.catch()` function on promises and `try/catch` if using Async/Await.

All of the following functions and the returned data types are detailed in the
Bittrex API docs. For details of the types shown below visit the `src/models`
folder in this repo and the Bittrex API docs.

Optional parameters are denoted using the `?` character.

#### http(uri: string, options?: AxiosRequestConfig): AxiosPromise
Perform a HTTPS request to the Bittrex API. You should only provide the relative
path, e.g `/public/getmarkets` since this library will create the fully formed
url.

Resolves the Promise with an
[AxiosResponse Object](https://github.com/axios/axios#response-schema).

```js
// Example call to the Bittrex API
client.http('/public/getmarkets', { timeout: 5000 })
  .then((result) => {})
  .catch((error) => {})
```

You probably won't need to use this much, but if you need to make a custom
request to the Bittrex API this will allow you to do so.

#### getMarkets(): Promise<Market[]>
Returns a result like that shown below. This is the `result` field from the
Bittrex API documentation as mentioned previosuly.

```js
client.getMarkets()
  .then((markets) => {
    // Markets be an Array of Market Objects similar to this:
    // [
    //   {
    //     "MarketCurrency": "LTC",
    //     "BaseCurrency": "BTC",
    //     "MarketCurrencyLong": "Litecoin",
    //     "BaseCurrencyLong": "Bitcoin",
    //     "MinTradeSize": 0.01,
    //     "MarketName": "BTC-LTC",
    //     "IsActive": true,
    //     "Created": "2014-02-13T00:00:00"
    //   },
    //   {
    //     "MarketCurrency": "DOGE",
    //     "BaseCurrency": "BTC",
    //     "MarketCurrencyLong": "Dogecoin",
    //     "BaseCurrencyLong": "Bitcoin",
    //     "MinTradeSize": 100,
    //     "MarketName": "BTC-DOGE",
    //     "IsActive": true,
    //     "Created": "2014-02-13T00:00:00"
    //   }
    // ]
  })
  .catch(errorHandler)
```

#### getMarketSummary(tickerA: string, tickerB: string): Promise\<MarketSummaryEntry>
Returns a summary for the given pair. `tickerA` and `tickerB` are combined to
form a pair, e.g `BTC-LTC` or similar.

The Bittrex API actually returns an Array for this call, but this function
returns an Object since the Array returned by Bittrex always contains just one
entry.

```js
client.getMarketSummary('btc', 'ltc')
  .then((summary) => {
    // Summary will be an Object like so:
    // {
    //   "MarketName": "BTC-LTC",
    //   "High": 0.02,
    //   "Low": 0.01790001,
    //   "Volume": 320125.18706995,
    //   "Last": 0.01966999,
    //   "BaseVolume": 6117.00242171,
    //   "TimeStamp": "2017-12-19T21:21:56.16",
    //   "Bid": 0.0196,
    //   "Ask": 0.01966999,
    //   "OpenBuyOrders": 5598,
    //   "OpenSellOrders": 4891,
    //   "PrevDay": 0.01812,
    //   "Created": "2014-02-13T00:00:00"
    // }
  })
```

#### getMarketSummaries(): Promise<MarketSummaryEntry[]>

#### getCurrencies(): Promise<Currency[]>

#### getTicker(ticker: string): Promise\<Ticker>

#### getOrderBook(tickerA: string, tickerB: string, type: 'BUY'|'SELL'|'BOTH'): Promise<OrderBookEntry[]>

#### getMarketHistory(tickerA: string, tickerB: string): Promise<MarketHistoryEntry[]>

#### getBalances(): Promise<AccountBalanceEntry[]>

#### getBalance(currency: string): Promise\<AccountBalanceEntry>

#### getOrderHistory(): Promise<AccountOrderEntry[]>

#### getOrderHistory(tickerA: string, tickerB: string): Promise<AccountOrderEntry[]>

#### getDepositHistory(currency?: string): Promise<AccountOrderEntry[]>

#### getDepositAddress(currency: string): Promise\<AccountDepositAddress>

#### getOrder(uuid: string): Promise\<AccountOrderEntry>

#### withdraw(params: WithdrawlParams): Promise\<WithdrawlResult>

#### getWithdrawlHistory(currency?: string): Promise<WithdrawlHistoryEntry[]>

#### buyLimit (tickerA: string, tickerB: string, quantity: string, rate: string): Promise\<BuyLimitResult>

#### sellLimit (tickerA: string, tickerB: string, quantity: string, rate: string): Promise\<SellLimitResult>

#### cancelOrder (uuid: string): Promise\<void>

#### getOpenOrders(): Promise<OpenOrder[]>

#### getOpenOrders(tickerA: string, tickerB: string): Promise<OpenOrder[]>

## TODOs
* Test use with Browserify within another project.
* Look at improved browser support if necessary.
