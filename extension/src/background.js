'use strict';

/** @define {boolean} */
var DEV = true;

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
    "clearing_badge_debug": "[PPG][DEBUG] Clearing badge [background.js]",
    print_called_debug: "[PPG][DEBUG] print() called [background.js]",
    print_emails_called_debug: "[PPG][DEBUG] printEmails() called [background.js]",
    fetch_emails_err: "[PPG][ERR] Error while fetching email data [background.js]",
    no_emails_warn: "[PPG][WARN] No emails selected [background.js]",
    printing_single_debug: "[PPG][DEBUG] Printing single email [background.js]",
    printing_multiple_debug: "[PPG][DEBUG] Printing multiple emails [background.js]",
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

function print(active, emails) {
    DEV && console.debug(CONSOLE_STRINGS.print_called_debug);
    chrome.tabs.create({
        url: chrome.extension.getURL('printpage.html'),
        active: active
    }, function(newTab) {
        chrome.tabs.onUpdated.addListener(function(tabId, info) {
            if (info.status == "complete" && tabId == newTab.id) {
                chrome.tabs.sendMessage(newTab.id, { emails: emails });
                chrome.browserAction.setBadgeText({ text: "Done" });
                setTimeout(function() {
                    DEV && console.debug(CONSOLE_STRINGS.clearing_badge_debug);
                    chrome.browserAction.setBadgeText({ text: '' });
                    chrome.browserAction.enable();
                }, 1000);
            }
        });
    });
}

function printEmails(viewState) {
    chrome.tabs.query({
            active: true,
            lastFocusedWindow: true
        },
        function(tabs) {
            // Please wait
            chrome.browserAction.setBadgeText({ text: "Wait" });
            chrome.browserAction.disable();
            chrome.browserAction.setBadgeBackgroundColor({ color: "black" });
            console.log();
            chrome.tabs.executeScript({
                runAt: "document_end",
                file: "src/fetch_selected_emails_data.js" + (DEV ? "" : ".min")
            }, function() {
                chrome.tabs.sendMessage(tabs[0].id, { viewState: viewState }, function(response) {
                    if (response && response.error) {
                        console.error(CONSOLE_STRINGS.fetch_emails_err)
                        console.error(response.error);
                        chrome.browserAction.setBadgeText({ text: "ERR" });
                        chrome.browserAction.setBadgeBackgroundColor({ color: "red" });
                        chrome.browserAction.disable();
                        setTimeout(function() {
                            DEV && console.debug(CONSOLE_STRINGS.clearing_badge_debug);
                            chrome.browserAction.setBadgeText({ text: '' });
                            chrome.browserAction.enable();
                        }, 3000);
                    } else if (response && response.emails) {
                        print(true, response.emails);
                    } else if (response && response.none) {
                        DEV && console.warn(CONSOLE_STRINGS.no_emails_warn);
                        chrome.browserAction.setBadgeText({ text: "None" });
                        chrome.browserAction.enable();
                        setTimeout(function() {
                            DEV && console.debug(CONSOLE_STRINGS.clearing_badge_debug);
                            chrome.browserAction.setBadgeText({ text: '' });
                        }, 1000);
                    } else {
                        chrome.browserAction.setBadgeText({ text: "" });
                        chrome.browserAction.enable();
                    }
                });
            });
        }
    );
}

// Start
chrome.browserAction.onClicked.addListener(function(tab) {
    get_current_tab_url(function(url) {
        var urlElements = url.split("\/");
        var threadId = urlElements.pop();
        var positionOfInboxId = 5;
        var inboxNumber = urlElements[positionOfInboxId];
        var canonicalUrl = "https://mail.google.com/mail/u/";
        if (isThreadId(threadId.toLowerCase())) {
            // On a printable email...
            // Print single
            DEV && console.debug(CONSOLE_STRINGS.printing_single_debug);
            let viewState = {
                inThread: true,
                threadId: threadId.toLowerCase()
            };
            printEmails(viewState);
        } else if (inGmail(urlElements)) {
            DEV && console.debug(CONSOLE_STRINGS.printing_multiple_debug);
            let viewState = {
                inThread: false,
                threadId: ""
            };
            printEmails(viewState);
        } else {
            // Just go to Gmail
            chrome.tabs.create({
                url: "https://mail.google.com"
            });
        }
    })
});

// Check whether new version is installed
chrome.runtime.onInstalled.addListener(function(details) {
    if (details.reason == "install") {
        // First install
        // Set uninstall URL
        var uninstallGoogleFormLink = 'https://docs.google.com/forms/d/e/1FAIpQLSeKS-A4VWmXGnKc6jEqXpBSyjCuZ5Ot5ceTGyXuqIOxEbduHQ/viewform';
        if (chrome.runtime.setUninstallURL) {
            chrome.runtime.setUninstallURL(uninstallGoogleFormLink);
        }
    } else if (details.reason == "update") {
        var thisVersion = chrome.runtime.getManifest().version;
        console.info("[PPG][INFO] Updated from " + details.previousVersion + " to " + thisVersion + "!");
    }
});
