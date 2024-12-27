class apiError extends Error {
    constructor(statusCode, errors = [], message = 'An error occured', stack = '') {
        super(message),
        this.statusCode = statusCode,
        this.errors = errors,
        this.success = false,
        this.data = null

        if (stack) {
            this.stack = stack
        } else {
            Error.captureStackTrace(this, this.constructor)
        }
    }
}

export { apiError }