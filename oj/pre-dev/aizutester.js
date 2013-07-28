var vjcore = require("nbut-vj-core/base").core;
var base = new vjcore();
var spider = base.spider;
var util = require("nbut-vj-core/base").util;
base.logger = require("nbut-vj-core/base").logger("aizu");

var username = "username";
var password = "password";

var accountinfo = {
    "loginUserID"  : username,
    "loginPassword"  : password
};
var loginheader = base.getBaseHeader(accountinfo);

function queryResult(cookie) {
    //var username = "cjoedwio";
    var baseh = base.getBaseHeader({}, { "cookie" : cookie });
    spider.get("http://judge.u-aizu.ac.jp/onlinejudge/status.jsp", function(data, status, respheader) {
        var t = 0;
        var p = 0;
        while(data.indexOf('<tr class="dat">', p) !== -1) {
            t++;
            p = data.indexOf('<tr class="dat">', p) + 1;
        }
        base.logger.info("Total " + t + " records.");

        var result = {};

        var marktext = '<td class="text-left"><a href="user.jsp?id=' + username + '#1">' + username + '</a></td>';
        var pos1 = data.indexOf(marktext);

        //console.log(data.substr(pos1 - 70, 1000));

        var hreftext = "review.jsp?rid=";
        var pos2 = data.indexOf(hreftext, pos1 - 70);
        var pos3 = data.indexOf('&', pos2);
        result["runid"] = parseInt(data.substring(pos2 + hreftext.length, pos3));

        var pos4 = data.indexOf('<span class="status', pos3);
        pos4 = data.indexOf(": ", pos4);
        var pos5 = data.indexOf(">", pos4);
        var pos6 = data.indexOf("<", pos5);
        result["result"] = data.substring(pos5 + 1, pos6);

        var pos7 = data.indexOf('<td class="text-center">', pos6);
        pos7 = data.indexOf('<td class="text-center">', pos7 + 1);
        pos7 = data.indexOf('<td class="text-center">', pos7 + 1);
        var pos8 = data.indexOf('</td>', pos7);
        result["time"] = data.substring(pos7 + '<td class="text-center">'.length, pos8);
        if(result["time"] === '-') result["time"] = NaN;
        else result["time"] = parseInt(parseFloat(result["time"]) * 1000);

        var pos9 = data.indexOf('<td class="text-right" style="line-height:12pt; padding-bottom:4px">', pos8);
        var pos10 = data.indexOf('</td>', pos9);
        result["memo"] = data.substring(pos9 + '<td class="text-right" style="line-height:12pt; padding-bottom:4px">'.length, pos10);
        if(result["memo"] === '-') result["memo"] = NaN;
        else result["memo"] = parseInt(result["memo"]);

        if(result["result"] === "Waiting Judge" || result["result"] === "Running") {
            console.log(result);
            setTimeout(queryResult, 500, cookie);
            return;
        }

        if(result["result"] === "Compile Error") {
            var url = "http://judge.u-aizu.ac.jp/onlinejudge/review.jsp?rid=" + result["runid"];
            spider.get(url, function(data, status, respheader) {
                var pos1 = data.indexOf('Compile Error Logs:');
                pos1 = data.indexOf('<div class="annotation">\n\n', pos1);
                var pos2 = data.indexOf("\n\n</div>", pos1);

                var ceinfo = data.substring(pos1 + '<div class="annotation">\n\n'.length, pos2);
                ceinfo = util.htmlDecode(ceinfo);
                result["ceinfo"] = ceinfo;
                result["ceinfo"] = result["ceinfo"].replace(/\n\n/g, "\n");

                console.log(result);
            }, baseh, "utf8").on("error", function(e) {

            });
            return;
        }

        console.log(result);
    }, baseh, "utf8").on("error", function(e) {

    });
}

base.logger.info("Start log in...");
spider.post("http://judge.u-aizu.ac.jp/onlinejudge/", function(data, status, respheader) {
    if(data.indexOf('<a href="logout.jsp" class="signup" id="login"><span class="line">Logout</span></a>') === -1) {
        var pos1 = data.indexOf('<input type="submit" name="submit" id="logininput" value="Sign in" />');
        var pos2 = data.indexOf("<b>", pos1);
        var pos3 = data.indexOf("</b>", pos2);
        var info = data.substring(pos2 + 3, pos3);

        base.logger.error("log failed: " + info);
        return;
    }

    base.logger.info("Logged in.");

    //console.log(respheader);
    var carr = respheader["set-cookie"];
    var cookie = "";
    cookie += carr[0].substr(0, 44);
    cookie += " ";
    cookie += carr[1].substring(0, carr[1].indexOf(" "));
    cookie += " ";
    cookie += carr[2].substring(0, carr[2].indexOf(" "));
    cookie += " ";

    base.logger.info("Cookies will be [ " + cookie + " ].");

    var postdata = {
        "language"      : "C",
        "problemNO"     : "10000",
        "sourceCode"    : "#include<stdio.h>\n\
                int main(){\n\
                printf(\"Hello World\\n\");\n\
                return 0;\n\
            }"
    };

    var bheader = base.getBaseHeader({}, { "cookie" : cookie });
    spider.post("http://judge.u-aizu.ac.jp/onlinejudge/description.jsp?id=" + data["problemNO"], function(data, status, respheader) {
        var pos1 = data.indexOf('NAME="userID" VALUE="');
        var pos2 = data.indexOf('">', pos1);
        var un = data.substring(pos1 + 'NAME="userID" VALUE="'.length, pos2);

        var pos3 = data.indexOf('NAME="password" VALUE="', pos2);
        var pos4 = data.indexOf('">', pos3);
        var pw = data.substring(pos3 + 'NAME="password" VALUE="'.length, pos4);

        postdata["userID"] = un;
        postdata["password"] = pw;
        var postheader = base.getBaseHeader(postdata);

        spider.post("http://judge.u-aizu.ac.jp/onlinejudge/servlet/Submit", function(data, status, respheader) {
            if(data.indexOf("<font color=#ff000F><b>") !== -1) {
                //console.log(data);
                var pos1 = data.indexOf("<b>\n");
                var pos2 = data.indexOf("\n</b>", pos1);

                var msg = data.substring(pos1 + 4, pos2);
                base.logger.error("Failed while submitting: " + msg);
                return;
            } else if(data.indexOf("URL=http://judge.u-aizu.ac.jp/onlinejudge/status.jsp") !== -1) {
                //console.log(data);
                queryResult(cookie);
            } else {
                //console.log(data);
                base.logger.error("Failed while submitting: Unknown error.");
                return;
            }
        }, postheader, postdata, "utf8").on("error", function(e) {

        });
    }, bheader, {}, "utf8").on("error", function(e) {

    });
}, loginheader, accountinfo, "utf8").on("error", function(e) {

});
