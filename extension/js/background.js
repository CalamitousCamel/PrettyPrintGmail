chrome.browserAction.onClicked.addListener(function(tab) {
	getCurrentTabUrl(function(url) {
		var splut = url.split("\/")
		var conversation_id = splut[splut.length - 1]
		var new_url = "https://mail.google.com/mail/u/0/?view=pt&search=inbox&th=" + conversation_id
		chrome.tabs.create({url : new_url}, function(tabN) { 
			chrome.tabs.executeScript(tabN.id, {runAt: "document_end", file: 'gmail_pprint.js'});
		});
	})

});
/**
 * Get the current URL. Citation: https://developer.chrome.com/extensions/getstarted
 * @param {function(string)} callback - called when the URL of the current tab
 *   is found.
 */
 function getCurrentTabUrl(callback) {
 	var queryInfo = {
 		active: true,
 		currentWindow: true
 	};
 	chrome.tabs.query(queryInfo, function(tabs) {
 		var tab = tabs[0];
 		var url = tab.url;
 		console.assert(typeof url == 'string', 'tab.url should be a string');
 		callback(url);
 	})
 };
