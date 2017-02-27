var ROW_SELECTOR = ROW_SELECTOR || "zA yO";
var SELECTED_SELECTOR = SELECTED_SELECTOR || "zA yO x7";


function getViewData() {
    // Get all scripts
    var scripts = document.getElementsByTagName('script'),
        currentScriptText, varViewDataPos, viewDataScript, viewData;

    // Look for where VIEW_DATA is defined
    for (var i = 0; i < scripts.length; i++) {
        currentScriptText = scripts[i].textContent;
        varViewDataPos = currentScriptText.indexOf("var VIEW_DATA=");
        if (varViewDataPos >= 0) {
            // Toss everything before VIEW_DATA is defined
            viewDataScript = currentScriptText.slice(varViewDataPos);
            break;
        }
    }

    // Eval in closure (to be slightly less gross)
    return (function(script) {
        eval(script);
        return VIEW_DATA;
    })(viewDataScript);
}

function getThreadIds(viewData) {
    return viewData[3][2].map(function(thread) {
        return thread[0];
    })
}

/*
    Figure out unique ids of all selected trs
*/
function getSelectedThreadIds() {
    let threadIds = [];
    let allThreadIds = getThreadIds(getViewData());
    // return an array of ids as strings
    var allRows = document.getElementsByClassName(ROW_SELECTOR);
    // Get position of all the ones that have x7 in class name
    for (var i = 0; i < allRows.length; i++) {
        if (allRows[i].className == SELECTED_SELECTOR) {
            threadIds.push(allThreadIds[i]);
        }
    }
    return threadIds;
}

function main() {
    var selectedThreadIds = getSelectedThreadIds();
    console.log("[DEBUG][PPG]: In print_multiple.js, selectedThreadIds: " + selectedThreadIds);
    chrome.runtime.sendMessage({ threadIds: selectedThreadIds });
}

// Kick off everything
main();
