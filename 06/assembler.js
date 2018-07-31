let fs = require('fs');
let os = require('os');
let path = require('path');

// Symbol Table
class SymbolTable {
    constructor() {
        this.table = new Map();
    }

    addEntry(symbol,address) {
        this.table.set(symbol,address);
    }

    contains(symbol) {
        return this.table.get(symbol) !== undefined;
    }

    getAddress(symbol) {
        return this.table.get(symbol);
    }
}

// init
class AssemblerError {
    constructor(errorMsg) {
        this.errorMsg = errorMsg;
    }
}

function readFileStream(filePath) {
    let fileStrArray = [];

    fileStrArray = fs.readFileSync(filePath, 'utf8').split('\n');

    return fileStrArray;
}

function loadTable(tableObject, table) {
    for(entry in tableObject) {
        if (tableObject.hasOwnProperty(entry)) {
            table.addEntry(entry, tableObject[entry]);
        }
    }
}

// Parser
function hasMoreCommands(commandArray) {
    return commandArray.length === 0 ? false : true;
}

function advance(commandArray) {

    return commandArray.shift().replace(/\/\/.*/, '').trim();
}

function commandType(currCommand) {
    let match;

    if (match = /^@[a-zA-Z|_|.|$|:|\_|0-9+][\w|.|$|:]*/.exec(currCommand)) {
        return {type :'A_COMMAND',matches: match};
    } else if (match = /^\([\w|.|$]*\)$/.exec(currCommand)) {  // label symbols
        return {type :'L_COMMAND',matches: match};
    } else if (match = /^([a-zA-Z]+)?=?([+|\-|&|\||!|\w]+);?(.+)?$/.exec(currCommand)) {
        return {type :'C_COMMAND',matches: match};
    } else {
        return new AssemblerError("Invalid Syntax: " + currCommand);
    }
}

function toSymbol(match, global) {
    return global.table.getAddress(match);
}

function toDest(match) {
    return destTable[match];
}

function toComp(match) {
    return compTable[match];
}

function toJump(match) {
    return jumpTable[match];
}

// auxiliary function
function skipBlackLine(fileStrArray) {
    let newArray = fileStrArray.filter((item) => {
        return item !== '';
    });

    return newArray;
}

function parser2(fileStrArray ,global) {
    let current;

    while (hasMoreCommands(fileStrArray)) {

        current = advance(fileStrArray);
        if (current === '') {
            continue;
        }
        current = commandType(current);
        switch (current.type) {
            case 'A_COMMAND' :
                if (/^[0-9]+$/.exec(current.matches[0].replace(/@/,''))) {
                    global.binaryArray.push(parseInt(current.matches[0].replace(/@/,'')).toString(2)
                        .padStart(16, "0"));
                    break;
                }
                if (!global.table.contains(current.matches[0].replace(/@/,'')))  {
                    global.table.addEntry(current.matches[0].replace(/@/,''), global.vPointer++);
                }
                global.binaryArray.push(parseInt(toSymbol(current.matches[0].replace(/@/,''), global))
                    .toString(2).padStart(16, "0"));

                break;
            case 'L_COMMAND' :
                break;
            case 'C_COMMAND' :
                global.binaryArray.push('111'.concat(toComp(current.matches[2]),
                    current.matches[1] ? toDest(current.matches[1]) : '000',
                    current.matches[3] ? toJump(current.matches[3]) : '000'));
                break;
            default : break;
        }
    }

    return 0;
}

function symbolRes(fileStrArray, global) {
    let current,match;

    return fileStrArray.filter((item)=> {
        current = item.replace(/\/\/.*/, '').trim();
        if (current === '') {
            return false;
        }
        else if (match = /^\([\w|.|$]*\)$/.exec(current)) {  // label symbols
            global.table.addEntry(match[0].replace(/\(/i,'').replace(/\)/,''), global.PC);
            return true;
        }
        else {
            global.PC++;
            return true;
        }
    });
}

let preDefSymbol = {
    'SP': 0, 'LCL': 1, 'ARG': 2,
    'THIS': 3, 'THAT': 4, 'R0': 0,
    'R1': 1, 'R2': 2, 'R3': 3,
    'R4': 4, 'R5': 5, 'R6': 6,
    'R7': 7, 'R8': 8, 'R9': 9,
    'R10': 10, 'R11': 11, 'R12': 12,
    'R13': 13, 'R14': 14, 'R15': 15,
    'SCREEN': 16384, 'KBD': 24576
};

let compTable = {
    '0'  : '0101010', '1'  : '0111111',  '-1' : '0111010',
    'D'  : '0001100', 'A'  : '0110000',  '!D' : '0001101',
    '!A' : '0110001', '-D' : '0001111',  '-A' : '0110011',
    'D+1': '0011111', 'A+1': '0110111', 'D-1' : '0001110',
    'A-1': '0110010', 'D+A': '0000010', 'D-A' : '0010011',
    'A-D': '0000111', 'D&A': '0000000', 'D|A' : '0010101',
    'M'  : '1110000', '!M' : '1110001', '-M'  : '1110011',
    'M+1': '1110111', 'M-1': '1110010', 'D+M' : '1000010',
    'D-M': '1010011', 'M-D': '1000111', 'D&M' : '1000000',
    'D|M': '1010101'
};

let destTable = {
    'null': '000','M': '001','D': '010',
    'MD': '011', 'A': '100', 'AM': '101',
    'AD': '110', 'AMD': '111'
};

let jumpTable = {
    'null': '000', 'JGT': '001', 'JEQ': '010',
    'JGE' : '011', 'JLT': '100', 'JNT': '101',
    'JNE' : '101', 'JLE': '110', 'JMP': '111'
};
// run Assembler
// let table = new SymbolTable();
// let PC = 0; // counter, point to instruction memory
// let vPointer = 16; // point to data memory

/**
 * 文件遍历方法
 * @param filePath 需要遍历的文件路径
 */
let filePath = path.resolve('./');
function fileDisplay(filePath){
    //根据文件路径读取文件，返回文件列表
    fs.readdir(filePath,function(err,files){
        if(err){
            console.warn(err)
        }else{
            //遍历读取到的文件列表
            files.forEach(function(filename){
                //获取当前文件的绝对路径
                let filedir = path.join(filePath,filename);
                //根据文件路径获取文件信息，返回一个fs.Stats对象
                fs.stat(filedir,function(error,stats){
                    if(error){
                        console.warn('fail to get file');
                    }else{
                        let isFile = stats.isFile();//是文件
                        let isDir = stats.isDirectory();//是文件夹
                        if(isFile && (filedir.indexOf('.asm') !== -1)){
                            let global = {
                                PC : 0,
                                vPointer : 16,
                                table : new SymbolTable(),
                                binaryArray: []
                            };

                            loadTable(preDefSymbol, global.table);
                            // console.log(PC, vPointer, table);

                            let fileStrArray = skipBlackLine(readFileStream(filedir));

                            fileStrArray = symbolRes(fileStrArray, global);

                            parser2(fileStrArray, global);

                            let fWrite = fs.createWriteStream(filedir.replace(/.asm/, '.hackes'));
                            global.binaryArray.forEach((data)=> {
                                fWrite.write(data + os.EOL);
                            });
                        }
                        if(isDir){
                            fileDisplay(filedir);//递归，如果是文件夹，就继续遍历该文件夹下面的文件
                        }
                    }
                })
            });
        }
    });
}
fileDisplay(filePath);
