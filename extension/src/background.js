chrome.browserAction.onClicked.addListener(function(tab) {
	get_current_tab_url(function(url) {
		var splut = url.split("\/");
		var conversationId = splut.pop();
		var positionOfInboxId = 5;
		// Current logic to make sure that we're on a printable email
		var printable = ~splut.indexOf("mail.google.com") &&
		 splut.reduce ( function (acc, str) { return ~str.indexOf("#") || acc }, false );
		var newUrl;
		if (printable) {
			var inbox = splut[positionOfInboxId];
			newUrl = "https://mail.google.com/mail/u/" + inbox + "/?view=pt&search=inbox&th=" + conversationId;
			chrome.tabs.create({url : newUrl}, function(newTab) { 
			chrome.tabs.executeScript(newTab.id, {runAt: "document_end", file: 'src/gmail_pprint.js'});
		});
		} else {
			newUrl = "https://mail.google.com";
			chrome.tabs.create({url : newUrl}); 
		}
	})
});

// https://gist.github.com/SathyaBhat/894012



// console.log("here!")
// var mql = window.matchMedia('print');
// mql.addListener(function(thing) {
// 	if (thing.matches) {
// 		console.log("SHIVANNNN")
// 		alert("hi")
// 	} else {
// 		console.log("AFTER PRINT")
// 		alert("bye")
// 	}
// });

document.addEventListener("keydown", pressedPrint, false);

function pressedPrint(e) {
var keyCode = e.keyCode;
  if(keyCode==13) {
  alert("You hit the enter key.");
  } else {
  alert("Oh no you didn't.");
  }
}

// window.onload  = function(){
//     document.keydown(function(event) {
//         if (event.ctrlKey==true && event.which == '80') { //cntrl + p
//             event.preventDefault();
//         }
//     });
//  });

/**
 * Get the current URL. Citation: https://developer.chrome.com/extensions/getstarted
 * @param {function(string)} callback - called when the URL of the current tab
 *   is found.
 */
 function get_current_tab_url(callback) {
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
