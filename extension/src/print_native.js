'use strict';

/** @define {boolean} */
var DEV = true;

let bodycontainer = document.getElementsByClassName("bodycontainer")[0];
document.head.parentNode.insertBefore(bodycontainer, document.head.nextSibling);

let e = document.body;
e.parentNode.removeChild(e);

var maincontent = document.getElementsByClassName("maincontent")[0];
while (bodycontainer.firstChild != maincontent) {
    bodycontainer.removeChild(bodycontainer.firstChild);
}

var sheet = window.document.styleSheets[0]
sheet.insertRule('.bodycontainer { font-size:13px } ', sheet.cssRules.length);
sheet.insertRule('hr {border-top: 1px dashed #8c8b8b;} ', sheet.cssRules.length);
sheet.insertRule('@media print { footer {page-break-after: always;} } ', sheet.cssRules.length);

window.print();
