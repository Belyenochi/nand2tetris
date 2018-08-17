/*
    statement:     ifStatement
                   whileStatement
                   letStatement

    statement:     statement*

  ifStatement:  'if''('expression')'
                   '{' statement '}'
 letStatement:  'let' varName '=' expression ';'

   expression:    term (op term)?

         term:    varName | constant

      varName:  a string not beginning with digit

     constant:  a decimal number

           op: '+'|'-'|'='|'>'|'<'
 */
let fs = require('fs');
let os = require('os');

class JackTokenizer {
    constructor(fileStream) {
        this.tokens = [];
        this.input = fileStream;
        // this.currToken = '';
    }

    hasMoreTokens() {
        return this.input.length > 0;
    }

    advance() {
        let match;

        this.input = this.input.trim();
        if (match = /^(class|constructor|function|method|field|static|var|int|char|boolean|void|true|false|null|this|let|do|if|else|while|return)/.exec(this.input)) {
            this.tokens.push({type :'keyword',value: match[0]});
        } else if (match = /^(\{|\}|\(|\)|\[|\]|\.|\,|;|\+|\-|\*|\/|&|\||<|>|=|~)/.exec(this.input)) {
            this.tokens.push({type :'symbol',value: match[0]});
        } else if (match = /^(327[0-6][0-7])|^(3[012][0-6][0-9][0-9])|^([1-2]?[0-9]?[0-9]?[0-9]?[0-9])/.exec(this.input)) {
            this.tokens.push({type :'integerConstant',value: match[0]});
        } else if (match = /^"[^"]*"/.exec(this.input)) {
            this.tokens.push({type :'stringConstant',value: match[0].replace(/"/, "").replace(/"/, "")});
        } else if (match = /^\w+/.exec(this.input)) {
            this.tokens.push({type :'identifier',value: match[0]});
        } else {
            throw SyntaxError("Invalid Syntax: " + this.input);
        }

        this.input = this.input.slice(match[0].length);
    }

    tokenType() {

    }

    keyword() {

    }

    symbol() {

    }

    identifier() {

    }

    intVal() {

    }

    StringVal() {

    }
}

class CompilationEngine {
    constructor(tokens, outputFile, Symbol_Table) {
        this.tokens = tokens;
        this.currentToken = '';
        this.fWrite = fs.createWriteStream(outputFile);
        this.Symbol_Table = Symbol_Table;
        this.vmWriter = new VMWriter();
    }

    run() {
        this.currentToken = this.tokens.shift();
        this.compileClass()
    }

    compileClass() {
        this.fWrite.write(`<class>` + os.EOL);
        this.eatTerminal('class', 'value');

        this.Symbol_Table.define(this.currentToken.value, 'class', '');
        this.Symbol_Table.define('class', this.currentToken.value, ''); // define class name use to subroutine named

        this.eatTerminal('identifier', 'type');
        this.eatTerminal('{', 'value');

        while (this.currentToken.value === 'static' || this.currentToken.value === 'field') {
            this.compileClassVarDec();
        }

        while (this.currentToken.value === 'constructor' || this.currentToken.value === 'function'
        || this.currentToken.value === 'method') {
            this.compileSubroutine();
        }
        this.eatTerminal('}', 'value');
        this.fWrite.write(`</class>` + os.EOL);

    }

    compileClassVarDec() {
        let kind, type;

        this.fWrite.write(`<classVarDec>` + os.EOL);
        kind = this.currentToken.value;

        this.eatTerminal('keyword', 'type');
        type = this.currentToken.value;
        this.compileType();
        // deal with varName
        this.Symbol_Table.define(this.currentToken.value, kind, type);

        this.eatTerminal('identifier', 'type');
        while (this.currentToken.value === ',') {
            this.eatTerminal(',', 'value');
            this.Symbol_Table.define(this.currentToken.value, kind, type);
            this.eatTerminal('identifier', 'type');
        }
        this.eatTerminal(';', 'value');

        this.fWrite.write(`</classVarDec>` + os.EOL);

        if (kind === 'static') {
            for (let i = 0; i < this.Symbol_Table.indexOf(); i++) {
                this.vmWriter.writePush('STATIC', i);
            }
        }
    }

