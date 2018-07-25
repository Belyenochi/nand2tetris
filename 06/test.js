var fs = require('fs');

fs.readFile('add/Add.asm', 'utf8', function (err, data) {
    console.log(data,data.split('\n'));
});