'use strict';

/*
 * This function is inserted as a content script and basically just attaches
 * the message handler so as to receive the print request from background.js
 * on time. Run at document_start to maximize chances that script has been
 * loaded by the time the extension icon is pressed.
 */
/** @define {boolean} */
var DEV = true;
/** @define {boolean} */
var NOT_COMPILED = true;


var GET_CHECKED_SELECTOR = "[gh='tl'] div[role='checkbox'][aria-checked='true']";

var CONSOLE_STRINGS = {
    selected_threads_print_debug: "[PrettyPrintGmail] Main view, selected emails to print",
    received_message_debug: "[PrettyPrintGmail] Received message to print",
    parsed_data_debug: "[PrettyPrintGmail] Parsed email data: ",
    gmail_error: "[PrettyPrintGmail] Error while fetching email: ",
}

function pickFirst(arr) {
    return arr.map(function(element) {
        return element[0];
    });
}

function getIndexInParent(node) {
    return Array.from(node.parentNode.children).indexOf(node);
}

function getSelectedRowsIndices() {
    let selectedRows = document.querySelectorAll(GET_CHECKED_SELECTOR);
    // Get indices in table
    return Array.from(selectedRows).map(function(row) {
        return getIndexInParent(row.parentNode.parentNode);
    })
}

function zipWithIndices(arr, indices) {
    return indices.map(function(index) {
        return arr[index];
    })
}

function getSelectedThreadIds() {
    return getVisibleEmails()
        .then((emails) => zipWithIndices(emails,
            getSelectedRowsIndices()));
}

/*
    Functions from gmail.js library by Kartik Talwar - reimplemented.
    I did not want dependency on jquery.
    https://github.com/KartikTalwar/gmail.js
*/
function getCurrentPage(hash) {
    hash = hash || window.location.hash;
    var hashPart = hash.split("#").pop().split("?").shift() || "inbox";
    if (hashPart.match(/\/[0-9a-f]{16,}$/gi)) {
        return "email";
    }
    var isTwopart = (hashPart.indexOf("search/") === 0 ||
        hashPart.indexOf("category/") === 0 ||
        hashPart.indexOf("label/") === 0);

    var result = null;
    if (!isTwopart) {
        result = hashPart.split("/").shift();
        return result;
    } else {
        var parts = hashPart.split("/");
        result = parts[0] + "/" + parts[1];
        return result;
    }
};

