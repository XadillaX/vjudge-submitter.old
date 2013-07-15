/**
 * Created with JetBrains WebStorm.
 * User: xadillax
 * Date: 7/14/13
 * Time: 11:11 PM
 * Some useful function for the core module.
 */
exports.stringifyData = function(data) {
    var qs = require("querystring");
    return qs.stringify(data);
}

exports.getDataLength = function(data) {
    var str = this.stringifyData(data);
    return str.length;
}

exports.cloneObject = function(org) {
    var obj = {};
    for(ele in org) {
        obj[ele] = org[ele];
    }

    return obj;
}
