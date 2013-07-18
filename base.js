/**
 * Created with JetBrains WebStorm.
 * User: xadillax
 * Date: 7/14/13
 * Time: 9:13 PM
 * Base of NBUT Vitrual Judge Core Module.
 */
var util = require("util");
var EventEmitter = require("events").EventEmitter;
var log4js = require("log4js");
var logLevel = "TRACE";
var userAgent = "NBUT Virtual Judge Core Module Spider";

function vjcorebase(baseurl) {
    /** Some variable */
    this.spider = require("nodegrass");
    this.logger = undefined;

    this.baseurl = baseurl;
    this.name = "";
    this.cookies = "";
}

util.inherits(vjcorebase, EventEmitter);

/**
 * The login function
 * Will be called when it needs log in.
 */
vjcorebase.prototype.login = function(username, password, callback) {
}

/**
 * The submission function
 * Will be called when it needs submit code
 * @param problemID
 * @param language
 * @param code
 * @param baseheader
 * @param callback
 */
vjcorebase.prototype.submit = function(problemID, language, code, baseheader, callback) {
}

/**
 * View the last submission of one virtual judge account
 * Will be called when it needs query
 * @param username
 * @param callback
 */
vjcorebase.prototype.result = function(username, baseheader, callback) {
}

/**
 * Get the CE record information
 * @param username
 * @param runid
 * @param baseheader
 * @param baseresult
 * @param callback
 */
vjcorebase.prototype.ceinfo = function(username, runid, baseheader, baseresult, callback) {
}

/**
 * Set the user agent of spider.
 * @param agent
 */
vjcorebase.prototype.setUserAgent = function(agent) {
    userAgent = agent;
}

/**
 * Get the user agent of spider.
 * @returns {string}
 */
vjcorebase.prototype.getUserAgent = function() {
    return userAgent;
}

/**
 * Format each OJ's result string
 * @param resultString
 * @returns {string}
 */
vjcorebase.prototype.formatResult = function(resultString) {
    return "";
}

/**
 * Get the very beginning base header
 * @param postdata
 * @param ext
 * @returns {{content-type: string, content-length: number, user-agent: string}}
 */
vjcorebase.prototype.getBaseHeader = function(postdata, ext) {
    var header = {
        "content-type"      : "application/x-www-form-urlencoded",
        "content-length"    : 0,
        "user-agent"        : this.getUserAgent()
    };

    if(typeof(postdata) === "int") {
        header["content-length"] = postdata;
    } else if(typeof(postdata) === "string") {
        header["content-length"] = postdata.length;
    } else if(typeof(postdata) === "object") {
        header["content-length"] = exports.util.getDataLength(postdata);
    } else if(postdata === undefined) {
        header["content-length"] = 0;
    }

    if(typeof(ext) === "object") {
        for(ele in ext) {
            header[ele] = ext[ele];
        }
    }

    return header;
}

/**
 * Set the logger level.
 * [ TRACE, DEBUG, INFO, WARN, ERROR, FATAL ]
 * @param level
 */
exports.setLogLevel = function(level) {
    logLevel = level;
}

exports.util = require("./lib/util");
exports.core = vjcorebase;
exports.logger = function(name, level) {
    if(name === undefined) name = "GLOBAL";
    if(level === undefined) level = logLevel;

    var logger = log4js.getLogger(name);
    logger.setLevel(level);

    return logger;
}
