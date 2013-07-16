/**
 * Created with JetBrains WebStorm.
 * User: xadillax
 * Date: 7/14/13
 * Time: 9:44 PM
 * NBUT Online Judge Impl.
 */
var base = require("../base");
var util = require("util");
var langArr = {
    "C"     : 1,
    "C++"   : 2,
    "PASCAL": 4
};

/**
 * Create an NOJ Module
 * @param baseurl
 * @returns {nbut}
 */
exports.create = function(baseurl) {
    return new nbut(baseurl);
}

/**
 * The NOJ Module
 * @param baseurl
 */
function nbut(baseurl) {
    base.core.call(this);

    this.name = "NBUT";
    this.logger = base.logger("NBUT");
    if(undefined === baseurl) {
        this.baseurl = "http://acm.nbut.edu.cn/";
    }
}

util.inherits(nbut, base.core);

/**
 * Override and ignore the base.
 * @param username
 * @param password
 */
nbut.prototype.login = function(username, password, callback) {
    var url = this.baseurl + "user/chklogin.xhtml";
    var data = {
        "username" : username,
        "password" : password
    };
    var datalen = base.util.getDataLength(data);
    var header = {
        "content-type"      : "application/x-www-form-urlencoded",
        "content-length"    : datalen,
        "user-agent"        : this.getUserAgent()
    };

    this.logger.info("Login NOJ: [ " + url + " ]...");
    this.logger.trace("Querystring: [ " + base.util.stringifyData(data) + " ]...");
    this.logger.trace("Request header: [ " + JSON.stringify(header) + " ]...");

    var par = this;

    this.spider.post(url, function(data, status, headers) {
        par.logger.trace("Page status: " + status + ".");

        /**
         * OJ returns a wrong status.
         */
        if(status !== 200) {
            par.logger.warn("The server returns an error status.");
        }

        /**
         * NOJ:
         *   When returns 1, that means it log succeed.
         *   When others, that means it log failed.
         */
        if(data === "1") {
            var s = true;
            var msg = "";
            par.cookies = headers["set-cookie"][0].substr(0, headers["set-cookie"][0].length - 7);

            par.logger.info("Logged in successfully.");
            var baseheader = { "cookie" : par.cookies, "content-length" : 0, "user-agent" : par.getUserAgent() };

            /**
             * Use fun.bind(par) to bind par as the "this" pointer for fun.
             * @refer https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind
             * @refer NODE.JS IRC CHANNEL: 13:07 < shama> xadillax: foo(a, b callback.bind(foo))
             *                             13:10 < olalonde> foo (a, b fn) { fn = fn.bind(this); …. }
             */
            if(callback !== undefined) callback.bind(par)(s, msg, baseheader);
            return;
        } else {
            par.logger.error("Failed while logging in: " + data + ".");

            var s = false;
            var msg = data;
            var baseheader = { "content-length" : 0, "user-agent" : par.getUserAgent() };

            if(callback !== undefined) callback.bind(par)(s, msg, baseheader);
            return;
        }
    }, header, data, "utf8").on("error", function(e){
        par.logger.error("Failed while logging in: " + e.message + ".");
        if(callback !== undefined) callback.bind(par)(false, e.message, { "content-length" : 0, "user-agent" : par.getUserAgent() });
        return;
    });
}

/**
 * Override and ignore the base
 * @param problemID
 * @param language
 * @param code
 * @param baseheader
 * @param callback
 */
nbut.prototype.submit = function(problemID, language, code, baseheader, callback) {
    var url = this.baseurl + "problem/submitok.xhtml";
    var data = {
        "language"  : langArr[language],
        "code"      : code,
        "id"        : problemID
    };
    var datalen = base.util.getDataLength(data);
    var header = base.util.cloneObject(baseheader);
    header["content-length"] = datalen;
    header["content-type"] = "application/x-www-form-urlencoded";

    this.logger.info("Submit code to NOJ: [ " + url + " ]...");
    this.logger.trace("Querystring: [ " + base.util.stringifyData(data) + " ]...");
    this.logger.trace("Request header: [ " + JSON.stringify(header) + " ]...");

    var par = this;

    this.spider.post(url, function(data, status, headers) {
        par.logger.trace("Page status: " + status + ".");

        /**
         * OJ returns a wrong status.
         */
        if(status !== 200) {
            par.logger.warn("The server returns an error status.");
        }

        var result = JSON.parse(data);
        var msg = "";
        var s = true;

        /**
         * If the JSON code is invalid or submit failed or succeed.
         */
        if(result["status"] === undefined) {
            par.logger.error("Failed while submitting: The server returns invalid data (" + data + ").");
            s = false;
            msg = "The server returns invalid data (" + data + ")";
        } else if(result["status"] === 0) {
            par.logger.error("Failed while submitting: " + result["info"]);
            s = false;
            msg = result["info"];
        } else {
            par.logger.info("Submitted successfully.");
            s = true;
            msg = "";
        }

        if(callback !== undefined) {
            callback.bind(par)(s, msg, baseheader);
        }
    }, header, data, "utf8").on("error", function(e) {
        par.logger.error("Failed while submitting: " + e.message + ".");

        if(callback !== undefined) {
            callback.bind(par)(false, e.message, baseheader);
        }
    });
}

