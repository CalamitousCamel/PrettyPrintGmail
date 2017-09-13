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
    options_debug: "[PrettyPrintGmail] Got options: ",
    inboxId_debug: "[PrettyPrintGmail] Got inboxId: ",
    url_debug: "[PrettyPrintGmail] Got canonicalUrl: ",
    proxified_debug: "[PrettyPrintGmail] Handling a proxified image: ",
}

DEV && console.debug(CONSOLE_STRINGS.print_ran_debug);

function isString(str) {
    return (typeof str === 'string') || (str instanceof String);
}

function contains(container, element) {
    return container.indexOf(element) > -1;
}

/*
    Expects a replacement object with
    keys: substrings in str to replace
    values: replacements
    DEPRECATED
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
        return (acc + cur.join(' &lt;')) +
            '&gt;, ';
    } else if (isString(cur)) {
        return acc +
            escapeWithRegex(cur) +
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
function getToLine(message, display) {
    if (!display) {
        return "";
    }
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

function getDateTime(message, display) {
    if (!display) {
        return "";
    }
    let datetime = message['datetime'];
    /* if it doesn't exist then insert nothing */
    return datetime ? "<br><b>At: </b>" + datetime : "";
}

function getFromLine(message, display) {
    if (!display) {
        return "";
    }
    return "<br><font size=-1><b>From: </b>" +
        message['from'] +
        ' &lt;' +
        message['from_email'] +
        '&gt;';
}

function getSubjectLineCSSized(subject) {
    return "<hr class=dashed><font size=+1><b>" +
        subject + "</b></font><br>";
}

function escapeWithRegex(s) {
    return s.replace(/[&"<>]/g, function(c) {
        return {
            '&': "&amp;",
            '"': "&quot;",
            '<': "&lt;",
            '>': "&gt;"
        }[c];
    });
}

function getSubjectLine(email, display) {
    if (!display) {
        return "<hr class=dashed>";
    }
    /*If no subject then print <no subject>*/
    return email['subject'] ?
        getSubjectLineCSSized(escapeWithRegex(email['subject'])) :
        getSubjectLineCSSized("&lt;no subject&gt;");
}

function getContent(message) {
    return message['content_html'] ? message['content_html'] : "[no body]";
}

function getInitialEmailContent(numThreads) {
    let initialCss = "<font size=-1 color=#777>";
    let numMessages = numThreads > 1 ? numThreads + " messages " :
        numThreads + " message ";
    let endingCss = "</font> <hr class=dashed>";
    return initialCss + numMessages + endingCss;
}

/* Returns relevant HTML content for emails */
function formatEmails(emails, options) {
    return emails.map(function(email) {
        let subjectLine = getSubjectLine(email, options['subject']);
        let totalThreads = email['total_threads'].length;
        let emailContent = subjectLine + getInitialEmailContent(totalThreads);

        /* Messages
         * Have to get keys of email.threads object from total_threads
         * Fold over all threads and combine into one HTML string that
         * will be printed.
         */

        return email['total_threads'].reduce(function(acc, threadId) {
            /* sender/receiver */
            /* don't change order of these lines */
            let message = (email['threads'])[threadId];
            let fromLine = getFromLine(message, options['from']);
            let toLine = getToLine(message, options['to']).replace(/(,\s$)/g, "");
            let dateTime = getDateTime(message, options['datetime']);
            let divider = "</font><br><hr>";

            return {
                'emailContent': acc['emailContent'] +
                    fromLine + toLine + dateTime + divider +
                    getContent(message) +
                    "<br><br><font size=-2 color=#777>" +
                    acc['messageCount'] + " / " + totalThreads +
                    "</font><br><hr class=dashed>",
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

function handleProxified(src, inboxId, canonicalUrl) {
    let matcher = src.match(/chrome-extension:\/\/[a-zA-Z]*\/printpage\.html?(.*)/);
    if (matcher) {
        let proxyUrl = canonicalUrl + inboxId + "/" + matcher[1];
        DEV && console.debug(CONSOLE_STRINGS.proxified_debug + proxyUrl);
        /* the image has been proxied */
        return proxyUrl;
    }

    return src;
}

chrome.runtime.onMessage.addListener(
    function messageListener(message, sender, sendResponse) {
        let emails = message['emails'];
        let options = message['options'];
        let inboxId = message['inboxId'];
        let canonicalUrl = message['url'];

        DEV && console.debug(CONSOLE_STRINGS.inboxId_debug);
        DEV && console.debug(inboxId);
        DEV && console.debug(CONSOLE_STRINGS.options_debug);
        DEV && console.debug(options);
        DEV && console.debug(CONSOLE_STRINGS.url_debug);
        DEV && console.debug(canonicalUrl);

        if (emails) {
            /* Set title: */
            document.title = emails.length + " email" + (emails.length == 1 ? "" : "s");
            insertInPage((formatEmails(emails, options)));
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
            images[i].src = handleProxified(images[i].src, inboxId, canonicalUrl);
            images[i].src += "?t=" + new Date().getTime();
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
