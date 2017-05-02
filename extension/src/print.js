'use strict';

console.log("[PPG][DEBUG] print.js ran");

var bodycontainer = document.getElementsByClassName("bodycontainer")[0];
document.head.insertAdjacentElement('afterend', bodycontainer)

var e = document.body;
e.parentNode.removeChild(e);

var maincontent = document.getElementsByClassName("maincontent")[0];
while (maincontent.firstChild) {
    maincontent.removeChild(maincontent.firstChild);
}
while (bodycontainer.firstChild != maincontent) {
    bodycontainer.removeChild(bodycontainer.firstChild);
}

var sheet = window.document.styleSheets[0]
sheet.insertRule('.bodycontainer { font-size:13px } ', sheet.cssRules.length);
sheet.insertRule('hr {border-top: 1px dashed #8c8b8b;} ', sheet.cssRules.length);
sheet.insertRule('@media print { footer {page-break-after: always;} } ', sheet.cssRules.length);

// Helper function to delete all matched nodes + their children
function deleteAll(collection) {
    for (var i = 0; i < collection.length; i++) {
        // Delete all children (so sad)
        while (collection[i].firstChild) {
            collection[i].removeChild(collection[i].firstChild);
        }
    }
}

// Returns relevant HTML content for emails
function formatEmails(emails) {
    return emails.map(function(email) {
        let subject = email.subject;
        // Subject
        var emailContent = "<hr><font size=+1><b>" + subject + "</b></font><br>";
        // # of Messages
        emailContent += "<font size=-1 color=#777>" + email.total_threads.length + " messages </font> <hr>";
        // Messages
        // Have to get keys of email.threads object from total_threads
        return email.total_threads.reduce(function(emailContent_acc, threadId_cur) {
            return emailContent_acc + email.threads[threadId_cur].content_html + "<br><hr><br>";
        }, emailContent) + "<footer>";
    });
}

function insertInPage(emails) {
    let body = document.getElementsByClassName("bodycontainer")[0];
    emails.map(function(emailHTML) {
        body.insertAdjacentHTML('beforeend', emailHTML);
    })
}

chrome.runtime.onMessage.addListener(
    function messageListener(message, sender, sendResponse) {
        var emails = message.emails;
        console.log("[DEBUG][PPG][print.js] : In print.js onmessage handler");
        if (emails) {
            insertInPage((formatEmails(emails)));
        }
        // At the end, force-open print dialog
        window.print();
    }
);
