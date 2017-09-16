'use strict';

/** @define {boolean} */
var DEV = true;
/** @define {boolean} */
var NOT_COMPILED = true;

/* Citation: https://developer.chrome.com/extensions/optionsV2
 * Saves options to chrome.storage.sync.
 */
function saveOptions() {

    var formElements = document.getElementById('settings').elements;

    var subject = formElements['subject']['checked'];
    var fromOpt = formElements['from']['checked'];
    var to = formElements['to']['checked'];
    var datetime = formElements['datetime']['checked'];

    chrome.storage.sync.set({
        'subject': subject,
        'from': fromOpt,
        'to': to,
        'datetime': datetime
    }, function() {
        /* Update status to let user know options were saved. */
        var status = document.getElementById('status');
        status.textContent = 'Options saved!';
        setTimeout(function() {
            status.textContent = '';
        }, 1250);
    });
}

document.getElementById('save').addEventListener('click',
    saveOptions);

function getOptions() {
    /* Modify view */
    chrome.storage.sync.get({
        'subject': true,
        'from': true,
        'to': true,
        'datetime': true
    }, function(items) {
        document.getElementById('subject')['checked'] = items['subject'];
        document.getElementById('from')['checked'] = items['from'];
        document.getElementById('to')['checked'] = items['to'];
        document.getElementById('datetime')['checked'] = items['datetime'];
    });
}

document.addEventListener('DOMContentLoaded', getOptions);
