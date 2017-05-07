function pickFirst(arr) {
    return arr.map(function(element) {
        return element[0];
    });
}


function getIndexInParent(node) {
    return Array.from(node.parentNode.children).indexOf(node);
}

function getSelectedRowsIndices() {
    let selectedRows = document.querySelectorAll('[gh="tl"] div[role="checkbox"][aria-checked="true"]');
    // Get indices in table
    return Array.from(selectedRows).map(function(row) {
        return getIndexInParent(row.parentNode.parentNode);
    })
}

function zipWithIndices(arr, indices) {
    return indices.map(function(index) {
        return arr[index];
    })
}

function getSelectedThreadIds() {
    return getVisibleEmails()
        .then((emails) => zipWithIndices(emails, getSelectedRowsIndices()))
}

/*
    Functions from gmail.js library by Kartik Talwar - reimplemented.
    https://github.com/KartikTalwar/gmail.js
*/
function getCurrentPage(hash) {
    hash = hash || window.location.hash;
    var hashPart = hash.split("#").pop().split("?").shift() || "inbox";
    if (hashPart.match(/\/[0-9a-f]{16,}$/gi)) {
        return "email";
    }
    var isTwopart = (hashPart.indexOf("search/") === 0 ||
            hashPart.indexOf("category/") === 0 ||
            hashPart.indexOf("label/") === 0);

    var result = null;
    if (!isTwopart) {
        result = hashPart.split("/").shift();
        return result;
    } else {
        var parts = hashPart.split("/");
        result = parts[0] + "/" + parts[1];
        return result;
    }
};

function makeRequestAsync(_link, method, disable_cache) {
    var link = decodeURIComponent(_link.replace(/%23/g, "#-#-#"));
    method = method || "GET";
    link = encodeURI(link).replace(/#-#-#/gi, "%23");

    let xmlhttp = new XMLHttpRequest();


    return new Promise(
        function(resolve, reject) {


    xmlhttp.onreadystatechange = function() {
        if (xmlhttp.readyState == XMLHttpRequest.DONE ) {
           if (xmlhttp.status == 200) {
            resolve(xmlhttp.responseText);
           }
           else {
            console.error("Request Failed ", xmlhttp.statusText);
               reject('Error thrown: ' + xmlhttp.statusText);
           }
        }

    };

xmlhttp.open(method, link, true);
    xmlhttp.send();

});

};

function getGlobals() {
    // Get all scripts
    var scripts = document.getElementsByTagName('script'),
        currentScriptText, varGlobalsPos, globalsScript, globals;

    // Look for where GLOBALS is defined
    for (var i = 0; i < scripts.length; i++) {
        currentScriptText = scripts[i].textContent;
        varGlobalsPos = currentScriptText.indexOf("var GLOBALS=");
        if (varGlobalsPos >= 0) {
            // Toss everything before GLOBALS is defined
            globalsScript = currentScriptText.slice(varGlobalsPos);
            break;
        }
    }
    return globalsScript;
}

function getIkFromGlobals(globals) {
    return JSON.parse(globals.split(',')[9]);
}

function makeRequest(_link, method, disable_cache) {
    var link = decodeURIComponent(_link.replace(/%23/g, "#-#-#"));
    method = method || "GET";
    link = encodeURI(link).replace(/#-#-#/gi, "%23");

    let xmlhttp = new XMLHttpRequest();

    xmlhttp.onreadystatechange = function() {
        if (xmlhttp.readyState == XMLHttpRequest.DONE ) {
           if (xmlhttp.status == 200) {
            return (xmlhttp.responseText);
           }
           else {
            console.error("Request Failed ", xmlhttp.statusText);
           }
        }

    };

xmlhttp.open(method, link, false);
    xmlhttp.send();

};

function getVisibleEmails_url() {
    var page = getCurrentPage();
    var ik = getIkFromGlobals(getGlobals());
    var url = window.location.origin + window.location.pathname + "?ui=2&ik=" + ik + "&view=tl&num=120&rt=1";

//     var start = $(".aqK:visible .Dj").find("span:first").text().replace(",", "").replace(".", "");
//     console.log("this is from jquery");
// console.log(start);

    var start = document.querySelectorAll(".aqK:not([hidden]) .Dj")[0].firstChild.textContent.replace(",", "").replace(".", "");
    // console.log("This is from regular");
// console.log(start);


    if (start) {
        start = parseInt(start - 1);
        url += "&start=" + start +
            "&sstart=" + start;
    } else {
        url += "&start=0";
    }
    var cat_label = "";
    if (page.indexOf("label/") === 0) {
        url += "&cat=" + page.split("/")[1] + "&search=cat";
    } else if (page.indexOf("category/") === 0) {
        if (page.indexOf("forums") !== -1) {
            cat_label = "group";
        } else if (page.indexOf("updates") !== -1) {
            cat_label = "notification";
        } else if (page.indexOf("promotion") !== -1) {
            cat_label = "promo";
        } else if (page.indexOf("social") !== -1) {
            cat_label = "social";
        }
        url += "&cat=^smartlabel_" + cat_label + "&search=category";
    } else if (page.indexOf("search/") === 0) {
        // var at = $("input[name=at]").val();
        var at = document.querySelector("input[name=at]").value;

        url += "&qs=true&q=" + page.split("/")[1] + "&at=" + at + "&search=query";
    } else if (page === "inbox") {
        // $("div[aria-label='Social']").attr("aria-selected") === "true"
        if (document.querySelector("div[aria-label='Social']").getAttribute("aria-selected") === "true") {
            cat_label = "social";
            url += "&cat=^smartlabel_" + cat_label + "&search=category";
        } else if (document.querySelector("div[aria-label='Promotions']").getAttribute("aria-selected") === "true") {
            cat_label = "promo";
            url += "&cat=^smartlabel_" + cat_label + "&search=category";
        } else if (document.querySelector("div[aria-label='Updates']").getAttribute("aria-selected") === "true") {
            cat_label = "notification";
            url += "&cat=^smartlabel_" + cat_label + "&search=category";
        } else if (document.querySelector("div[aria-label='Forums']").getAttribute("aria-selected") === "true") {
            cat_label = "group";
            url += "&cat=^smartlabel_" + cat_label + "&search=category";
        } else {
            url += "&search=" + "mbox";
        }
    } else {
        url += "&search=" + page;
    }

    return url;
};

function getVisibleEmails_clean(get_data) {
    if (!get_data) {
        return [];
    }
    var data = get_data.substring(get_data.indexOf("["));
    var json = JSON.parse(data);
    var emails = pickFirst(json[0].filter(function(ele) {
        return ele[0] == "tb";
    })[0][2]);

    return emails;
};

function getVisibleEmails() {
    var url = getVisibleEmails_url();
    return makeRequestAsync(url, "GET")
        .then((get_data) => getVisibleEmails_clean(get_data))
}

function contains(container, element) {
    return container.indexOf(element) > -1;
}
