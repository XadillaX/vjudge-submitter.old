/**
 * Created with JetBrains WebStorm.
 * User: xadillax
 * Date: 7/14/13
 * Time: 9:43 PM
 * Main tester.
 */
var vj = require("nbut-vj-core");
vj.setDefaultLogLevel("INFO");

var username = "username";
var password = "password";

var aizu = vj.getSubmitter("aizu");
aizu.login(username, password, function(status, msg, baseheader) {
    if(!status) return;
    //baseheader = this.getBaseHeader({}, { "cookie" : baseheader["cookie"] });

    var code = "#include<stdio.h>\n\
                int main(){\nwhile(1);\
                printf(\"Hello World\\n\");\n\
                return 0;\n\
            }"
    var code2 = "echo 'Hello World\\n';";
    var code3 = "while(true);console.log('Hello World');";

    this.submit("10000", "JavaScript", code3, baseheader, function(status, msg, baseheader) {
        if(!status) return;

        this.result(username, baseheader, function(status, msg, result) {
            //console.log(result);
            this.logger.info("------ The result is " + result["finalresult"]);
        });
    });
});

var lsu = vj.getSubmitter("lsu");
lsu.login(username, password, function(status, msg, baseheader) {
    if(!status) return;

    var code = '#include "stdio.h"\n\
        int main()\n\
        {\n\
            int a,b;\n\
            scanf("%d %d",&a, &b);\n\
            printf("%d\\n",a+b);\n\
            return 0;\n\
        } ';

    this.submit(1000, "C", code, baseheader, function(status, msg, baseheader) {
        if(!status) return;

        this.result(username, baseheader, function(status, msg, result) {
            //console.log(result);
            this.logger.info("------ The result is " + result["finalresult"]);
        });
    });
});

var sysu = vj.getSubmitter("sysu");
sysu.login(username, password, function(status, msg, baseheader) {
    if(!status) return;

    var code = "#include<iostream>\n\
        using namespace std;\n\
        int main()\n\
        {\n\
            int a,b;\n\
            cin>>a>>b;\n\
            cout<<a-b<<endl;\n\
        }";

    this.submit(1000, "C++", code, baseheader, function(status, msg, baseheader) {
        this.result(username, baseheader, function(status, msg, result) {
            //console.log(result);
            this.logger.info("------ The result is " + result["finalresult"]);
        });
    });
});

/**
 * NBUT OJ TESTER
 * @type {nbut}
 */
var nbut = vj.getSubmitter("nbut");
nbut.login(username, password, function(status, msg, baseheader) {
    if(!status) return;

    var fs = require("fs");
    fs.readFile("test.cpp", function(err, data){
        var decoder = require("string_decoder").StringDecoder;
        var d = new decoder("utf8");
        var code = d.write(data);

        nbut.submit(1457, "C++", code, baseheader, function(status, msg, baseheader) {
            if(!status) return;

            this.result(username, baseheader, function(status, msg, result) {
                if(!status) return;
                this.logger.info("------ The result is " + result["finalresult"]);
                //console.log(result);
            });
        });
    });
});

/**
 * NYIST OJ TESTER
 * @type {*}
 */
var nyist = vj.getSubmitter("nyist");
nyist.login(username, password, function(status, msg, baseheader) {
    if(!status) return;

    var code = "#include<iostream>\nusing namespace std;\nint main()\n{\nint a,b;\ncin>>a>>b;\ncout<<a+b<<endl;\n}";
    this.submit(1, "C++", code, baseheader, function(status, msg, baseheader) {
        this.result(username, baseheader, function(status, msg, result) {
            //console.log(result);
            this.logger.info("------ The result is " + result["finalresult"]);
        });
    })
});

var foo = vj.getSubmitter("foo");
foo.login("foo", "bar", function(s, m, b) {  });

if(foo === vj.INVALID_SUBMITTER) {
    vj.logger.warn("foo is an INVALID SUBMITTER.");
}
