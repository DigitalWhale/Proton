
const http = require("http");
const url = require("url");
const app = require("./app");
let log = require('./libs/log')(module);
//const router = require("./router");

//Экспортируемая функция запуска сервера.
let start = () => {
    http.createServer(app).listen(app.get("port"), () => {
        log.info("Express server listenned on a port" + app.get("port"));
    });
};

exports.start = start;