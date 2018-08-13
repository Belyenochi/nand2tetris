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
        this.currToken = '';
        this.decode = {
            "<" : "&lt;" ,
            ">" : "&gt;",
            "&" : "&amp;",
            " " : "&nbsp;",
            "\"": "&quot;",
            "©" : "&copy;"
            // Add more
        };
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

        this.input = this.input.slice(match[0].length)
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
    constructor(tokenizer, outputFile) {
        this.tokenizer = tokenizer;
        this.currentToken = '';
        this.fWrite = fs.createWriteStream(this.outputFile);
    }

    init() {
        this.currentToken = this.tokenizer.advance();
        this.compileClass()
    }

    compileClass() {
        this.eat('class', 'value');
        this.eat('identifier', 'type');
        this.eat('{', 'value');

        while (this.currentToken.value === 'static' || this.currentToken.value === 'field') {
            this.compileClassVarDec();
        }

        while (this.currentToken.value === 'constructor' || this.currentToken.value === 'function'
            || this.currentToken.value === 'method') {
            this.compileSubroutine();
        }
        this.eat('}', 'value');


    }

    compileClassVarDec() {
        this.eat(this.currentToken.type, 'function');
        this.compileType();
        // deal with var name
        this.eat('identifier', 'type');
    }

    compileType() {
        switch (this.currentToken.value) {
            case 'int'    : this.eat('keyword', 'type');break;
            case 'char'   : this.eat('keyword', 'type');break;
            case 'boolean': this.eat('keyword', 'type');break;
            default       : this.eat('identifier', 'type');break;
        }
    }

    compileSubroutine() {
        this.eat(this.currentToken.type, 'function');

        // deal with void or type
        if (this.currentToken === 'void') {
            this.eat('keyword', 'type')
        } else {
            this.compileType();
        }

        // deal with subroutineName
        this.eat('identifier', 'type');
        this.eat('(', 'value');
        if (this.currentToken.value !== ')') {
            this.compileParameterList();
        }
        this.eat(')', 'value');
        this.compileSubroutineBody()
    }

    compileParameterList() {
        while (this.currentToken !== ')') {
            this.compileType();
            // deal with varName
            this.eat('identifier', 'type');
        }
    }

    compileSubroutineBody() {
        this.eat('{', 'value');
        while (this.currentToken === 'var') {
            this.compileVarDec();
        }
        this.compileStatements();
        this.eat('}', 'value')
    }

    compileVarDec() {
        this.eat('var', 'value');
        this.compileType();
        this.eat('identifier', 'type');
        while (this.currentToken.value !== ';') {
            this.eat(',', 'value');
            this.eat('identifier', 'type');
        }
        this.eat(';', 'value');
    }

    compileStatements() {
        while (this.currentToken.value === 'let' || this.currentToken.value === 'if'
            || this.currentToken.value === 'while' || this.currentToken.value === 'do'
            || this.currentToken.value === 'return') {
            switch (this.currentToken.value) {
                case 'let'    : this.compileLet();break;
                case 'if'     : this.compileIf();break;
                case 'while'  : this.compileWhile();break;
                case 'do     ': this.compileDo();break;
                default       : this.compileReturn();break;
            }
        }
    }

    compileDo() {
        this.eat('do', 'value');
        this.compileSubroutineCall();
        this.eat(';', 'value');
    }

    compileLet() {

    }

    compileWhile() {

    }

    compileReturn() {

    }

    compileIf() {

    }
    compileSubroutineCall() {

    }

    compileExpression() {

    }

    compileTerm() {

    }

    compileExpressionList() {

    }
    eat(input, prop) {
        if (input === this.currentToken[prop]) {
            let data = `<${this.currentToken.type}> ${this.currentToken.value} </${this.currentToken.type}>`
            this.fWrite.write(data + os.EOL);
            this.currentToken = this.tokenizer.advance()
        } else {
            throw Error("Unexpected token: " + input)
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

    outputFile() {
        let jackToken = new JackTokenizer(this.input);
        let fWrite = fs.createWriteStream(this.output);

        while (jackToken.hasMoreTokens()) {
            jackToken.advance();
        }

        fWrite.write("<tokens>" + os.EOL);
        jackToken.tokens.forEach((data)=> {
            if(jackToken.decode[data.value] && jackToken.decode.hasOwnProperty(data.value)) {
                data = `<${data.type}> ${jackToken.decode[data.value]} </${data.type}>`
            } else {
                data = `<${data.type}> ${data.value} </${data.type}>`
            }

            fWrite.write(data + os.EOL);
        });
        fWrite.write("</tokens>" + os.EOL);
    }

}

new JackAnalyzer('Square/Square.jack', 'Square/Square.xml2').outputFile();