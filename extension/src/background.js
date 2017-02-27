function contains(container, element) {
    return container.indexOf(element) > -1;
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
                for (tid of request.threadIds) {
                    print(url + tid, false);
                }
            }
            chrome.runtime.onMessage.removeListener(messageListener);
        }
    );
}

// Are in inbox
//	- get selected emails (gmail.get.selected_emails_data())
// Are on thread
//	- get thread id

function inThread(urlElements) {
    return inGmail(urlElements) && urlElements.reduce(function(acc, str) {
        return contains(str, "#") || acc
    }, false);
}

function inGmail(urlElements) {
    return contains(urlElements, "mail.google.com");
}

chrome.browserAction.onClicked.addListener(function(tab) {
    get_current_tab_url(function(url) {
        var urlElements = url.split("\/");
        var threadId = urlElements.pop();
        var positionOfInboxId = 5;
        var inboxNumber = urlElements[positionOfInboxId];
        var canonicalUrl = "https://mail.google.com/mail/u/";
        var printUrl = canonicalUrl + inboxNumber + "/?view=pt&search=inbox&th=";
        // Current logic to make sure that we're on a printable email
        var printable = inThread(urlElements);
        if (printable) {
            // On a printable email
            // Print view url
            print(printUrl + threadId, true);
        } else if (inGmail(urlElements)) {
        	// Print multiple
            chrome.tabs.executeScript({
                runAt: "document_end",
                file: 'src/print_multiple.js'
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

var uninstallGoogleFormLink = 'https://docs.google.com/forms/d/e/1FAIpQLSeKS-A4VWmXGnKc6jEqXpBSyjCuZ5Ot5ceTGyXuqIOxEbduHQ/viewform';

// Set uninstall URL
if (chrome.runtime.setUninstallURL) {
    chrome.runtime.setUninstallURL(uninstallGoogleFormLink);
}
