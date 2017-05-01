'use strict';

/*
PROGRESS UPDATE: need to find way to prevent chrome from bringing up print dialog (remove that js). I can intercept network requests, does that help?
*/

// Helper function to delete all matched nodes + their children
function deleteAll(collection) {
    for (var i = 0; i < collection.length; i++) {
        // Delete all children (so sad)
        while (collection[i].firstChild) {
            collection[i].removeChild(collection[i].firstChild);
        }
    }
}

// var bodycontainer = document.createElement('div');
// bodycontainer.className = "bodycontainer";
var bodycontainer = document.getElementsByClassName("bodycontainer")[0];
document.head.insertAdjacentElement('afterend', bodycontainer)

var maincontent = document.getElementsByClassName("maincontent")[0];
while (maincontent.firstChild) {
    maincontent.removeChild(maincontent.firstChild);
}
var sheet = window.document.styleSheets[0]
sheet.insertRule('.bodycontainer { font-size:13px } ', sheet.cssRules.length);
sheet.insertRule('hr {border-top: 1px dashed #8c8b8b;} ', sheet.cssRules.length);
sheet.insertRule('@media print { footer {page-break-after: always;} } ', sheet.cssRules.length);
// @media print {
//     footer {page-break-after: always;}
// }
// document.body.onload = function() {
//     console.log("this executed");
// };
// window.onload = function() {
//     console.log("this executed");
// };


var e = document.body;
e.parentNode.removeChild(e);

// var scripts = document.getElementsByTagName('script');
// var i = scripts.length;
// while (i--) {
//     console.log(scripts[i]);
//     scripts[i].parentNode.removeChild(scripts[i]);
// }

// var scripts = document.getElementsByTagName('script');
// document.body.onload = function() {
//     console.log("this executed");
// };

// document.body.style.backgroundColor = "red";


function formatEmails(emails) {
    console.log("in format emails");
    return emails.map(function(email) {
        let subject = email.subject;
        var emailContent = "<hr><font size=+1><b>" + subject + "</b></font><br>";
        emailContent += "<font size=-1 color=#777>" + email.total_threads.length + " messages </font> <hr>"
            // console.log(email.total_threads);
        email.total_threads.map(function(threadId) {
            var thread = email.threads[threadId];
            emailContent += thread.content_html + "<br><hr><br>";
        emailContent += "<footer>"
        });
        // console.log(email);
        return emailContent;
    });
}

function insertInPage(emailText) {
    var body = document.getElementsByClassName("bodycontainer")[0];
    console.log("inserting in page");
    console.log(body);
    body.insertAdjacentHTML('beforeend', emailText);
}

function insertInPageAll(emails) {
    console.log("inserting in page all");
    emails.map(function(email) {
        insertInPage(email);
    })
}

chrome.runtime.onMessage.addListener(
    function messageListener(message, sender, sendResponse) {
        var emails = message.emails;
        console.log("[DEBUG][PPG][print.js] : In print.js");
        if (emails) {
            // rm rf /

            // append HTML
            // var html = [];
            // emails.map(function(email) {
            //     email.threads
            // });
            console.log(emails);
            console.log("emails is set");
            insertInPageAll((formatEmails(emails)));
            // console.dir(emails)
        }
        // chrome.runtime.onMessage.removeListener(messageListener);

        // Get...
        // Gmail header, which (at least for now) is the first table
        var tables = document.getElementsByTagName("table");
        // receiver + sender cruft. The email id that shows up next to the name should be enough
        var receiverSender = document.getElementsByClassName("recipient");
        // attachment images
        var attachments = document.getElementsByClassName("att");

        // Remove...
        tables[0].parentNode.removeChild(tables[0]);
        deleteAll(receiverSender);
        deleteAll(attachments);

        // At the end, force-open print dialog
        // window.print();
    }
);
