let fs = require('fs');
let os = require('os');
let path = require('path');

class Paser {
    constructor(filePath, global) {
        this.commands = clearData(readFileStream(filePath));
        this.currCommand = '';
        global_config.static = path.dirname(filePath).split('/').pop()+'.';
    }
    hasMoreCommands() {
        return this.commands.length > 0;
    }
    /*
      Ignore inline comments.
      The compiler front end cannot generate inline comments.
     */
    advance() {
        if (this.hasMoreCommands()) {
            this.currCommand = this.commands.shift();
            return true;
        } else {
            this.currCommand = '';
            return false;
        }
    }
    commandType() {
        let match;

        if (match = /^pop\s*([a-z|A-Z]*)?\s*([0-9]*)/.exec(this.currCommand)) {
            return {type :'C_POP',arg1: match[1], arg2: match[2], matches: match[0]};
        } else if (match = /^push\s*([a-z|A-Z]*)?\s*([0-9]*)/.exec(this.currCommand)) {  // label symbols
            return {type :'C_PUSH',arg1: match[1], arg2: match[2], matches: match[0]};
        } else if (match = /^and|or|not|neg|add|sub|eq|lt|gt/.exec(this.currCommand)) {  // label symbols
            return {type :'C_ARITHMETIC',operator: match[0], matches: match[0]};
        } else {
            console.log("Invalid Syntax: " + this.currCommand);
        }
    }
}

class CodeWriter {
    constructor(fileName) {
        this.fileName = fileName;
        this.outputAsm = [];
    }

    translator(paserObject) {
        while (paserObject.advance()) {
            let command = paserObject.commandType();
            switch (command.type) {
                case 'C_PUSH': this.writePushPop(command); break;
                case 'C_POP': this.writePushPop(command); break;
                case 'C_ARITHMETIC': this.writeArithmetic(command); break;
                default:
                    console.log("Can't deal with this command type!")
            }
        }

        return this;
    }

    outputFile() {
        let fWrite = fs.createWriteStream(this.fileName, {
            encoding: 'utf8'
        });

        // infinite loop use to stop
        this.outputAsm = this.outputAsm.concat(`(END${global_config.counter})
                                @END${global_config.counter}
                                0;JMP`.split('\n'));

        this.outputAsm.forEach((data)=> {
            fWrite.write(data + os.EOL);
        });
    }

