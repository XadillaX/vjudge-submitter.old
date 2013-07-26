/**
 * Created with JetBrains WebStorm.
 * User: xadillax
 * Date: 13-7-26
 * Time: 下午9:23
 * LSU Online Judge Impl.
 */
var base = require("../base");
var util = require("util");
var langArr = {
    "C"     : 1,
    "C++"   : 0,
    "PASCAL": 2
};

/**
 * Create an LSU OJ Module
 * @param baseurl
 * @returns {lsu}
 */
exports.create = function(baseurl) {
    return new lsu(baseurl);
}

/**
 * The LSU OJ Module
 * @param baseurl
 */
function lsu(baseurl) {
    base.core.call(this);

    this.name = "LSU";
    this.logger = base.logger("LSU");
    if(undefined === baseurl) {
        this.baseurl = "http://acms.lsu.edu.cn:81/OnlineJudge/";
    }
}

util.inherits(lsu, base.core);

/**
 * Override and ignore the base
 * @param username
 * @param password
 * @param callback
 */
lsu.prototype.login = function(username, password, callback) {
    var url = this.baseurl + "login?action=login";

    /**
     * Though it looks strange and urly, it is like that
     *   {
     *       user_id1 -> username
     *       password1 -> password
     *   }
     *
     * @refer view-source:http://acms.lsu.edu.cn:81/OnlineJudge/
     * @type {{user_id1: *, password1: *}}
     */
    var data = {
        "user_id1"  : username,
        "password1" : password
    };

    var reqheader = this.getBaseHeader(data);

    this.logger.info("Login LSUOJ: [ " + url + " ]...");
    this.logger.trace("Querystring: [ " + base.util.stringifyData(data) + " ]...");
    this.logger.trace("Request header: [ " + JSON.stringify(reqheader) + " ]...");

    var par = this;

    /**
     * ! Caution: In all the pages of LSU OJ, the charset is 'GBK', not 'UTF8'
     */
    this.spider.post(url, function(data, status, responseheader) {
        par.logger.trace("Page status: " + status + ".");

        /**
         * Whether the result is successful or failed, the status is always 302:
         *   it will take you to the page that hidden in the text-input named "url",
         *   we hadn't post that value, so LSU will take us back to the index page.
         *   That means responseheader["location"] is http://acms.lsu.edu.cn:81/OnlineJudge/
         */
        if(status !== 302) {
            par.logger.warn("The server returns an error status.");
        }

        /**
         * You can't get the login status from the target page.
         * So you can only verify it from the index page - it will show your information when you logged in.
         * We make the string
         *
         *   欢迎您!&nbsp;&nbsp;<a href="userstatus?user_id=
         *
         * as the signed text.
         */
        var signText = '欢迎您!&nbsp;&nbsp;<a href="userstatus?user_id=';

        /**
         * The cookies will be like
         *   JSESSIONID=FOOOOOOOOOOOOOOOOOOOOOOOOOOOOBAR; path=/OnlineJudge
         */
        par.cookies = responseheader["set-cookie"][0].substr(0, responseheader["set-cookie"][0].length - 17);

        var baseheader = {
            "cookie" : par.cookies,
            "content-length" : 0,
            "user-agent" : par.getUserAgent()
        };

        /**
         * And another "eggache" place of LSU OJ is that a normal page forbids "POST".
         */
        par.spider.get(par.baseurl, function(data, status, responseheader) {
            par.logger.info("Verifying log-in status...");
            if(status !== 200) {
                par.logger.warn("The server returns an error status.");
            }

            if(data.indexOf(signText) !== -1) {
                par.logger.info("Logged in successfully.");

                var s = true;
                var msg = "";

                if(callback !== undefined) callback.bind(par)(s, msg, baseheader);
                return;
            } else {
                par.logger.error("Failed while logging in: LSU OJ has no failed message.");

                var s = false;
                var msg = "LSU OJ is no failed message";
                baseheader = { "content-length" : 0, "user-agent" : par.getUserAgent() };

                if(callback !== undefined) callback.bind(par)(s, msg, baseheader);
                return;
            }
        }, baseheader, "gbk").on("error", function(e) {
            par.logger.error("Failed while logging in: " + e.message + ".");
            if(callback !== undefined) callback.bind(par)(false, e.message, { "content-length" : 0, "user-agent" : par.getUserAgent() });
            return;
        });
    }, reqheader, data, "gbk").on("error", function(e) {
        par.logger.error("Failed while logging in: " + e.message + ".");
        if(callback !== undefined) callback.bind(par)(false, e.message, { "content-length" : 0, "user-agent" : par.getUserAgent() });
        return;
    });
};

