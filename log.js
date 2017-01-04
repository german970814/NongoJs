/* Module of logs. */
"use strict";

var fs = require('fs');
var settings = require('./settings');
var inspect = require('util').inspect;

class Log {

    constructor () {
        if (!settings.DEBUG) {
            /* if not debug, logs go to files defined in settings */
            this.stdout = fs.createWriteStream('./stdout.log');
            this.stderr = fs.createWriteStream('./stderr.log');
            this.console = new Console(this.stdout, this.stderr);
        } else {
            this.console = console;
        }
    }

    call (data) {
        this.log(data);
    }

    log (data) {
        /* To log the data, stdout will be stout of process */
        if (settings.DEBUG) {
            this.console.log(data);
        }
    }

    error (data) {
        /* To stack an error, the error will be raised */
        if (settings.DEBUG) {
            this.console.error(data.stack);
        }
        throw new Error(data);
    }

    dir (object) {
        /* To inspect an object, with hidden functions*/
        this.log(inspect(object, {showHidden: true}));
    }
}

module.exports = Log;
