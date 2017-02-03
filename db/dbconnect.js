const mysql = require("mysql");
const config = require("./../config/index");

//Экспортируемый объект.
//Конфигурация подключения к базе данных
const connection = mysql.createConnection({
    host: config.get("host"),
    user: config.get("dbuser"),
    password: config.get("dbpass"),
    database: config.get("db"),
    multipleStatements: true
});

exports.connection = connection;