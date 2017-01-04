'use strict';

class Url {
    constructor(path, handler, name) {
        this.path = path;
        this.handler = handler;
        this.name = name;
    }
}

function url (path, handler, name) {
    return new Url(path, handler, name);
}

var urls = [
    url('/', function (request, response) {response.send("hello;")}),
    url('/hola/', './views/myview'),
    url('/saludo/', './views/to_render'),
]

module.exports.urls = urls;
