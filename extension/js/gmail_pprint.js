// Delete header which right now is the first table. Future changes to the print view might break this.
var tables = document.getElementsByTagName("TABLE");
tables[0].parentNode.removeChild(tables[0])