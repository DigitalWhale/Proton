const dbconnect = require("./dbconnect").connection;
const fs = require("fs");
let async = require("async");

const arg = process.argv;//Записываем все аргументы принятые из командной строки
const VERSION_DIRECTIONAL = "db_version/";
const REG_VERSION = /\d+(\.\d+){2}/;

let command;
let up_version = null;


//Рекурсивная функция накатывания миграции
let upMigration = (file, callback) => {
    //Читаем файл с миграцией
    let sql = fs.readFile(VERSION_DIRECTIONAL + file, "utf8", (error, content) => {
        if(error){
            throw error;
        }
        //Накатываем миграцию
        dbconnect.query(content, callback);
    });
};

//Проверка существования базы данных
let checkBaseline = (callback) => {
    dbconnect.connect();
    dbconnect.query("SHOW TABLES FROM `protondb` LIKE 'migration_history';", (error, result) => {
        if(error){
            throw error;
        }
        if((result[0] === undefined && command == "-s") || (result[0] !== undefined && command == "-u")){
            callback(null, null);
        }
        else {
            command == "-s" ? callback("Baseline already create", null) : callback("Baseline not found", null) ;
        }
    });
};

//Получаем список имен файлов в директории
let readFileNames = (checkBD, callback) => {
   fs.readdir(VERSION_DIRECTIONAL, (error, files) => {
        if (error) {
            throw error;
        }
        callback(null, files);
    });
};

//Фильтрует файлы по имени
let filterFileNames = (files, callback) =>{
    let err;
    if(files.length > 0) {
        for (let i = files.length - 1; i >= 0; i--) {
            if (!REG_VERSION.test(files[i])) {
                files.splice(i, 1);
            }
        }
        err = null;
    }
    else {
        err = "Not found files";
    }
    callback(err, files);
};

//Отсеиваем не нужные версии миграций
let filterVersion = (files, callback) => {
    let current_version;
    if(up_version === null){
        up_version = files[files.length - 1].replace(".sql", "");
    }
    dbconnect.query("call select_last_migration()",  (error, result) => {
        if (error) {
            throw error;
        }
        current_version = result[0][0]['major_version'] + "." + result[0][0]['minor_version'] + "." + result[0][0]['subversion'];
        if(up_version > current_version){
            //Удаляем имена не соответствующие формату записи версий или не попадающеие в промежуток между текущей версией и версией обновления
            for(let i = files.length-1; i >= 0; i--) {
                if (files[i] <= current_version + ".sql" || files[i] > up_version + ".sql") {
                    files.splice(i, 1);
                }
            }
            callback(null, files);
        }
        else {
            callback("The above version is less than the current", null)
        }
    });
};

//Накатывание требуемых миграций
let migrations = (files, callback) => {
    async.eachSeries(files, upMigration, (err)=> {
        if(err){
            throw err;
        }
        callback(null, files[files.length - 1])
    });
};

let resWaterfall = (err, res) => {
    if(err){
        throw err;
    }
    let version = res.split(".");
    dbconnect.query("call increment_migration(" + version[0]+ ", " + version[1] + ", " +version[2]+ ")");
    dbconnect.end();
}

//Функция развертывания БД
let start = () => {
   async.waterfall([
        checkBaseline,
        readFileNames,
        filterFileNames,
        migrations
    ], resWaterfall)
};


//Функция обновления БД
let update = () => {

    async.waterfall([
        checkBaseline,
        readFileNames,
        filterFileNames,
        filterVersion,
        migrations,
    ], resWaterfall)
};

//Проверка ключей переданных при вызове скрипта.
switch(arg[2]){
    case "-s": //Развертывание БД
        command = "-s";
        start();
        break;
    case "-u"://Обновление версии
        command = "-u";
        if(arg[3] === undefined) {
            update();
        }
        else if(REG_VERSION.test(arg[3])){
            up_version = arg[3];
            update();
        }
        else{
            console.log("Invalid argument");
        }
        break;
    default:
        console.log("Invalid argument");
        break;
}



