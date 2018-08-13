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
    constructor(tokenizer, outputFile) {
        this.tokenizer = tokenizer;
        this.currentToken = '';
        this.fWrite = fs.createWriteStream(outputFile);
    }

    run() {
        this.currentToken = this.tokenizer.advance();
        this.compileClass()
    }

    compileClass() {
        this.fWrite.write(`<class>` + os.EOL);
        this.eatNonTerminal('class', 'keyword');
        global_table.className = this.currentToken.value;


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
        this.fWrite.write(`<classVarDec>` + os.EOL);
        this.eatTerminal('keyword', 'type');
        this.compileType();
        // deal with varName
        this.eatTerminal('identifier', 'type');
        while (this.currentToken.value === ',') {
            this.eatTerminal(',', 'symbol');
            this.eatTerminal('identifier', 'type');
        }
        this.eatTerminal(';', 'symbol');

        this.fWrite.write(`</classVarDec>` + os.EOL);
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
        this.eatTerminal(this.currentToken.type, 'keyword');

        // deal with void or type
        if (this.currentToken === 'void') {
            this.eatTerminal('keyword', 'type')
        } else {
            this.compileType();
        }

        // deal with subroutineName
        this.eatTerminal('identifier', 'type');
        this.eatTerminal('(', 'value');
        if (this.currentToken.value !== ')') {
            this.compileParameterList();
        }
        this.eatTerminal(')', 'value');
        this.compileSubroutineBody();
        this.fWrite.write(`<subroutineDec>` + os.EOL);
    }

    compileParameterList() {
        this.fWrite.write(`<parameterList>` + os.EOL);
        while (this.currentToken !== ')') {
            this.compileType();
            // deal with varName
            this.eatTerminal('identifier', 'type');
        }
        this.fWrite.write(`<parameterList>` + os.EOL);
    }

    compileSubroutineBody() {
        this.fWrite.write(`<subroutineBody>` + os.EOL);
        this.eatTerminal('{', 'value');
        while (this.currentToken === 'var') {
            this.compileVarDec();
        }
        this.compileStatements();
        this.eatTerminal('}', 'value');
        this.fWrite.write(`</subroutineBody>` + os.EOL);
    }

    compileVarDec() {
        this.fWrite.write(`<varDec>` + os.EOL);
        this.eatTerminal('var', 'value');
        this.compileType();
        this.eatTerminal('identifier', 'type');
        while (this.currentToken.value !== ';') {
            this.eatTerminal(',', 'value');
            this.eatTerminal('identifier', 'type');
        }
        this.eatTerminal(';', 'value');
        this.fWrite.write(`</varDec>` + os.EOL);
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
        this.fWrite.write(`<letStatement>` + os.EOL);
        this.eatTerminal('let', 'value');
        this.eatTerminal('identifier', 'type');
        if (this.currentToken === '[') {
            this.eatTerminal('[', 'value');
            this.compileExpression();
            this.eatTerminal(']', 'value');
        }
        this.eatTerminal('=', 'value');
        this.compileExpression();
        this.eatTerminal(';', 'value');
        this.fWrite.write(`</letStatement>` + os.EOL);
    }

    compileWhile() {
        this.fWrite.write(`<whileStatement>` + os.EOL);
        this.eatTerminal('while', 'value');
        this.eatTerminal('(', 'value');
        this.compileExpression();
        this.eatTerminal(')', 'value');
        this.eatTerminal('{', 'value');
        this.compileStatements();
        this.eatTerminal('}', 'value');
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
        this.eatTerminal('{', 'value');
        this.compileStatements();
        this.eatTerminal('}', 'value');
        if (this.currentToken === 'else') {
            this.eatTerminal('else', 'value');
            this.eatTerminal('{', 'value');
            this.compileStatements();
            this.eatTerminal('}', 'value');
        }
        this.fWrite.write(`</ifStatement>` + os.EOL);
    }
    compileSubroutineCall() {
        let second = this.tokenizer.advance();
        if (second.value === '.') {
            this.tokenizer.input = second + ' ' + this.tokenizer.input;

            if (this.currentToken === global_table.className) {
                this.eatTerminal('identifier', 'type'); // deal with className
            } else {
                this.eatTerminal('identifier', 'type'); // deal with varName
            }
            this.eatTerminal('.', 'value');
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
        while (/\+|\-|\*|\/|\&|\||\>|\<|\=/.exec(this.currentToken)) {
            switch (this.currentToken.value) {
                case '+'     : this.eat('+', 'value');break;
                case '-'     : this.eat('-', 'value');break;
                case '*'     : this.eat('*', 'value');break;
                case '/'     : this.eat('/', 'value');break;
                case '&'     : this.eat('&', 'value');break;
                case '>'     : this.eat('>', 'value');break;
                case '<'     : this.eat('<', 'value');break;
                default      : this.eat('=', 'value');break;
            }
            this.compileTerm();
        }
        this.fWrite.write(`</expression>` + os.EOL);
    }

    compileTerm() {
        this.fWrite.write(`<term>` + os.EOL);
        if (this.currentToken.type === 'stringConstant') {
            this.eat('stringConstant', 'type')
        } else if (this.currentToken.type === 'integerConstant') {
            this.eat('integerConstant', 'type')
        } else if (this.currentToken.type === 'keyword') {
            this.eat('keyword', 'type')
        } else if (this.currentToken.value === '(') {
            this.eat('(', 'value');
            this.compileExpression();
            this.eat(')', 'value');
        } else if (this.currentToken.value === '_' || this.currentToken.value === "~") {
            this.eat('symbol', 'type');
            this.compileTerm();
        } else {
            let second = this.tokenizer.advance();

            this.tokenizer.input = second + ' ' + this.tokenizer.input;
            if (second.value === '(' || second.value === '.') {
                this.compileSubroutineCall();
            } else if (second.value === '[') {
                this.eat('identifier', 'type');
                this.eat('[', 'type');
                this.compileExpression();
                this.eat(']', 'type');
            } else {
                this.eat('identifier', 'type');
            }
        }
        this.fWrite.write(`</term>` + os.EOL);
    }

    compileExpressionList() {
        this.fWrite.write(`</expressionList>` + os.EOL);
        if (this.currentToken.type === 'identifier' || this.currentToken.type === 'stringConstant'
            || this.currentToken.type === 'integerConstant' || this.currentToken.type === 'keyword'
            || this.currentToken.value === ')' || this.currentToken.value === '~'
            || this.currentToken.value === '_') {
            this.compileExpression();
            while (this.currentToken.value === ',') {
                this.compileExpression();
            }
        }
        this.fWrite.write(`</expressionList>` + os.EOL);
    }

    eatTerminal(input, prop) {
        if (input === this.currentToken[prop]) {
            let data = `<${this.currentToken.type}> ${this.currentToken.value} </${this.currentToken.type}>`
            this.fWrite.write(data + os.EOL);
            this.currentToken = this.tokenizer.advance()
        } else {
            throw Error("Unexpected token: " + input)
        }
    }
    eatNonTerminal (value, type) {
        if (value === this.currentToken.value && type === this.currentToken.type) {
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

    // outputFile() {
    //     let jackToken = new JackTokenizer(this.input);
    //     let fWrite = fs.createWriteStream(this.output);
    //
    //     while (jackToken.hasMoreTokens()) {
    //         jackToken.advance();
    //     }
    //
    //     fWrite.write("<tokens>" + os.EOL);
    //     jackToken.tokens.forEach((data)=> {
    //         if(jackToken.decode[data.value] && jackToken.decode.hasOwnProperty(data.value)) {
    //             data = `<${data.type}> ${jackToken.decode[data.value]} </${data.type}>`
    //         } else {
    //             data = `<${data.type}> ${data.value} </${data.type}>`
    //         }
    //
    //         fWrite.write(data + os.EOL);
    //     });
    //     fWrite.write("</tokens>" + os.EOL);
    // }
    outputFile() {
        let compEngine = new CompilationEngine(new JackTokenizer(this.input), this.output);

        compEngine.run();
    }

}
let global_table = {
    'className' : ''
};

new JackAnalyzer('ArrayTest/Main.jack', 'ArrayTest/Main.xml2').outputFile();