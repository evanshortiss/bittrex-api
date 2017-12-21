import * as debug from 'debug'

const name = 'bittrex-api'
const log = debug(`${name}:default`)

export default log

export function getLogger (subname: string) {
  return debug(`${name}:${subname}`)
}
