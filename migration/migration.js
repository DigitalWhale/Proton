const dbconnect = require("../dbconnect").connection;
const fs = require("fs");
const arg = process.argv;//Записываем все аргументы принятые из командной строки
const VERSION_DIRECTIONAL = "db_version/";
const REG_VERSION = /\d+(\.\d+){2}/;
let count_up_migration = 0;
let count_migration;

//Рекурсивная функция накатывания миграции
let upMigration = (path, files) => {
    //Читаем файл с миграцией
    let sql = fs.readFile(path, "utf8", (error, content) => {
        if(error){
            throw error;
        }
        //Получаем массив с номером версий и подверсий
        let version = files[count_up_migration].split(".");
        //Накатываем миграцию
        dbconnect.query(content, (error, result) => {
            if(error){
                throw  error;
            }
            count_up_migration++;
            //Если накатанная миграция последняя в директории, то завершаем рекурсию
            if(count_up_migration == count_migration){
                dbconnect.query("call increment_migration("+ version[0] +", "+ version[1] + ", "+ version[2] +");", (error, result) => {
                    dbconnect.end();
                });
                return;
            }
            //Рекурсивный вызов функции
            upMigration(VERSION_DIRECTIONAL + files[count_up_migration], files);
        })
    });
};


//Функция развертывания БД
let start = () => {
    dbconnect.connect();
    //Запрос на проверку существования baseline
    dbconnect.query("SHOW TABLES FROM `protondb` LIKE 'migration_history';", (error, result) => {
        if(error){
            throw error;
        }
        //Если baseline не существует, то создаем её
        if(result[0] === undefined){
            fs.readdir(VERSION_DIRECTIONAL, (error, files) => {
                if(error){
                    throw error;
                }
                //Удаляем имена не соответствующие формату записи версий
                for(let i = files.length-1; i >= 0; i--) {
                    if (!REG_VERSION.test(files[i])) {
                        files.splice(i, 1);
                    }
                }
                count_migration = files.length;

                //Рекурсивная функция накатывания миграций
                upMigration(VERSION_DIRECTIONAL + files[count_up_migration], files);
            });
        }
        else {
            console.log("baseline already exists");
        }
    })
};

//Функция обновления БД
let update = (upVersion) => {
    dbconnect.connect();

    //Запрос на проверку существования baseline
    dbconnect.query("SHOW TABLES FROM `protondb` LIKE 'migration_history';", (error, result) => {
        if (error) {
            throw error;
        }
        //Если baseline не существует, то создаем её
        if (result[0] !== undefined) {
            let current_version;
            let update_version;
            dbconnect.query("call select_last_migration()",  (error, result) => {
                if (error) {
                    throw error;
                }
                current_version = result[0][0]['major_version'] + "."  + result[0][0]['minor_version'] + "." + result[0][0]['subversion'];
                console.log(current_version);
                fs.readdir(VERSION_DIRECTIONAL, (error, files) => {
                    if(error){
                        throw error;
                    }

                    //Обновляем до большей версии
                    if(upVersion === undefined) {
                        update_version = files[files.length - 1];
                    } else {
                       update_version = upVersion;
                    }
                    if(update_version > current_version){
                        //Удаляем имена не соответствующие формату записи версий или не попадающеие в промежуток между текущей версией и версией обновления
                        for(let i = files.length-1; i >= 0; i--) {
                            if (!REG_VERSION.test(files[i]) || files[i] <= current_version + ".sql" || files[i] > update_version + ".sql") {
                                files.splice(i, 1);
                            }
                        }
                        count_migration = files.length;
                        upMigration(VERSION_DIRECTIONAL + files[count_up_migration], files);
                    }
                    else {

                        console.log("The above version is less than the current");
                        dbconnect.end();
                    }
                })
            })
        }
        else {
            console.log("baseline not found");
        }
    });
};

//Проверка ключей переданных при вызове скрипта.
switch(arg[2]){
    case "-s": //Развертывание БД
        start();
        break;
    case "-u"://Обновление версии
        if(arg[3] === undefined) {
            update();
        }
        else if(REG_VERSION.test(arg[3])){
            update(arg[3]);
        }
        else{
            console.log("Invalid argument");
        }
        break;
    default:
        console.log("Invalid argument");
        break;
}



