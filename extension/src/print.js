console.log("[DEBUG][PPG]: In print.js ");

// Helper function to delete all matched nodes + their children
function delete_all(collection) {
	for (var i = 0; i < collection.length; i++) {
		// Delete all children (so sad)
		while (collection[i].firstChild) {
			collection[i].removeChild(collection[i].firstChild);
		}
	}
}

// Get...
// Gmail header, which (at least for now) is the first table
var tables = document.getElementsByTagName("table");
// receiver + sender cruft. The email id that shows up next to the name should be enough
var receiverSender = document.getElementsByClassName("recipient");
// attachment images
var attachments = document.getElementsByClassName("att");

// Remove...
tables[0].parentNode.removeChild(tables[0]);
delete_all(receiverSender);
delete_all(attachments);

// At the end, force-open print dialog
window.print();

