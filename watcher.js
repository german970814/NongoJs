#!/usr/bin/env node
'use strict';

var fs = require('fs');  // require de file system
var spawn = require('child_process').spawn;  // require de spawn

const BASE_DIR = __dirname;
const ENCODING = 'utf8';  // base para los encoding

var child_server;  // inicializa la variable de child_server

start();  // llama la funcion


function start() {
    /* Funcion  encargada de iniciar el proceso de el servidor */

    // spawnea el proceso
    child_server = spawn('node', [`${BASE_DIR}/main.js`], {stdio: [null, null, null, 'ipc']});

    // cuando el proceso emita una salida
    child_server.stdout.on('data', (data) => {
        // si no es un numero
        if (!data === Number) {
            // muestra en pantalla la salida, con el encoding adecuado
            console.log(data.toString(ENCODING));
        } else {
            // muestra el numero en salida
            console.log(data.toString());
        }
    });

    // si ocurre algun error
    child_server.stderr.on('data', (data) => {
        // muestra el error
        console.log('Traceback:\n');
        console.log(data.toString(ENCODING));
    });
}


fs.watch(BASE_DIR, {encoding: 'buffer', recursive: true}, (eventType, filename) => {
    /* Funcion que vigila los archivos */
    if (eventType == 'change' && filename) {
        // child_server.kill('SIGHUP');
        child_server.kill('SIGINT');  // envia la señal al proceso
        console.log("Reiniciando Servidor...");
        start();  // Aqui lo reinicia.
    }
});

process.on('SIGINT', function() {
    // cuando precione CTRL + C, se mata el proceso hijo.
    console.log("Caught interrupt signal");
    child_server.kill();
    process.exit();
});

process.on('uncaughtException', function(error) {
    // si ocurre una excepcion
    child_server.kill();  // mata el proceso, para evitar que quede fantasma
    // arroja la excepcion
    throw error;
});
