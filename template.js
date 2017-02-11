'use strict';

var fs = require('fs');  // this engine requires the fs module
var settings = require('./settings');
var utils = require('./utils');
var Engine = require('./template/engine');

const BASE_MATCH = '{{\\s*(\\w+\\.*)+\\s*}}';
const MATCH = new RegExp(BASE_MATCH, 'g');  // /{{\s*(\w+\.*)+\s*}}/g;


function resolve_in (string) {
    let new_string = string.replace('{{', '').replace('}}', '');
    new_string = new_string.replace(/\s*/g, '');
    return new_string;
}

function resolve_variable (string, options) {
    let resolved;
    let new_string = resolve_in(string);
    let properties = new_string.split('.');

    while (properties.length != 0) {
        let attribute = properties.splice(0, 1);  // get the first
        try {
            if (resolved) {
              resolved = utils.getattr(resolved, attribute, undefined);
            } else {
              resolved = utils.getattr(options, attribute, undefined);
            }
        } catch (err) {
            console.log(err);
            break;
        }
    }
    return resolved.toString(settings.ENCODING);
}

module.exports.engine = function (path, options, callback) {  // define the template engine
    fs.readFile(path, function (err, content) {
        if (err) {
            return callback(err);
        }
        // this is an extremely simple template engine
        var _content = content.toString(settings.ENCODING);

        var template = new Engine(_content);
        var rendered = template.render(options);
        // let coincidences = _content.match(MATCH);
        //
        // var rendered = _content;
        //
        // if (coincidences.length) {
        //     for (var coincidence of coincidences) {
        //         try {
        //             var resolved = resolve_in(coincidence);
        //             let new_pattern = new RegExp(BASE_MATCH.replace('\\w+\\.*', resolved), 'g');
        //             let variable = resolve_variable(coincidence, options);
        //             rendered = rendered.replace(new_pattern, variable);
        //         } catch (err) {
        //             if (settings.DEBUG) {
        //                 console.error(`Can't resolve ${resolved}`);
        //             }
        //             continue;
        //         }
        //     }
        // }



        return callback(null, rendered)
    })
}
// app.set('views', './views') // specify the views directory
// app.set('view engine', 'ntl') // register the template engine
