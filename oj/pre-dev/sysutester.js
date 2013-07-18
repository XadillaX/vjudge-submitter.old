var vj = require("nbut-vj-core");
var spider = vj.spider;
var util = vj.util;
var logger = vj.getLogger("SYSU");

var account = {
    "username" : "username",
    "password" : "password"
};
var header = vj.getBaseHeader(account);
var code = "#include<iostream>\n\
    using namespace std;\n\
    int main()\n\
    {\n\
        int a,b;\n\
        cin>>a>>b;\n\
        cout<<a-b<<endl;\n\
    }";

function queryStatus(data, header) {
    spider.post("http://soj.me/action.php?act=QueryStatus", function(rdata, status, responseheader) {
        console.log(rdata);

        var res = JSON.parse(rdata);
        if(res["status"] === "Waiting" || res["status"] === "Judging") {
            queryStatus(data, header);
        } else if(res["status"] === "Compile Error") {
            var url = "http://soj.me/compileresult.php?cid=&sid=" + data["sid"];

            spider.post(url, function(data, status, responseheader) {
                var pos1 = data.indexOf("<pre>");
                var pos2 = data.indexOf("</pre>", pos1);

                var ceinfo = data.substring(pos1 + 5, pos2);
                console.log(ceinfo);
            }, header, data, "utf8").on("error", function(msg) {
            });
        }
    }, header, data, "utf8").on("error", function(msg) {
    });
}

spider.post("http://soj.me/action.php?act=Login", function(data, status, responseheader) {
    var res = JSON.parse(data);
    //console.log(res);

    /**
     * Verify the status
     */
    if(res["success"] === 0) {
        console.log(res["status"]);
        return;
    }

    //console.log(responseheader);

    /**
     * Set the cookies
     * @type {*}
     */
    var setcookie = responseheader["set-cookie"];
    var cookie = "";
    cookie += setcookie[0].substring(0, setcookie[0].length - 6);
    cookie += setcookie[1].substring(0, setcookie[1].length - 16);
    cookie += setcookie[2].substring(0, setcookie[2].length - 16);
    //console.log(cookie);

    var ext = { "cookie" : cookie };
    var postdata = {
        "pid" : 1000,
        "language" : 2,
        "source" : code,
        "cid" : 0
    };
    header = vj.getBaseHeader(postdata, ext);
    //console.log(header);

    spider.post("http://soj.me/action.php?act=Submit", function(data, status, responseheader) {
        console.log(data);

        var res = JSON.parse(data);
        if(res["success"] === 0) {
            console.log(res["status"]);
            return;
        }

        var sid = res["sid"];

        var chk = { "sid" : sid };
        header = vj.getBaseHeader(chk, ext);

        queryStatus(chk, header);
    }, header, postdata, "utf8").on("error", function(msg) {

    });
}, header, account, "utf8").on("error", function(msg) {
});
