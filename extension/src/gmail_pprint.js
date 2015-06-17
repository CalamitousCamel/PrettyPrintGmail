// Get...
// Gmail header, which (at least for now) is the first table
var tables = document.getElementsByTagName("table");
// receiver + sender cruft. The email id that shows up next to the name should be enough, methinks.
var receiver_sender = document.getElementsByClassName("recipient");
// attachment images
var attachments = document.getElementsByClassName("att");

// Remove...
tables[0].parentNode.removeChild(tables[0])
deleteAll(receiver_sender)
deleteAll(attachments)

// At the end, force-open print dialog
window.print()

// HELPER FUNCTION: delete all matched nodes + their children
function deleteAll(collection) {
	for (var i = 0; i < collection.length; i++) {
		// Delete all children (so sad)
		while (collection[i].firstChild) {
			collection[i].removeChild(collection[i].firstChild);
		}
	}
}