    compileType() {
        switch (this.currentToken.value) {
            case 'int'    : this.eatTerminal('keyword', 'type');break;
            case 'char'   : this.eatTerminal('keyword', 'type');break;
            case 'boolean': this.eatTerminal('keyword', 'type');break;
            default       : this.eatTerminal('identifier', 'type');break;
        }
    }

    compileSubroutine() {
        this.fWrite.write(`<subroutineDec>` + os.EOL);
        let type, env = this.Symbol_Table.startSubroutine(),kind;

        kind = this.currentToken.value; // use to switch method constructor function

        if (kind === 'method') {
            env.define('this', 'argument', this.Symbol_Table.kindOf('class'));
        }

        this.eatTerminal(this.currentToken.type, 'type');

        type = this.currentToken.value;
        // deal with void or type
        if (this.currentToken.value === 'void') {
            this.eatTerminal('keyword', 'type')
        } else {
            this.compileType();
        }

        let subroutineName = this.currentToken.value;
        // deal with subroutineName
        this.Symbol_Table.define(this.currentToken.value, 'subroutine', type);

        this.eatTerminal('identifier', 'type');
        this.eatTerminal('(', 'value');
        this.compileParameterList(env);

        this.eatTerminal(')', 'value');
        this.compileSubroutineBody(env);
        this.fWrite.write(`</subroutineDec>` + os.EOL);

        if (kind === 'constructor') {
            this.vmWriter.writePush('CONSTANT', env.indexOf('argument'));
            this.vmWriter.writeCall('Memory.alloc', 1);
            this.vmWriter.writePop('POINTER', 0);
        }

        this.vmWriter.writeFunction(this.Symbol_Table.kindOf('class') + subroutineName, env.indexOf('var'));
        if (type === 'void') {
            this.vmWriter.writePush('CONSTANT', 0);
        }

    }

    compileParameterList(env) {
        let type;

        this.fWrite.write(`<parameterList>` + os.EOL);
        if (this.currentToken.value === 'int' || this.currentToken.value === 'char'
            || this.currentToken.value === 'boolean' || this.currentToken.type === 'identifier') {
            let type = this.currentToken.value;

            this.compileType();
            // deal with varName
            env.define(this.currentToken.value, 'argument', type);

            this.eatTerminal('identifier', 'type');

            while (this.currentToken.value === ',') {
                this.eatTerminal(',', 'value');
                type = this.currentToken.value;
                this.compileType();
                // deal with varName
                env.define(this.currentToken.value, 'argument', type);
                this.eatTerminal('identifier', 'type');
            }
        }
        this.fWrite.write(`</parameterList>` + os.EOL);
    }

    compileSubroutineBody(env) {
        this.fWrite.write(`<subroutineBody>` + os.EOL);
        this.eatTerminal('{', 'value');
        while (this.currentToken.value === 'var') {
            this.compileVarDec(env);
        }
        this.compileStatements();
        this.eatTerminal('}', 'value');
        this.fWrite.write(`</subroutineBody>` + os.EOL);
    }

    compileVarDec(env) {
        let type;

        this.fWrite.write(`<varDec>` + os.EOL);
        this.eatTerminal('var', 'value');
        type = this.currentToken.value;
        this.compileType();
        env.define(this.currentToken.value, 'var', type);

        this.eatTerminal('identifier', 'type');
        while (this.currentToken.value !== ';') {
            this.eatTerminal(',', 'value');
            env.define(this.currentToken.value, 'var', type);
            this.eatTerminal('identifier', 'type');
        }
        this.eatTerminal(';', 'value');
        this.fWrite.write(`</varDec>` + os.EOL);

        for (let i = 0; i < env.indexOf('var'); i ++) {
            this.vmWriter.writePush('LOCAL', i);
        }
    }

