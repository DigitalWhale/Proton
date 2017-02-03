
const PORT = 8888;
const http = require("http");
const url = require("url");
const router = require("./router");
const dbconnect = require("./dbconnect").connection;

//Экспортируемая функция запуска сервера.
// Принимает параметром функцию маршрутизации из роутера
var start = function(route){
    http.createServer(function (request, response) {
        var pathname = url.parse(request.url).pathname;

    }).listen(PORT);



    console.log("Server started");
};

exports.start = start;