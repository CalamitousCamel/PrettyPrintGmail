chrome.browserAction.onClicked.addListener(function(tab) {
  console.log('Cleaning up your email!');
  chrome.tabs.executeScript(null, {file: "gmail_pprint.js"});
});