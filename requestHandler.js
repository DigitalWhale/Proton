
/*Вызов скриптов для соответствующих страниц*/

//Пример
// home = function () {
//    console.log("home");
//};
//
//var registration = function() {
//    console.log("registration");
//};


//Экспортируемый массив соответсвий открытой страницы и вызываемого скрипта
let handle = {};

//Пример
//handle["/"] = home;
//handle["/registration"] =  registration;

exports.handle = handle;