var fs = require('fs');

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
    // console.log(fileStrArray);

    return fileStrArray;
}

// Parser

function hasMoreCommands() {
    
}

function advance() {

}

function commandType() {
    
}

function toSymbol() {
    
}

function toDest() {
    
}

function toComp() {
    
}

function toJump() {
    
}

// Code
function destToCode() {

}

function compToCode() {

}

function jumpToCode() {

}

// auxiliary function
function skipBlackLine(fileStrArray) {
    let newArray = fileStrArray.filter((item) => {
        return item !== '';
    });

    return newArray;
}

function parser(midArray ,binaryArray) {
    let current,match;

    current = midArray.shift();
    if (match = /^@[a-zA-Z|_|.|$|:][\w|.|$|:]*/.exec(current)) {
        // console.log(current,table.getAddress(match[0].replace(/@/,'')));

        binaryArray.push(parseInt(table.getAddress(match[0].replace(/@/,''))).toString(2).padStart(16, "0"));
    } else if (match = /^@[\w]+/.exec(current)) {
        // console.log(current,table.getAddress(match[0].replace(/@/,'')));

        binaryArray.push(parseInt(match[0].replace(/@/,'')).toString(2).padStart(16, "0"));
    } else if (match = /^(.+)=([+|\-|&|\||!|\w]+);(.+)$/.exec(current)) {
        // console.log(current,match[1],match[2],match[3],
        //     compTable[match[2]], destTable[match[1]], jumpTable[match[3]]);

        binaryArray.push('111' + compTable[match[2]] + destTable[match[1]] + jumpTable[match[3]]);
    } else if (match = /^(.+)=([+|\-|&|\||!|\w]+)$/.exec(current)) {
        // console.log(current,match[1],match[2],
        //     'comp:' + compTable[match[2]], 'dest:' + destTable[match[1]]);

        binaryArray.push('111' + compTable[match[2]] + destTable[match[1]] + '000');
    } else if (match = /^([+|\-|&|\||!|\w]+);(.+)$/.exec(current)) {
        // console.log(current,match[1],match[2],
        //     'comp:' + compTable[match[1]], 'jump:' + jumpTable[match[2]]);

        binaryArray.push('111' + compTable[match[1]] + '000' + jumpTable[match[2]]);
    } else if (match = /^[+|\-|&|\||!|\w]+/.exec(current)) {
        // console.log(current,'comp: ' + compTable[match[0]]);

        binaryArray.push('111' + compTable[match[0]] + '000000');
    } else {
        return new AssemblerError("Invalid Syntax: " + current);
    }

    return midArray.length !== 0 ? parser(midArray, binaryArray) : 0;
}

function symbolRes(fileStrArray, newArray) {
    let current,match;

    current = fileStrArray.shift().replace(/\/\/.*/, '').trim();
    //console.log(current , PC);
    if (current === '') {
    }
    else if (match = /^@[a-zA-Z|_|.|$|:][\w|.|$|:]*/.exec(current)) {  // variable symbols
        if (!table.contains(match[0].replace(/@/,'')))  {
            table.addEntry(match[0].replace(/@/,''), vPointer++);
        }
        newArray.push(match[0]);
        PC++;
    }
    else if (match = /^@[0-9]+$/.exec(current)) {
        newArray.push(match[0]);
        PC++;
    }
    else if (match = /^\(\w*\)$/.exec(current)) {  // label symbols
        table.addEntry(match[0], PC);
    }
    else if (match = /^.+=.+/.exec(current)) {
        newArray.push(match[0]);
        PC++;
    }
    else if (match = /^.+;.+/.exec(current)) {
        newArray.push(match[0]);
        PC++;
    }

    return fileStrArray.length !== 0 ? symbolRes(fileStrArray, newArray) : 0;
}


// run Assembler
let table = new SymbolTable();
let PC = 0; // counter, point to instruction memory
let vPointer = 16; // point to data memory

function loadTable(tableObject) {
    for(entry in tableObject) {
        if (tableObject.hasOwnProperty(entry)) {
            table.addEntry(entry, tableObject[entry]);
        }
    }
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

// Scanning symbol table
loadTable(preDefSymbol);

        let fileStrArray = skipBlackLine(readFileStream('max/Max.asm')), midArray = [],
    binaryArray = [];

symbolRes(fileStrArray, midArray);
// console.log(midArray);
parser(midArray,binaryArray);
console.log(binaryArray);
// console.log(table);
// console.log('PC: ' + PC, 'vPointer: ' + vPointer);