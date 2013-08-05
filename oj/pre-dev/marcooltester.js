/**
 * 貌似一题的AC次数有限——这让我怎么做VJ
 * @type {Function}
 */
var vjcore = require("nbut-vj-core/base").core;
var base = new vjcore();
var spider = base.spider;
var util = require("nbut-vj-core/base").util;
base.logger = require("nbut-vj-core/base").logger("marcool");

var username = "username";
var password = "password";

var startFunction;

function queryResult(cookie) {
    var url = "http://www.marcool.net/home/getSolutionList.htm?sort=solutionID&order=desc&rows=1&page=1&userName=" + username;
    var reqheader = base.getBaseHeader({}, { "cookie" : cookie });

    spider.get(url, function(data, status, respheader) {
        if(status !== 200) {
            base.logger.error("获取失败：状态代码错误。");
            return;
        }

        var res;
        try {
            res = JSON.parse(data);
        } catch(e) {
            base.logger.error("获取失败：" + e.message);
            return;
        }

        if(res.success !== true) {
            base.logger.error("获取失败：系统错误。");
            return;
        } else if(res.total <= 0) {
            base.logger.error("获取失败：无记录。");
            return;
        }

        res = res.rows[0];
        var result = {};

        result["runid"] = res["solutionID"];
        result["time"] = res["execTime"];
        result["memo"] = res["execMemory"];
        result["result"] = res["processStateName"];

        if(result["result"] === "编译错误") {
            spider.get("http://www.marcool.net/home/solution.htm?solutionID=" + result["runid"], function(data, status, respheader) {
                var reg = /<td><div class="viewItemTitle">错误提示：<\/div><\/td>[\s\S]*<td><div style="border: #b0b0b0 1px dashed;padding:5px">([\s\S]*)<\/div><\/td>[\s\S]*<div class="viewItemTitle">代码：<\/div><\/td>/;
                var res = reg.exec(data);
                result["ceinfo"] = res[1];
                result["ceinfo"] = util.htmlDecode(result["ceinfo"]);

                console.log(result);
                console.log(result["ceinfo"]);
            }, reqheader, "utf8");

            return;
        }

        console.log(result);
        if(result["result"] === "等待处理" || result["result"] === "正在编译" || result["result"] === "正在测评") {
            queryResult(cookie);
            return;
        }
    }, reqheader, "utf8");
}

var loginaccount = {
    "_userName"     : username,
    "_password"     : password
};
var loginheader = base.getBaseHeader(loginaccount);

function start() {
    base.logger.info("开始登录");
    spider.post("http://www.marcool.net/home/doLogin.htm", function(data, status, respheader) {
        if(status !== 200) {
            base.logger.error("登录失败：错误的返回状态。");
            return;
        }

        var res;
        try {
            res = JSON.parse(data);
        } catch(e) {
            base.logger.error("登录失败：" + e.message);
            return;
        }

        if(res.success !== true) {
            base.logger.error("登录失败：错误的用户名或者密码。");
            return;
        } else {
            if(res.object !== 2) {
                base.logger.error("登录成功，但该用户无法正常提交代码。");
                return;
            }

            base.logger.info("登录成功。");

            var cookie = respheader["set-cookie"][0].substring(0, respheader["set-cookie"][0].indexOf(" "));
            var code = "#include <iostream>\nusing namespace std;\nint main(){int a,b;cin>>a>>b;cout<<a+b<<endl;return 0;}//看后台好像有正确代码提交次数限制，所以这些提交只是为了看最多能提交几次而已——VJ本身就会有N次提交的。请参见相仿项目BNUOJ或者HUST的virtual judge";
            var postdata = {
                "languageType"      : 2,        ///< 2: C++   3: C   4: PASCAL   5: BASIC
                "codeContent"       : code,
                "problemID"         : "0001"
            };
            var reqheader = base.getBaseHeader(postdata, { "cookie" : cookie });

            //queryResult(cookie);return;

            base.logger.info("提交代码");
            spider.post("http://www.marcool.net/home/submitSolution.htm", function(data, status, respheader) {
                if(200 !== status) {
                    base.logger.error("提交失败：错误的状态代码。");
                    return;
                }

                var res;

                try {
                    res = JSON.parse(data);
                } catch(e) {
                    base.logger.error("提交失败：" + e.message);
                    return;
                }

                if(res.success !== true) {
                    if(res.object > 0) {
                        base.logger.error("提交失败：该题您已经通过" + res.object + "次了，无需继续尝试。");
                    } else if(res.object === 0) {
                        base.logger.error("提交失败：您的提交太过频繁，请稍后再试。");
                    } else {
                        base.logger.error("提交失败：未知错误。");
                    }
                    return;
                }

                base.logger.info("提交成功。");

                base.logger.info("获取状态");
                queryResult(cookie);
            }, reqheader, postdata, "utf8");
        }
    }, loginheader, loginaccount, "utf8");
}

for(var i = 0; i < 50; i++) {
    setTimeout(start, 100);
}
