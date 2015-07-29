//https://github.com/ariya/phantomjs/wiki/API-Reference-WebPage#webpage-onConsoleMessage
var webPage= require('webpage')
var fs = require('fs');
var system = require('system')

if (system.args.length === 1) {
  console.log('Usage: deobfuscateme.js <File/URL>');
  phantom.exit();
}

var url = system.args[1];
var page= webPage.create();
var index=1;
//page.navigationLocked= true;

function getRandom(min, max) {
    return min + Math.floor(Math.random() * (max - min + 1));
}

function write_to_file(pre, content)
{
	fs.write(pre+ "_" + index + "_" + getRandom(1,10000)	+ ".js", content, 'w');
	index= index + 1;
}

page.onConsoleMessage = function(msg, lineNum, sourceId) {
    console.log('CONSOLE: ' + msg );
};

page.onAlert = function(msg) {
    console.log('ALERT: ' + msg);
};

page.onClosing = function(closingPage) {
    console.log('The page is closing! URL: ' + closingPage.url);
};

page.onConfirm = function(msg) {
    console.log('CONFIRM: ' + msg);
    return true;  // `true` === pressing the "OK" button, `false` === pressing the "Cancel" button
};

page.onError = function(msg, trace) {
    var msgStack = ['ERROR: ' + msg];
    if (trace && trace.length) {
        msgStack.push('TRACE:');
        trace.forEach(function(t) {
            msgStack.push(' -> ' + t.file + ': ' + t.line + (t.function ? ' (in function "' + t.function + '")' : ''));
        });
    }
    console.error(msgStack.join('\n'));
};

page.onLoadFinished= function () {
	page.clearCookies()
	phantom.exit();
}

page.onLoadStarted = function() {
    var currentUrl = page.evaluate(function() {
        return window.location.href;
    });
    console.log('Current page ' + currentUrl +' will gone...');
    console.log('Now loading a new page...');
};

page.onNavigationRequested = function(url, type, willNavigate, main) {
    console.log('Trying to navigate to: ' + url);
    console.log('Caused by: ' + type);
    console.log('Will actually navigate: ' + willNavigate);
    console.log("Sent from the page's main frame: " + main);
}

page.onPageCreated = function(newPage) {
    console.log('A new child page was created! Its requested URL is not yet available, though.');
    // Decorate
    newPage.onClosing = function(closingPage) {
        console.log('A child page is closing: ' + closingPage.url);
    };
};

page.onResourceRequested = function(requestData, networkRequest) {
    console.log('Request (#' + requestData.id + '): ' + JSON.stringify(requestData));
};

page.onResourceReceived = function(response) {
    console.log('Response (#' + response.id + ', stage "' + response.stage + '"): ' + JSON.stringify(response));
};

page.onResourceTimeout = function(request) {
    console.log('Response (#' + request.id + '): ' + JSON.stringify(request));
};

page.onUrlChanged = function(targetUrl) {
    console.log('New URL: ' + targetUrl);
};

page.onResourceError = function(resourceError) {
    console.log('Unable to load resource (#' + resourceError.id + 'URL:' + resourceError.url + ')');
    console.log('Error code: ' + resourceError.errorCode + '. Description: ' + resourceError.errorString);
};

page.onInitialized= function () {
		page.evaluate(function () {
			var p= window.callPhantom;
			delete window.callPhantom
			Object.defineProperty(window, "mynewname", {
				get: function() { return p;},
				set: function() {}, 
				enumerable: false
			});
			
			var logme= function(dtype, arg) 
			{
				window.mynewname({secret:arg});
			}
			
			
			var oldNavigator= navigator;
			var oldPlugins= oldNavigator.plugins;
			var plugins= {};
			plugins.length= 1;
			plugins.__proto__= oldPlugins.__proto__;
			
			window.navigator= {plugins: plugins};
			window.navigator.__proto__= oldNavigator.__proto__;
			window.navigator.userAgent= 'Mozilla/5.0 (MSIE; Windows NT 6.1; WOW64; Trident/7.0; rv:11.0) like Gecko'
			
			var originaldw= document.write;
			Object.defineProperty(document, "originaldocumentwrite", {
							get: function() { return originaldw;},
							set: function() {}, 
							enumerable: false
			});
					
			document.write= function(arg) { 
				//console.log(arg);
				logme("docwrite", arg);
				//document.originaldocumentwrite(arg);
			};
			
			var original_eval= window.eval;
			Object.defineProperty(window, "originaleval", {
							get: function() { return original_eval;},
							set: function() {}, 
							enumerable: false
			});
					
			window.eval= function(arg) { 
				//console.log(arg);
				logme("eval", arg);
				//window.originaleval(arg);
			};
			
		});
};

page.onCallback= function(obj) 
{
	console.log('Got some data.')
	write_to_file("eval_or_docwrite", obj.secret);
};

page.open(url, function(status) {
	if (status === "success") {
		/*if (page.injectJs('injectme.js')) {
			var title = page.evaluate(function() {
				// returnTitle is a function loaded from our do.js file - see below
				return returnTitle();
			});
			console.log("From injected code. Title= " + title);
		}
		
		var title= page.evaluate(function() {
			return document.title;
		});
		console.log('Finished loading.');
		phantom.exit();*/
	}
});


