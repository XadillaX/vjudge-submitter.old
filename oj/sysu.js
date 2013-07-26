/**
 * Created with JetBrains WebStorm.
 * User: xadillax
 * Date: 7/18/13
 * Time: 9:01 PM
 * SYSU Online Judge Impl.
 */
var urlutil = require("url");
var qs = require("querystring");

var base = require("../base");
var util = require("util");
var langArr = {
    "C"     : 1,
    "C++"   : 2,
    "PASCAL": 3
};

exports.create = function(baseurl) {
    return new sysu(baseurl);
}

/**
 * The SYSU OJ Module
 * @param baseurl
 */
function sysu(baseurl) {
    base.core.call(this);

    this.name = "SYSU";
    this.logger = base.logger("SYSU");
    if(undefined === baseurl) {
        this.baseurl = "http://soj.me/";
    }
}

util.inherits(sysu, base.core);

/**
 * Override and ignore the base.
 * @param username
 * @param password
 * @param callback
 */
sysu.prototype.login = function(username, password, callback) {
    var url = this.baseurl + "action.php?act=Login";
    var accountinfo = {
        "username"      : username,
        "password"      : password
    };
    var pheader = this.getBaseHeader(accountinfo);

    this.logger.info("Login SYSU: [ " + url + " ]...");
    this.logger.trace("Querystring: [ " + base.util.stringifyData(accountinfo) + " ]...");
    this.logger.trace("Request header: [ " + JSON.stringify(pheader) + " ]...");

    var par = this;

    this.spider.post(url, function(data, status, responseheader) {
        par.logger.trace("Page status: " + status + ".");

        if(status !== 200) {
            par.logger.warn("The server returns an error status.");
        }

        /**
         * SYSU OJ will return a JSON object like:
         *   {
         *       success    : [0|1],
         *       status     : "status msg"
         *   }
         */
        var result;
        try {
            result = JSON.parse(data);
        } catch(e) {
            par.logger.error("Failed while logging in: broken JSON string [" + e.message + "].");
            if(callback !== undefined)
            {
                callback.bind(par)(
                    false,
                    "broken JSON string [" + e.message + "].",
                    { "content-length" : 0, "user-agent" : par.getUserAgent() }
                );
                return;
            }
        }

        if(result["success"] === 1) {
            var s = true;
            var msg = "";

            /**
             * The cookie of SYSU is like:
             *   PHPSESSID=foo; uid=bar; hash=andfoobar;
             */
            var setcookie = responseheader["set-cookie"];
            var cookie = "";
            cookie += setcookie[0].substring(0, setcookie[0].length - 6);
            cookie += setcookie[1].substring(0, setcookie[1].length - 16);
            cookie += setcookie[2].substring(0, setcookie[2].length - 16);
            par.cookies = cookie;

            par.logger.info("Logged in successfully.");
            var baseheader = { "cookie" : par.cookies, "content-length" : 0, "user-agent" : par.getUserAgent() };

            if(callback !== undefined)
            {
                callback.bind(par)(s, msg, baseheader);
            }
            return;
        } else {
            var baseheader = { "content-length" : 0, "user-agent" : par.getUserAgent() };
            var msg = result["status"];
            if(result["status"] === undefined) msg = "Known error.";
            var s = false;

            par.logger.error("Failed while logging in: " + msg + ".");
            if(callback !== undefined) callback.bind(par)(s, msg, baseheader);
            return;
        }
    }, pheader, accountinfo, "utf8").on("error", function(e) {
        par.logger.error("Failed while logging in: " + e.message + ".");
        if(callback !== undefined) callback.bind(par)(false, e.message, { "content-length" : 0, "user-agent" : par.getUserAgent() });
    });
}

/**
 * Override and ignore the base.
 * @param problemID
 * @param language
 * @param code
 * @param baseheader
 * @param callback
 */
