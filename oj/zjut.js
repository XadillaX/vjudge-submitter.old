/**
 * Created with JetBrains WebStorm.
 * User: xadillax
 * Date: 7/28/13
 * Time: 11:38 PM
 * ZJUT Online Judge Impl.
 */
var base = require("../base");
var util = require("util");
var langArr = {
    "VC"    : 0,
    "C++"   : 1,
    "C"     : 2,
    "BCB"   : 3
};

/**
 * Create a ZJUT OJ Module
 * @param baseurl
 * @returns {zjut}
 */
exports.create = function(baseurl) {
    return new zjut(baseurl);
}

/**
 * The ZJUT OJ Module
 * @param baseurl
 */
function zjut(baseurl) {
    base.core.call(this);

    this.name = "ZJUT";
    this.logger = base.logger("ZJUT");
    if(undefined === baseurl) {
        this.baseurl = "http://cpp.zjut.edu.cn/";
    }
}

util.inherits(zjut, base.core);

/**
 * Override and ignore the base
 * @param username
 * @param password
 * @param callback
 */
zjut.prototype.login = function(username, password, callback) {
    var url = this.baseurl + "SignIn.aspx?ReturnUrl=%2fDefault.aspx";
    var data = {
        /**
         * Obviously, it's in C# style.
         */
        "ctl00$cphPage$Login1$UserName" : username,
        "ctl00$cphPage$Login1$Password" : password,

        /**
         * For the C# websites, you must POST two params to the function like
         *
         *     private void XXXClicked(Object sender, System.EventArgs e)
         *
         * "__EVENTTARGET" is the sender and "__EVENTARGUMENT" is the EventArgs.
         * Here's `login` action, so the sender is the `submit button`. As a result,
         * "__EVENTTARGET" will be "ctl00$cphPage$Login1$LoginButton"
         *
         *                                                                  -- XadillaX Guess.
         */
        "__EVENTTARGET"     : "ctl00$cphPage$Login1$LoginButton",
        "__EVENTARGUMENT"   : "",

        /**
         * Here's two static strings.
         */
        "__VIEWSTATE"       : "/wEPDwUKMTA5NzA2MjUxMA9kFgJmD2QWAgIDD2QWAgIDD2QWAgIBD2QWAmYPZBYCAg0PEA8WAh4HQ2hlY2tlZGhkZGRkGAEFHl9fQ29udHJvbHNSZXF1aXJlUG9zdEJhY2tLZXlfXxYDBRhjdGwwMCRMb2dpblN0YXR1czEkY3RsMDEFGGN0bDAwJExvZ2luU3RhdHVzMSRjdGwwMwUfY3RsMDAkY3BoUGFnZSRMb2dpbjEkUmVtZW1iZXJNZSvncbyujtQueCGHmQvCV5zi5I/g",
        "__EVENTVALIDATION" : "/wEWBgLUsZvzDQLh8vmTCAKEmvGlBgLg8d2aBwKX76a+DQKhlsmtCyvadX9SNZ/0HUtlCUoyYTneL3BR"
    };

    var reqheader = this.getBaseHeader(data);

    this.logger.info("Login ZJUTOJ: [ " + url + " ]...");
    this.logger.trace("Querystring: [ " + base.util.stringifyData(data) + " ]...");
    this.logger.trace("Request header: [ " + JSON.stringify(reqheader) + " ]...");

    var par = this;

    this.spider.post(url, function(data, status, respheader) {
        par.logger.trace("Page status: " + status + ".");

        if(status !== 302) {
            par.logger.warn("The server returns an error status.");
        }

        /**
         * If logged in, the target page will add the string above the page:
         *
         *     <html><head><title>Object moved</title></head><body>
         *     <h2>Object moved to <a href="%2fDefault.aspx">here</a>.</h2>
         *     </body></html>
         *
         * So we can search `<h2>Object moved to <a href="%2fDefault.aspx">here</a>.</h2>` to
         * make sure you're logged in.
         */
        var signText = '<h2>Object moved to <a href="%2fDefault.aspx">here</a>.</h2>';
        if(data.indexOf(signText) === -1) {
            /**
             * If failed while logging in, the error message will be shown at
             *
             *     ...
             *     <td align="center" colspan="2" style="color: red">
             *         THE ERROR MESSAGE.
             *     </td>
             *     ...
             */
            var text = '<td align="center" colspan="2" style="color: red">';
            var pos1 = data.indexOf(text);
            var pos2 = data.indexOf("</td>", pos1);
            var msg = data.substring(pos1 + text.length, pos2);
            msg = msg.trim();

            if(pos1 === -1 || pos2 === -1) msg = "Unknown error.";

            var baseheader = par.getBaseHeader();

            par.logger.error("Failed while logging in: " + msg);

            if(undefined !== callback) {
                callback.bind(par)(false, msg, baseheader);
            }

            return;
        }

        /**
         * The cookies will be like:
         *
         *   [
         *     'ASP.NET_SessionId=THE_SESSION_ID; path=/; HttpOnly',
         *     '.ASPXFORMSAUTH=A_VERY_VERY_LONG_STRING; path=/; HttpOnly'
         *   ]
         */
        var cookies = respheader["set-cookie"][0].substr(0, respheader["set-cookie"][0].indexOf(" ")) +
            respheader["set-cookie"][1].substr(0, respheader["set-cookie"][1].indexOf(" "));
        par.cookies = cookies;
        var baseheader = par.getBaseHeader({}, { "cookie" : cookies });

        /**
         * Verify if it really logged in.
         * In the index page, there will be the string:
         *
         *     Welcome,<span id="ctl00_LoginView1_LoginName1">USERNAME</span>
         */
        par.spider.get(par.baseurl, function(data, status, respheader) {
            if(status !== 200) {
                par.logger.warn("The server returns an error status.");
            }

            var signText = 'Welcome,<span id="ctl00_LoginView1_LoginName1">' + username + '</span>';
            if(data.indexOf(signText) === -1) {
                par.logger.error("Failed while logging in: Unknown error.");
                if(callback !== undefined) callback.bind(par)(false, "Unknown error.", { "content-length" : 0, "user-agent" : par.getUserAgent() });
                return;
            }

            par.logger.info("Logged in successfully.");

            if(undefined !== callback) {
                callback.bind(par)(true, "", baseheader);
            }
            return;
        }, baseheader, "utf8").on("error", function(e) {
            par.logger.error("Failed while logging in: " + e.message + ".");
            if(callback !== undefined) callback.bind(par)(false, e.message, { "content-length" : 0, "user-agent" : par.getUserAgent() });
            return;
        });
    }, reqheader, data, "utf8").on("error", function(e) {
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
zjut.prototype.submit = function(problemID, language, code, baseheader, callback) {
    var url = this.baseurl + "Submit.aspx?ShowID=" + problemID;
    var data = {
        "ctl00$cphPage$ProblemID"       : problemID,
        "ctl00$cphPage$LanguageList"    : langArr[language],
        "ctl00$cphPage$Source"          : code,

        /**
         * @refer The `data` above in the `login` function
         */
        "__EVENTTARGET"                 : "ctl00$cphPage$EditButton",
        "__EVENTARGUMENT"               : "",
        "__VIEWSTATE"                   : "/wEPDwUKLTkwOTYwMDMwOWQYAgUeX19Db250cm9sc1JlcXVpcmVQb3N0QmFja0tleV9fFgIFGGN0bDAwJExvZ2luU3RhdHVzMSRjdGwwMQUYY3RsMDAkTG9naW5TdGF0dXMxJGN0bDAzBRBjdGwwMCRMb2dpblZpZXcxDw9kAgFk6IVSnfBMCOBDCIyrAhY/umIXggk=",
        "__EVENTVALIDATION"             : "/wEWCQLQz9eHAgLh8tHdBgKkqP/0DgKRwICJDgKOwICJDgKPwICJDgKMwICJDgKiiLPYCQK1pumzCV5p/dWTJGpSY1VOhQxKqW9Ll0CK"
    };

    var reqheader = this.getBaseHeader(data, { "cookie" : baseheader["cookie"] });

    this.logger.info("Submit code to ZJUT OJ: [ " + url + " ]...");
    this.logger.trace("Querystring: [ " + base.util.stringifyData(data) + " ]...");
    this.logger.trace("Request header: [ " + JSON.stringify(reqheader) + " ]...");

    var par = this;
    var newbaseheader = base.util.cloneObject(baseheader);

    this.spider.post(url, function(data, status, respheader) {
        par.logger.trace("Page status: " + status + ".");

        if(status !== 302) {
            par.logger.warn("The server returns an error status.");

            /**
             * If failed in submitting, the error message will be like:
             *
             *     <td align="center" style="height: 19px">ERROR_MESSAGE</td>
             */
            var text = '<td align="center" style="height: 19px">';
            var pos1 = data.indexOf(text);
            var pos2 = data.indexOf("</td>", pos1);
            var msg = data.substring(pos1 + text.length, pos2);
            msg = msg.trim();
            if(pos1 === -1 || pos2 === -1) msg = "Unknown error.";

            par.logger.error("Failed while submitting: " + msg);

            if(undefined !== callback) {
                callback.bind(par)(false, msg, newbaseheader);
            }

            return;
        } else if(respheader["location"] !== "/Status.aspx") {
            var msg = "Unknown error.";
            par.logger.error("Failed while submitting: Unknown error.");
            if(undefined !== callback) {
                callback.bind(par)(false, msg, newbaseheader);
            }
            return;
        } else {
            par.logger.info("Submit successfully.");
            if(undefined !== callback) {
                callback.bind(par)(true, "", newbaseheader);
            }
            return;
        }
    }, reqheader, data, "utf8").on("error", function(e) {
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
zjut.prototype.result = function(username, baseheader, callback) {
    var url = this.baseurl + "Status.aspx?User=" + username + "&Problem=&Result=-1&Language=-1";
    var header = base.util.cloneObject(baseheader);

    this.logger.info("Query for result on ZJUT OJ: [ " + url + " ]...");
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
zjut.prototype.ceinfo = function(username, runid, baseheader, baseresult, callback) {
    var url = this.baseurl + "ShowCompileError.aspx?SID=" + runid;

    this.logger.info("Fetching CE information of [" + runid + "]...");
    this.logger.trace("Request header: [ " + JSON.stringify(baseheader) + " ]...");

    var par = this;
    var result = base.util.cloneObject(baseresult);

    this.spider.get(url, function(data, status, respheader) {
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

        var ceinfo = data.substring(pos1 + 5, pos2);
        ceinfo = ceinfo.trim();
        result["ceinfo"] = ceinfo;

        par.logger.info("The CE information of [" + runid + "] is fetched.");

        if(callback !== undefined) {
            callback.bind(par)(true, "", result);
        }
        return;
    }, baseheader, "utf8").on("error", function(e) {
        par.logger.warn("Fetching failed: " + e.message + ".");

        result["ceinfo"] = "Fetching failed: " + e.message + ".";
        if(callback !== undefined) {
            callback.bind(par)(true, "", result);
        }
        return;
    });
}

/**
 * Override and ignore the base
 * @param resultString
 * @returns {*}
 */
zjut.prototype.formatResult = function(resultString) {
    if(resultString === "waiting") return "Waiting";

    return resultString;
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

    self.spider.get(url, function(data, status, respheader) {
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

        var preText = '<th scope="col">Submit Time</th>';
        var prePos = data.indexOf(preText);

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

        if(pos1 === -1 || pos2 === -1 || pos3 === -1 || pos4 === -1 ||
            pos5 === -1 || pos6 === -1 || pos7 === -1 || pos8 === -1) {
            loggerStr = loggerStr + " [ Received invalid data ]";
            self.logger.error(loggerStr);
            setTimeout(queryResultRound, 1000, time + 1, self, username, header, url, "Received invalid data", callback);
            return;
        }

        result["finalresult"] = self.formatResult(result["result"]);

        if(result["result"] === "waiting") {
            loggerStr = loggerStr + " [ Record is still in pending : " + result["finalresult"] + " ]";
            self.logger.info(loggerStr);
            setTimeout(queryResultRound, 1000, time + 1, self, username, header, url, "Record is still in pending", callback);

            if(callback !== undefined) {
                callback.bind(self)(false, result["finalresult"], result);
            }
            return;
        }

        loggerStr = loggerStr + " [ Result fetched ]";
        self.logger.info(loggerStr);

        if(result["result"] === "Compilation Error") {
            self.ceinfo(username, result["runid"], header, result, callback);
            return;
        } else {
            callback.bind(self)(true, "", result);
            return;
        }
    }, header, "utf8").on("error", function(e) {
        loggerStr = loggerStr + " [ " + e.message + " ]";
        self.logger.error(loggerStr);
        setTimeout(queryResultRound, 1000, time + 1, self, username, header, url, e.message, callback);
        return;
    });
}
