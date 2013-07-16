/**
 * Created with JetBrains WebStorm.
 * User: xadillax
 * Date: 7/15/13
 * Time: 10:40 PM
 * NYIST Online Judge Impl.
 */
var urlutil = require("url");
var qs = require("querystring");

var base = require("../base");
var util = require("util");
var langArr = {
    "C"     : "C/C++",
    "C++"   : "C/C++",
    "JAVA"  : "JAVA"
};

exports.create = function(baseurl) {
    return new nyist(baseurl);
}

/**
 * The NYIST OJ Module
 * @param baseurl
 */
function nyist(baseurl) {
    base.core.call(this);

    this.name = "NYIST";
    this.logger = base.logger("NYIST");
    if(undefined === baseurl) {
        this.baseurl = "http://acm.nyist.net/JudgeOnline/";
    }
}

util.inherits(nyist, base.core);

/**
 * Override and ignore the base.
 * @param username
 * @param password
 */
nyist.prototype.login = function(username, password, callback) {
    var url = this.baseurl + "dologin.php";
    var accountinfo = {
        "userid"        : username,
        "password"      : password
    };
    var pheader = this.getBaseHeader(accountinfo);

    this.logger.info("Login NYIST: [ " + url + " ]...");
    this.logger.trace("Querystring: [ " + base.util.stringifyData(accountinfo) + " ]...");
    this.logger.trace("Request header: [ " + JSON.stringify(pheader) + " ]...");

    var par = this;

    this.spider.post(url, function(data, status, headers) {
        par.logger.trace("Page status: " + status + ".");

        /**
         * The NYIST OJ's some submission page's status is 302 not 200.
         *   Because it will redirect to another page.
         */
        if(status !== 302) {
            par.logger.warn("The server returns an error status.");
        }

        /**
         * The NYIST OJ's page status are in the "location" of "header":
         *   It will redirect to a url that include a message.
         *     EG. [ location : "message.php?msg=password+incorrect&url=login.php&second=0" ]
         *     That means "password incorrect".
         */
        par.logger.trace("Redirect location info: " + headers["location"]);

        /**
         * In the location info, if the value is "profile.php" that means login successfully
         * and if the value is "message.php?msg=foo" that means login failed and the error message is "foo".
         */
        if(headers["location"] === "undefined") {
            par.logger.warn("The server returns an error header.");
        }

        var location = headers["location"];
        if(location === "profile.php") {
            var s = true;
            var msg = "";
            par.cookies = headers["set-cookie"][0].substring(0, headers["set-cookie"][0].length - 7);

            par.logger.info("Logged in successfully.");
            var baseheader = { "cookie" : par.cookies, "content-length" : 0, "user-agent" : par.getUserAgent() };

            if(callback !== undefined) callback.bind(par)(s, msg, baseheader);
            return;
        } else {
            var location = urlutil.parse(location);

            /**
             * If it's not message.php then we regard it as wrong
             */
            if(location["pathname"] !== "message.php") {
                var msg = "wrong response header";
                par.logger.error("Failed while logging in: " + msg + ".");
                if(callback !== undefined) {
                    callback.bind(par)(false, msg, { "content-length" : 0, "user-agent" : par.getUserAgent() });
                }
                return;
            }

            /**
             * In query, there are:
             * {
             *   msg : The login message
             *   url: The url will be redirected
             *   second: wait seconds
             * }
             */
            var query = qs.parse(location["query"]);

            var baseheader = { "content-length" : 0, "user-agent" : par.getUserAgent() };
            var msg = query["msg"];
            var s = false;
            if(typeof(msg) !== "string") {
                msg = "Unknown error";
            }

            par.logger.error("Failed while logging in: " + msg + ".");
            if(callback !== undefined) callback.bind(par)(s, msg, baseheader);
            return;
        }
    }, pheader, accountinfo, "utf8").on("error", function(e){
        par.logger.error("Failed while logging in: " + e.message + ".");
        if(callback !== undefined) callback.bind(par)(false, e.message, { "content-length" : 0, "user-agent" : par.getUserAgent() });
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
nyist.prototype.submit = function(problemID, language, code, baseheader, callback) {
    var url = this.baseurl + "submit.php?pid=" + problemID;
    var data = {
        "code"      : code,
        "language"  : langArr[language]
    };

    var pheader = base.util.cloneObject(baseheader);
    pheader["content-length"] = base.util.getDataLength(data);
    pheader["content-type"] = "application/x-www-form-urlencoded";

    this.logger.info("Submit code to NOJ: [ " + url + " ]...");
    this.logger.trace("Querystring: [ " + base.util.stringifyData(data) + " ]...");
    this.logger.trace("Request header: [ " + JSON.stringify(pheader) + " ]...");

    var par = this;

    this.spider.post(url, function(data, status, headers) {
        par.logger.trace("Page status: " + status + ".");

        if(status !== 302) {
            par.logger.warn("The server returns an error status.");
        }

        par.logger.trace("Redirect location info: " + headers["location"]);

        /**
         * Parse the location information that will be redirected
         */
        var location = urlutil.parse(headers["location"]);
        if(location["pathname"] !== "message.php") {
            var msg = "wrong response header";
            par.logger.error("Failed while submitting: " + msg + ".");
            if(callback !== undefined) {
                callback.bind(par)(false, msg, baseheader);
            }
            return;
        } else {
            var query = qs.parse(location["query"]);

            /**
             * Invalid message information
             */
            if(typeof(query["msg"]) !== "string") {
                var msg = "Unknown error"
                par.logger.error("Failed while submitting: " + msg + ".");
                if(callback !== undefined) {
                    callback.bind(par)(false, msg, baseheader);
                }
                return;
            }

            /**
             * If the message is "已提交" that means scesseed.
             */
            if(query["msg"] === "已提交") {
                var msg = "";
                var s = true;
                par.logger.info("Submitted successfully.");
                if(callback !== undefined) {
                    callback.bind(par)(s, msg, baseheader);
                }
                return;
            } else {
                var msg = query["msg"];
                var s = false;
                par.logger.error("Failed while submitting: " + msg + ".");
                if(callback !== undefined) {
                    callback.bind(par)(s, msg, baseheader);
                }
                return;
            }
        }
    }, pheader, data, "utf8").on("error", function(e) {
        par.logger.error("Failed while submitting: " + e.message + ".");

        if(callback !== undefined) {
            callback.bind(par)(false, e.message, baseheader);
        }
    });
}

/**
 * Override and ignore the base
 * @param resultString
 * @returns {string}
 */
nyist.prototype.formatResult = function(resultString) {
    /**
     * Accepted:    <img src="img/accepted.gif"/>Accepted
     * Others:      <a href="CE.php?runid=RUNID">Status</a>
     * Pending:     判题中
     */
    if(resultString.indexOf("Accepted") !== -1) return "Accepted";
    if(resultString.indexOf("判题中") !== -1) return "Pending";

    var pos1 = resultString.indexOf(">");
    var pos2 = resultString.indexOf("<", pos1);
    var text = resultString.substring(pos1 + 1, pos2);

    var result = "";
    for(var i = 0; i < text.length; i++) {
        if(i === 0) {
            result += text[i];
            continue;
        }

        if(text[i] >= "A" && text[i] <= "Z") {
            result += " ";
            result += text[i];
        } else {
            result += text[i];
        }
    }

    return result;
}

/**
 * Override and ignore the base
 * @param username
 * @param baseheader
 * @param callback
 */
nyist.prototype.result = function(username, baseheader, callback) {
    var url = this.baseurl + "status.php?do=search&pid=&language=0&result=0&userid=" + username;
    var header = base.util.cloneObject(baseheader);

    this.logger.info("Query for result on NYIST OJ: [ " + url + " ]...");
    this.logger.trace("Request header: [ " + JSON.stringify(header) + " ]...");

    setTimeout(queryResultRound, 1000, 1, this, username, header, url, "", callback);
}

/**
 * Override and ignore the base
 * @param username
 * @param runid
 * @param baseheader
 * @param baseresult
 * @param callback
 */
nyist.prototype.ceinfo = function(username, runid, baseheader, baseresult, callback) {
    var url = this.baseurl + "CE.php?runid=" + runid;

    this.logger.info("Fetching CE information of [" + runid + "]...");
    this.logger.trace("Request header: [ " + JSON.stringify(baseheader) + " ]...");

    var par = this;
    var result = base.util.cloneObject(baseresult);

    this.spider.post(url, function(data, status, header) {
        if(status !== 200) {
            par.logger.warn("Fetching failed: received a wrong status number " + status + ".");

            result["ceinfo"] = "Fetching failed: received a wrong status number " + status + ".";
            if(callback !== undefined) {
                callback.bind(par)(true, "", result);
            }
            return;
        }

        var pos1 = data.indexOf("错误信息如下:<br />");
        var pos2 = data.indexOf("</div>", pos1);
        if(pos1 === -1 || pos2 === -1) {
            par.logger.warn("Fetching failed: invalid data.");
            result["ceinfo"] = "Fetching failed: invalid data.";
            if(callback !== undefined) {
                callback.bind(par)(true, "", result);
            }
            return;
        }

        par.logger.info("The CE information of [" + runid + "] is fetched.");

        var text = data.substring(pos1 + "错误信息如下:<br />".length, pos2);
        while(text.indexOf("<br />") !== -1) {
            text = text.replace("<br />", "\n");
        }
        result["ceinfo"] = text;

        if(callback !== undefined) {
            callback.bind(par)(true, "", result);
        }
        return;
    }, baseheader, {}, "utf8").on("error", function(e) {
        par.logger.warn("Fetching failed: " + e.message + ".");

        result["ceinfo"] = "Fetching failed: " + e.message + ".";
        if(callback !== undefined) {
            callback.bind(par)(true, "", result);
        }
        return;
    });
}

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
    const maxTryTime = 30;
    if(time > maxTryTime) {
        self.logger.error("Can't get the result: failed after " + maxTryTime + " times.");
        if(callback !== undefined) {
            callback.bind(self)(false, "Failed after " + maxTryTime + " times.", null);
        }
        return;
    }

    var loggerStr = "Try time: " + time + "...";
    self.spider.post(url, function(data, status, fetchheader) {
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

        /**
         * If any is -1, then we regard it as invalid HTML string data.
         */
        if(tbodypos === -1 || ridtemp === -1 || ridfirst === -1 || ridlast === -1 || probtemp === -1 || resfirst === -1 ||
            reslast === -1 || timefirst === -1 || timelast === -1 || memofirst === -1 || memolast === -1) {
            loggerStr = loggerStr + " [ Received invalid data ]";
            self.logger.error(loggerStr);
            setTImeout(queryResultRound, 1000, time + 1, self, username, header, url, "Received invalid data", callback);
            return;
        }

        for(ele in result) {
            result[ele] = result[ele].trim();
        }

        /**
         * In queue or in judging.
         * Though it's succeed, the return value is false but the message is the status.
         * Because NYIST OJ seems only have "判题中", we change it to "PENDING"
         */
        if(result["result"].indexOf("判题中") !== -1) {
            result["finalresult"] = self.formatResult(result["result"]);

            loggerStr = loggerStr + " [ Record is still in pending : " + result["result"] + " ]";
            self.logger.info(loggerStr);
            setTimeout(queryResultRound, 1000, time + 1, self, username, header, url, "Record is still in pending", callback);

            if(callback !== undefined) {
                callback.bind(self)(false, "PENDING", result);
            }
            return;
        }

        result["finalresult"] = self.formatResult(result["result"]);
        loggerStr = loggerStr + " [ Result fetched ]";
        self.logger.info(loggerStr);

        /**
         * Whether it's CE record
         *    <a href="CE.php?runid=RUNID">CompileError</a>
         */
        if(result["result"].indexOf("CompileError") !== -1) {
            self.ceinfo(username, result["runid"], header, result, callback);
            return;
        } else if(callback !== undefined) {
            callback.bind(self)(true, "", result);
            return;
        }
    }, header, {}, "utf8").on("error", function(e) {
        loggerStr = loggerStr + " [ " + e.message + " ]";
        self.logger.error(loggerStr);
        setTimeout(queryResultRound, 1000, time + 1, self, username, header, url, e.message, callback);
        return;
    });
}