/**
 * Override and ignore the base
 * @param problemID
 * @param language
 * @param code
 * @param baseheader
 * @param callback
 */
lsu.prototype.submit = function(problemID, language, code, baseheader, callback) {
    var url = this.baseurl + "submit";
    var data = {
        "language"  : langArr[language],
        "source"    : code,
        "problem_id": problemID.toString()
    };
    delete baseheader["content-length"];
    var reqheader = this.getBaseHeader(data, baseheader);

    this.logger.info("Submit code to LSU OJ: [ " + url + " ]...");
    this.logger.trace("Querystring: [ " + base.util.stringifyData(data) + " ]...");
    this.logger.trace("Request header: [ " + JSON.stringify(reqheader) + " ]...");

    var par = this;
    var newbaseheader = base.util.cloneObject(baseheader);

    this.spider.post(url, function(data, status, responseheader) {
        par.logger.trace("Page status: " + status + ".");

        if(status !== 302) {
            par.logger.warn("The server returns an error status.");
        }

        /**
         * If submit successfully, the header will redirect you to http://acms.lsu.edu.cn:81/OnlineJudge/status.
         * Or it will show an error page that include:
         *   <font size="4">Error Occurred</font></p>
         *   <ul>
         *     <li>{{{__The error message___}}}</li>
         *   </ul>
         */
        if(status === 302)  {
            var s = true;
            var msg = "";

            if(responseheader["location"] === "http://acms.lsu.edu.cn:81/OnlineJudge/status") {
                par.logger.info("Submit successfully.");
                s = true;
                msg = "";
            } else {
                msg = "Unknown error";
                s = false;
                par.logger.error("Failed while submitting: " + msg + ".");
            }

            if(undefined !== callback) {
                callback.bind(par)(s, msg, newbaseheader);
            }
            return;
        } else {
            var msg = "";
            var s = false;

            var pos1 = data.indexOf('<font size="4">Error Occurred</font></p>');
            var pos2 = data.indexOf("<li>", pos1);
            var pos3 = data.indexOf("</li>", pos2);
            if(pos1 === -1 || pos2 === -1 || pos3 === -1) {
                msg = "Unknown error";
            } else {
                msg = data.substring(pos2 + 4, pos3);
            }

            par.logger.error("Failed while submitting: " + msg + ".");
            if(undefined !== callback) {
                callback.bind(par)(s, msg, newbaseheader);
            }
            return;
        }
    }, reqheader, data, "gbk").on("error", function(e) {
        par.logger.error("Failed while submitting: " + e.message + ".");

        if(callback !== undefined) {
            callback.bind(par)(false, e.message, baseheader);
        }
    });
};

/**
 * Override and ignore the base
 * @param username
 * @param baseheader
 * @param callback
 */
lsu.prototype.result = function(username, baseheader, callback) {
    var url = this.baseurl + "status?problem_id=&user_id=" + username + "&B1=Go";
    var header = base.util.cloneObject(baseheader);

    this.logger.info("Query for result on LSU OJ: [ " + url + " ]...");
    this.logger.trace("Request header: [ " + JSON.stringify(header) + " ]...");

    setTimeout(queryResultRound, 0, 1, this, username, header, url, "", callback);
};

/**
 * Override and ignore the base
 * @param username
 * @param runid
 * @param baseheader
 * @param baseresult
 * @param callback
 */
