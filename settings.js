/* Settings */
'use strict';
var path = require('path');

class Settings {

    constructor () {

        this.BASE_DIR = __dirname;

        this.SECRET_KEY = "@asj0f12n31@AKJHA2hason142098asda";

        this.DEBUG = true;

        this.MIDDLEWARE_CLASSES = [
            './middlewares/LoggerServerMiddleware',
        ]

        this.TEMPLATE_ENGINE = {
            extension: 'html',
            engine: 'template.engine'
        }

        this.TEMPLATE_DIR = 'templates';

        this.TEMPLATE_ROOT = path.join(this.BASE_DIR, this.TEMPLATE_DIR);

        this.STATIC_DIR = 'static';

        this.STATIC_ROOT = path.join(this.BASE_DIR, this.STATIC_DIR);

        this.ENCODING = 'utf8';
    }
}

module.exports = new Settings();
