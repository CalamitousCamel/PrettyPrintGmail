'use strict';


// Start
getSelectedThreadIds()
    .then((selectedThreadIds) => {
        chrome.runtime.sendMessage({ threadIds: selectedThreadIds })
    })
    .catch(function(error) {
        console.log(error);
    });
