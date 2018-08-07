let fs = require('fs');
let os = require('os');
let path = require('path');

class Parser {
    constructor(filePath) {
        this.commands = clearData(fileDisplay(filePath));
        this.currCommand = '';
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

        if (match = /^pop\s+([a-z|A-Z]*)?\s+([0-9]+)/.exec(this.currCommand)) {
            return {type :'C_POP',arg1: match[1], arg2: match[2], matches: match[0]};
        } else if (match = /^push\s+([a-z|A-Z]+)?\s+([0-9]+)/.exec(this.currCommand)) {  // label symbols
            return {type :'C_PUSH',arg1: match[1], arg2: match[2], matches: match[0]};
        } else if (match = /^and|or|not|neg|add|sub|eq|lt|gt/.exec(this.currCommand)) {  // label symbols
            return {type :'C_ARITHMETIC',operator: match[0], matches: match[0]};
        } else if (match = /^label\s+(\w+)/.exec(this.currCommand)) {  // label symbols
            return {type :'C_LABEL',labelName: match[1], matches: match[0]};
        } else if (match = /^goto\s+(\w+)/.exec(this.currCommand)) {  // label symbols
            return {type :'C_GOTO', labelName: match[1], matches: match[0]};
        } else if (match = /^if-goto\s+(\w+)/.exec(this.currCommand)) {  // label symbols
            return {type :'C_IF',labelName: match[1], matches: match[0]};
        } else if (match = /^call\s+([\w|\.]+)\s*(\d*)/.exec(this.currCommand)) {  // label symbols
            return {type :'C_CALL',funName: match[1], args: match[2],matches: match[0]};
        } else if (match = /^function\s+([\w|\.]+)\s*(\d*)/.exec(this.currCommand)) {  // label symbols
            return {type :'C_FUNCTION',funName: match[1], localVar: match[2],matches: match[0]};
        } else if (match = /^return/.exec(this.currCommand)) {  // label symbols
            return {type: 'C_RETURN', matches: match[0]};
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

    init(paserObject) {
        this.outputAsm = this.outputAsm.concat(`@256
                                                D=A
                                                @SP
                                                M=D`.split('\n'));
        paserObject.commands.unshift('call Sys.init');
    }
    translator(paserObject) {
        this.init(paserObject);

        while (paserObject.advance()) {
            let command = paserObject.commandType();
            // console.log(command,paserObject)
            switch (command.type) {
                case 'C_PUSH': this.writePushPop(command); break;
                case 'C_POP': this.writePushPop(command); break;
                case 'C_ARITHMETIC': this.writeArithmetic(command); break;
                case 'C_LABEL': this.writeLabel(command); break;
                case 'C_GOTO': this.writeGoto(command); break;
                case 'C_IF': this.writeIf(command); break;
                case 'C_FUNCTION': this.writeFunction(command); break;
                case 'C_RETURN': this.writeReturn(command); break;
                case 'C_CALL': this.writeCall(command); break;
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
                                1;JMP`.split('\n'));

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
            // special deal with static
            if (/static/.exec(command.arg1)) {
                template += `@${command.arg1.slice(6)}.${command.arg2}
                            D=M
                            @SP
                            A=M
                            M=D
                            @SP
                            M=M+1`;

            }
            else {
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
        }
        // pop
        else {
            if (/static/.exec(command.arg1)) {
                template += `@SP
                             A=M-1
                             D=M
                             @SP
                             M=M-1
                             @${command.arg1.slice(6)}.${command.arg2}
                             M=D
                             `;
            }
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
        }

        this.outputAsm = this.outputAsm.concat(template.split('\n'));
    }

    writeLabel(command) {
        let template = `// ${command.matches}\n`;

        template += `(${command.labelName})`;
        this.outputAsm = this.outputAsm.concat(template.split('\n'));
    }

    writeGoto(command) {
        let template = `// ${command.matches}\n`;

        template += `@${command.labelName}
                     D;JMP`;
        this.outputAsm = this.outputAsm.concat(template.split('\n'));
    }

    writeIf(command) {
        let template = `// ${command.matches}\n`;

        template += `@SP
                     A=M-1
                     D=M
                     @SP
                     M=M-1
                     @${command.labelName}
                     D;JNE`;
        this.outputAsm = this.outputAsm.concat(template.split('\n'));
    }

    writeCall(command) {
        let template = `// ${command.matches}\n`;

        template += `@return-address-${command.funName}
                     D=A
                     @SP
                     A=M
                     M=D
                     @SP
                     M=M+1
                     @LCL
                     D=M
                     @SP
                     A=M
                     M=D
                     @SP
                     M=M+1
                     @ARG
                     D=M
                     @SP
                     A=M
                     M=D
                     @SP
                     M=M+1
                     @THIS
                     D=M
                     @SP
                     A=M
                     M=D
                     @SP
                     M=M+1
                     @THAT
                     D=M
                     @SP
                     A=M
                     M=D
                     @SP
                     M=M+1
                     @SP
                     D=M
                     @SP
                     A=M
                     M=D
                     @SP
                     M=M+1
                     @${command.args ? command.args : 0}
                     D=A
                     @13
                     M=D
                     @5
                     D=A
                     @13
                     M=D+M
                     @SP
                     A=M
                     M=D
                     @SP
                     M=M+1
                     @SP
                     A=M
                     D=M
                     @ARG
                     M=D
                     @13
                     D=M
                     @ARG
                     M=M-D
                     @SP
                     D=M
                     @LCL
                     M=D
                     @${command.funName}
                     D;JMP
                     (return-address-${command.funName})`;
        this.outputAsm = this.outputAsm.concat(template.split('\n'));
    }

    writeFunction(command) {
        let template = `// ${command.matches}\n`;

        template += `(${command.funName})
                     @${command.localVar ? command.localVar : 0}
                     D=A
                     @13
                     M=D
                     @i
                     M=0
                     (${command.funName}$LOOP)
                     @13
                     D=M-1
                     M=M-1
                     @${command.funName}$END
                     D;JLT
                     @i
                     D=M
                     @LCL
                     A=M+D
                     M=0
                     @i
                     M=M+1
                     @SP
                     M=M+1
                     @${command.funName}$LOOP
                     1;JMP
                     (${command.funName}$END)`;
        this.outputAsm = this.outputAsm.concat(template.split('\n'));
    }

    writeReturn(command) {
        let template = `// ${command.matches}\n`;

        template += `@LCL
                     D=M
                     @13
                     M=D
                     @5
                     D=D-A
                     A=D
                     D=M
                     @14
                     M=D
                     @SP
                     A=M-1
                     D=M
                     @ARG
                     A=M
                     M=D
                     @ARG
                     D=M+1
                     @SP
                     M=D
                     @1
                     D=A
                     @13
                     A=M-D
                     D=M
                     @THAT
                     M=D
                     @2
                     D=A
                     @13
                     A=M-D
                     D=M
                     @THIS
                     M=D
                     @3
                     D=A
                     @13
                     A=M-D
                     D=M
                     @ARG
                     M=D
                     @4
                     D=A
                     @13
                     A=M-D
                     D=M
                     @LCL
                     M=D
                     @14
                     A=M
                     D;JMP`;
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
function fileDisplay(filePath) {
    let commandArray = [],fileName = '';

    filePath.forEach((item)=>{
        fileName = item.split('/').pop().replace(/\.vm/i, "");

        commandArray = commandArray.concat(
        fs.readFileSync(item, 'utf8').split('\n')
            .map((item)=>{
                return item.replace(/static/, "static" + fileName);
            }));
    });

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
let write = new CodeWriter('FunctionCalls/FibonacciElement/FibonacciElement.asms')
    .translator(new Parser(['FunctionCalls/FibonacciElement/Main.vm',
        'FunctionCalls/FibonacciElement/Sys.vm'])).outputFile();
// fileDisplay("FunctionCalls/FibonacciElement/");