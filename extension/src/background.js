'use strict';

/** @define {boolean} */
var DEV = true;
/** @define {boolean} */
var NOT_COMPILED = true;
/**
Helper functions that are small enough to be duplicated
*/
function contains(container, element) {
    return container.indexOf(element) > -1;
}

function inGmail(urlElements) {
    return contains(urlElements, "mail.google.com");
}

// The thread id is a 64 bit hex
function isThreadId(str) {
    return /^[0-9a-f]{16,}$/i.test(str);
}

/* This is set in start function */
var INBOX_ID = -1;
var URL = "";

/**
    NOTE: We cannot access window object from background.
 */

var CONSOLE_STRINGS = {
    update_info: "[PrettyPrintGmail] Updated extension to " + chrome.runtime.getManifest().version + "!",
    clearing_badge_debug: "[PrettyPrintGmail] Clearing badge",
    print_called_debug: "[PrettyPrintGmail] print() called",
    print_emails_called_debug: "[PrettyPrintGmail] printEmails() called",
    fetch_emails_err: "[PrettyPrintGmail] Error while fetching/cleaning email data",
    no_emails_warn: "[PrettyPrintGmail] No emails selected",
    printing_single_debug: "[PrettyPrintGmail] Printing single email",
    printing_multiple_debug: "[PrettyPrintGmail] Printing multiple emails",
    fetched_emails_debug: "[PrettyPrintGmail] Fetched emails successfully",
    fetched_emails_no_response_err: "[PrettyPrintGmail] No response from fetched emails",
    fetched_emails_invalid_response_err: "[PrettyPrintGmail] Invalid response from fetched emails",
    reloaded_ext_debug: "---- [PrettyPrintGmail] Reloaded extension at ---- " + (new Date().toLocaleString()),
    inboxId_debug: "[PrettyPrintGmail] Got inboxId: ",
    inboxId_warn: "[PrettyPrintGmail] Could not get inbox id",
    start_debug: "[PrettyPrintGmail] Clicked on extension icon",
}

/**
 * Get the current URL. Citation: https://developer.chrome.com/extensions/getstarted
 * @param {function(string)} callback - called when the URL of the current tab
 *   is found.
 */
function get_current_tab_url(callback) {
    var queryInfo = {
        active: true,
        currentWindow: true
    };
    chrome.tabs.query(queryInfo, function(tabs) {
        var tab = tabs[0];
        var url = tab.url;
        console.assert(typeof url == 'string', 'tab.url should be a string');
        callback(url);
    })
};

/* Done this way so I can refactor at some point */
function getInboxId() {
    return INBOX_ID;
}

/* Done this way so I can refactor at some point */
function getCanonicalUrl() {
    return URL.substring(0, URL.indexOf("/u/") + "/u/".length);
}

function isNumeric(number) {
    return !isNaN(parseFloat(number)) && isFinite(number);
}

/* Ideally we want to get inbox number in this function only but
 * that would mean getting current tab url using Chrome api
 * and we already do that once in start function so use a shared
 * global variable to get around that for now
 */
function print(active, emails, options) {
    let inboxId = getInboxId();
    if (!isNumeric(inboxId) || inboxId < 0) {
        console.warn(CONSOLE_STRINGS.inboxId_warn);
    }

    DEV && console.debug(CONSOLE_STRINGS.inboxId_debug + inboxId);

    let canonicalUrl = getCanonicalUrl();

    DEV && console.debug(CONSOLE_STRINGS.print_called_debug);
    DEV && console.debug(emails);
    chrome.tabs.create({
        url: chrome.extension.getURL('printpage.html'),
        active: active
    }, function(newTab) {
        chrome.tabs.onUpdated.addListener(function(tabId, info) {
            if (info.status == "complete" && tabId == newTab.id) {
                chrome.tabs.sendMessage(newTab.id, {
                    'emails': emails,
                    'options': options,
                    'inboxId': inboxId,
                    'url': canonicalUrl
                });
                setBrowserAction({
                    'text': "Done",
                });
                setTimeout(function() {
                    DEV && console.debug(CONSOLE_STRINGS.clearing_badge_debug);
                    setBrowserAction({
                        'clear': true,
                        'enable': true
                    });
                }, 1000);
            }
        });
    });
}

/*
 * params -> [[clear (boolean) | text (string)] | color (string) |
 * [enable (boolean) | disable (boolean)]]
 */
function setBrowserAction(params) {
    if (params['text']) {
        chrome.browserAction.setBadgeText({ text: params['text'] });
    } else if (params['clear']) {
        chrome.browserAction.setBadgeText({ text: '' });
    }
    if (params['color']) {
        chrome.browserAction.setBadgeBackgroundColor({ color: params['color'] });
    }
    if (params['enable']) {
        chrome.browserAction.enable();
    } else if (params['disable']) {
        chrome.browserAction.disable();
    }
}

