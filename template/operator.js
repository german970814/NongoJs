'use strict';

class Operator {
    lt (first, second) {
        return first < second;
    }

    gt (first, second) {
        return first > second;
    }

    eq (first, second) {
        return first == second;
    }

    ne (first, second) {
        return first != second;
    }

    le (first, second) {
        return first <= second;
    }

    ge (first, second) {
        return first >= second;
    }

    truth (element) {
        if (element) {
            return true;
        }
        return false;
    }

    esp1 (first, second) {
        return first === second;
    }

    esp2 (first, second) {
        return first !== second;
    }
}

module.exports = new Operator();
