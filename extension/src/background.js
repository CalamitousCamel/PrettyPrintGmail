'use strict';

// The thread id is a 64 bit hex
function isThreadId(str) {
    return /^[0-9a-f]{16}$/i.test(str);
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
    console.log("[PPG][DEBUG] Print called in background js");
    chrome.tabs.create({
        url: chrome.extension.getURL('printpage.html'),
        active: active
    }, function(newTab) {
        chrome.tabs.executeScript(newTab.id, {
            code: "",
            runAt: 'document_end'
        }, function() {
            console.log("Sending message at " + new Date().getTime());
            chrome.tabs.sendMessage(newTab.id, { emails: emails });

        });
    });
}

function printEmails(viewState) {
    chrome.tabs.query({
            active: true,
            lastFocusedWindow: true
        },
        function(tabs) {
            chrome.tabs.executeScript({ file: "lib/helper.js" }, function() {
                chrome.tabs.executeScript({
                    runAt: "document_end",
                    file: "src/fetch_selected_emails_data.js"
                }, function() {
                    chrome.tabs.sendMessage(tabs[0].id, { viewState: viewState }, function(response) {
                        if (response && response.emails) {
                            print(false, response.emails);
                        }
                    });
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
            console.log("[PPG][DEBUG] Printing single email.");
            let viewState = {
                inThread: true,
                threadId: threadId.toLowerCase()
            };
            printEmails(viewState);
        } else if (inGmail(urlElements)) {
            console.log("[PPG][DEBUG] Printing multiple emails.");
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
        console.log("[PPG][INFO] Updated from " + details.previousVersion + " to " + thisVersion + "!");
    }
});
