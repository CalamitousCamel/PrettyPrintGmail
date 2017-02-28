'use strict';

function getGlobals() {
    // Get all scripts
    var scripts = document.getElementsByTagName('script'),
        currentScriptText, varGlobalsPos, globalsScript, globals;

    // Look for where GLOBALS is defined
    for (var i = 0; i < scripts.length; i++) {
        currentScriptText = scripts[i].textContent;
        varGlobalsPos = currentScriptText.indexOf("var GLOBALS=");
        if (varGlobalsPos >= 0) {
            // Toss everything before GLOBALS is defined
            globalsScript = currentScriptText.slice(varGlobalsPos);
            break;
        }
    }
    return globalsScript;
}

function getIkFromGlobals(globals) {
    return JSON.parse(globals.split(',')[9]);
}

function pickFirst(arr) {
    return arr.map(function(element) {
        return element[0];
    });
}

function getIndexInParent(node) {
    return Array.from(node.parentNode.children).indexOf(node);
}

function getSelectedRowsIndices() {
    let selectedRows = document.querySelectorAll('[gh="tl"] div[role="checkbox"][aria-checked="true"]');
    // Get indices in table
    return Array.from(selectedRows).map(function(row) {
        return getIndexInParent(row.parentNode.parentNode);
    })
}

function zipWithIndices(arr, indices) {
    return indices.map(function(index) {
        return arr[index];
    })
}

function getSelectedThreadIds() {
    return getVisibleEmails()
        .then((emails) => zipWithIndices(emails, getSelectedRowsIndices()))
}


// Start
getSelectedThreadIds()
    .then((selectedThreadIds) => {
        chrome.runtime.sendMessage({ threadIds: selectedThreadIds })
    })
    .catch(function(error) {
        console.log(error);
    });