    compileStatements() {
        this.fWrite.write(`<statements>` + os.EOL);
        while (this.currentToken.value === 'let' || this.currentToken.value === 'if'
        || this.currentToken.value === 'while' || this.currentToken.value === 'do'
        || this.currentToken.value === 'return') {
            switch (this.currentToken.value) {
                case 'let'    : this.compileLet();break;
                case 'if'     : this.compileIf();break;
                case 'while'  : this.compileWhile();break;
                case 'do'     : this.compileDo();break;
                default       : this.compileReturn();break;
            }
        }
        this.fWrite.write(`</statements>` + os.EOL);
    }

    compileDo() {
        this.fWrite.write(`<doStatement>` + os.EOL);
        this.eatTerminal('do', 'value');
        this.compileSubroutineCall();
        this.eatTerminal(';', 'value');
        this.fWrite.write(`</doStatement>` + os.EOL);
    }

    compileLet() {
        let variableName;

        this.fWrite.write(`<letStatement>` + os.EOL);
        this.eatTerminal('let', 'value');
        variableName = this.currentToken.value;
        this.eatTerminal('identifier', 'type');
        if (this.currentToken.value === '[') {
            this.eatTerminal('[', 'value');
            this.compileExpression();
            this.eatTerminal(']', 'value');
        }
        this.eatTerminal('=', 'value');
        this.compileExpression();
        this.eatTerminal(';', 'value');

        let kind = this.Symbol_Table.kindOf(variableName);
        let index = this.Symbol_Table.indexOf(variableName);
        this.mapToMemory(kind, index, 'pop');

        this.fWrite.write(`</letStatement>` + os.EOL);
    }

    compileWhile() {
        this.fWrite.write(`<whileStatement>` + os.EOL);
        this.vmWriter.writeLabel(this.Symbol_Table.kindOf('class') + this.Symbol_Table.labelId++);

        this.eatTerminal('while', 'value');
        this.eatTerminal('(', 'value');
        this.compileExpression();
        this.eatTerminal(')', 'value');
        this.vmWriter.writeIf(this.Symbol_Table.kindOf('class') + (this.Symbol_Table.labelId + 1));

        this.eatTerminal('{', 'value');
        this.compileStatements();
        this.eatTerminal('}', 'value');
        this.vmWriter.writeIf(this.Symbol_Table.kindOf('class') + (this.Symbol_Table.labelId - 1));
        this.vmWriter.writeLabel(this.Symbol_Table.kindOf('class') + this.Symbol_Table.labelId);
        this.fWrite.write(`</whileStatement>` + os.EOL);
    }

    compileReturn() {
        this.fWrite.write(`<returnStatement>` + os.EOL);
        this.eatTerminal('return', 'value');
        if (this.currentToken.value !== ';') {
            this.compileExpression();
        }
        this.eatTerminal(';', 'value');
        this.fWrite.write(`</returnStatement>` + os.EOL);
    }

    compileIf() {
        this.fWrite.write(`<ifStatement>` + os.EOL);
        this.eatTerminal('if', 'value');
        this.eatTerminal('(', 'value');
        this.compileExpression();
        this.eatTerminal(')', 'value');
        this.vmWriter.writeIf(this.Symbol_Table.kindOf('class') + this.Symbol_Table.labelId++);

        this.eatTerminal('{', 'value');
        this.compileStatements();
        this.eatTerminal('}', 'value');
        this.vmWriter.writeGoto(this.Symbol_Table.kindOf('class') + this.Symbol_Table.labelId++);
        this.vmWriter.writeLabel(this.Symbol_Table.kindOf('class') + this.Symbol_Table.labelId - 2);
        if (this.currentToken.value === 'else') {
            this.eatTerminal('else', 'value');
            this.eatTerminal('{', 'value');
            this.compileStatements();
            this.eatTerminal('}', 'value');
        }
        this.vmWriter.writeLabel(this.Symbol_Table.kindOf('class') + this.Symbol_Table.labelId - 1);
        this.fWrite.write(`</ifStatement>` + os.EOL);
    }

