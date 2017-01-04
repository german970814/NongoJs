'use strict';

var Log = require('./log');
var six = require('./six');
var settings = require('./settings');
var _path = require('path');
var fs = require('fs');

var String = six.six_string;
var undefined = six.six_undefined;

var logger = new Log();

function getattr (object, attribute, _default) {
    return object[attribute] != undefined ? object[attribute] : _default;
}

function hasattr (object, attribute) {
    return attribute in object;
}

function import_string (path, _default) {
    var func = undefined;

    try {
        let array = path.split(_path.sep);
        let func = array.splice(array.length - 1, 1);
        let new_path = '/'.join(array);

        var object = require(new_path);

        var result = getattr(object, func, _default);

        if (result == undefined || result == _default) {
            throw `Exception, module has not attribute ${func}`;
        }

        return result;

    } catch (error) {
        logger.error(error);
    }
}

function import_string_dotted (path, _default) {
    try {
        let array = path.split('.');
        let route = settings.BASE_DIR;
        for (let file_class of array) {
            if (fs.existsSync(_path.join(route, file_class)) || fs.existsSync(_path.join(route, file_class + '.js'))) {
                route = _path.join(route, file_class);
            }
            array.splice(0, 1);
        }

        var object = require(route);
        if (array.length) {
            object = getattr(object, array[array.length - 1], _default);
        }

        return object;
    } catch (error) {
        logger.error(error);
    }
}

function smart_import (path, _default) {
    /* The smartest way to import a function or object */
    _default = _default || undefined;
    path = path.replace(/\//g, '.');
    return import_string_dotted(path, _default);
}

function safe_string (string) {
    if (typeof string == 'string') {
        let pattern_open_key = /\{/g;
        let pattern_close_key = /\}/g;
        return string.replace(pattern_open_key, '\\{').replace(pattern_close_key, '\\}');
    }
    logger.error(`'${string}' is not String instance`);
}

module.exports.import_string = import_string;
module.exports.import_string_dotted = import_string_dotted;
module.exports.smart_import = smart_import;
module.exports.getattr = getattr;
module.exports.hasattr = hasattr;
module.exports.safe_string = safe_string;
