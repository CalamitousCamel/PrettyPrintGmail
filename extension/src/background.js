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
    return /^[0-9a-f]{16}$/i.test(str);
}

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

function print(active, emails, options, inboxId) {
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
                    'inboxId': inboxId
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
        DEV && console.debug(CONSOLE_STRINGS.inboxId_debug);
        DEV && console.debug(response['inboxId']);
        /* print 'em! */
        restoreOptionsAndPrint(true, response['emails'], response['inboxId']);
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

function fetchEmails(tabId, viewState, inboxId) {
    /* handleResponse is passed as callback function */
    chrome.tabs.sendMessage(tabId, { 'viewState': viewState, 'inboxId': inboxId },
        handleResponse
    );
}

function printEmails(viewState, inboxId) {
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
        fetchEmails(tabs[0].id, viewState, inboxId);
    });
}

/* Start: on extension invocation */
chrome.browserAction.onClicked.addListener(function(tab) {
    get_current_tab_url(function(url) {
        var urlElements = url.split("\/");
        var threadId = urlElements.pop();
        var positionOfInboxId = 5;
        var inboxNumber = urlElements[positionOfInboxId];
        var canonicalUrl = "http://mail.google.com/mail/u/";
        if (isThreadId(threadId.toLowerCase())) {
            // On a printable email...
            // Print single
            DEV && console.debug(CONSOLE_STRINGS.printing_single_debug);
            let viewState = {
                'inThread': true,
                'threadId': threadId.toLowerCase()
            };
            printEmails(viewState, inboxNumber);
        } else if (inGmail(urlElements)) {
            DEV && console.debug(CONSOLE_STRINGS.printing_multiple_debug);
            let viewState = {
                'inThread': false,
                'threadId': ""
            };
            printEmails(viewState, inboxNumber);
        } else {
            // Just go to Gmail
            chrome.tabs.create({
                url: "https://mail.google.com"
            });
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
function restoreOptionsAndPrint(active, emails, inboxId) {
    chrome.storage.sync.get({
        'subject': true,
        'from': true,
        'to': true,
        'datetime': true,
    }, function(options) {
        print(active, emails, options, inboxId);
    });
}