lsu.prototype.ceinfo = function(username, runid, baseheader, baseresult, callback) {
    var url = this.baseurl + "showcompileinfo?solution_id=" + runid;

    this.logger.info("Fetching CE information of [" + runid + "]...");
    this.logger.trace("Request header: [ " + JSON.stringify(baseheader) + " ]...");

    var par = this;
    var result = base.util.cloneObject(baseresult);

    this.spider.get(url, function(data, status, header) {
        if(status !== 200) {
            par.logger.warn("Fetching failed: received a wrong status number " + status + ".");

            result["ceinfo"] = "Fetching failed: received a wrong status number " + status + ".";
            if(callback !== undefined) {
                callback.bind(par)(true, "", result);
            }
            return;
        }

        var text = "<font face=Times New Roman size=3>\r\n";
        var pos1 = data.indexOf(text);
        var pos2 = data.indexOf("</font>", pos1);

        if(pos1 === -1 || pos2 === -1) {
            par.logger.warn("Fetching failed: invalid data.");
            result["ceinfo"] = "Fetching failed: invalid data.";
            if(callback !== undefined) {
                callback.bind(par)(true, "", result);
            }
            return;
        }

        var ce = data.substring(pos1 + text.length, pos2);

        ce = base.util.htmlDecode(ce);
        result["ceinfo"] = ce;

        par.logger.info("The CE information of [" + runid + "] is fetched.");

        if(callback !== undefined) {
            callback.bind(par)(true, "", result);
        }
        return;
    }, baseheader, "gbk").on("error", function(e) {
        par.logger.warn("Fetching failed: " + e.message + ".");

        result["ceinfo"] = "Fetching failed: " + e.message + ".";
        if(callback !== undefined) {
            callback.bind(par)(true, "", result);
        }
        return;
    });
};

/**
 * True function that fetching run record.
 * @param time
 * @param self
 * @param username
 * @param header
 * @param url
 * @param lastError
 * @param callback
 */
function queryResultRound(time, self, username, header, url, lastError, callback) {
    const maxTryTime = base.MAX_TRY_TIME_OF_GETTING_RESULT;
    if(time > maxTryTime) {
        self.logger.error("Can't get the result: failed after " + maxTryTime + " times.");
        if(callback !== undefined) {
            callback.bind(self)(false, "Failed after " + maxTryTime + " times.", null);
        }
        return;
    }

    var loggerStr = "Try time: " + time + "...";

    /**
     * Again, you can't "POST".
     * So we use "GET".
     */
    self.spider.get(url, function(data, status, fetchheader) {
        if(status !== 200) {
            loggerStr = loggerStr + " [ The server returns a wrong status : " + status + " ]";
            self.logger.error(loggerStr);
            setTimeout(queryResultRound, 1000, time + 1, self, username, header, url, "The server returns a wrong status", callback);
            return;
        }

        /**
         * Parse the HTML code and find the right record.
         */
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
        var pos7 = data.indexOf("</td>", pos6);
        result["memo"] = parseInt(data.substring(pos6 + 4, pos7));

        var pos8 = data.indexOf("<td>", pos7);
        var pos9 = data.indexOf("</td>", pos8);
        result["time"] = parseInt(data.substring(pos8 + 4, pos9));

        if(pos1 === -1 || pos2 === -1 || pos3 === -1 || pos4 === -1 || pos5 === -1 ||
            pos6 === -1 || pos7 === -1 ||pos8 === -1 || pos9 === -1) {
            loggerStr = loggerStr + " [ Received invalid data ]";
            self.logger.error(loggerStr);
            setTimeout(queryResultRound, 1000, time + 1, self, username, header, url, "Received invalid data", callback);
            return;
        }

        /**
         * ! Caution: Except you got an "Accepted", you won't get the information of TIME and MEMO.
         *            We will get a wrong TIME and MEMO. So we just set it to NaN.
         *            And if we got an "Accepted", we should cut the TIME xMS as x and cut the MEMO xK as x.
         */
        if(result["result"] !== "Accepted") {
            result["memo"] = result["time"] = NaN;
        }

        result["finalresult"] = self.formatResult(result["result"]);

        /**
         * This is the WAITING status
         */
        if(result["result"] === "Waiting") {
            loggerStr = loggerStr + " [ Record is still in pending : " + result["result"] + " ]";
            self.logger.info(loggerStr);
            setTimeout(queryResultRound, 1000, time + 1, self, username, header, url, "Record is still in pending", callback);

            if(callback !== undefined) {
                callback.bind(self)(false, "PENDING", result);
            }
            return;
        }

        loggerStr = loggerStr + " [ Result fetched ]";
        self.logger.info(loggerStr);

        /**
         * Whether it's a CE record
         */
        if(result["result"] === "Compile Error") {
            self.ceinfo(username, result["runid"], header, result, callback);
        } else {
            callback.bind(self)(true, "", result);
            return;
        }
    }, header, "gbk").on("error", function(e) {
        loggerStr = loggerStr + " [ " + e.message + " ]";
        self.logger.error(loggerStr);
        setTimeout(queryResultRound, 1000, time + 1, self, username, header, url, e.message, callback);
        return;
    });
}
