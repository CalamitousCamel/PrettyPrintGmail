// NOTE: ~bar.indexOf("foo") is a nicer way of saying bar contains foo.
chrome.browserAction.onClicked.addListener(function(tab) {
	getCurrentTabUrl(function(url) {
		var splut = url.split("\/")
		var conversation_id = splut.pop()
		// Current logic to make sure that we're on a printable email
		var printable = ~splut.indexOf("mail.google.com") &&
		 splut.reduce ( function (acc, str) { return ~str.indexOf("#") || acc }, false )
		 
		var new_url;
		if (printable) {
			new_url = "https://mail.google.com/mail/u/0/?view=pt&search=inbox&th=" + conversation_id
			chrome.tabs.create({url : new_url}, function(newTab) { 
			chrome.tabs.executeScript(newTab.id, {runAt: "document_end", file: 'src/gmail_pprint.js'});
		});
		} else {
			new_url = "https://mail.google.com"
			chrome.tabs.create({url : new_url}) 
		}
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
