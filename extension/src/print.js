'use strict';

console.log("[PPG][DEBUG] print.js ran at " + new Date().getTime());

// Returns relevant HTML content for emails
function formatEmails(emails) {
    return emails.map(function(email) {
        let subjectLine = "<hr><font size=+1><b>" + email.subject + "</b></font><br>";
        console.log(email);
        let totalThreads = email.total_threads.length;
        let emailContent = subjectLine + "<font size=-1 color=#777>" +
            totalThreads + " messages </font> <hr>";
        // Messages
        // Have to get keys of email.threads object from total_threads
        return email.total_threads.reduce(function(acc, threadId) {
            // sender/receiver
            let message = email.threads[threadId];
            let fromLine = "<font size=-1><b>From: </b>" +
                message.from +
                " [" +
                message.from_email +
                "]<br>";
            let toLine = "<b>To: </b>" +
                message.to.slice(1).reduce(function(acc, cur) {
                    return acc.replace("<", "[") + acc.replace(">", "]") + ", " + cur;
                }, message.to[0]) +
                "</font><br><br>";
            return {
                emailContent: acc.emailContent +
                    fromLine + toLine +
                    message.content_html +
                    "<br><br><font size=-2 color=#777>" +
                    acc.messageCount + " / " + totalThreads +
                    "</font><br><hr><br>",
                messageCount: acc.messageCount + 1
            };
        }, { emailContent: emailContent, messageCount: 1 }).emailContent + "<footer>";
    });
}

function insertInPage(emails) {
    let body = document.body;
    emails.map(function(emailHTML) {
        body.insertAdjacentHTML('beforeend', emailHTML);
    })
}

chrome.runtime.onMessage.addListener(
    function messageListener(message, sender, sendResponse) {
        var emails = message.emails;
        console.log("[DEBUG][PPG][print.js] : In print.js onmessage handler");
        if (emails) {
            // Set title:
            document.title = emails.length + " email" + (emails.length == 1 ? "" : "s");
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
