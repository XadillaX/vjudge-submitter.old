/**
 * Created with JetBrains WebStorm.
 * User: xadillax
 * Date: 7/14/13
 * Time: 9:43 PM
 * Main tester.
 */
var vj = require("nbut-vj-core");
vj.setDefaultLogLevel("TRACE");

/**
 * NBUT OJ TESTER
 * @type {nbut}
 */
var nbut = vj.getSubmitter("nbut");
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

/**
 * NYIST OJ TESTER
 * @type {*}
 */
var nyist = vj.getSubmitter("nyist");
nyist.login("username", "password", function(status, msg, baseheader) {
    if(!status) return;

    var code = "#include<iostream>\nusing namespace std;\nint main()\n{\nint a,b;\ncin>>a>>b;\ncout<<a+b<<endl;\n}";
    this.submit(1, "C++", code, baseheader, function(status, msg, baseheader) {
        this.result("XadillaX", baseheader, function(status, msg, result) {
            console.log(result);
        });
    })
});

if(nbut === vj.INVALID_SUBMITTER) {
    console.log("abc");
}
