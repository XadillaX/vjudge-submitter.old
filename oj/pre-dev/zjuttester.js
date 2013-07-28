var vjcore = require("nbut-vj-core/base").core;
var base = new vjcore();
var spider = base.spider;
var util = require("nbut-vj-core/base").util;
base.logger = require("nbut-vj-core/base").logger("zjut");

var username = "username";
var password = "password";

function queryResult(cookies) {
    var url = "http://cpp.zjut.edu.cn/Status.aspx?User=" + username + "&Problem=&Result=-1&Language=-1";

    var header = base.getBaseHeader({}, { "cookie" : cookies });
    spider.get(url, function(data, status, respheader) {
        var preText = '<th scope="col">Submit Time</th>';
        var prePos = data.indexOf(preText);

        var result = {};

        var pos1 = data.indexOf("<td>", prePos);
        var pos2 = data.indexOf("</td>", pos1);
        result["runid"] = parseInt(data.substring(pos1 + 4, pos2));

        var sText = '<a href="ShowProblem.aspx?ShowID=';
        var pos3 = data.indexOf(sText, pos2);
        pos3 = data.indexOf("<td>", pos3);
        var pos4 = data.indexOf("</td>", pos3);
        result["result"] = data.substring(pos3 + 4, pos4);
        if(result["result"].indexOf("<font color=\"") !== -1) {
            var rpos1 = result["result"].indexOf("<font color=\"");
            rpos1 = result["result"].indexOf(">", rpos1);
            var rpos2 = result["result"].indexOf("<", rpos1);
            result["result"] = result["result"].substring(rpos1 + 1, rpos2);
        }

        var pos5 = data.indexOf("<td>", pos4);
        var pos6 = data.indexOf("</td>", pos5);
        result["time"] = parseInt(data.substring(pos5 + 4, pos6));

        var pos7 = data.indexOf("<td>", pos6);
        var pos8 = data.indexOf("</td>", pos7);
        result["memo"] = parseInt(data.substring(pos7 + 4, pos8));

        if(result["result"] === "waiting") {
            console.log(result);
            setTimeout(queryResult, 100, cookies);
            return;
        } else if(result["result"] === "Compilation Error") {
            spider.get("http://cpp.zjut.edu.cn/ShowCompileError.aspx?SID=" + result["runid"], function(data, status, respheader) {
                var pos1 = data.indexOf("<pre>");
                var pos2 = data.indexOf("</pre>", pos1);
                var ceinfo = data.substring(pos1 + 5, pos2);
                ceinfo = ceinfo.trim();
                result["ceinfo"] = ceinfo;

                base.logger.info("编译失败：\n" + ceinfo);
                console.log(result);
            }, header, "utf8");
            return;
        } else {
            console.log(result);
            return;
        }
    }, header, "utf8");
}

var accountdata = {
    "__VIEWSTATE"       : "/wEPDwUKMTA5NzA2MjUxMA9kFgJmD2QWAgIDD2QWAgIDD2QWAgIBD2QWAmYPZBYCAg0PEA8WAh4HQ2hlY2tlZGhkZGRkGAEFHl9fQ29udHJvbHNSZXF1aXJlUG9zdEJhY2tLZXlfXxYDBRhjdGwwMCRMb2dpblN0YXR1czEkY3RsMDEFGGN0bDAwJExvZ2luU3RhdHVzMSRjdGwwMwUfY3RsMDAkY3BoUGFnZSRMb2dpbjEkUmVtZW1iZXJNZSvncbyujtQueCGHmQvCV5zi5I/g",
    "__EVENTTARGET"     : "ctl00$cphPage$Login1$LoginButton",
    "__EVENTARGUMENT"   : "",
    "__EVENTVALIDATION" : "/wEWBgLUsZvzDQLh8vmTCAKEmvGlBgLg8d2aBwKX76a+DQKhlsmtCyvadX9SNZ/0HUtlCUoyYTneL3BR",

    "ctl00$cphPage$Login1$UserName" : username,
    "ctl00$cphPage$Login1$Password" : password
};
var loginheader = base.getBaseHeader(accountdata);

base.logger.info("开始登录");
spider.post("http://cpp.zjut.edu.cn/SignIn.aspx?ReturnUrl=%2fDefault.aspx", function(data, status, respheader) {
    if(data.indexOf('<h2>Object moved to <a href="%2fDefault.aspx">here</a>.</h2>') === -1) {
        var text = '<td align="center" colspan="2" style="color: red">';
        var pos1 = data.indexOf(text);
        var pos2 = data.indexOf("</td>", pos1);
        var msg = data.substring(pos1 + text.length, pos2);
        msg = msg.trim();

        base.logger.error("登录失败：" + msg);

        return;
    }

    var cookies = respheader["set-cookie"][0].substr(0, respheader["set-cookie"][0].indexOf(" ")) +
        respheader["set-cookie"][1].substr(0, respheader["set-cookie"][1].indexOf(" "));

    var vheader = base.getBaseHeader({}, { "cookie" : cookies });
    spider.get("http://cpp.zjut.edu.cn/", function(data, status, respheader) {
        if(data.indexOf('Welcome,<span id="ctl00_LoginView1_LoginName1">' + username + '</span>') === -1) {
            msg = "Unknown error."
            base.logger.error("登录失败：" + msg);
            return;
        }

        base.logger.info("登录成功");
        var code = "#include<iostream>\nusing namespace std;\nint main(){int a, b; while(cin >> a >> b) { if(a == 0 && b == 0) break; cout << a + b << endl; } return 0;}";
        var postdata = {
            "ctl00$cphPage$ProblemID"       : "1000",
            "ctl00$cphPage$LanguageList"    : "1",
            "ctl00$cphPage$Source"          : code,

            "__EVENTTARGET"                 : "ctl00$cphPage$EditButton",
            "__EVENTARGUMENT"               : "",
            "__VIEWSTATE"                   : "/wEPDwUKLTkwOTYwMDMwOWQYAgUeX19Db250cm9sc1JlcXVpcmVQb3N0QmFja0tleV9fFgIFGGN0bDAwJExvZ2luU3RhdHVzMSRjdGwwMQUYY3RsMDAkTG9naW5TdGF0dXMxJGN0bDAzBRBjdGwwMCRMb2dpblZpZXcxDw9kAgFk6IVSnfBMCOBDCIyrAhY/umIXggk=",
            "__EVENTVALIDATION"             : "/wEWCQLQz9eHAgLh8tHdBgKkqP/0DgKRwICJDgKOwICJDgKPwICJDgKMwICJDgKiiLPYCQK1pumzCV5p/dWTJGpSY1VOhQxKqW9Ll0CK"
        };
        var postheader = base.getBaseHeader(postdata, { "cookie" : cookies });

        spider.post("http://cpp.zjut.edu.cn/Submit.aspx?ShowID=1000", function(data, status, respheader) {
            if(data.indexOf('<h2>Object moved to <a href="%2fStatus.aspx">here</a>.</h2>') === -1) {
                var text = '<td align="center" style="height: 19px">';
                var pos1 = data.indexOf(text);
                var pos2 = data.indexOf("</td>", pos1);
                var msg = data.substring(pos1 + text.length, pos2);
                msg = msg.trim();

                base.logger.error("提交失败：" + msg);
                return;
            }

            queryResult(cookies);
        }, postheader, postdata, "utf8");
    }, vheader, "utf8");
}, loginheader, accountdata, "utf8");