nbut.prototype.formatResult = function(resultString) {
    var result = "";
    for(var i = 0; i < resultString.length; i++) {
        if(i === 0) {
            result += resultString[i];
            continue;
        }

        if(resultString[i] === "_") {
            result += " ";
            continue;
        }

        if(resultString[i - 1] === "_") {
            result += resultString[i];
            continue;
        }

        result += resultString[i].toLowerCase();
    }

    return result;
}

/**
 * Override and ignore the base
 * @param username
 * @param baseheader
 * @param callback
 */
nbut.prototype.result = function(username, baseheader, callback) {
    var url = this.baseurl + "problem/status.xhtml?page=1&username=" + username;
    var header = base.util.cloneObject(baseheader);

    this.logger.info("Query for result on NOJ: [ " + url + " ]...");
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
nbut.prototype.ceinfo = function(username, runid, baseheader, baseresult, callback) {
    var url = this.baseurl + "problem/viewce.xhtml?submitid=" + runid;

    this.logger.info("Fetching CE information of [" + runid + "]...");
    this.logger.trace("Request header: [ " + JSON.stringify(baseheader) + " ]...");

    var par = this;
    var result = base.util.cloneObject(baseresult);

    this.spider.post(url, function(data, status, header){
        if(status !== 200) {
            par.logger.warn("Fetching failed: received a wrong status number " + status + ".");

            result["ceinfo"] = "Fetching failed: received a wrong status number " + status + ".";
            if(callback !== undefined) {
                callback.bind(par)(true, "", result);
            }
            return;
        }

        var pos1 = data.indexOf('<pre style="overflow-x: auto;">');
        if(pos1 === -1) {
            par.logger.warn("Fetching failed: invalid data.");
            result["ceinfo"] = "Fetching failed: invalid data.";
            if(callback !== undefined) {
                callback.bind(par)(true, "", result);
            }
            return;
        }

        var pos2 = data.indexOf("</pre>", pos1);
        if(pos2 === -1) {
            par.logger.warn("Fetching failed: invalid data.");
            result["ceinfo"] = "Fetching failed: invalid data.";
            if(callback !== undefined) {
                callback.bind(par)(true, "", result);
            }
            return;
        }

        par.logger.info("The CE information of [" + runid + "] is fetched.");
        var text = data.substring(pos1 + '<pre style="overflow-x: auto;">'.length, pos2);
        result["ceinfo"] = text;

        if(callback !== undefined) {
            callback.bind(par)(true, "", result);
            return;
        }
    }, baseheader, {}, "utf8").on("error", function(e){
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

        /**
         * Find the very begining
         */
        var pos1 = data.indexOf("<tbody>");
        if(pos1 === -1) {
            loggerStr = loggerStr + " [ Received invalid data ]";
            self.logger.error(loggerStr);
            setTImeout(queryResultRound, 1000, time + 1, self, username, header, url, "Received invalid data", callback);
            return;
        }

        /**
         * The first value's first position: runid
         */
        var pos2 = data.indexOf(";\">", pos1);
        if(pos2 === -1) {
            loggerStr = loggerStr + " [ Received invalid data ]";
            self.logger.error(loggerStr);
            setTimeout(queryResultRound, 1000, time + 1, self, username, header, url, "Received invalid data", callback);
            return;
        }

        /**
         * The first value's last position: runid
         */
        var pos3 = data.indexOf("</", pos2);
        if(pos3 === -1) {
            loggerStr = loggerStr + " [ Received invalid data ]";
            self.logger.error(loggerStr);
            setTimeout(queryResultRound, 1000, time + 1, self, username, header, url, "Received invalid data", callback);
            return;
        }
        result["runid"] = data.substring(pos2 + 3, pos3);

        /**
         * The second value's pre-first position: result
         */
        var pos2 = data.indexOf("<span style=\"color", pos3);
        if(pos2 === -1) {
            loggerStr = loggerStr + " [ Received invalid data ]";
            self.logger.error(loggerStr);
            setTimeout(queryResultRound, 1000, time + 1, self, username, header, url, "Received invalid data", callback);
            return;
        }

        /**
         * The second value's first position: result
         */
        var pos2 = data.indexOf(">", pos2);
        if(pos2 === -1) {
            loggerStr = loggerStr + " [ Received invalid data ]";
            self.logger.error(loggerStr);
            setTimeout(queryResultRound, 1000, time + 1, self, username, header, url, "Received invalid data", callback);
            return;
        }

        /**
         * The second value's last position: result
         */
        var pos3 = data.indexOf("<", pos2);
        if(pos3 === -1) {
            loggerStr = loggerStr + " [ Received invalid data ]";
            self.logger.error(loggerStr);
            setTimeout(queryResultRound, 1000, time + 1, self, username, header, url, "Received invalid data", callback);
            return;
        }
        result["result"] = data.substring(pos2 + 1, pos3);

        /**
         * The record is still in pending status:
         *                      QUEUING, COMPILING, RUNNING
         * Though it's succeed, the return value is false but the message is the status.
         */
        if(result["result"] === "QUEUING" || result["result"] === "COMPILING" || result["result"] === "RUNNING") {
            result["finalresult"] = self.formatResult(result["result"]);

            loggerStr = loggerStr + " [ Record is still in pending : " + result["finalresult"] + " ]";
            self.logger.info(loggerStr);
            setTimeout(queryResultRound, 1000, time + 1, self, username, header, url, "Record is still in pending", callback);

            if(callback !== undefined) {
                callback.bind(self)(false, result["result"], result);
            }
            return;
        }

        /**
         * The third value's first position: time
         */
        var pos2 = data.indexOf(";\">", pos3);
        if(pos2 === -1) {
            loggerStr = loggerStr + " [ Received invalid data ]";
            self.logger.error(loggerStr);
            setTimeout(queryResultRound, 1000, time + 1, self, username, header, url, "Received invalid data", callback);
            return;
        }

        /**
         * The third value's last position: time
         */
        var pos3 = data.indexOf("</", pos2);
        if(pos3 === -1) {
            loggerStr = loggerStr + " [ Received invalid data ]";
            self.logger.error(loggerStr);
            setTimeout(queryResultRound, 1000, time + 1, self, username, header, url, "Received invalid data", callback);
            return;
        }
        result["time"] = data.substring(pos2 + 3, pos3);

        /**
         * The fourth value's first position: memory
         */
        var pos2 = data.indexOf(";\">", pos3);
        if(pos2 === -1) {
            loggerStr = loggerStr + " [ Received invalid data ]";
            self.logger.error(loggerStr);
            setTimeout(queryResultRound, 1000, time + 1, self, username, header, url, "Received invalid data", callback);
            return;
        }

        /**
         * The fourth value's last position: memory
         */
        var pos3 = data.indexOf("</", pos2);
        if(pos3 === -1) {
            loggerStr = loggerStr + " [ Received invalid data ]";
            self.logger.error(loggerStr);
            setTimeout(queryResultRound, 1000, time + 1, self, username, header, url, "Received invalid data", callback);
            return;
        }
        result["memory"] = data.substring(pos2 + 3, pos3);

        loggerStr = loggerStr + " [ Result fetched ]";
        self.logger.info(loggerStr);

        /**
         * Whether it's CE record
         */
        result["finalresult"] = self.formatResult(result["result"]);
        if(result["result"] === "COMPILATION_ERROR") {
            self.ceinfo(username, result["runid"], header, result, callback);
            return;
        } else if(callback !== undefined) {
            callback.bind(self)(true, "", result);
        }

        return;
    }, header, {}, "utf8").on("error", function(e) {
        loggerStr = loggerStr + " [ " + e.message + " ]";
        self.logger.error(loggerStr);
        setTimeout(queryResultRound, 1000, time + 1, self, username, header, url, e.message, callback);
        return;
    });
}
