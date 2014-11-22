msgs = document.getElementsByClassName("message");
for(var i = 0; i < msgs.length; i++) {
    msg = msgs[i];
    msg_table = msg.children[0];
    for (var j=1; j < msg_table.children.length -1; j++) {
        msg_table.removeChild(msg_table.children[j]);
    }
}
