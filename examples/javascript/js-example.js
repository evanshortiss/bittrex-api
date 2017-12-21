'use strict'

const Bittrex = require('../../bittrex')

const client = new Bittrex.RestClient({
  apikey: 'YOUR KEY',
  apisecret: 'YOUR SECRET'
})

function onBalances (balances) {
  balances.forEach(b => console.log(`${b.Currency} - ${b.Available}`)))
}

console.log('Fetching balances...\n')

client.getBalances()
  .then(onBalances)
  .catch((e) => {
    console.log('error fetching balances')
    console.error(e)
    process.exit(1)
  })
