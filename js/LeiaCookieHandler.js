/**
 * LeiaCookieHandler
 *
 * Example usage:
 *
 * LeiaCookieHandler.getItem(key)
 * LeiaCookieHandler.setItem(key, value)
 * LeiaCookieHandler.removeItem(key)
 * LeiaCookieHandler.hasItem(key)
 * LeiaCookieHandler.keys()
 *
 * @constructor
 */
var LeiaCookieHandler = {
    SHIFTX: "LeiaShiftX",
    SHIFTY: "LeiaShiftY",

    getItem: function (key) {
        if (!key) { return null; }
        return parseInt(decodeURIComponent(document.cookie.replace(new RegExp("(?:(?:^|.*;)\\s*" + encodeURIComponent(key).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=\\s*([^;]*).*$)|^.*$"), "$1")) || null);
    },

    setItem: function (key, value) {
        if (!key || /^(?:expires|max\-age|path|domain|secure)$/i.test(key)) { return false; }
        var suffix = "; expires=Fri, 31 Dec 9999 23:59:59 GMT;path=/";
        document.cookie = encodeURIComponent(key) + "=" + encodeURIComponent(value) + suffix;
        return true;
    },

    removeItem: function (key) {
        if (!this.hasItem(key)) { return false; }
        document.cookie = encodeURIComponent(key) + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        return true;
    },

    hasItem: function (key) {
        if (!key) { return false; }
        return (new RegExp("(?:^|;\\s*)" + encodeURIComponent(key).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=")).test(document.cookie);
    },

    keys: function () {
        var aKeys = document.cookie.replace(/((?:^|\s*;)[^\=]+)(?=;|$)|^\s*|\s*(?:\=[^;]*)?(?:\1|$)/g, "").split(/\s*(?:\=[^;]*)?;\s*/);
        for (var nLen = aKeys.length, nIdx = 0; nIdx < nLen; nIdx++) { aKeys[nIdx] = decodeURIComponent(aKeys[nIdx]); }
        return aKeys;
    },

    shiftX: function(amount) {
        this.setItem(this.SHIFTX, this.getItem(this.SHIFTX)+amount);
    },

    shiftY: function(amount) {
        this.setItem(this.SHIFTY, this.getItem(this.SHIFTY)+amount);
    }
};
if( !LeiaCookieHandler.hasItem(LeiaCookieHandler.SHIFTX) ) {
    LeiaCookieHandler.setItem(LeiaCookieHandler.SHIFTX, 0);
}
if( !LeiaCookieHandler.hasItem(LeiaCookieHandler.SHIFTY) ) {
    LeiaCookieHandler.setItem(LeiaCookieHandler.SHIFTY, 0);
}