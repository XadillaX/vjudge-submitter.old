/**
 * Created with JetBrains WebStorm.
 * User: xadillax
 * Date: 7/14/13
 * Time: 9:43 PM
 * Main tester.
 */
require("nbut-vj-core/base").setLogLevel("TRACE");

var nbut = require("nbut-vj-core/oj/nbut").create();

nbut.login("username", "password", function(status, msg, baseheader) {
    if(!status) return;

    var fs = require("fs");
    fs.readFile("test.cpp", function(err, data){
        var decoder = require("string_decoder").StringDecoder;
        var d = new decoder("utf8");
        var code = d.write(data);

        nbut.submit(1457, "C++", code, baseheader, function(status, msg, baseheader) {
            if(!status) return;

            this.result("XadillaX", baseheader, function(status, msg, result) {
                if(!status) return;
                console.log(result);
            });
        });
    });
});
