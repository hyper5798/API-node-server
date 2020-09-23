let fs = require("fs")

exports.saveJsonToFile = function (path,obj){
    saveJaonFile(path,obj)
}

exports.getJsonFromFile = function (path){
    return getJaonFile(path)
}

exports.appendToFile = function (path, data){
    return appendFile(path, data)
}


exports.saveToFile = function (path, data){
    return saveFile(path,data)
}

exports.getFromFile = function (path){
    return getFile(path)
}

function saveJaonFile(path,obj){
    try {
        let json = JSON.stringify(obj)
        fs.writeFileSync(path, json, 'utf8')
        showLog("## saveJaonFile path: "+ path + ' -> ok')
    } catch (error) {
        showLog("## saveJaonFile path: "+ path + ' -> '+error.message)
    }
}

function getJaonFile(path){
    try {
        if (fs.existsSync(path) == false) {
            showLog("## getJaonFile path: "+ path + ' -> null')
            return null;
        }else{
            let text = fs.readFileSync(path, 'utf8');
            //console.log('read text :'+text);
            if(text.length>0){
                let json = JSON.parse(text);
                showLog("## getJaonFile path: "+ path + ' -> ok')
                return json;
            }else{
                showLog("## getJaonFile path: "+ path + ' -> null')
                return null;
            }
        }
    } catch (error) {
        showLog("## getJaonFile path: "+ path + ' -> '+error.message)
        return error.message
    }
}

function appendFile(path, data) {
    
    //console.log("Debug jsonFileTools appendFile -> path: "+ path);
    try {
        let message = new Date().toISOString()  + ' -> ' + data +'\r\n'
        fs.appendFileSync(path, message)
        showLog("## appendFile path: "+ path + ' -> ok')
    } catch (error) {
        showLog("## appendFile path: "+ path + ' -> '+error.message)
    }
}

function saveFile(path,data){
    
    try {
        let message = new Date().toISOString()+ ' -> '+data + '\r\n';
        fs.writeFileSync(path, message, 'utf8');
        showLog("## saveFile path: "+ path + ' -> OK');
    } catch (error) {
        showLog("## saveFile path: "+ path + ' -> '+error.message)
    }
}

function getFile(path){
    
    try {
        if (fs.existsSync(path) === false) {
            showLog("## getFile path: "+ path + ' -> null');
            return null;
        }else{
            let text = fs.readFileSync(path, 'utf8');
            showLog("## getFile path: "+ path + ' -> ok');
            return text;
        }
    } catch (error) {
        showLog("## getFile path: "+ path + ' -> error:'+error.message);
        return error.message
    }
    
}

function showLog(message) {
      console.log( new Date().toISOString()+ ' >>> '+ message)   
}

