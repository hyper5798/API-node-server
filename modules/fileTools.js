let fs = require("fs");

exports.saveJsonToFile = function (path,obj){
    saveJaonFile(path,obj);
}

exports.getJsonFromFile = function (path){
    return getJaonFile(path);
}


function saveStringToFile(mpath,mstring){
    console.log("Debug jsonFileTools saveFile -> path: "+ mpath);
    //console.log("Debug jsonFileTools saveFile -> string: "+ mstring);
    //let json = JSON.stringify(obj);
    fs.writeFile(mpath, mstring, 'utf8');
    console.log("\n *START* \n");
    //let content = fs.readFileSync(mpath);
    //console.log("Output Content : \n"+ content);
}

function saveJaonFile(path,obj){
    console.log("Debug jsonFileTools saveFile -> path: "+ path);
    let json = JSON.stringify(obj);
    fs.writeFileSync(path, json, 'utf8');
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
