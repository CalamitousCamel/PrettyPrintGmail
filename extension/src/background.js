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

// Set uninstall URL
var uninstallGoogleFormLink = 'https://docs.google.com/forms/d/e/1FAIpQLSeKS-A4VWmXGnKc6jEqXpBSyjCuZ5Ot5ceTGyXuqIOxEbduHQ/viewform';
if (chrome.runtime.setUninstallURL) {
    chrome.runtime.setUninstallURL(uninstallGoogleFormLink);
}

function print(url, active) {
    chrome.tabs.create({
        url: url,
        active: active
    }, function(newTab) {
        chrome.tabs.executeScript(newTab.id, {
            runAt: "document_end",
            file: 'src/print.js'
        });
    });
}

function registerMessageListener(url) {
    chrome.runtime.onMessage.addListener(
        function messageListener(request, sender, sendResponse) {
            if (request.threadIds) {
                for (let tid of request.threadIds) {
                    print(url + tid, false);
                }
            }
            chrome.runtime.onMessage.removeListener(messageListener);
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
        var printUrl = canonicalUrl + inboxNumber + "/?view=pt&search=inbox&th=";
        if (isThreadId(threadId.toLowerCase())) {
            // On a printable email
            // Print view url
            print(printUrl + threadId, true);
        } else if (inGmail(urlElements)) {
            // Print multiple
            chrome.tabs.executeScript({ file: "lib/helper.js" }, function() {
                chrome.tabs.executeScript({ runAt: "document_end", file: "src/print_multiple.js" });
            });
            // Register and immediately de-register message listener
            // Had problem where I was registering multiple listeners
            registerMessageListener(printUrl);
        } else {
            // Just go to Gmail
            printUrl = "https://mail.google.com";
            chrome.tabs.create({
                url: printUrl
            });
        }
    })
});