    compileSubroutineCall() {
        let second = this.tokens.shift();
        this.tokens.unshift(second);
        if (second.value === '.') {
            this.eatTerminal('identifier', 'type'); // deal with className and varName
            this.eatTerminal('.', 'value');
            this.eatTerminal('identifier', 'type');
            this.eatTerminal('(', 'value');
            this.compileExpressionList();
            this.eatTerminal(')', 'value');
        } else {
            this.eatTerminal('identifier', 'type'); // deal with subroutineName
            this.eatTerminal('(', 'value');
            this.compileExpressionList();
            this.eatTerminal(')', 'value');
        }
    }

    compileExpression() {
        this.fWrite.write(`<expression>` + os.EOL);
        this.compileTerm();

        while (/\+|\-|\*|\/|\&|\||\>|\<|\=/.exec(this.currentToken.value)) {
            switch (this.currentToken.value) {
                case '+'     : this.eatTerminal('+', 'value');this.vmWriter.writeArithmetic("ADD");break;
                case '-'     : this.eatTerminal('-', 'value');this.vmWriter.writeArithmetic("SUB");break;
                case '*'     : this.eatTerminal('*', 'value');this.vmWriter.writeFunction("Math.multiply", 2);break;
                case '/'     : this.eatTerminal('/', 'value');this.vmWriter.writeFunction("Math.divide", 2);break;
                case '&'     : this.eatTerminal('&', 'value');this.vmWriter.writeArithmetic("AND");break;
                case '>'     : this.eatTerminal('>', 'value');this.vmWriter.writeArithmetic("GT");break;
                case '<'     : this.eatTerminal('<', 'value');this.vmWriter.writeArithmetic("LT");break;
                case '|'     : this.eatTerminal('|', 'value');this.vmWriter.writeArithmetic("OR");break;
                default      : this.eatTerminal('=', 'value');this.vmWriter.writeArithmetic("EQ");break;
            }
            this.compileTerm();
        }
        this.fWrite.write(`</expression>` + os.EOL);
    }

    compileTerm() {
        this.fWrite.write(`<term>` + os.EOL);
        if (this.currentToken.type === 'stringConstant') {
            let length = this.currentToken.value.length;
            this.vmWriter.writePush('CONSTANT', length);
            this.vmWriter.writeCall('String.new', 1);
            this.currentToken.value.forEach((item)=>{
                this.vmWriter.writePush('CONSTANT', item.charCodeAt(0));
                this.vmWriter.writeCall('String.appendChar', 2)
            });

            this.eatTerminal('stringConstant', 'type')
        } else if (this.currentToken.type === 'integerConstant') {
            this.vmWriter.writePush('CONSTANT', this.currentToken.value);

            this.eatTerminal('integerConstant', 'type')
        } else if (this.currentToken.type === 'keyword') {

            this.mapToMemory(this.Symbol_Table.kindOf(this.currentToken.value),
                this.Symbol_Table.indexOf(this.currentToken.value), 'push');


            this.eatTerminal('keyword', 'type')
        } else if (this.currentToken.value === '(') {
            this.eatTerminal('(', 'value');
            this.compileExpression();
            this.eatTerminal(')', 'value');
        } else if (this.currentToken.value === '-' || this.currentToken.value === "~") {
            if (this.currentToken.value === '-') {
                this.vmWriter.writeArithmetic('NEG')
            } else {
                this.vmWriter.writeArithmetic('NOT')
            }

            this.eatTerminal('symbol', 'type');
            this.compileTerm();
        } else {
            let second = this.tokens.shift();

            this.tokens.unshift(second);
            if (second.value === '(' || second.value === '.') {
                this.compileSubroutineCall();
            } else if (second.value === '[') {
                this.mapToMemory(this.Symbol_Table.kindOf(this.currentToken.value),
                    this.Symbol_Table.indexOf(this.currentToken.value), 'push');

                this.eatTerminal('identifier', 'type');
                this.eatTerminal('[', 'value');
                this.compileExpression();
                this.eatTerminal(']', 'value');

                this.vmWriter.writeArithmetic('ADD');
            } else {
                this.mapToMemory(this.Symbol_Table.kindOf(this.currentToken.value),
                    this.Symbol_Table.indexOf(this.currentToken.value), 'push');

                this.eatTerminal('identifier', 'type');
            }
        }
        this.fWrite.write(`</term>` + os.EOL);
    }

