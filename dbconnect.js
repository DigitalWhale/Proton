const mysql = require("mysql");

//Экспортируемый объект.
//Конфигурация подключения к базе данных
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'protondb',
    password: 'protondb',
    database: 'protondb',
    multipleStatements: true
});

exports.connection = connection;