function makeRequestAsync(_link, method, disable_cache) {
    var link = decodeURIComponent(_link.replace(/%23/g, "#-#-#"));
    method = method || "GET";
    link = encodeURI(link).replace(/#-#-#/gi, "%23");

    let xmlhttp = new XMLHttpRequest();

    return new Promise(
        function(resolve, reject) {
            xmlhttp.onreadystatechange = function() {
                if (xmlhttp.readyState == XMLHttpRequest.DONE) {
                    if (xmlhttp.status == 200) {
                        resolve(xmlhttp.responseText);
                    } else {
                        DEV && console.error("Request Failed ", xmlhttp.statusText);
                        reject('Error thrown: ' + xmlhttp.statusText);
                    }
                }

            };
            xmlhttp.open(method, link, true);
            xmlhttp.send();
        }
    );
};

function getGlobals() {
    // Get all scripts
    var scripts = document.getElementsByTagName('script'),
        currentScriptText, varGlobalsPos, globalsScript, globals;

    // Look for where GLOBALS is defined
    for (var i = 0; i < scripts.length; i++) {
        currentScriptText = scripts[i].textContent;
        varGlobalsPos = currentScriptText.indexOf("var GLOBALS=");
        if (varGlobalsPos >= 0) {
            // Toss everything before GLOBALS is defined
            globalsScript = currentScriptText.slice(varGlobalsPos);
            break;
        }
    }
    return globalsScript;
}

function getIkFromGlobals(globals) {
    return JSON.parse(globals.split(',')[9]);
}

function makeRequest(_link, method, disable_cache) {
    var link = decodeURIComponent(_link.replace(/%23/g, "#-#-#"));
    method = method || "GET";
    link = encodeURI(link).replace(/#-#-#/gi, "%23");

    let xmlhttp = new XMLHttpRequest();

    xmlhttp.onreadystatechange = function() {
        if (xmlhttp.readyState == XMLHttpRequest.DONE) {
            if (xmlhttp.status == 200) {
                return (xmlhttp.responseText);
            } else {
                DEV && console.error("Request Failed ", xmlhttp.statusText);
                return xmlhttp.statusText;
            }
        }

    };

    xmlhttp.open(method, link, false);
    xmlhttp.send();
};

function getVisibleEmails_url() {
    var page = getCurrentPage(null);
    var ik = getIkFromGlobals(getGlobals());
    var url = window.location.origin + window.location.pathname + "?ui=2&ik=" + ik + "&view=tl&num=120&rt=1";

    var start = document.querySelectorAll(".aqK:not([hidden]) .Dj")[0].firstChild.textContent.replace(",", "").replace(".", "");

    if (start) {
        start = parseInt(start - 1, 10); // decimal system
        url += "&start=" + start +
            "&sstart=" + start;
    } else {
        url += "&start=0";
    }
    var cat_label = "";
    if (page.indexOf("label/") === 0) {
        url += "&cat=" + page.split("/")[1] + "&search=cat";
    } else if (page.indexOf("category/") === 0) {
        if (page.indexOf("forums") !== -1) {
            cat_label = "group";
        } else if (page.indexOf("updates") !== -1) {
            cat_label = "notification";
        } else if (page.indexOf("promotion") !== -1) {
            cat_label = "promo";
        } else if (page.indexOf("social") !== -1) {
            cat_label = "social";
        }
        url += "&cat=^smartlabel_" + cat_label + "&search=category";
    } else if (page.indexOf("search/") === 0) {
        var at = document.querySelector("input[name=at]").value;
        url += "&qs=true&q=" + page.split("/")[1] + "&at=" + at + "&search=query";
    } else if (page === "inbox") {
        if (document.querySelector("div[aria-label='Social']").getAttribute("aria-selected") === "true") {
            cat_label = "social";
            url += "&cat=^smartlabel_" + cat_label + "&search=category";
        } else if (document.querySelector("div[aria-label='Promotions']").getAttribute("aria-selected") === "true") {
            cat_label = "promo";
            url += "&cat=^smartlabel_" + cat_label + "&search=category";
        } else if (document.querySelector("div[aria-label='Updates']").getAttribute("aria-selected") === "true") {
            cat_label = "notification";
            url += "&cat=^smartlabel_" + cat_label + "&search=category";
        } else if (document.querySelector("div[aria-label='Forums']").getAttribute("aria-selected") === "true") {
            cat_label = "group";
            url += "&cat=^smartlabel_" + cat_label + "&search=category";
        } else {
            url += "&search=" + "mbox";
        }
    } else {
        url += "&search=" + page;
    }

    return url;
};

function getVisibleEmails_clean(get_data) {
    if (!get_data) {
        return [];
    }
    var data = get_data.substring(get_data.indexOf("["));
    var json = JSON.parse(data);
    var emails = pickFirst(json[0].filter(function(ele) {
        return ele[0] == "tb";
    })[0][2]);

    return emails;
};

function getVisibleEmails() {
    var url = getVisibleEmails_url();
    return makeRequestAsync(url, "GET", false) // enable cache
        .then((get_data) => getVisibleEmails_clean(get_data))
}

function contains(container, element) {
    return container.indexOf(element) > -1;
}



function extractEmailAddress(str) {
    var regex = /[\+a-z0-9._-]+@[a-z0-9._-]+\.[a-z0-9._-]+/gi;
    var matches = (str) ? str.match(regex) : undefined;

    return (matches) ? matches[0] : undefined;
}

function getReplyTo(ms13) {
    // reply to is an array if exists
    var reply_to = ms13 ? ms13[4] : [];

    // if reply to set get email from it and return it
    if (reply_to.length !== 0) {
        return extractEmailAddress(reply_to[0]);
    }

    // otherwise return null
    return null;
}

function parseEmailData(email_data) {
    var data = {};

    for (var i in email_data) {
        var x = email_data[i];
        if (x[0] === "cs") {
            data['thread_id'] = x[1];
            data['first_email'] = x[8][0];
            data['last_email'] = x[2];
            data['total_emails'] = x[3];
            data['total_threads'] = x[8];
            data['people_involved'] = x[15];
            data['subject'] = x[23];
        }

        if (x[0] === "ms") {
            if (data['threads'] === undefined) {
                data['threads'] = {};
            }

            (data['threads'])[x[1]] = {};
            (data['threads'])[x[1]]['is_deleted'] = (x[9] && x[9].indexOf("^k") > -1);
            (data['threads'])[x[1]]['reply_to_id'] = x[2];
            (data['threads'])[x[1]]['from'] = x[5];
            (data['threads'])[x[1]]['from_email'] = x[6];
            (data['threads'])[x[1]]['timestamp'] = x[7];
            (data['threads'])[x[1]]['datetime'] = x[24];
            (data['threads'])[x[1]]['attachments'] = x[21].split(",");
            // data['threads'])[x[1]]['attachments_details'] = x[13] ? api.tools.parse_attachment_data(x[13]) : null;
            (data['threads'])[x[1]]['subject'] = x[12];
            (data['threads'])[x[1]]['content_html'] = x[13] ? x[13][6] : x[8];
            (data['threads'])[x[1]]['to'] = x[13] ? x[13][1] : ((x[37] !== undefined) ? x[37][1] : []);
            (data['threads'])[x[1]]['cc'] = x[13] ? x[13][2] : [];
            (data['threads'])[x[1]]['bcc'] = x[13] ? x[13][3] : [];
            // data['threads'])[x[1]].reply_to = getReplyTo(x[13]);
            (data['threads'])[x[1]]['labels'] = x[9];

            try { // Sometime fail to parse x[13][6], if so, putting the raw HTML
                (data['threads'])[x[1]]['content_plain'] = x[13] ? document.querySelector(x[13][6]).textContent : x[8];
            } catch (e) {
                (data['threads'])[x[1]]['content_plain'] = x[13] ? x[13][6] : x[8];
            }
        }
    }
    DEV && console.debug(CONSOLE_STRINGS.parsed_data_debug);
    DEV && console.debug(data);
    return data;
}

function sanitizeEmailData(get_data) {
    var data = get_data.substring(get_data.indexOf("["), get_data.length);
    // Check if Gmail Server error
    if (contains(data, "var gmail_server_error")) {
        let error_message = "Gmail server error: ";
        if (contains(data, "gmail_server_error=3141")) {
            error_message += "3141, Unusual Usage error";
        }
        return new Promise(function(_, reject) { reject(error_message) });
    } else {
        var json = JSON.parse(data);
        return new Promise(function(resolve, _) {
            resolve(parseEmailData(json[0]));
        });
    }
}

function getEmailUrl(tid) {
    var ik = getIkFromGlobals(getGlobals());
    return window.location.origin +
        window.location.pathname +
        "?ui=2&ik=" + ik + "&view=cv&th=" +
        tid + "&msgs=&mb=0&rt=1&search=mbox";
}

/*
 * Handles server errors by retrying
 */
function getEmailDatum(tid, async) {
    var url = getEmailUrl(tid);
    if (url == null) {
        return new Promise(function(_, reject) {
            reject("threadId " + tid + " is not valid.")
        });
    }
    if (async) {
        return makeRequestAsync(url, "GET", false) // enable cache
            .then((get_data) => sanitizeEmailData(get_data))
            .catch((error) => {
                // Two possible causes of error
                // Request (500), or server error in response
                DEV && console.debug("Received error \"" +
                    error + "\" for thread id" + tid + ", retrying.");
                return getEmailDatum(tid, async);
            });
    } else {
        return sanitizeEmailData(makeRequest(url, "GET", false)); // enable cache
    }
}

function getEmailData(selectedThreadIds, async) {
    return Promise.all(
        selectedThreadIds.map(function(tid) {
            return getEmailDatum(tid, async);
        })
    );
}

function fetchEmails(send_response) {
    getSelectedThreadIds()
        .then((selectedThreadIds) =>
            getEmailData(selectedThreadIds, true))
        .then((emails) =>
            send_response({ 'emails': emails }))
        .catch(function(error) {
            DEV && console.error(CONSOLE_STRINGS.gmail_error + error);
            send_response({ 'error': error });
        });
}

/*
 * Retrying on server error is handled for each individual thread by
 * getEmailDatum
 */
chrome.runtime.onMessage.addListener(
    function messageListener(message, sender, send_response) {
        DEV && console.debug(CONSOLE_STRINGS.received_message_debug);
        let viewState = message['viewState'];
        let selected_emails = [];
        /* Figure out if in thread or in main view */
        if (viewState['inThread']) {
            getEmailData([viewState['threadId']], true)
                .then((email) => send_response({ 'emails': email }))
                .catch(function(error) {
                    DEV && console.error(CONSOLE_STRINGS.gmail_error + error);
                    send_response({ 'error': error });
                });
        } else if (document.querySelectorAll(GET_CHECKED_SELECTOR).length) {
            /* pass in the sendResponse callback */
            DEV && console.debug(CONSOLE_STRINGS.selected_threads_print_debug);
            fetchEmails(send_response);
        } else {
            send_response({ 'none': true });
        }
        /* Async return: https://stackoverflow.com/a/20077854 */
        return true;
    }
);