    compileExpressionList() {
        this.fWrite.write(`<expressionList>` + os.EOL);
        if (this.currentToken.type === 'identifier' || this.currentToken.type === 'stringConstant'
            || this.currentToken.type === 'integerConstant' || this.currentToken.type === 'keyword'
            || this.currentToken.value === '(' || this.currentToken.value === '~'
            || this.currentToken.value === '-') {
            this.compileExpression();
            while (this.currentToken.value === ',') {
                this.eatTerminal(',', 'value');
                this.compileExpression();
            }
        }
        this.fWrite.write(`</expressionList>` + os.EOL);
    }

    eatTerminal(input, prop) {
        if (input === this.currentToken[prop]) {
            if (global_decode[input]) {
                this.currentToken.value = global_decode[input];
            }
            let data = `<${this.currentToken.type}> ${this.currentToken.value} </${this.currentToken.type}>`;
            this.fWrite.write(data + os.EOL);
            this.currentToken = this.tokens.shift()
        } else {
            throw Error("Unexpected token: " + input)
        }
    }

    mapToMemory(kind, index, operator) {
        if (operator === 'push') {
            switch (kind) {
                case 'var':
                    this.vmWriter.writePush('LOCAL', index);
                    break;
                case 'field':
                    this.vmWriter.writePush('THIS', index);
                    break;
                case 'argument':
                    this.vmWriter.writePush('ARG', index);
                    break;
                case 'static':
                    this.vmWriter.writePush('STATIC', index);
                    break;
            }
        } else {
            switch (kind) {
                case 'var':
                    this.vmWriter.writePop('LOCAL', index);
                    break;
                case 'field':
                    this.vmWriter.writePop('THIS', index);
                    break;
                case 'argument':
                    this.vmWriter.writePop('ARG', index);
                    break;
                case 'static':
                    this.vmWriter.writePop('STATIC', index);
                    break;
        }
    }
}

class JackAnalyzer {
    constructor(inputFile, outputFile) {
        this.input = this.clearData(this.readFileStream(inputFile));
        this.output = outputFile;
    }

    readFileStream(filePath) {
        let contentArray = [];

        contentArray = fs.readFileSync(filePath, 'utf8').split('\n');

        return contentArray;
    }

    clearData(contentArray) {
        return contentArray.map((item) => {
            return item.replace(/\/\/.*|\/\*\*.*/, "")
        }).filter((item) => {
            if (/^\s*\*/.exec(item)) {
                return false
            }
            return true
        }).join("");
    }

    outputFile(Symbol_Table) {
        let jackTokenizer = new JackTokenizer(this.input), compEngine;

        while (jackTokenizer.hasMoreTokens()) {
            jackTokenizer.advance();
        }
        compEngine = new CompilationEngine(jackTokenizer.tokens, this.output, Symbol_Table);
        compEngine.run();
        console.log('global',Symbol_Table);
    }

}

class SymbolTable {
    constructor() {
        this.static   = 0;
        this.field    = 0;
        this.argument = 0;
        this.var      = 0;
        this.labelId  = 0;
    }

