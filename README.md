<p align="center">
  <img src="/extension-icon-128.png"/>
</p>

# Pretty Print for Gmail

[![Chrome Web Store](https://img.shields.io/chrome-web-store/d/gdanfldekhdgkbmdoeapbgbcpfglkflg.svg)]()

Pretty print Gmail emails. [Chrome extension](https://chrome.google.com/webstore/detail/pretty-print-gmail/gdanfldekhdgkbmdoeapbgbcpfglkflg). Get rid of that clunky Gmail logo and other visual clutter while printing emails.

## Why would I want this?

I hated it when Gmail would completely mess up my email when I wanted to print (cat emojis my own):

<p align="center">
  <img src="/screenshots/screenshot-before.png"/>
  <br><br>
  <p align="center"><sub>Just. Why would I want this, Gmail.</sub></p>
</p>

So I made [an extension](https://chrome.google.com/webstore/detail/pretty-print-gmail/gdanfldekhdgkbmdoeapbgbcpfglkflg) that would clean up the print view:

<p align="center">
  <img src="/screenshots/screenshot-after.png"/>
  <br><br>
  <p align="center"><sub>omg so clean!</sub></p>
</p>

I released it, and people seemed to like it. I got a lot of feature requests, so I kept adding features, until at this point you can batch print emails, print threads, and print individual emails in threads.

## Features and Usage

### Multiple Printing
From the main Gmail page, select all the emails you want to print, and press the extension icon ![orange printer](/extension/assets/icon-16.png?raw=true "extension icon"). Alternatively, you can press <kbd>Alt + P</kbd> (extension shortcut), but if that is overriden by something else then it won't work. 

<p align="center">
  <img src="/screenshots/screenshot-multiple-printing-before.png"/>
  <br><br>
  <p align="center"><sub><em>Select multiple emails from the main Gmail page and press extension icon</em></sub></p>
</p>

<p align="center">
  <img src="/screenshots/screenshot-multiple-printing-after.png"/>
  <br><br>
  <p align="center"><sub><em>All of them are combined in a print view</em></sub></p>
</p>

Print as many emails as you like! You can print by label, category, etc. 

If you select too many emails to print, things might slow down for a bit - please be patient!

### Single Thread Printing
If you want to pretty print one thread, click on the email thread. Now press the extension icon ![orange printer](/extension/assets/icon-16.png?raw=true "extension icon") or the shortcut <kbd>Alt + P</kbd>. 

### Single Email in Thread Printing
If you want to pretty print a **single message** in a long threaded conversation, then this extension supports that as well! Custom styles are inserted for the to-be-printed email. Do the following:

- Open the message you want to print
- Click the down arrow next to the reply button, at the top-right corner of the message
- Select Print. The email should be all cleaned up!

<p align="center">
  <img src="/screenshots/screenshot-single-printing-before.png"/>
  <br><br>
  <p align="center"><sub><em>Click on Print button</em></sub></p>
</p>

<p align="center">
  <img src="/screenshots/screenshot-single-printing-after.png"/>
  <br><br>
  <p align="center"><sub><em>Pretty printed single email!</em></sub></p>
</p>


### Installation
Simply head on over to the [Chrome Web Store](https://chrome.google.com/webstore/detail/pretty-print-gmail/gdanfldekhdgkbmdoeapbgbcpfglkflg) and install it. 

### Requirements
Just Google Chrome!

### Press
[5 Lesser Known Google Chrome Extensions for Gmail You Should be Using](http://techpp.com/2017/06/02/gmail-chrome-extensions/)

### Donations
If you use this extension, please consider donating:
- Bitcoin : [1JRWhcvaR2syKguSeZcQv3CeGqfwFQ49y1](https://blockchain.info/address/1JRWhcvaR2syKguSeZcQv3CeGqfwFQ49y1)
- PayPal : [paypal.me/shivankaul/2](paypal.me/shivankaul/2)

This project (especially the multiple printing feature) took (takes) a ridiculous amount of time and effort to develop. Your donations help me devote time to features/bug-fixes by having to spend less time earning money to buy oatmeal. Because oatmeal is the best. Oatmeal + yogurt + berries + banana + flaxseed + peanut butter. You're welcome.

### Known Bugs
If you have inline images in your emails, they might not be loaded correctly because the cleaned up emails are inserted into a new printing page and this may violate the same-origin policy. I'm working on this - in case there is active interest in solving this issue, I'll work on this, well, more (so please let me know!).

### Acknowledgements
Icon credits: Plainicon from www.flaticon.com.

