/* Six Types */
'use strict';

const six_string = String;
const six_number = Number;
const six_array = Array;
const six_object = Object;
const six_re = RegExp;
const six_undefined = undefined;
const six_null = null;

if (!six_string.prototype.format) {
    six_string.prototype.format = function () {
        var string = this.toString();
        let error_code = 0;

        for (var x = 0; x < arguments.length; x++) {
            let regex = new six_re(`\\{${x}\\}`, 'g');
            if (string.match(regex)) {
                string = string.replace(regex, arguments[x]);
            } else {
                error_code = 1;
                break;
            }
        }

        if (error_code == 1) {
            for (var argument of arguments) {
                string = string.replace('{}', argument.toString());
            }
        }

        return string;
    }
}

if (!six_string.prototype.strip) {
    six_string.prototype.strip = function (re) {
        let $this = this;
        if (!re) {
            re = ' ';
        }

        while ($this.startsWith(re)) {
            $this = $this.replace(re, '');
        }

        while ($this.endsWith(re)) {
            let index = $this.length - 1;
            $this = $this.substr(0, index);
        }

        return $this;
    }
}

if (!six_string.prototype.join) {
    six_string.prototype.join = function (list) {
        var separator = this.toString();
        var $this = '';

        if (!list instanceof six_array) {
            throw ".join() method requires a list to be executed";
        }

        for (var i = 0; i < list.length; i++) {
            if (i == 0) {
                $this += list[i].toString()
            } else {
                $this += separator + list[i].toString();
            }
        }

        return $this;
    }
}


if (!six_array.prototype.contains) {
    six_array.prototype.contains = function (item) {
        return this.indexOf(item) >= 0;
    }
}

module.exports.six_string = six_string;
module.exports.six_number = six_number;
module.exports.six_array = six_array;
module.exports.six_object = six_object;
module.exports.six_re = six_re;
module.exports.six_undefined = six_undefined;
module.exports.six_null = six_null;
