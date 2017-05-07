'use strict';

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
            data.thread_id = x[1];
            data.first_email = x[8][0];
            data.last_email = x[2];
            data.total_emails = x[3];
            data.total_threads = x[8];
            data.people_involved = x[15];
            data.subject = x[23];
        }

        if (x[0] === "ms") {
            if (data.threads === undefined) {
                data.threads = {};
            }

            data.threads[x[1]] = {};
            data.threads[x[1]].is_deleted = (x[9] && x[9].indexOf("^k") > -1);
            data.threads[x[1]].reply_to_id = x[2];
            data.threads[x[1]].from = x[5];
            data.threads[x[1]].from_email = x[6];
            data.threads[x[1]].timestamp = x[7];
            data.threads[x[1]].datetime = x[24];
            data.threads[x[1]].attachments = x[21].split(",");
            // data.threads[x[1]].attachments_details = x[13] ? api.tools.parse_attachment_data(x[13]) : null;
            data.threads[x[1]].subject = x[12];
            data.threads[x[1]].content_html = x[13] ? x[13][6] : x[8];
            data.threads[x[1]].to = x[13] ? x[13][1] : ((x[37] !== undefined) ? x[37][1] : []);
            data.threads[x[1]].cc = x[13] ? x[13][2] : [];
            data.threads[x[1]].bcc = x[13] ? x[13][3] : [];
            // data.threads[x[1]].reply_to = getReplyTo(x[13]);
            data.threads[x[1]].labels = x[9];

            try { // jQuery will sometime fail to parse x[13][6], if so, putting the raw HTML
                data.threads[x[1]].content_plain = x[13] ? $(x[13][6]).text() : x[8];
            } catch (e) {
                data.threads[x[1]].content_plain = x[13] ? x[13][6] : x[8];
            }
        }
    }

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

function getEmailDatum(tid, async) {
    var url = getEmailUrl(tid);
    if (url == null) {
        throw new Error("threadId " + tid + " is not valid.");
    }
    if (async) {
        return makeRequestAsync(url, "GET")
            .then((get_data) => sanitizeEmailData(get_data));
    } else {
        return sanitizeEmailData(makeRequest(url, "GET"));
    }
}

function getEmailData(selectedThreadIds, async) {
    return Promise.all(
        selectedThreadIds.map(function(tid) {
            return getEmailDatum(tid, async);
        })
    );
}

chrome.runtime.onMessage.addListener(
    function messageListener(message, sender, sendResponse) {
        let viewState = message.viewState;
        let selected_emails = [];
        // Figure out if on thread or in main view
        if (viewState.inThread) {
            getEmailData([viewState.threadId], true)
                .then((email) => sendResponse({ emails: email }))
                .catch(function(error) {
                    console.log(error);
                });
        } else if ($("[gh='tl'] div[role='checkbox'][aria-checked='true']").length) {
            getSelectedThreadIds()
                .then((selectedThreadIds) => getEmailData(selectedThreadIds, true)) // get async
                .then((emails) => sendResponse({ emails: emails }))
                .catch(function(error) {
                    console.error(error);
                    sendResponse({ error: error });
                });
            console.log("[DEBUG][PPG]: In fetchSelectedEmailsData");
        }
        // Async return
        return true;
    }
);
