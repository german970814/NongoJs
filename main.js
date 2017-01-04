"use strict";
var express = require('express');
var Log = require('./log');
var settings = require('./settings');
var utils = require('./utils');
var urls = require('./urls').urls;

var app = express();

/* Settings */
const PORT = 3000;

let logger = new Log();

// app.use(LoggerServerMiddleware.as_function);

for (var middleware of settings.MIDDLEWARE_CLASSES) {
    try {
        let _middleware = utils.smart_import(middleware);
        if (_middleware != undefined) {
            if ('as_function' in _middleware) {
                app.use(_middleware.as_function);
            } else {
                app.use(_middleware);
            }
        } else {
            throw new Error(`Cannot import middleware ${middleware}`)
        }
    } catch (error) {
        logger.error(error);
    }
}

app.set('views', settings.TEMPLATE_ROOT);  // specify the views directory
var callback = utils.smart_import(settings.TEMPLATE_ENGINE.engine);
// console.log(callback);
app.engine(
    settings.TEMPLATE_ENGINE.extension,
    callback
)
app.set('view engine', settings.TEMPLATE_ENGINE.extension);  // register the template engine


for (var url of urls) {
    if (url.handler instanceof Function) {
        app.all(url.path, url.handler)
    } else {
        app.all(url.path, utils.smart_import(url.handler, undefined));
    }
}

app.listen(PORT, function() {
    logger.call(`Server Listen at port ${PORT}\n(CTRL + C) to break down.`);
    // process.send(PORT);
});
