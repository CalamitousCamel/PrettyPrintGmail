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
    var json = JSON.parse(data);
    return parseEmailData(json[0]);
}

function getEmailUrl(tid) {
    var ik = getIkFromGlobals(getGlobals());
    return window.location.origin +
        window.location.pathname +
        "?ui=2&ik=" + ik + "&view=cv&th=" +
        tid + "&msgs=&mb=0&rt=1&search=mbox";
}

function getEmailDatumAsync(tid) {
    var url = getEmailUrl(tid);
    if (url !== null) {
        return makeRequestAsync(url, "GET")
            .then((get_data) => sanitizeEmailData(get_data));
    } else {
        callback({});
    }
}

function getEmailData(selectedThreadIds) {
    return Promise.all(
        selectedThreadIds.map(function(tid) {
            return getEmailDatumAsync(tid);
        })
    );
}

function fetchSelectedEmailsData() {
    var selected_emails = [];
    // Figure out if on thread or in main view

    if ($("[gh='tl'] div[role='checkbox'][aria-checked='true']").length) {
        getSelectedThreadIds()
            .then((selectedThreadIds) => getEmailData(selectedThreadIds))
            .then((emails) => chrome.runtime.sendMessage({ emails: emails}))
            .catch(function(error) {
                console.log(error);
            });
        // console.log("[DEBUG][PPG]: Printing multiple emails...");
    }
};

fetchSelectedEmailsData();
