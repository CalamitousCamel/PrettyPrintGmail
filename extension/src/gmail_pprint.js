// Get...
// Delete header which right now is the first table. Future changes to the print view might break this.
var tables = document.getElementsByTagName("table");
// Delete receiver + sender cruft. The email id that shows up next to the name should be enough, methinks.
var receiver_sender = document.getElementsByClassName("recipient");
// Remove...
tables[0].parentNode.removeChild(tables[0])
for (var i = 0; i < receiver_sender.length; i++) {
	// Delete all children (so sad)
	while (receiver_sender[i].firstChild) {
		receiver_sender[i].removeChild(receiver_sender[i].firstChild);
	}
}
window.print()