    writeArithmetic(command) {
        let template = `// ${command.matches}\n`;

        switch (command.operator) {
            case 'lt':
                template += `@SP
                             A = M-1
                             D=M
                             @SP
                             M=M-1
                             @13
                             M=D
                             @SP
                             A=M-1
                             D=M
                             @SP
                             M=M-1
                             @13
                             D=D-M
                             @SP
                             A=M
                             M=0
                             @END${global_config.counter}
                             D;JGE
                             @SP
                             A=M
                             M=-1
                             (END${global_config.counter++})
                             @SP
                             M=M+1`;
                break;
            case 'gt':
                template += `@SP
                             A= M-1
                             D=M
                             @SP
                             M=M-1
                             @13
                             M=D
                             @SP
                             A=M-1
                             D=M
                             @SP
                             M=M-1
                             @13
                             D=D-M
                             @SP
                             A=M
                             M=0
                             @END${global_config.counter}
                             D;JLE
                             @SP
                             A=M
                             M=-1
                             (END${global_config.counter++})
                             @SP
                             M=M+1`;
                break;
            case 'eq':
                template += `@SP
                            A=M-1
                            D=M
                            @SP
                            M=M-1
                            @13
                            M=D
                            @SP
                            A=M-1
                            D=M
                            @SP
                            M=M-1
                            @13
                            D=D-M
                            @SP
                            A=M
                            M=0
                            @END${global_config.counter}
                            D;JNE
                            @SP
                            A=M
                            M=-1
                            (END${global_config.counter++})
                            @SP
                            M=M+1`;
                break;
            case 'not':
                template += `@SP
                            A=M-1
                            M=!M`;
                break;
            case 'neg':
                template += `@SP
                            A=M-1
                            M=-M`;
                break;
            case 'static':
                template += `@${global_config.op[command.operator]}${command.arg2}
                            D=M
                            @SP
                            A=M
                            M=D
                            @SP
                            M=M+1`;
                break;
            default: // deal with and,or,not,neg,add,sub operator
                template += `@SP
                            A=M-1
                            D=M
                            @SP
                            M=M-1
                            @13
                            M=D
                            @SP
                            A=M-1
                            D=M
                            @SP
                            M=M-1
                            @13
                            D=${global_config.op[command.operator]}
                            @SP
                            A=M
                            M=D
                            @SP
                            M=M+1`;
                break;
        }
        this.outputAsm = this.outputAsm.concat(template.split('\n'));
    }
    writePushPop(command) {
        let template = `// ${command.matches}\n`;

        if (command.type === 'C_PUSH') {
            switch (command.arg1) {
                case 'constant':
                    template += `@${command.arg2}
                                D=A
                                @SP
                                A=M
                                M=D
                                @SP
                                M=M+1`;
                    break;
                case 'temp':
                    template += `@${command.arg2}
                                D=A
                                @${global_config[command.arg1]}
                                A=D+A
                                D=M
                                @SP
                                A=M
                                M=D
                                @SP
                                M=M+1`;
                    break;
                case 'pointer':
                    template += `@${command.arg2}
                                D=A
                                @${global_config[command.arg1]}
                                A=D+A
                                D=M
                                @SP
                                A=M
                                M=D
                                @SP
                                M=M+1`;
                    break;
                case 'static':
                    template += `@${command.arg2}
                                D=A
                                @16
                                A=D+A
                                D=M
                                @SP
                                A=M
                                M=D
                                @SP
                                M=M+1`;
                    break;
                default:
                    template += `@${command.arg2}
                                D=A
                                @${global_config[command.arg1]}
                                A=D+M
                                D=M
                                @SP
                                A=M
                                M=D
                                @SP
                                M=M+1`;
                    break;
            }
        }
        // pop
        else {
            switch (command.arg1) {
                case 'temp':
                    template += `@SP
                                 A=M-1
                                 D=M
                                 @13
                                 M=D
                                 @SP
                                 M=M-1
                                 @${command.arg2}
                                 D=A
                                 @${global_config[command.arg1]}
                                 D=D+A
                                 @14
                                 M=D
                                 @13
                                 D=M
                                 @14
                                 A=M
                                M=D`;
                break;
                case 'pointer':
                    template += `@SP
                                 A=M-1
                                 D=M
                                 @13
                                 M=D
                                 @SP
                                 M=M-1
                                 @${command.arg2}
                                 D=A
                                 @${global_config[command.arg1]}
                                 D=D+A
                                 @14
                                 M=D
                                 @13
                                 D=M
                                 @14
                                 A=M
                                 M=D`;
                    break;
                case 'static':
                    template += `@SP
                                 A=M-1
                                 D=M
                                 @13
                                 M=D
                                 @SP
                                 M=M-1
                                 @${command.arg2}
                                 D=A
                                 @16
                                 D=D+A
                                 @14
                                 M=D
                                 @13
                                 D=M
                                 @14
                                 A=M
                                 M=D`;
                    break;
                default:
                    template += `@SP
                                 A=M-1
                                 D=M
                                 @13
                                 M=D
                                 @SP
                                 M=M-1
                                 @${command.arg2}
                                 D=A
                                 @${global_config[command.arg1]}
                                 D=D+M
                                 @14
                                 M=D
                                 @13
                                 D=M
                                 @14
                                 A=M
                                 M=D`;
                break;
            }
        }

        this.outputAsm = this.outputAsm.concat(template.split('\n'));
    }
}

let global_config = {
    'constant' : 'SP',
    'argument' : 'ARG',
    'local'    : 'LCL',
    'this'     : 'THIS',
    'that'     : 'THAT',
    'pointer'  : 3,
    'temp'     : 5,
    'static'   : '',
    'op'       : {
        'and'  : 'D&M',
        'or'   : 'D|M',
        'not'  : '!M',
        'neg'  : '-M',
        'add'  : 'D+M',
        'sub'  : 'D-M'
    },
    'counter'    : 1
};
function readFileStream(filePath) {
    let commandArray = [];

    commandArray = fs.readFileSync(filePath, 'utf8').split('\n');

    return commandArray;
}

function clearData(commands) {
    return commands.filter((item) => {
        if (item === '') {
            return false;
        } else if (/^\/\/.*/.exec(item)) {
            return false;
        }
        return true;
    })
}
let write = new CodeWriter('MemoryAccess/StaticTest/StaticTest.asm')
    .translator(new Paser('MemoryAccess/StaticTest/StaticTest.vm')).outputFile();