/* Handle fetched (or not) emails */
function handleResponse(response) {
    if (response && response['error']) {
        /* error case */
        console.error(CONSOLE_STRINGS.fetch_emails_err)
        console.error(response.error);
        /* Badge setting and clearing */
        setBrowserAction({
            'text': "ERR",
            'color': "red",
            'disable': true
        });
        setTimeout(function() {
            DEV && console.debug(CONSOLE_STRINGS.clearing_badge_debug);
            setBrowserAction({
                'clear': true,
                'enable': true
            });
        }, 3000);
    } else if (response && response['emails']) {
        /* SUCCESS CASE */
        DEV && console.debug(CONSOLE_STRINGS.fetched_emails_debug);
        /* print 'em! */
        restoreOptionsAndPrint(true, response['emails']);
    } else if (response && response['none']) {
        /* No emails selected */
        DEV && console.warn(CONSOLE_STRINGS.no_emails_warn);
        /* Badge setting and clearing */
        setBrowserAction({
            'text': "None",
            'enable': true
        });
        setTimeout(function() {
            DEV && console.debug(CONSOLE_STRINGS.clearing_badge_debug);
            setBrowserAction({
                'clear': true,
            });
        }, 1000);
    } else {
        /* also error cases - can't understand what fetch.js got */
        if (response) {
            /* was debating if this should be DEV &&'ed but I think in this case
             * it is a definite error and I want the user to tell me what happened
             * because it is definitely something that should never happen
             */
            console.error(CONSOLE_STRINGS.fetched_emails_invalid_response_err);
            console.error(response);
        } else {
            console.error(CONSOLE_STRINGS.fetched_emails_no_response_err);
        }
        /* Badge setting and clearing */
        setBrowserAction({
            'text': "ERR",
            'color': "red",
            'disable': true
        });
        setTimeout(function() {
            DEV && console.debug(CONSOLE_STRINGS.clearing_badge_debug);
            setBrowserAction({
                'clear': true,
                'enable': true
            });
        }, 3000);
    }
}

/* Tell fetch.js to fetch currently selected emails and handle response */
/* TODO: return response to caller and let it handle */
function fetchEmailsAndPrint(tabId, viewState) {
    /* handleResponse is passed as callback function */
    chrome.tabs.sendMessage(tabId, { 'viewState': viewState },
        handleResponse
    );
}

/* TODO: call fetchEmailsAndPrint and handle its return using a Promise */
function printEmails(viewState) {
    /* We query tabs to figure out which tab is the Gmail one */
    chrome.tabs.query({
        active: true,
        lastFocusedWindow: true
    }, function(tabs) {
        /* Please wait */
        setBrowserAction({
            'text': "Wait",
            'color': "black",
            'disable': true
        });
        fetchEmailsAndPrint(tabs[0].id, viewState);
    });
}

/* Start: on extension invocation */
chrome.browserAction.onClicked.addListener(function(tab) {
    get_current_tab_url(function(url) {

        DEV && console.debug(CONSOLE_STRINGS.start_debug);

        URL = url;

        let inEmail = false;
        let threadId = "";

        /* if not in gmail, navigate to gmail and skip rest of function */
        if (!inGmail(url)) {
            chrome.tabs.create({
                url: "https://mail.google.com"
            });
            return;
        }

        /* get inbox id */
        let userIndexPrefix = "/u/";
        INBOX_ID = parseInt(url.substring(url.indexOf(userIndexPrefix) +
            userIndexPrefix.length), 10);
        if (!isNumeric(INBOX_ID) || INBOX_ID < 0) {
            console.warn(CONSOLE_STRINGS.inboxId_warn);
        }
        DEV && console.debug(CONSOLE_STRINGS.inboxId_debug + INBOX_ID);

        /* get thread id, if any */
        let hash = url.substring(url.indexOf("#") + "#".length);
        if (hash) {
            threadId = hash.split("/").pop() || "";
            if (threadId && isThreadId(threadId)) {
                inEmail = true;
            }
        }

        if (inEmail) {
            // On a printable email...
            // Print single
            DEV && console.debug(CONSOLE_STRINGS.printing_single_debug);
            let viewState = {
                'inThread': true,
                'threadId': threadId.toLowerCase()
            };
            printEmails(viewState);
        } else {
            DEV && console.debug(CONSOLE_STRINGS.printing_multiple_debug);
            let viewState = {
                'inThread': false,
                'threadId': ""
            };
            printEmails(viewState);
        }
    })
});

/* Check whether new version is installed */
chrome.runtime.onInstalled.addListener(function(details) {
    if (details.reason == "install") {
        /* If first install, set uninstall URL */
        var uninstallGoogleFormLink = 'https://docs.google.com/forms/d/e/1FAIpQLSeKS-A4VWmXGnKc6jEqXpBSyjCuZ5Ot5ceTGyXuqIOxEbduHQ/viewform';
        if (chrome.runtime.setUninstallURL) {
            !DEV && chrome.runtime.setUninstallURL(uninstallGoogleFormLink);
        }
    } else if (details.reason == "update") {
        !DEV && console.info(CONSOLE_STRINGS.update_info);
        DEV && console.debug(CONSOLE_STRINGS.reloaded_ext_debug);
    }
});

/* Restores options and result cache
 * stored in chrome.storage asynchronously
 */
function restoreOptionsAndPrint(active, emails) {
    chrome.storage.sync.get({
        'subject': true,
        'from': true,
        'to': true,
        'datetime': true,
    }, function(options) {
        print(active, emails, options);
    });
}