sysu.prototype.submit = function(problemID, language, code, baseheader, callback) {
    var url = this.baseurl + "action.php?act=Submit";
    var data = {
        "pid"       : problemID,
        "cid"       : 0,                        ///< CID seems the contest id and 0 is the practice problem library.
        "source"    : code,
        "language"  : langArr[language]
    };

    var pheader = base.util.cloneObject(baseheader);
    pheader["content-length"] = base.util.getDataLength(data);
    pheader["content-type"] = "application/x-www-form-urlencoded";

    this.logger.info("Submit code to SYSU: [ " + url + " ]...");
    this.logger.trace("Querystring: [ " + base.util.stringifyData(data) + " ]...");
    this.logger.trace("Request header: [ " + JSON.stringify(pheader) + " ]...");

    var par = this;

    this.spider.post(url, function(data, status, headers) {
        par.logger.trace("Page status: " + status + ".");

        if(status !== 200) {
            par.logger.warn("The server returns an error status.");
        }

        /**
         * The structure of JSON is like:
         *   {
         *       success    : [0|1],
         *       status     : "status msg",
         *       sid        : The submission id, will only exist when successfully
         *   }
         *
         *   But due to this framework, it seemed that we can't use sid.
         *   Because this framework is getting result from the status page, not any JSON API.
         *   We can put it as reserved items.
         */
        var result;
        try {
            result = JSON.parse(data);
        } catch(e) {
            par.logger.error("Failed while logging in: broken JSON string [" + e.message + "].");
            if(callback !== undefined)
            {
                callback.bind(par)(
                    false,
                    "broken JSON string [" + e.message + "].",
                    { "content-length" : 0, "user-agent" : par.getUserAgent() }
                );
                return;
            }
        }

        var nbaseheader = base.util.cloneObject(baseheader);
        if(result["success"] === 1) {
            var msg = "";
            var s = true;
            par.logger.info("Submit successfully.");
            if(callback !== undefined) {
                callback.bind(par)(s, msg, nbaseheader);
            }
            return;
        } else {
            var msg = result["status"];
            if(result["status"] === undefined) msg = "Known error";
            var s = false;
            par.logger.error("Failed while submitting: " + result["status"] + ".");
            if(callback !== undefined) {
                callback.bind(par)(s, msg, nbaseheader);
            }
            return;
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
 * @param username
 * @param baseheader
 * @param callback
 */
sysu.prototype.result = function(username, baseheader, callback) {
    var url = this.baseurl + "status.php?username=" + username.toLowerCase();
    var header = base.util.cloneObject(baseheader);

    this.logger.info("Query for result on SYSU OJ: [ " + url + " ]...");
    this.logger.trace("Request header: [ " + JSON.stringify(header) + " ]...");

    setTimeout(queryResultRound, 1000, 1, this, username, header, url, "", callback);
}

/**
 * Override and ignore
 * @param username
 * @param runid
 * @param baseheader
 * @param baseresult
 * @param callback
 */
sysu.prototype.ceinfo = function(username, runid, baseheader, baseresult, callback) {
    var url = this.baseurl + "compileresult.php?cid=&sid=" + runid;

    this.logger.info("Fetching CE information of [" + runid + "]...");
    this.logger.trace("Request header: [ " + JSON.stringify(baseheader) + " ]...");

    var par = this;
    var result = base.util.cloneObject(baseresult);

    this.spider.post(url, function(data, status, fetchheader) {
        if(status !== 200) {
            par.logger.warn("Fetching failed: received a wrong status number " + status + ".");

            result["ceinfo"] = "Fetching failed: received a wrong status number " + status + ".";
            if(callback !== undefined) {
                callback.bind(par)(true, "", result);
            }
            return;
        }

        var pos1 = data.indexOf("<pre>");
        var pos2 = data.indexOf("</pre>", pos1);
        if(pos1 === -1 || pos2 === -1) {
            par.logger.warn("Fetching failed: invalid data.");
            result["ceinfo"] = "Fetching failed: invalid data.";
            if(callback !== undefined) {
                callback.bind(par)(true, "", result);
            }
            return;
        }

        par.logger.info("The CE information of [" + runid + "] is fetched.");

        var ceinfo = data.substring(pos1 + 5, pos2);

        result["ceinfo"] = ceinfo;

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
    const maxTryTime = base.MAX_TRY_TIME_OF_GETTING_RESULT;
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

        var pos1 = data.indexOf("viewsource.php?sid=");
        var pos2 = data.indexOf("\"", pos1);
        if(pos1 === -1 || pos2 === -1) {
            loggerStr = loggerStr + " [ Received invalid data ]";
            self.logger.error(loggerStr);
            setTimeout(queryResultRound, 1000, time + 1, self, username, header, url, "Received invalid data", callback);
            return;
        }

        /**
         * Get the sid and we can get the result from JSON API
         */
        var sid = data.substring(pos1 + "viewsource.php?sid=".length, pos2);
        if(isNaN(sid)) {
            loggerStr = loggerStr + " [ Received invalid sid : " + sid + " ]";
            self.logger.error(loggerStr);
            setTimeout(queryResultRound, 1000, time + 1, self, username, header, url, "Received invalid sid : " + sid, callback);
            return;
        } else {
            loggerStr = loggerStr + " [ Submission ID fetched : " + sid + " ].";
            self.logger.info(loggerStr);

            var newurl = self.baseurl + "action.php?act=QueryStatus";
            setTimeout(queryJSONResultRound, 1000, time + 1, self, sid, header, newurl, "", callback);
            return;
        }
    }, header, {}, "utf8").on("error", function(e) {
        loggerStr = loggerStr + " [ " + e.message + " ]";
        self.logger.error(loggerStr);
        setTimeout(queryResultRound, 1000, time + 1, self, username, header, url, e.message, callback);
        return;
    });
}

/**
 * Query the result frome the JSON API
 * @param time
 * @param self
 * @param sid
 * @param header
 * @param url
 * @param lastError
 * @param callback
 */
function queryJSONResultRound(time, self, sid, header, url, lastError, callback) {
    const maxTryTime = base.MAX_TRY_TIME_OF_GETTING_RESULT;
    if(time > maxTryTime) {
        self.logger.error("Can't get the result: failed after " + maxTryTime + " times.");
        if(callback !== undefined) {
            callback.bind(self)(false, "Failed after " + maxTryTime + " times.", null);
        }
        return;
    }

    var loggerStr = "Try time: " + time + "...";
    var nheader = base.util.cloneObject(header);
    var chk = { "sid" : sid };
    nheader["content-length"] = base.util.getDataLength(chk);
    nheader["content-type"] = "application/x-www-form-urlencoded";

    self.spider.post(url, function(data, status, fetchheader) {
        if(status !== 200) {
            loggerStr = loggerStr + " [ The server returns a wrong status : " + status + " ]";
            self.logger.error(loggerStr);
            setTimeout(queryJSONResultRound, 1000, time + 1, self, sid, header, url, "The server returns a wrong status", callback);
            return;
        }

        /**
         * Parse the JSON code like:
         *   {
         *      "success"   : [0|1],
         *      "status"    : [Waiting|Wrong Answer|Accepted|etc.],
         *      "run_time"  : time,
         *      "run_memory": memo,
         *      "case_num"  : "I don't know, almost -1",
         *      "uid"       : "user id",
         *      "sid"       : "submission id",
         *      "queue_size": I don't know
         *  }
         */
        var json;
        try {
            json = JSON.parse(data);
        } catch(e) {
            loggerStr = loggerStr + " [ " + e.message + " ]";
            self.logger.error(loggerStr);
            setTimeout(queryJSONResultRound, 1000, time + 1, self, sid, header, url, e.message, callback);
            return;
        }

        if(json["success"] !== 1) {
            var e = json["status"];
            if(json["status"] === undefined) e = "Unknown error";
            loggerStr = loggerStr + " [ " + e + " ]";
            self.logger.error(loggerStr);
            setTimeout(queryJSONResultRound, 1000, time + 1, self, sid, header, url, e, callback);
            return;
        } else {
            var result = {
                "runid"     : sid,
                "result"    : json["status"],
                "time"      : parseInt(json["run_time"]),
                "memo"      : parseInt(json["run_memory"])
            };

            /**
             * In queue or in judging
             */
            if(result["result"] === "Waiting" || result["result"] === "Judging") {
                result["finalresult"] = self.formatResult(result["result"]);

                loggerStr = loggerStr + " [ Record is still in pending : " + result["result"] + " ]";
                self.logger.info(loggerStr);
                setTimeout(queryJSONResultRound, 1000, time + 1, self, sid, header, url, "Record is still in pending", callback);

                if(callback !== undefined) {
                    callback.bind(self)(false, result["result"].toUpperCase(), result);
                }
                return;
            }

            result["finalresult"] = self.formatResult(result["result"]);
            loggerStr = loggerStr + " [ Result fetched ]";
            self.logger.info(loggerStr);

            /**
             * If compile error
             */
            if(result["result"] === "Compile Error") {
                self.ceinfo("", result["runid"], header, result, callback);
                return;
            } else {
                callback.bind(self)(true, "", result);
                return;
            }
        }
    }, nheader, chk, "utf8").on("error", function(e) {
        loggerStr = loggerStr + " [ " + e.message + " ]";
        self.logger.error(loggerStr);
        setTimeout(queryJSONResultRound, 1000, time + 1, self, sid, header, url, e.message, callback);
        return;
    });
}
