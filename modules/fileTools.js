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

function saveStringToFile(mpath,mstring){
    console.log("Debug jsonFileTools saveFile -> path: "+ mpath);
    //console.log("Debug jsonFileTools saveFile -> string: "+ mstring)
    //let json = JSON.stringify(obj)
    fs.writeFile(mpath, mstring, 'utf8')
    console.log("\n *START* \n")
    //let content = fs.readFileSync(mpath)
    //console.log("Output Content : \n"+ content)
}

function saveJaonFile(path,obj){
    console.log("Debug jsonFileTools saveFile -> path: "+ path)
    let json = JSON.stringify(obj)
    fs.writeFileSync(path, json, 'utf8')
}

function getJaonFile(path){
    console.log("Debug jsonFileTools getJaonFile -> path: "+ path);
    if (fs.existsSync(path) == false) {
        return null;
    }else{
        let text = fs.readFileSync(path, 'utf8');
        console.log('read text :'+text);
        if(text.length>0){
            let json = JSON.parse(text);
            return json;
        }else{
            return null;
        }
        
    }
}

function appendFile(path, data) {
    
    //console.log("Debug jsonFileTools appendFile -> path: "+ path);
    try {
        let message = new Date().toISOString()  + ' -> ' + data +'\r\n'
        fs.appendFileSync(path, message)
    } catch (error) {
        console.log('???? '+ new Date().toISOString() + error.message)
    }
}

function saveFile(path,data){
    
    try {
        let message = new Date().toISOString()+ ' -> '+data + '\r\n';
        fs.writeFileSync(path, message, 'utf8');
    } catch (error) {
        console.log('???? '+ new Date().toISOString() + error.message)
    }
}
