var ROW_SELECTOR = ROW_SELECTOR || "zA";
var SELECTED_SELECTOR = SELECTED_SELECTOR || "x7";

function contains(container, element) {
    return container.indexOf(element) > -1;
}

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

function pickFirst(arr) {
    return arr.map(function(element) {
        return element[0];
    });
}

function getThreadIds(viewData) {
    return viewData.map(function(arrayItem) {
        if (arrayItem[0] == "tb") {
            return pickFirst(arrayItem[2]);
        }
    }).filter(function(ele) {
        return ele != undefined
    });
}

function getCategorySelected() {
    // Get the tr containing the div
    let selectedCat = document.querySelector('tr div[aria-selected="true"]').parentNode;
    // Get index in table
    return Array.from(selectedCat.parentNode.children).indexOf(selectedCat);
}

/*
    Figure out unique ids of all selected trs
*/
function getSelectedThreadIds() {
    let threadIds = [];

    // Determine which category we're on
    let selectedCat = getCategorySelected();
    // Return an array of array of ids as strings, and
    // choose the one that belongs to the category we're in
    let allThreadIds = getThreadIds(getViewData())[selectedCat];
    var allRows = document.getElementsByClassName(ROW_SELECTOR);
    // Get position of all the ones that have x7 in class name
    for (var i = 0; i < allRows.length; i++) {
        if (contains(allRows[i].className, SELECTED_SELECTOR)) {
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
