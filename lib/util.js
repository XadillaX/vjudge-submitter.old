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

exports.htmlEncode = function(str)
{
    var s = "";
    if (str.length == 0) return "";
    s = str.replace(/&/g, "&gt;");
    s = s.replace(/</g, "&lt;");
    s = s.replace(/>/g, "&gt;");
    s = s.replace(/ /g, "&nbsp;");
    s = s.replace(/\'/g, "&#39;");
    s = s.replace(/\"/g, "&quot;");
    s = s.replace(/\n/g, "<br>");
    return s;
}

exports.htmlDecode = function(str)
{
    var s = "";
    if (str.length == 0) return "";
    s = str.replace(/&gt;/g, "&");
    s = s.replace(/&lt;/g, "<");
    s = s.replace(/&gt;/g, ">");
    s = s.replace(/&nbsp;/g, " ");
    s = s.replace(/&#39;/g, "\'");
    s = s.replace(/&quot;/g, "\"");
    s = s.replace(/<br>/g, "\n");
    return s;
}
