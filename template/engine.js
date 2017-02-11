'use strict';
var utils = require('../utils');
var settings = require('../settings');
var __ = utils.safe_string;
var operator = require('./operator');

var String = require('../six').six_string;
var RegExp = require('../six').six_re;
var Array = require('../six').six_array;

const VAR_FRAGMENT = 0;
const OPEN_BLOCK_FRAGMENT = 1;
const CLOSE_BLOCK_FRAGMENT = 2;
const TEXT_FRAGMENT = 3;

const VAR_TOKEN_START = '{{';
const VAR_TOKEN_END = '}}';
const BLOCK_TOKEN_START = '{%';
const BLOCK_TOKEN_END = '%}';

// const TOKEN_REGEX = new RegExp('({}.*?{}|{}.*?{})'.format(
//     __(VAR_TOKEN_START), __(VAR_TOKEN_END),
//     __(BLOCK_TOKEN_START), __(BLOCK_TOKEN_END)
// ), 'g');

const WHITESPACE = /\s/g;  // /\s*/[Symbol.split](string);


class Regex extends RegExp {
    [Symbol.split](str, limit) {
        var result = RegExp.prototype[Symbol.split].call(this, str, limit);
        return result.map(x => x);
    }
}

const TOKEN_REGEX = new Regex('({}.*?{}|{}.*?{})'.format(
    __(VAR_TOKEN_START), __(VAR_TOKEN_END),
    __(BLOCK_TOKEN_START), __(BLOCK_TOKEN_END)
), 'g');

var operator_lookup_table = {
    '<': operator.lt,
    '>': operator.gt,
    '==': operator.eq,
    '!=': operator.ne,
    '<=': operator.le,
    '>=': operator.ge
}

if (!String.prototype._as_fragment) {
    String.prototype._as_fragment = function () {
        return this.substr(2).slice(0, -2).strip();
    }
}

function eval_expression (expr) {
    try {
        return ['literal', eval(expr)]  // POSIBLE ERROR 1
    } catch (err) {
        return ['name', expr]
    }
}

function resolve(name, context) {
    if (name.startsWith('..')) {
        context = utils.getattr(context, '..', {});
        name = name.substr(2);
    }
    try {
        for (let tok of name.split('.')) {
            context = context[tok];
        }
        return context;
    } catch (err) {
        throw new Error(`Cannot resolve ${name} in context`);
    }
}


class _Fragment {
    constructor (raw_text) {
        this.raw = raw_text;
        this.clean = this.clean_fragment();
        this.type = this._type();  // property to define the fragment type
    }

    clean_fragment() {
        if (new Array(VAR_TOKEN_START, BLOCK_TOKEN_START).contains(this.raw.substr(0, 2))) {
            return this.raw.strip()._as_fragment();  // llama la funcion prototype creada
        }
        return this.raw;
    }

    _type () {
        let raw_start = this.raw.slice(0, 2);
        if (raw_start == VAR_TOKEN_START) {
            return VAR_FRAGMENT;
        } else if (raw_start == BLOCK_TOKEN_START) {
            if (this.clean.slice(-3) == 'end') {
                return CLOSE_BLOCK_FRAGMENT;
            } else {
                return OPEN_BLOCK_FRAGMENT;
            }
        } else {
            return TEXT_FRAGMENT;
        }
    }
}


class _Node {
    constructor (fragment) {
        this.creates_scope = false;
        this.children = new Array();
        this.process_fragment(fragment);
    }

    process_fragment (fragment) {
        // pass
    }

    enter_scope () {
        // pass
    }

    render (context) {
        // pass
    }

    exit_scope () {
        // pass
    }

    render_children (context, children) {
        if (!children) {
            children = this.children;
        }
        function render_child (child) {
            let child_html = child.render(context)
            if (child_html) {
                return child_html.toString();
            }
            return ''
        }
        return ''.join(children.map(render_child));  // POSIBLE ERROR 2
    }
}


class _ScopableNode extends _Node {
    constructor (fragment) {
        super(fragment);
        this.creates_scope = true;
    }
}


class _Root extends _Node {

    constructor (fragment) {
        super(fragment);
    }

    render (context) {
        return this.render_children(context);
    }
}


class _Variable extends _Node {

    constructor (fragment) {
        super(fragment);
    }

    process_fragment (fragment) {
        this.name = fragment;
    }

    render (context) {
        return resolve(this.name, context);
    }
}


class _Each extends _ScopableNode {
    constructor (fragment) {
        super(fragment);
    }

    process_fragment (fragment) {
        try {
            let regex = new Regex('\\s*');
            let it = fragment.split(regex)[1];
            this.it = eval_expression(it);
        } catch (err) {
            throw new Error (`'${fragment}' seem's like invalid syntax.`);
        }
    }

    render (context) {
        if (this.it[0] == 'literal') {
            var items = this.it[1];
        } else {
            var items = resolve(this.it[1], context);
        }
        var $this = this;
        function render_item (item) {
            return $this.render_children({'..': context, 'it': item})
        }
        return ''.join(items.map(render_item));
    }
}


class _If extends _ScopableNode {
    constructor (fragment) {
        super(fragment);
    }

    process_fragment (fragment) {
        var bits = fragment.split(' ').slice(1, 100);
        if (!new Array(1, 3).contains(bits.length)) {
            throw new Error(`'${fragment}' seem's like invalid syntax.`);
        }
        this.lhs = eval_expression(bits[0]);
        if (bits.length == 3) {
            this.op = bits[1];
            this.rhs = eval_expression(bits[2]);
        }
    }

