'use strict';
var utils = require('../utils');
var String = require('../six').six_string;
var RegExp = require('../six').six_re;
var settings = require('../settings');
var __ = utils.safe_string;


// (\{% if .*?%\})(\n|.)*(\{% endif %\})  // if pattern

class BaseEngine {
    constructor () {
        var tags = this.get_tags();
        for (let tag in tags) {  // use 'in' over objects
            this[tag] = tags[tag];
        }
    }

    get_tags () {
        return {
            BLOCK_TAG_START: '{%',
            BLOCK_TAG_END: '%}',
            VARIABLE_TAG_START: '{{',
            VARIABLE_TAG_END: '}}',
            COMMENT_TAG_START: '{#',
            COMMENT_TAG_END: '#}',
            SINGLE_BRACE_START: '{',
            SINGLE_BRACE_END: '}'
        }
    }

    get_pattern () {
        if (!this.MATCH) {
            this.MATCH = '({}.*?{}|{}.*?{}|{}.*?{})'.format(
              __(this.BLOCK_TAG_START), __(this.BLOCK_TAG_END),
              __(this.VARIABLE_TAG_START), __(this.VARIABLE_TAG_END),
              __(this.COMMENT_TAG_START), __(this.COMMENT_TAG_END)
            )
        }
        return this.MATCH;
    }
}


class Node {
    constructor (type) {
        this.type = type;
        this.base = new BaseEngine();
        this.next_node = undefined;
        this.prevew_node = undefined;
    }

    resolve () {
        throw new Error('resolve Not Implemented for Node');
    }
}


class Variable extends Node {
    constructor (expression) {
        super(this);
        this._expression = expression;
        this.expression = expression;
    }

    resolve (options) {
        let resolved;
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
                break;
            }
        }

        return resolved.toString(settings.ENCODING);
    }
}


class BlockNode extends Node {
    constructor (subtype) {
        super(this);
        this.subtype = subtype;
        this.start_tag = undefined;
        this.end_tag = undefined;
    }

    toString () {
        throw new Error('Method "toString()" not declared Yet');
    }
}

BlockNode.resolve_node = (expression) => {
    var nodes = [If, For];  // Actual nodes

    for (let node of nodes) {
        let _node = new node(expression);
        if (_node.validate_start() || _node.validate_end()) {
            return _node;
        }
        delete _node;  // se borra la instancia del nodo
    }
}

class If extends BlockNode {
    constructor (expression, options) {
        super(this);
        var tags = this.base.get_tags();
        let string_regex_start = '{}\s*if\s.*?{}'.format(__(tags.BLOCK_TAG_START), __(tags.BLOCK_TAG_END));
        this.START_REGEX = RegExp(string_regex_start, 'g');
        let string_regex_end = '{}\s*endif\s*{}'.format(__(tags.BLOCK_TAG_START), __(tags.BLOCK_TAG_END));
        this.END_REGEX = RegExp(string_regex_end, 'g');
    }

    resolve () {

    }

    validate_start () {
        return this.expression.match(this.START_REGEX) ? true: false;
    }

    validate_end () {
        return this.expression.match(this.END_REGEX) ? true: false;
    }

    toString () {
        return 'If';
    }
}


class For extends BlockNode {
    constructor (expression, options) {
        super(this.toString());
    }

    resolve () {

    }

    toString () {
        return 'For';
    }
}

class Comment extends Node {
    constructor (expression, options) {
        super(this);
    }

    resolve () {

    }
}


class Resolver {
    constructor (buffer, options) {
        this.EOE = '';
        this._base = new BaseEngine();
        this._pattern = this._base.get_pattern();
        this.pattern = new RegExp(this._base.get_pattern(), 'g');
        // this.expression = expression;
        this.options = options;
        this._buffer = buffer;
        this.content = this._buffer.toString(settings.ENCODING);
    }

    resolve () {
        /* Funcion encargada de hacer el resolve, y retornar el nuevo archivo. */
        // node = this.get_node();
        // node.resolve(this.options);
        expressions = get_expressions();
    }

    resolve_in () {
        // let new_string = expression.replace()
        tags = this._base.get_tags();
        for (let tag in tags) {
            this.expression = this.expression.replace(tag, this.EOE)
        }
        this.expression = this.expression.replace(/\s*/g, '');
        return this.expression;
    }

    get_expressions () {
        this.expressions = expressions = this.content.match(this.pattern);
        attemp_nodes = new Object();
        for (let expression in expressions) {
            let node = get_node(expression);

            if (node instanceof BlockNode) {
                if (!(node.subtype) in attemp_nodes) {
                    node.start_tag = true;
                    attemp_nodes[node.subtype] = node;
                } else {
                    if (attemp_nodes[node.subtype]) {  // siempre y cuando sean del mismo tipo
                        if (node.validate_end()) {  // si es un tag de cierre
                            let nodo = attemp_nodes[node.subtype];
                            while (true) {
                                if (nodo.next_node) {
                                    nodo = nodo.next_node;
                                    if (!nodo.next_node.end_tag) {
                                        nodo = nodo.next_node;
                                    }
                                } else {
                                    break;
                                }
                            }
                            attemp_nodes[node.subtype].end_tag = node;
                            continue;
                        } else {
                            attemp_nodes[node.subtype].next_node = node;
                        }
                    }
                }
            }
        }
    }

    get_node (expression) {
        var expression = expression || this.expression;
        if (!this.patterns) {
            let patterns = this._pattern.split('|');

            for (let pat of patterns) {
                if (pat.startsWith('(')) {
                    pat = `${pat})`;
                } else if (pat.endsWith(')')) {
                    pat = `(${pat}`;
                } else {
                    pat = `(${pat})`;
                }
                pat = new RegExp(pat, 'g');
            }
            this.patterns = patterns;
        } else {
            let patterns = this.patterns;
        }

        for (pattern in patterns) {
            if (expression.match(pattern)) {
                if (expression.startsWith(this._base.VARIABLE_TAG_START) && expression.endsWith(this._base.VARIABLE_TAG_END)) {
                    return new Variable(expression);
                } else if (expression.startsWith(this._base.BLOCK_TAG_START) && expression.endsWith(this._base.BLOCK_TAG_END)) {
                    // debe resolver el primer nodo mas el ultimo
                    var node = BlockNode.resolve_node(expression);
                    return node;
                } else {
                    return new Comment(expression);
                }
            }
        }
    }
}
module.exports = new BaseEngine();
