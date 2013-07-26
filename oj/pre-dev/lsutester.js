var vjcore = require("nbut-vj-core/base").core;
var base = new vjcore();
var spider = base.spider;
var util = require("nbut-vj-core/base").util;
base.logger = require("nbut-vj-core/base").logger("lsu");

var username = "username";
var password = "password";

function decodeHtml(str)
{
    var s = "";
    if (str.length == 0) return "";
    s = str.replace(/&gt;/g, "&");
    s = s.replace(/&lt;/g, "<");
    s = s.replace(/&gt;/g, ">");
    s = s.replace(/&nbsp;/g, " ");
    s = s.replace(/&#39;/g, "\'");
    s = s.replace(/&quot;/g, "\"");
    s = s.replace(/<br>/g, "\n");

    return s;
}


function queryResult(cookie) {
    var reqheader = base.getBaseHeader({}, {"cookie" : cookie});
    spider.get("http://acms.lsu.edu.cn:81/OnlineJudge/status?problem_id=&user_id=" + username + "&B1=Go", function(data, status, responseheader) {
        if(status !== 200) {
            base.logger.warn("status error");
        }

        var result = {};
        var text1 = "<tr align=center><td>";
        var pos1 = data.indexOf(text1);
        var pos2 = data.indexOf("</td>", pos1);
        result["runid"] = data.substring(pos1 + text1.length, pos2);

        var pos3 = data.indexOf("<font color=", pos2);
        var pos4 = data.indexOf(">", pos3);
        var pos5 = data.indexOf("</font>", pos4);
        result["result"] = data.substring(pos4 + 1, pos5);
        if(result["result"] === "<font color=green>Waiting") {
            result["result"] = "Waiting";
        }

        var pos6 = data.indexOf("<td>", pos5);
        var pos7 = data.indexOf("K</td>", pos6);
        result["memo"] = parseInt(data.substring(pos6 + 4, pos7));

        var pos8 = data.indexOf("<td>", pos7);
        var pos9 = data.indexOf("MS</td>", pos8);
        result["time"] = parseInt(data.substring(pos8 + 4, pos9));

        if(pos1 === -1 || pos2 === -1 || pos3 === -1 || pos4 === -1 || pos5 === -1 || pos6 === -1 || pos7 === -1 || pos8 === -1 || pos9 === -1) {
            base.logger.error("invalid value");
            setTimeout(queryResult, 100, cookie);
            return;
        }

        if(result["result"] !== "Accepted") {
            result["memo"] = result["time"] = NaN;
        }

        if(result["result"] === "Compile Error") {
            spider.get("http://acms.lsu.edu.cn:81/OnlineJudge/showcompileinfo?solution_id=" + result["runid"], function(data, status, responseheader) {
                var text = "<font face=Times New Roman size=3>\r\n";
                var pos1 = data.indexOf(text);
                var pos2 = data.indexOf("</font>", pos1);

                var ce = data.substring(pos1 + text.length, pos2);
                ce = decodeHtml(ce);

                result["ceinfo"] = ce;

                console.log(result);
            }, reqheader, "gbk").on("error", function(e) {

            });
            return;
        }

        console.log(result);
        if(result["result"] === "Waiting") {
            setTimeout(queryResult, 100, cookie);
        }
    }, reqheader, "gbk").on("error", function(e) {

    });
}

var loginaccount = {
    "user_id1"  : username,
    "password1" : password
};
var loginheader = base.getBaseHeader(loginaccount);

base.logger.info("开始登录");
spider.post("http://acms.lsu.edu.cn:81/OnlineJudge/login?action=login", function(data, status, responseheader) {
    //console.log(status);
    //console.log(data);
    //console.log(responseheader);

    var cookie = responseheader["set-cookie"][0].substr(0, responseheader["set-cookie"][0].length - 17);
    var verifyheader = base.getBaseHeader({}, {"cookie" : cookie});
    verifyheader["content-type"] = "text/html";
    //console.log(verifyheader);
    spider.get("http://acms.lsu.edu.cn:81/OnlineJudge/", function(data, status, responseheader) {
        if(data.indexOf("欢迎您!&nbsp;&nbsp;<a href=\"userstatus?user_id=") !== -1) {
            base.logger.info("登录成功");
        } else {
            base.logger.error("登录失败");
            return;
        }

        var code = '#include "stdio.h"\n\
        int main()\n\
        {\n\
            int a,ba;\n\
            scanf("%d %d",&a, &b);\n\
            printf("%d\\n",a+b);\n\
            return 0;\n\
        } ';

        var postdata = {
            "language"  : 1,
            "source"    : code,
            "problem_id": "1000"
        };
        var postheader = base.getBaseHeader(postdata, {"cookie": cookie});

        spider.post("http://acms.lsu.edu.cn:81/OnlineJudge/submit", function(data, status, responseheader) {
            //console.log(responseheader);
            if(status === 302 && responseheader["location"] === "http://acms.lsu.edu.cn:81/OnlineJudge/status") {
                base.logger.info("提交成功");
            } else {
                base.logger.error("提交失败");
                console.log(data);
                return;
            }

            queryResult(cookie);
        }, postheader, postdata, "gbk").on("error", function(e) {

        });
    }, verifyheader, "gbk").on("error", function(e) {

    });
}, loginheader, loginaccount, "gbk").on("error", function(e) {

});
