/**
 * Created with JetBrains WebStorm.
 * User: XadillaX
 * Date: 13-7-28
 * Time: 下午2:15
 * AIZU Online Judge Impl.
 */
var base = require("../base");
var util = require("util");

/**
 * Create an AIZU OJ Module
 * @param baseurl
 * @returns {aizu}
 */
exports.create = function(baseurl) {
    return new aizu(baseurl);
}

/**
 * The AIZU OJ Module
 * @param baseurl
 */
function aizu(baseurl) {
    base.core.call(this);

    this.name = "AIZU";
    this.logger = base.logger("AIZU");
    if(undefined === baseurl) {
        this.baseurl = "http://judge.u-aizu.ac.jp/onlinejudge/";
    }
}

util.inherits(aizu, base.core);

/**
 * Override and ignore the base
 * @param username
 * @param password
 * @param callback
 */
aizu.prototype.login = function(username, password, callback) {
    /**
     * There's a Login Box in every page.
     * And it just post to itself.
     *
     * So we set the index page as the login post page.
     */
    var url = this.baseurl;
    var data = {
        "loginUserID"   : username,
        "loginPassword" : password
    };
    var reqheader = this.getBaseHeader(data);

    this.logger.info("Login AIZUOJ: [ " + url + " ]...");
    this.logger.trace("Querystring: [ " + base.util.stringifyData(data) + " ]...");
    this.logger.trace("Request header: [ " + JSON.stringify(reqheader) + " ]...");

    var par = this;

    this.spider.post(url, function(data, status, respheader) {
        par.logger.trace("Page status: " + status + ".");

        if(status !== 200) {
            par.logger.warn("The server returns an error status.");
        }

        /**
         * We don't know whether you're logged in via the target page.
         * We only can recognize it from the string "LOGOUT".
         * If you're logged in, the button "LOGIN" will be "LOGOUT".
         */
        var signText = '<a href="logout.jsp" class="signup" id="login"><span class="line">Logout</span></a>';

        if(data.indexOf(signText) === -1) {
            /**
             * If failed in logging in, the message will be shown in the "LOGIN BOX":
             *
             *     ...
             *     <input type="submit" name="submit" id="logininput" value="Sign in" />
             *     <b>ERROR MESSAGE</b>
             *     ...
             */
            var signPos = data.indexOf('<input type="submit" name="submit" id="logininput" value="Sign in" />');
            var pos1 = data.indexOf("<b>", signPos);
            var pos2 = data.indexOf("</b>", pos2);
            var msg = "";
            if(signPos === -1 || pos1 === -1 || pos2 === -1) {
                msg = "Unknown error.";
            } else {
                msg = data.substring(pos1 + 3, pos2);
            }

            var baseheader = {
                "content-length" : 0,
                "user-agent" : par.getUserAgent()
            };

            par.logger.error("Failed while logging in: " + msg);

            if(undefined !== callback) {
                callback.bind(par)(false, msg, baseheader);
            }

            return;
        } else {
            /**
             * The cookies will be like:
             *   [
             *       "JSESSIONID=FOOOOOOOOOOOOOOOOOOOOOOOOOOOOBAR; Path=/onlinejudge; HttpOnly",
             *       "iref=USERNAME; Expires=WKD, DD-MMM-YYYY HH:II:SS GTM",
             *       "sref=here_s_something_blahblah_encrypted; Expires=WKD, DD-MMM-YYYY HH:II:SS GTM"
             *   ]
             */
            var cookieArr = respheader["set-cookie"];
            var cookies = "";
            cookies += cookieArr[0].substr(0, 44); cookies += " ";
            cookies += cookieArr[1].substring(0, cookieArr[1].indexOf(" ")); cookies += " ";
            cookies += cookieArr[2].substring(0, cookieArr[2].indexOf(" ")); cookies += " ";

            par.logger.trace("The cookies will be [ " + cookies + "].");
            par.cookies = cookies;

            var baseheader = {
                "cookie"            : par.cookies,
                "content-length"    : 0,
                "user-agent"        : par.getUserAgent(),

                /**
                 * Because AIZU OJ needs you to post the username and password to the submitting page,
                 * we store it in the BASEHEADER to provide it in the "submit" function.
                 *
                 * This action will save one step: fetching your username and password in the description page.
                 */
                "username"          : username,
                "password"          : password
            };

            par.logger.info("Logged in successfully.");

            if(undefined !== callback) {
                callback.bind(par)(true, "", baseheader);
            }

            return;
        }
    }, reqheader, data, "utf8").on("error", function(e) {
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
aizu.prototype.submit = function(problemID, language, code, baseheader, callback) {
    /**
     * Checking for the BASEHEADER that whether it includes "username" and "password".
     */
    if(undefined === baseheader["username"] || undefined === baseheader["password"]) {
        var msg = "broken `baseheader` parameter with missing `username` and `password`";
        this.logger.error("Failed while submitting: " + msg + ".");

        var newbaseheader = this.getBaseHeader({}, { "cookie" : baseheader["cookie"] });
        if(undefined !== callback) {
            callback.bind(this)(false, msg, newbaseheader);
        }
        return;
    }

    var url = this.baseurl + "servlet/Submit";
    var data = {
        "language"      : language,
        "problemNO"     : problemID,
        "sourceCode"    : code,

        /**
         * @Important: Here we must post the `username` and `password`!
         *
         * AIZU OJ is a strange enough OJ!
         */
        "userID"        : baseheader["username"],
        "password"      : baseheader["password"]
    };
    var reqheader = this.getBaseHeader(data, { "cookie" : baseheader["cookie"] });
    var par = this;

    this.spider.post(url, function(data, status, respheader) {
        par.logger.trace("Page status: " + status + ".");

        if(status !== 200) {
            par.logger.warn("The server returns an error status.");
        }

        /**
         * If submitting successfully, the returning data will be:
         *
         *     <META HTTP-EQUIV="refresh" CONTENT="0 ; URL=http://judge.u-aizu.ac.jp/onlinejudge/status.jsp">
         *
         * And if there's an error occurred, the data will be:
         *
         *     <font color=#ff000F><b>
         *     THE ERROR MESSAGE HERE!
         *     </b></font>
         *
         * And if server error, the data will be:
         *
         *     <html><head><title>Apache Tomcat/7.0.12 - Error report</title><style><!--H1 {font-family:Tahoma,Arial,sans-serif;color:white;background-color:#525D76;font-size:22px;} H2 {font-family:Tahoma,Arial,sans-serif;color:white;background-color:#525D76;font-size:16px;} H3 {font-family:Tahoma,Arial,sans-serif;color:white;background-color:#525D76;font-size:14px;} BODY {font-family:Tahoma,Arial,sans-serif;color:black;background-color:white;} B {font-family:Tahoma,Arial,sans-serif;color:white;background-color:#525D76;} P {font-family:Tahoma,Arial,sans-serif;background:white;color:black;font-size:12px;}A {color : black;}A.name {color : black;}HR {color : #525D76;}--></style> </head><body><h1>HTTPステータス 500 - </h1><HR size="1" noshade="noshade"><p><b>type</b> 例外レポート</p><p><b>メッセージ</b> <u></u></p><p><b>説明</b> <u>The server encountered an internal error () that prevented it from fulfilling this request.</u></p><p><b>例外</b> <pre>java.lang.NullPointerException
         *     Submit.doPost(Submit.java:61)
         *     javax.servlet.http.HttpServlet.service(HttpServlet.java:641)
         *     javax.servlet.http.HttpServlet.service(HttpServlet.java:722)
         *     </pre></p><p><b>注意</b> <u>原因のすべてのスタックトレースは、Apache Tomcat/7.0.12のログに記録されています</u></p><HR size="1" noshade="noshade"><h3>Apache Tomcat/7.0.12</h3></body></html>
         *
         * That's all I know.
         */
        if(data.indexOf("http://judge.u-aizu.ac.jp/onlinejudge/status.jsp") !== -1) {
            par.logger.info("Submit successfully.");
            var s = true;
            var msg = "";
            var newbaseheader = par.getBaseHeader({}, { "cookie" : baseheader["cookie"] });

            if(undefined !== callback) {
                callback.bind(par)(s, msg, newbaseheader);
            }
            return;
        } else if(data.indexOf("<font color=#ff000F><b>") !== -1) {
            var pos1 = data.indexOf("<b>\n");
            var pos2 = data.indexOf("\n</b>", pos1);

            var msg = data.substring(pos1 + 4, pos2);
            if(pos1 === -1 || pos2 === -1) msg = "Unknown error.";

            par.logger.error("Failed while submitting: " + msg);

            var newbaseheader = par.getBaseHeader({}, { "cookie" : baseheader["cookie"] });

            if(undefined !== callback) {
                callback.bind(par)(false, msg, newbaseheader);
            }
            return;
        } else {
            var msg = "Unknown error.";
            par.logger.error("Failed while submitting: " + msg);
            var newbaseheader = par.getBaseHeader({}, { "cookie" : baseheader["cookie"] });

            if(undefined !== callback) {
                callback.bind(par)(false, msg, newbaseheader);
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
aizu.prototype.result = function(username, baseheader, callback) {
    /**
     * You can't have a your own status page in AIZU since it only has
     * a status page that including `LAST 200 SUBMISSIONS`.
     *
     * So we fetch that page and find the first record of your username.
     * I think it's the only way to fetch your record.
     *
     * TODO: If you have a better way, please contact me (admin@xcoder.in).
     */
    var url = this.baseurl + "status.jsp";
    var header = base.util.cloneObject(baseheader);

    this.logger.info("Query for result on AIZU OJ: [ " + url + " ]...");
    this.logger.trace("Request header: [ " + JSON.stringify(header) + " ]...");

    setTimeout(queryResultRound, 0, 1, this, username, header, url, "", callback);
}

/**
 * Override and ignore the base
 * @param username
 * @param runid
 * @param baseheader
 * @param baseresult
 * @param callback
 */
aizu.prototype.ceinfo = function(username, runid, baseheader, baseresult, callback) {
    var url = this.baseurl + "review.jsp?rid=" + runid;

    this.logger.info("Fetching CE information of [" + runid + "]...");
    this.logger.trace("Request header: [ " + JSON.stringify(baseheader) + " ]...");

    var par = this;
    var result = base.util.cloneObject(baseresult);

    this.spider.get(url, function(data, status, respheader) {
        var pos1 = data.indexOf('Compile Error Logs:');
        pos1 = data.indexOf('<div class="annotation">\n\n', pos1);
        var pos2 = data.indexOf("\n\n</div>", pos1);

        if(pos1 === -1 || pos2 === -1) {
            par.logger.warn("Fetching failed: invalid data.");
            result["ceinfo"] = "Fetching failed: invalid data.";
            if(callback !== undefined) {
                callback.bind(par)(true, "", result);
            }
            return;
        }

        var ceinfo = data.substring(pos1 + '<div class="annotation">\n\n'.length, pos2);
        ceinfo = util.htmlDecode(ceinfo);
        result["ceinfo"] = ceinfo;

        /**
         * There're two '\n' between each line, so we must replace one.
         */
        result["ceinfo"] = result["ceinfo"].replace(/\n\n/g, "\n");

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
         * @Hint: You can comment the code below since it just to verify whether there're 200 or 201 records or more.
         *        Normally, it only contains 200 normal records and several pending records (waiting, running, etc.)
         */
        {
            var _recordNum = 0;
            var _recordPos = 0;
            while(data.indexOf('<tr class="dat">', _recordPos) !== -1) {
                _recordNum++;
                _recordPos = data.indexOf('<tr class="dat">', _recordPos) + 1;
            }
            loggerStr += " [ " + _recordNum + " records ]"
        }

        /**
         * Parse the HTML code and find the right record.
         */
        var result = {};

        /**
         * The column will be ordered as:
         *
         *   RunID
         *   Username
         *   Problem
         *   Status
         *   Passed Point
         *   Language
         *   Time
         *   Memory
         *   Code
         *   Submit Date
         *
         * So when we find the username, we must go back to fetch the runid.
         * We define the back number as 70
         */
        const BACK_NUMBER = 70;
        var signText = '<td class="text-left"><a href="user.jsp?id=' + username + '#1">' + username + '</a></td>';
        var signPos = data.indexOf(signText);
        var runIDSignText = "review.jsp?rid=";

        /** Get the runid */
        var pos1 = data.indexOf(runIDSignText, signPos - BACK_NUMBER);
        var pos2 = data.indexOf("&", pos1);
        result["runid"] = parseInt(data.substring(pos1 + runIDSignText.length, pos2));

        /**
         * Get the result:
         *
         *     <span class="status RESULT_ICON">: <a [THERE_MAY_HAVE SOME PARAMS]>STATUS</a></span>
         */
        var pos3 = data.indexOf("<span class=\"status", pos2);
        pos3 = data.indexOf(": ", pos3);
        pos3 = data.indexOf(">", pos3);
        var pos4 = data.indexOf("<", pos3);
        result["result"] = data.substring(pos3 + 1, pos4);

        /**
         * Get the time
         *
         *     <td class="text-center">00.00 s</td>
         *
         *       or
         *
         *     <td class="text-center">-</td>
         *
         * And there're two '<td class="text-center">' between time <TD> and result <TD> including in "<!-- -->"
         */
        var timeSignText = '<td class="text-center">';
        var pos5 = data.indexOf(timeSignText, pos4);
        pos5 = data.indexOf(timeSignText, pos5 + 1);
        pos5 = data.indexOf(timeSignText, pos5 + 1);
        var pos6 = data.indexOf("</td>", pos5);
        result["time"] = data.substring(pos5 + timeSignText.length, pos6);
        if(result["time"] === "-") {
            result["time"] = NaN;
        } else {
            /**
             * Convert it from SECOND to MILLION SECOND
             */
            result["time"] = parseInt(parseFloat(result["time"]) * 1000);
        }

        /**
         * Get the memory
         *
         *     <td class="text-right" style="line-height:12pt; padding-bottom:4px">
         */
        var memoSignText = '<td class="text-right" style="line-height:12pt; padding-bottom:4px">';
        var pos7 = data.indexOf(memoSignText, pos6);
        var pos8 = data.indexOf("</td>", pos7);
        result["memo"] = data.substring(pos7 + memoSignText.length, pos8);
        if(result["memo"] === "-") {
            result["memo"] = NaN;
        } else {
            result["memo"] = parseInt(result["memo"]);
        }

        /**
         * Can't find the string
         */
        if(pos1 === -1 || pos2 === -1 || pos3 === -1 || pos4 === -1 || pos5 === -1 || pos6 === -1 || pos7 === -1 || pos8 === -1) {
            loggerStr = loggerStr + " [ Received invalid data ]";
            self.logger.error(loggerStr);
            setTimeout(queryResultRound, 1000, time + 1, self, username, header, url, "Received invalid data", callback);
            return;
        }

        result["finalresult"] = self.formatResult(result["result"]);

        /**
         * The record is still in pending.
         */
        if(result["result"] === "Waiting Judge" || result["result"] === "Running") {
            loggerStr = loggerStr + " [ Record is still in pending : " + result["result"] + " ]";
            self.logger.info(loggerStr);
            setTimeout(queryResultRound, 1000, time + 1, self, username, header, url, "Record is still in pending", callback);

            if(callback !== undefined) {
                callback.bind(self)(false, result["result"], result);
            }
            return;
        }

        loggerStr = loggerStr + " [ Result fetched ]";
        self.logger.info(loggerStr);

        /**
         * Whether it's a CE record
         */
        if(result["result"] === "Compile Error") {
            self.ceinfo(username, runid, header, result, callback);
            return;
        } else {
            if(callback !== undefined) {
                callback.bind(self)(true, "", result);
            }
            return;
        }
    }, header, "utf8").on("error", function(e) {
        loggerStr = loggerStr + " [ " + e.message + " ]";
        self.logger.error(loggerStr);
        setTimeout(queryResultRound, 1000, time + 1, self, username, header, url, e.message, callback);
        return;
    });
}