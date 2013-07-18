/**
 * Created with JetBrains WebStorm.
 * User: xadillax
 * Date: 7/17/13
 * Time: 9:42 PM
 * It's an invalid submitter
 */
var base = require("./index");
var util = require("util");

exports.create = function(baseurl) {
    return new errorbase(baseurl);
}

errorbase = function(baseurl) {
    base.base.call(this);

    this.name = "INVLID SUBMITTER";
    this.logger = base.getLogger("INVLID SUBMITTER");
    if(undefined === baseurl) {
        this.baseurl = "INVLID SUBMITTER";
    }
}

util.inherits(errorbase, base.base);

errorbase.prototype.login = function(username, password, callback) {
    this.logger.error("You are going to log in an INVALID SUBMITTER.");
}

errorbase.prototype.submit = function(problemID, language, code, baseheader, callback) {
    this.logger.error("You are going to submit code to an INVALID SUBMITTER.");
}

errorbase.prototype.result = function(username, baseheader, callback) {
    this.logger.error("You are going to fetch the latest result from an INVALID SUBMITTER.");
}
