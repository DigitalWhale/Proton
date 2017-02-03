//Модуль содержит вызовы скриптов для соответствующих страниц
const requestHandler = require("./requestHandler");

//Экспортируемая функция - маршрутизатор.
// Вызывает скрипты для соответсвующих страниц
let route = (pathname) => {
    if(typeof requestHandler.handle[pathname] === "function"){
        requestHandler.handle[pathname]();
    }
    else{
        console.log("Not found 404");
    }
};

exports.route = route;