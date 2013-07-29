var vjcore = require("nbut-vj-core/base").core;
var base = new vjcore();
var spider = base.spider;
var util = require("nbut-vj-core/base").util;
base.logger = require("nbut-vj-core/base").logger("sjtu");

var username = "username";
var password = "password";

function queryResult(cookie) {
    var url = "http://acm.sjtu.edu.cn/OnlineJudge/status?owner=" + username + "&problem=&language=0&verdict=0";
    var header = base.getBaseHeader({}, { "cookie" : cookie });
    spider.get(url, function(data, status, respheader) {
        var result = {};

        var pos1 = data.indexOf("<tbody>");
        pos1 = data.indexOf("<a ", pos1);
        pos1 = data.indexOf("\">", pos1);
        var pos2 = data.indexOf("</a>", pos1);
        result["runid"] = data.substring(pos1 + 2, pos2);

        var signText = "href=\"/OnlineJudge/record/" + result["runid"] + "\">";
        var pos3 = data.indexOf(signText, pos2);
        var pos4 = data.indexOf("</a>", pos3);
        result["result"] = data.substring(pos3 + signText.length, pos4);

        var pos5 = data.indexOf("<td>", pos4);
        pos5 = data.indexOf("<td>", pos5 + 1);
        var pos6 = data.indexOf("</td>", pos5);
        result["time"] = data.substring(pos5 + 4, pos6);
        if(result["time"] === "-") {
            result["time"] = NaN;
        } else {
            result["time"] = parseInt(result["time"]);
        }

        var pos7 = data.indexOf("<td>", pos6);
        var pos8 = data.indexOf("</td>", pos7);
        result["memo"] = data.substring(pos7 + 4, pos8);
        if(result["memo"] === "-") {
            result["memo"] = NaN;
        } else {
            result["memo"] = parseInt(result["memo"]);
        }

        if(result["result"] === "未评测" || result["result"] === "等待评测" || result["result"] === "正在评测") {
            console.log(result);
            setTimeout(queryResult, 1000, cookie);
            return;
        } else if(result["result"] === "编译错误") {
            var ceurl = "http://acm.sjtu.edu.cn/OnlineJudge/record/" + result["runid"];
            spider.get(ceurl, function(data, status, respheader) {
                var pos1 = data.indexOf("<pre>");
                var pos2 = data.indexOf("</pre>");
                var ceinfo = data.substring(pos1 + 5, pos2);
                ceinfo = ceinfo.trim();
                result["ceinfo"] = ceinfo;

                console.log(result);
            }, header, "utf8");
            return;
        }

        console.log(result);
    }, header, "utf8");
}

var accountinfo = {
    "username"      : username,
    "password"      : password,

    "action"        : "登录"
};
var loginheader = base.getBaseHeader(accountinfo);

base.logger.info("开始登录");
spider.post("http://acm.sjtu.edu.cn/OnlineJudge/login", function(data, status, respheader) {
    if(respheader["set-cookie"].length < 2) {
        var cookie = respheader["set-cookie"][0];
        cookie = cookie.substr(0, cookie.indexOf(" "));
        var header = base.getBaseHeader({}, { "cookie" : cookie });

        spider.get("http://acm.sjtu.edu.cn/OnlineJudge/", function(data, status, respheader) {
            var signText = "<strong>Oh snap!</strong>";
            var pos1 = data.indexOf(signText);
            var pos2 = data.indexOf("</div>", pos1);
            var msg = data.substring(pos1 + signText.length, pos2);
            msg = msg.trim();
            if(pos1 === -1 || pos2 === -1) {
                msg = "Unknown error.";
            }

            base.logger.error("登录失败：" + msg);
        }, header, "utf8");

        return;
    }

    var cookie = respheader["set-cookie"][1];
    cookie = cookie.substr(0, cookie.indexOf(" "));
    var header = base.getBaseHeader({}, { "cookie" : cookie });

    spider.get("http://acm.sjtu.edu.cn/OnlineJudge/", function(data, status, respheader) {
        if(data.indexOf('<i class="icon-user"></i> 当前用户：') === -1) {
            var msg = "Unknown error.";
            base.logger.error("登录失败：" + msg);
            return;
        }

        base.logger.info("登录成功");

        var code = "#include<iostream>\nusing namespace std;\nint main(){int a, b;cin >> a >> b; cout << a + b << endl; return 0;}";
        var data = {
            "code"      : code,
            "language"  : 0,
            "problem"   : 1000
        };
        var header = base.getBaseHeader(data, { "cookie" : cookie });
        var getheader = base.getBaseHeader({}, { "cookie" : cookie });
        spider.post("http://acm.sjtu.edu.cn/OnlineJudge/submit", function(data, status, respheader) {
            if(respheader["location"] !== "http://acm.sjtu.edu.cn/OnlineJudge/status") {
                spider.get(respheader["location"], function(data, status, respheader) {
                    var signText = "<strong>Oh snap!</strong>";
                    var pos1 = data.indexOf(signText);
                    var pos2 = data.indexOf("</div>", pos1);
                    var msg = data.substring(pos1 + signText.length, pos2);
                    msg = msg.trim();
                    if(pos1 === -1 || pos2 === -1) {
                        msg = "Unknown error.";
                    }

                    base.logger.error("提交失败：" + msg);
                }, getheader, "utf8");

                return;
            }

            queryResult(cookie);
        }, header, data, "utf8");
    }, header, "utf8");
}, loginheader, accountinfo, "utf8");