    startSubroutine() {
        let env = new SymbolTable();

        return env;
    }

    define(name, kind, type ) {
        if (this[kind] !== undefined) {
            this[name] = {kind: kind, type: type, index: this.varCount(kind)}
            this[kind] += 1;
        } else {
            this[name] = {kind: kind, type: type, index: 0}
        }

    }

    varCount(kind) {
        return this[kind];
    }

    kindOf(name) {
        if (!this[name].kind) {
            throw new Error("undefined SymbolTable kind: " + kind)
        }

        return this[name].kind;
    }

    typeOf() {
        if (!this[name].type) {
            throw new Error("undefined SymbolTable type: " + type)
        }

        return this[name].type;
    }

    indexOf() {
        if (!this[name].index) {
            throw new Error("undefined SymbolTable index: " + index)
        }

        return this[name].index;
    }
}

class VMWriter {
    constructor(outputFile) {
        this.fWrite = fs.createWriteStream(outputFile);
    }

    writePush(segment, index) {
        let template = '';

        switch (segment) {
            case 'CONSTANT': template += `push constant ${index}`;break;
            case 'LOCAL'   : template += `push local ${index}`;break;
            case 'ARG'     : template += `push argument ${index}`;break;
            case 'STATIC'  : template += `push static ${index}`;break;
            case 'THIS'    : template += `push this ${index}`;break;
            case 'THAT'    : template += `push that ${index}`;break;
            case 'POINTER' : template += `push pointer ${index}`;break;
            case 'TEMP'    : template += `push temp ${index}`;break;
        }

        this.fWrite.write(template + os.EOL);
    }

    writePop(segment, index) {
        let template = '';

        switch (segment) {
            case 'LOCAL'   : template += `pop local ${index}`;break;
            case 'ARG'     : template += `pop argument ${index}`;break;
            case 'STATIC'  : template += `pop static ${index}`;break;
            case 'THIS'    : template += `pop this ${index}`;break;
            case 'THAT'    : template += `pop that ${index}`;break;
            case 'POINTER' : template += `pop pointer ${index}`;break;
            case 'TEMP'    : template += `pop temp ${index}`;break;
        }

        this.fWrite.write(template + os.EOL);
    }

    writeArithmetic(command) {
        let template = '';

        switch (command) {
            case 'ADD': template += 'add';break;
            case 'SUB': template += 'sub';break;
            case 'NEG': template += 'neg';break;
            case 'EQ' : template += 'eq';break;
            case 'GT' : template += 'gt';break;
            case 'LT' : template += 'lt';break;
            case 'AND': template += 'and';break;
            case 'OR' : template += 'or';break;
            case 'NOT': template += 'not';break;

        }

        this.fWrite.write(template + os.EOL);
    }

    writeLabel(label) {
        let template = `label ${label}`;

        this.fWrite.write(template + os.EOL);
    }

    writeGoto(label) {
        let template = `goto ${label}`;

        this.fWrite.write(template + os.EOL);
    }

    writeIf(label) {
        let template = `if-goto ${label}`;

        this.fWrite.write(template + os.EOL);
    }

    writeCall(name, nArgs) {
        let template = `call ${name} ${nArgs}`;

        this.fWrite.write(template + os.EOL);
    }

    writeFunction(name, nArgs) {
        let template = `function ${name} ${nArgs}`;

        this.fWrite.write(template + os.EOL);
    }

    writeReturn() {
        let template = `return`;

        this.fWrite.write(template + os.EOL);
    }
}


global_decode = {
    "<" : "&lt;" ,
    ">" : "&gt;",
    "&" : "&amp;",
    " " : "&nbsp;",
    "\"": "&quot;",
    "©" : "&copy;"
    // Add more
};

new JackAnalyzer('Square/SquareGame.jack', 'Square/SquareGame.xml2').outputFile(new SymbolTable());