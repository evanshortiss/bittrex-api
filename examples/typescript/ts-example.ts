'use strict'

import * as Bittrex from '../../bittrex'

async function getBalances () {
  console.log('Fetching balances...\n')

  const client = new Bittrex.RestClient({
    apikey: 'YOUR KEY',
    apisecret: 'YOUR SECRET'
  })

  try {
    const balances = await client.getBalances()
    balances.forEach(b => console.log(`${b.Currency} - ${b.Available}`))
  } catch (e) {
    console.log('error fetching balances')
    console.error(e)
    process.exit(1)
  }
}

getBalances()
