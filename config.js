#!/usr/bin/env node
'use strict';

function decorator (lambda) {
  (function (some) {
      console.log("decorada");
      return lambda();
  })();
}

@decorator
function say_hello () {
    console.log("say hello");
}

say_hello();
