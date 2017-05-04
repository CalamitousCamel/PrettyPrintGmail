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

// Returns relevant HTML content for emails
function formatEmails(emails) {
    return emails.map(function(email) {
        let subjectLine = "<hr><font size=+1><b>" + email.subject + "</b></font><br>";
        console.log(email);
        let emailContent = subjectLine + "<font size=-1 color=#777>" +
            email.total_threads.length + " messages </font> <hr>";
        // Messages
        // Have to get keys of email.threads object from total_threads
        return email.total_threads.reduce(function(acc_emailContent, cur_threadId) {
            // sender/receiver
            let message = email.threads[cur_threadId];
            let fromLine = "<font size=-1><b>" +
                message.from +
                "</b> [" +
                message.from_email +
                "]<br>";
            let toLine = "To: " +
                message.to.slice(1).reduce(function(acc, cur) {
                    return acc.replace("<", "[") + acc.replace(">", "]") + ", " + cur;
                }, message.to[0]) +
                "</font><br><br>";
            return acc_emailContent +
                fromLine + toLine +
                message.content_html +
                "<br><hr><br>";
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
        // Check if all images have finished loading
        let images = document.getElementsByTagName("img");
        let counter = images.length;

        for (let i = images.length - 1; i >= 0; i--) {
            if (images[i].complete) counter--;
            else {
                images[i].onload = images[i].onerror = function() {
                    counter--;
                }
            }
            // Invalidate cached image / reload image at this point.
            // The onload function is flaky if not called before setting src
            // However, I'm confused as to how the image can be incomplete
            // and still the onerror function does not fire.
            images[i].src += "?" + new Date().getTime();
        }
        // Check every 500 ms
        let interval = setInterval(function() {
            if (counter <= 0) {
                clearInterval(interval);
                window.print();
            }
        }, 500);
    }
);
