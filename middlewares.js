'use strict';
var Log = require('./log');

// const logger = new Log();

class LoggerServerMiddleware extends Log {
    constructor (request, response, next) {
        super();
        this.request = request;
        this.response = response;
        this.next = next;

        this._log();
        this.next();
    }

    _log() {
        let request = this.request;
        this.log(`${request.method} '${request.url}'`);
    }
}

// importante, no pasar el prototype
LoggerServerMiddleware.as_function = (request, response, next) => {
    return new LoggerServerMiddleware(request, response, next);
}

module.exports.LoggerServerMiddleware = LoggerServerMiddleware;
