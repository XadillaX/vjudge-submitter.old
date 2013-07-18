var vjcore = require("nbut-vj-core/base").core;
var base = new vjcore();
var spider = base.spider;
var util = require("nbut-vj-core/base").util;
base.logger = require("nbut-vj-core/base").logger("nyist");

String.prototype.trim= function(){
    // 用正则表达式将前后空格
    // 用空字符串替代。
    return this.replace(/(^\s*)|(\s*$)/g, "");
}

var accountdata = {
    "userid"        : "userid",
    "password"      : "password"
};

var pheader1 = base.getBaseHeader(accountdata);

function queryres(cookie) {
    base.logger.info("查询结果");

    var ext = {
        "cookie" : cookie
    };
    var pheader4 = base.getBaseHeader(null, ext);

    spider.post("http://acm.nyist.net/JudgeOnline/status.php?do=search&pid=1&userid=XadillaX&language=0&result=0", function(data, status, header) {
        base.logger.info("查询完成");
        var result = {};

        var tbodypos = data.indexOf("<tbody>");

        var ridtemp = data.indexOf('<a href="javascript', tbodypos);
        var ridfirst = data.indexOf('>', ridtemp);
        var ridlast = data.indexOf("</a>", ridfirst);
        result["runid"] = data.substring(ridfirst + 1, ridlast);

        var probtemp = data.indexOf('<a href="problem.php', ridlast);
        var resfirst = data.indexOf("<td>", probtemp);
        var reslast = data.indexOf("</td>", resfirst);
        result["result"] = data.substring(resfirst + 4, reslast);

        var timefirst = data.indexOf("<td>", reslast);
        var timelast = data.indexOf("</td>", timefirst);
        result["time"] = data.substring(timefirst + 4, timelast);

        var memofirst = data.indexOf("<td>", timelast);
        var memolast = data.indexOf("</td>", memofirst);
        result["memo"] = data.substring(memofirst + 4, memolast);

        for(ele in result) {
            result[ele] = result[ele].trim();
        }

        if(result["result"].indexOf("CompileError") !== -1) {
            base.logger.info("获取CE信息");
            spider.post("http://acm.nyist.net/JudgeOnline/CE.php?runid=" + result["runid"], function(data, status, header){
                base.logger.info("获取CE完成");
                var pos1 = data.indexOf("错误信息如下:<br />");
                var pos2 = data.indexOf("</div>", pos1);

                var ce = data.substring(pos1 + "错误信息如下:<br />".length, pos2);
                result["result"]["ceinfo"] = ce;
                console.log(result);
            }, pheader4, {}, "utf8").on("error", function(){});

            return;
        } else if(result["result"].indexOf("判题中") !== -1) {
            setTimeout(queryres, 1, cookie);
        }

        console.log(result);
    }, pheader4, {}, "utf8").on("error", function(e) {});
}

base.logger.info("开始登录");
spider.post("http://acm.nyist.net/JudgeOnline/dologin.php", function(data, status, header) {
    base.logger.info("登录完成");

    var pheader2 = base.getBaseHeader();
    pheader2["cookie"] = header["set-cookie"][0].substring(0, header["set-cookie"][0].length - 7);
    var ext = {
        "cookie" : pheader2["cookie"]
    };

    base.logger.info("开始签到");
    spider.post("http://acm.nyist.net/JudgeOnline/profile.php?flag=1", function(data, status, header) {
        base.logger.info("签到完成");

        // 提交
        var code = "#include<iostream>\n\
            using namespace std;\n\
            int main()\n\
            {\n\
                int a,b2;\n\
                cin>>a>>b;\n\
                cout<<a+b<<endl;\n\
            }"
        var lang = "C/C++";

        var postdata = {
            "language"      : lang,
            "code"          : code
        };
        var pheader3 = base.getBaseHeader(postdata, ext);
        console.log(pheader3);

        base.logger.info("提交代码");
        spider.post("http://acm.nyist.net/JudgeOnline/submit.php?pid=1", function(data, status, header) {
            base.logger.info("提交完成");
            //console.log(header);

            var u = require("url");
            var qs = require("querystring");

            var jurl = u.parse(header["location"]);
            var querystring = qs.parse(jurl["query"]);

            //var pheader4 = base.getBaseHeader(null, ext);

            //console.log(querystring);

            queryres(ext["cookie"]);
        }, pheader3, postdata, "utf8").on("error", function(e) {});
    }, pheader2, {}, "utf8").on("error", function(e) {});
}, pheader1, accountdata, "utf8").on("error", function(e) {});
