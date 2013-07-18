/**
 * Created with JetBrains WebStorm.
 * User: xadillax
 * Date: 7/17/13
 * Time: 9:21 PM
 * Out wrapper
 */
var fs = require("fs");
var base = require("./base");

/**
 * Get the Online Judge submitter by name
 * @param ojname
 * @param baseurl
 * @returns {*}
 */
exports.getSubmitter = function(ojname, baseurl) {
    var r = "./oj/" + ojname.toLowerCase();
    exports.logger.trace("To get the submitter [" + ojname + "]");

    try {
        if(baseurl === undefined) return require(r).create();
        else return require(r).create(baseurl);
    } catch(e) {
        exports.logger.error("Can't get the submitter [" + ojname + "] : " + e.code);
        return exports.INVALID_SUBMITTER;
    }
}

/**
 * Set the base logger level
 *   It will only effect the following logger but not previous ones
 * @param level
 */
exports.setDefaultLogLevel = function(level) {
    base.setLogLevel(level);
}

/**
 * Get logger by name and level
 * @param name
 * @param level
 * @returns {*}
 */
exports.getLogger = function(name, level) {
    return base.logger(name, level);
}

/**
 * The spider
 * @type {*}
 */
exports.spider = require("nodegrass");

/**
 * The base
 * @type {Function}
 */
exports.base = base.core;

/**
 * Utils
 * @type {*}
 */
exports.util = base.util;

/**
 * The global logger
 * @type {null}
 */
var globallogger = null;
exports.logger = exports.getLogger();

/**
 * This is an INVALID SUBMITTER
 * @type {*}
 */
exports.INVALID_SUBMITTER = require("./errorbase").create();

var dummybase = new base.core();

/**
 * Get the base header
 * @type {Function}
 */
exports.getBaseHeader = dummybase.getBaseHeader.bind(dummybase);
exports.dummyBase = dummybase;