    render (context) {
        let lhs = this.resolve_side(this.lhs, context);
        if (utils.hasattr(this, 'op')) {
            var op = operator_lookup_table[this.op];  // POSIBLE ISSUE
            if (!op) {
                throw new Error(`'${op}' seem's like invalid syntax.`);
            }
            let rhs = this.resolve_side(this.rhs, context);
            var exec_if_branch = op(lhs, rhs);
        } else {
            var exec_if_branch = operator.truth(lhs);
        }
        let split = this.split_children()
        let if_branch = split[0];
        let else_branch = split[1];

        if (exec_if_branch) {
            return this.render_children(context, this.if_branch);
        } else {
            return this.render_children(context, this.else_branch);
        }
    }

    resolve_side (side, context) {
        if (side[0] == 'literal') {
            return side[1];
        }
        return resolve(side[1], context);
    }

    exit_scope () {
        let aux = this.split_children();
        this.if_branch = aux[0];
        this.else_branch = aux[1];
    }

    split_children () {
        /* Puede mejorar si se hace el singleton con un this.split_children para evitar entrar dos veces a hacer lo mismo*/
        let if_branch = new Array();
        let else_branch = new Array();
        let curr = if_branch;
        for (let child of this.children) {
            if (child instanceof _Else) {
                curr = else_branch;
                continue;
            }
            curr.push(child);
        }
        return new Array(if_branch, else_branch);
    }
}


class _Else extends _Node {
    constructor (fragment) {
        super(fragment);
    }

    render (context) {
        // pass
    }
}


class _Call extends _Node {
    constructor (fragment) {
        super(fragment);
    }

    process_fragment (fragment) {
        try {
            let regex = new Regex('\\s*');
            let bits = fragment.split(regex);
            this.callable = bits[1];
            let params = this._parse_params(bits.slice(-2));
            this.args = params[0];
            this.kwargs = params[1];
        } catch (err) {
            throw new Error(`'${op}' seem's like invalid syntax.`);
        }
    }

    _parse_params (params) {
        let args = new Array();
        let kwargs = {};

        for (let param of params) {
            if (param.search('=') >= 0) {
                let split = param.split('=');
                name = split[0];
                value = split[1];
                kwargs[name] = eval_expression(value);
            } else {
                args.push(eval_expression(param));
            }
        }

        return new Array(args, kwargs);
    }

    render (context) {
        let args = new Array();
        let kwargs = {};

        for (let kind of this.args) {
            let value = kind[1];
            if (kind[0] == 'name') {
                value = resolve(value, context);
            }
            args.push(value)
        }

        for (let key in this.kwargs) {
            let value = this.kwargs[key][1];
            if (this.kwargs[key][0] == 'name') {
                value = resolve(value, context)
            }
            kwargs[key] = value;
        }
        let resolved_callable = resolve(this.callable, context);
        if (typeof resolved_callable == 'function') {
            return resolved_callable(args, kwargs);
        } else {
            throw new Error(`'${this.callable}' is not a callable function.`);
        }
    }
}


class _Text extends _Node {

    constructor (fragment) {
        super(fragment);
    }

    process_fragment (fragment) {
        this.text = fragment;
    }

    render (context) {
        return this.text;
    }
}


class Compiler {
    /* Compiler of template engine, this class resolve the nodes. */

    constructor (template_string) {
        this.template_string = template_string;
    }

    *each_fragment () {
        /*
          generator for fragments,
          each match found with the TOKEN_REGEX will be a fragment object
        */
        for (var fragment of this.template_string.split(TOKEN_REGEX)) {
            if (fragment) {
                yield new _Fragment(fragment);
            }
        }
    }

    compile () {
        let root = new _Root();  // create the root node
        let scope_stack = new Array(root);  // add the root an a array

        for (var fragment of this.each_fragment()) {
            if (!scope_stack) {
                throw new Error('Nesting issues');
            }

            let parent_scope = scope_stack[scope_stack.length - 1];  // get the last node;
            if (fragment.type == CLOSE_BLOCK_FRAGMENT) {
                parent_scope.exit_scope();  // exit of the last node
                scope_stack.pop();  // pop out the node of stack
                continue;
            }
            var new_node = this.create_node(fragment);  // crete the node
            if (new_node) {
                parent_scope.children.push(new_node);  // add node as children of last node
                if (new_node.creates_scope) {  // if node create nodes
                    scope_stack.push(new_node);  // add node to stack
                    new_node.enter_scope()  // fires enter_scope method
                }
            }
        }

        return root;
    }

    create_node (fragment) {
        var node_class = undefined;
        switch (fragment.type) {
            case TEXT_FRAGMENT:
                node_class = _Text;
                break;
            case VAR_FRAGMENT:
                node_class = _Variable;
                break;
            case OPEN_BLOCK_FRAGMENT:
                let cmd = fragment.clean.split(' ')[0];
                switch (cmd) {
                    case 'each':
                        node_class = _Each;
                        break;
                    case 'if':
                        node_class = _If;
                        break;
                    case 'else':
                        node_class = _Else;
                        break;
                    case 'call':
                        node_class = _Call;
                        break;
                    default:
                        node_class = undefined;
                }
                break;
            default:
                node_class = undefined;
        }

        if (!node_class) {
            throw new Error(`'${fragment}' seem's like invalid syntax.`)
        }

        return new node_class(fragment.clean);
    }
}


class Template {
    /* Template class, this class buil the root node and compile it. */

    constructor (contents) {
        this.contents = contents;
        this.root = new Compiler(contents).compile();  // main node
    }

    render (options) {
        /* Render the content. */
        return this.root.render(options);
    }
}

module.exports = Template;
