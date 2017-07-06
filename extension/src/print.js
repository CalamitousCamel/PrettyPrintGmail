'use strict';

/** @define {boolean} */
var DEV = true;
/** @define {boolean} */
var NOT_COMPILED = true;

var CONSOLE_STRINGS = {
    print_ran_debug: "[PrettyPrintGmail] print.js ran",
    onmessage_debug: "[PrettyPrintGmail] In onmessage handler",
    insert_in_page_debug: "[PrettyPrintGmail] In insertInPage",
    received_emails_debug: "[PrettyPrintGmail] Received emails",
    to_is_messed_up_debug: "[PrettyPrintGmail] One of the 'to's is messed up",
    parsing_email_error: "[PrettyPrintGmail] Parsing email error",
}

DEV && console.debug(CONSOLE_STRINGS.print_ran_debug);

function isString(str) {
    return (typeof str === 'string') || (str instanceof String);
}

/*
    Expects a replacement object with
    keys: substrings in str to replace
    values: replacements
*/
function replaceMultiple(replaceObj, str) {
    function replaceInner(replacements, acc) {
        if (replacements && replacements.length) {
            let key = replacements[0][0];
            let value = replacements[0][1];
            return replaceInner(replacements.slice(1), acc.replace(key, value));
        } else return acc;
    }
    let replacements = Object.keys(replaceObj)
        .map(key => [key, replaceObj[key]]);

    return replaceInner(replacements, str);
}

function handleTo(acc, cur) {
    /* Handle type unsafety :( */
    if (Array.isArray(cur)) {
        return (acc + cur.join(" [")) +
            "], ";
    } else if (isString(cur)) {
        return acc +
            replaceMultiple({ "<": "[", ">": "]" }, cur) +
            ", ";
    }
    /* else error */
    console.error(CONSOLE_STRINGS.parsing_email_error);
    DEV && console.debug(CONSOLE_STRINGS.to_is_messed_up_debug)
    DEV && console.debug(cur);
    return cur;
}

/*
 * NOTE: Every line handles starting <br> for itself
 */

/* TO is annoying. Check handleTo for details
 * We have to operate on first element of to
 * array as well so we have to pass the operated
 * upon element as the initialValue to the reduce
 * and start reducing from the 2nd element.
 */
function getToLine(message) {
    if (message['to'] && message['to'].length) {
        let to = "<br><b>To: </b>";
        let firstTo = message['to'][0];
        if (message['to'].length > 1) {
            return to +
                message['to'].slice(1).reduce(function(acc, cur) {
                    if (cur) return handleTo(acc, cur);
                }, handleTo("", firstTo));
        } else return to + handleTo("", firstTo);
    } else return "";
}

function getDateTime(message) {
    let datetime = message['datetime'];
    /* if it doesn't exist then insert nothing */
    return datetime ? "<br><b>At: </b>" +  datetime : "";
}

function getFromLine(message) {
    return "<font size=-1><b>From: </b>" +
        message['from'] +
        " [" +
        message['from_email'] +
        "]";
}

/* Returns relevant HTML content for emails */
function formatEmails(emails) {
    return emails.map(function(email) {
        DEV && console.debug(email)
        let subjectLine = "<hr class=dashed><font size=+1><b>" + email['subject'] + "</b></font><br>";
        let totalThreads = email['total_threads'].length;
        let emailContent = subjectLine + "<font size=-1 color=#777>" +
            totalThreads + " messages </font> <hr class=dashed>";

        /* Messages
         * Have to get keys of email.threads object from total_threads
         * Fold over all threads and combine into one HTML string that
         * will be printed.
         */
        return email['total_threads'].reduce(function(acc, threadId) {
            // sender/receiver
            let message = (email['threads'])[threadId];
            let fromLine = getFromLine(message);
            let toLine = getToLine(message);
            let dateTime = getDateTime(message);
            let divider = "</font><br><hr><br>";

            return {
                'emailContent': acc['emailContent'] +
                    fromLine + toLine + dateTime + divider +
                    message['content_html'] +
                    "<br><br><font size=-2 color=#777>" +
                    acc['messageCount'] + " / " + totalThreads +
                    "</font><br><hr class=dashed><br>",
                'messageCount': acc['messageCount'] + 1
            };
        }, { 'emailContent': emailContent, 'messageCount': 1 })['emailContent'] + "<footer>";
    });
}

function insertInPage(emails) {
    DEV && console.debug(CONSOLE_STRINGS.insert_in_page_debug);
    let body = document.body;
    emails.map(function(emailHTML) {
        body.innerHTML += emailHTML;
    });
}

chrome.runtime.onMessage.addListener(
    function messageListener(message, sender, sendResponse) {
        let emails = message['emails'];
        DEV && console.debug(CONSOLE_STRINGS.onmessage_debug);
        if (emails) {
            /* Set title: */
            document.title = emails.length + " email" + (emails.length == 1 ? "" : "s");
            insertInPage((formatEmails(emails)));
        }
        /* Check if all images have finished loading */
        let images = document.getElementsByTagName("img");
        let counter = images.length;

        for (let i = images.length - 1; i >= 0; i--) {
            if (images[i].complete) counter--;
            else {
                images[i].onload = images[i].onerror = function() {
                    counter--;
                }
            }
            /* Invalidate cached image / reload image at this point.
             * The onload function is flaky if not called before setting src
             * However, I'm confused as to how the image can be incomplete
             * and still the onerror function does not fire.
             */
            images[i].src += "?" + new Date().getTime();
        }
        /* Check every 500 ms */
        let interval = setInterval(function() {
            if (counter <= 0) {
                clearInterval(interval);
                window.print();
            }
        }, 500);
    }
);
