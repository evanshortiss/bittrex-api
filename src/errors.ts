export class BittrexHttpError extends Error {
  constructor (msg: string|any, public bittexMessage?: string, public statusCode?: number) {
    super(msg)

    if (msg.stack) {
      // If the incoming object is an error then we preserve its stack, but we
      // still wrap it so that developers can determine the error originated
      // from this module on some level
      this.stack = msg.stack
    }

    // Print the expected name in error toString calls, e.g:
    // "BittrexRestApiError: received status code 404 and text "Not Found""
    this.name = 'HTTPError'

    // This is necessary to have the error report the correct type, e.g using
    // "e instanceof RestApiError" without this would fail
    // https://stackoverflow.com/questions/41102060/typescript-extending-error-class
    Object.setPrototypeOf(this, BittrexHttpError.prototype)
  }
}

export class BittrexRestApiError extends Error {
  constructor (public bittexMessage: string) {
    super(`bittrex returned "${bittexMessage}" error`)

    // Print the expected name in error toString calls, e.g:
    // "BittrexRestApiError: received status code 404 and text "Not Found""
    this.name = 'BittrexRestApiError'

    // This is necessary to have the error report the correct type, e.g using
    // "e instanceof RestApiError" without this would fail
    // https://stackoverflow.com/questions/41102060/typescript-extending-error-class
    Object.setPrototypeOf(this, BittrexRestApiError.prototype)
  }
}
