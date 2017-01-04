

function myview(request, response) {
    response.send("hola otra de nuevo");
}

function to_render(request, response) {
    return response.render('hello', {saludo: 'Saludame', nombre: 'Eduardo Jose'});
}

module.exports.myview = myview;
module.exports.to_render = to_render;
