// IMPORTANT: This code requires the including file to define the following variables:
//            var urlArray
//            var isPerformDriverCheckUsingAJAX
//            var isCheckDriverWithoutContactingDriver
//            var checkDriverUsingAjaxMethodCallTimeoutMs
//            var currentUrlContext
//            var workstationDriverUrl

// This code is tied to a check for Driver using a client-side AJAX approach, enabled with the v3.9.0 Preference 'CheckDriverUsingAJAX'.
var urlArray;
var CONSTANTS = {
	"driverUrlDiv" : "driverUrlDiv",
	"currentUrlIndex" : "currentUrlIndex",
	"selectedAJAXDriverUrl" : "selectedAJAXDriverUrl",
	"urlStatus_WAITING" : "WAITING",
	"urlStatus_TESTING" : "TESTING",
	"urlStatus_PASSED" : "PASSED",
	"urlStatus_FAILED" : "FAILED",
	"urlStatus_TIMEOUT" : "TIMEOUT",
	"urlStatus_SKIPPED" : "SKIPPED",
	"STATUS_INVALID_PTC_CMD" : "STATUS_INVALID_PTC_CMD",
	"STATUS_TRANSPORT_OFF" : "STATUS_TRANSPORT_OFF",
	"driverStatus_Unknown" : "STATUS_UNKNOWN"
};
var numberOfRetries = 0;
var maximumNumberOfRetries = 7;
var browserIsIE = is_ie;
var browserIsChrome = window.chrome;
var xhr;
var requestTimer;
var JSON = JSON || {};

var timeout_instance
var interval_instance
// implement JSON.stringify serialization
JSON.stringify = JSON.stringify || function(obj) {
	var t = typeof (obj);
	if (t != "object" || obj === null) {
		// simple data type
		if (t == "string")
			obj = '"' + obj + '"';
		return String(obj);
	} else {
		// recurse array or object
		var n, v, json = [], arr = (obj && obj.constructor == Array);
		for (n in obj) {
			v = obj[n];
			t = typeof (v);
			if (t == "string")
				v = '"' + v + '"';
			else if (t == "object" && v !== null)
				v = JSON.stringify(v);
			json.push((arr ? "" : '"' + n + '":') + String(v));
		}
		return (arr ? "[" : "{") + String(json) + (arr ? "]" : "}");
	}
};

if (typeof String.prototype.hashCode != 'function') {
	String.prototype.hashCode = function() {
		var hash = 0;
		if (this.length == 0)
			return hash;
		var i;
		var j = this.length;
		for (i = 0; i < j; i++) {
			char = this.charCodeAt(i);
			hash = ((hash << 5) - hash) + char;
			hash = hash & hash; // Convert to 32bit integer
		}
		return hash;
	}
}

if (typeof String.prototype.startsWith != 'function') {
	String.prototype.startsWith = function(str) {
		return this.slice(0, str.length) == str;
	};
}

if (typeof String.prototype.endsWith !== 'function') {
	String.prototype.endsWith = function(suffix) {
		return this.indexOf(suffix, this.length - suffix.length) !== -1;
	};
}

function createXHR() {
	var functionName = "createXHR(): ";
	consoleLog(functionName + "Entering " + functionName + "...");
	var xhr;
	if (window.XDomainRequest) { // typeof XDomainRequest != "undefined"
		consoleLog(functionName
				+ "IE Browser detected, creating xhr by calling new window.XDomainRequest()...");
		xhr = new window.XDomainRequest();
	} else {
		consoleLog(functionName + "Non-IE Browser detected, creating xhr by calling new XMLHttpRequest()...");
		xhr = new XMLHttpRequest();
	}
	consoleLog(functionName + "typeof xhr is " + (typeof xhr) + "...");
	return xhr;
	consoleLog(functionName + "Exiting " + functionName + "...");
}

function createCORSRequest(method, url) {
	var xhr = new XMLHttpRequest();
	if ("withCredentials" in xhr) {
		// Check if the XMLHttpRequest object has a "withCredentials" property.
		// "withCredentials" only exists on XMLHTTPRequest2 objects.
		xhr.open(method, url, true);
	} else if (typeof XDomainRequest != "undefined") {
		// Otherwise, check if XDomainRequest.
		// XDomainRequest only exists in IE, and is IE's way of making CORS requests.
		xhr = new XDomainRequest();
		xhr.open(method, url);
	} else {
		// Otherwise, CORS is not supported by the browser.
		xhr = null;
	}
	return xhr;
}

function establishDriverUrl() {
	var functionName = "establishDriverUrl(): ";
	consoleLog(functionName + "Entering " + functionName + "...");
	if (urlArray && urlArray.driverUrls && (urlArray.driverUrls.length > 0)) {
		consoleLog(functionName + "urlArray contains "
				+ urlArray.driverUrls.length + " items.");
		initializeDriverUrlVerification();
	} else {
		consoleWarn("WARNING: Could not initialize urlArray from Preferences! No Driver verification can be completed!");
	}
	consoleLog(functionName + "Exiting " + functionName + "...");
}

function initializeDriverUrlVerification() {
	var functionName = "initializeDriverUrlVerification(): ";
	consoleLog(functionName + "Entering " + functionName + "...");
	var driverUrlDiv = document.getElementById(CONSTANTS.driverUrlDiv);
	if (driverUrlDiv) {
		// Setup a currentURL DIV and one for each URL to be checked while pre-calculating each URL's hash value
		driverUrlDiv.appendChild(createDocumentFragment("<div id='" + CONSTANTS.currentUrlIndex + "'>0</div>"));
		driverUrlDiv.appendChild(createDocumentFragment("<div id='" + CONSTANTS.selectedAJAXDriverUrl + "'></div>"));
		var driverUrlVerificationIterator;
		var driverUrlVerificationLength = urlArray.driverUrls.length;
		for (driverUrlVerificationIterator = 0; driverUrlVerificationIterator < driverUrlVerificationLength; driverUrlVerificationIterator++) {
			var currentDriverUrl = urlArray.driverUrls[driverUrlVerificationIterator].driverUrl;
			var urlId = "url_" + currentDriverUrl.hashCode();
			urlArray.driverUrls[driverUrlVerificationIterator].urlId = urlId;
			urlArray.driverUrls[driverUrlVerificationIterator].status = CONSTANTS.urlStatus_WAITING;
			// Empty out the contents of an existing DIV for this URL
			var thisUrlDiv = document.getElementById(urlId);
			if (thisUrlDiv) {
				thisUrlDiv.innerHTML = "";
			}
			driverUrlDiv.appendChild(createDocumentFragment("<div id='" + urlId + "'>" + JSON.stringify(urlArray.driverUrls[driverUrlVerificationIterator]) + "'</div>"));
		}
	}
	// Setup the first URL for testing now...
	var urlDiv = document.getElementById(urlArray.driverUrls[0].urlId);
	if (urlDiv) {
		urlDiv.innerHTML = JSON.stringify(urlArray.driverUrls[0]);
		consoleLog(functionName + CONSTANTS.urlStatus_TESTING + " - "
				+ JSON.stringify(urlArray.driverUrls[0]) + "...");
		// Always use JSONP
		testDriverUrlUsingJQuerygetJSON("true");
	} else {
		consoleWarn("WARNING: Could not find DIV with id '" + urlArray.driverUrls[0].urlId + "' inside the HTML document! " +
				     " No Driver verification can be completed!");
	}
	consoleLog(functionName + "Exiting " + functionName + "...");
}

function generateDriverCheckUrlFromDriverUrl(driverUrl) {
	return driverUrl + "?PTC_CMD=QINFO&PTC_SUCCESS_URL=" + currentUrlContext + "/Success" + "&PTC_FAILURE_URL=" + currentUrlContext + "/Failure" + "&PTC_DEPOSITID=0&format=json";
}

function generateInfoDriverUrl(driverUrl) {
	return driverUrl + "?PTC_CMD=INFO&PTC_SUCCESS_URL=" + currentUrlContext + "/Success" + "&PTC_FAILURE_URL=" + currentUrlContext + "/Failure" + "&PTC_DEPOSITID=0&format=json";
}

function logExceptionMessage(ex, functionName) {
	var exMessage = "";
	if (ex && ex.message) {
		exMessage = ex.message;
	}
	consoleWarn(functionName + "Exception caught while attempting to parse JSON Response ! ex.message='" + exMessage + "'");
}

function stateChangeHandler() {
	var functionName = "stateChangeHandler(): ";
	consoleLog(functionName + "Entering CALLBACK function " + functionName
			+ "...");
	consoleLog(functionName + "xhr.readyState='" + xhr.readyState
			+ "' and xhr.status='" + xhr.status + "' and xhr.statusText='"
			+ xhr.statusText + "'.");
	if (xhr.readyState === 4) {
		if (requestTimer) {
			clearTimeout(requestTimer);
		}
		var currentUrlIndex = parseInt(document
				.getElementById(CONSTANTS.currentUrlIndex).innerHTML);
		var currentDriverUrl = urlArray.driverUrls[currentUrlIndex].driverUrl;
		var currentDriverCheckUrl = generateDriverCheckUrlFromDriverUrl(currentDriverUrl);
		var urlId = urlArray.driverUrls[currentUrlIndex].urlId;
		var currentStatus = urlArray.driverUrls[currentUrlIndex].status;
		if (xhr.status >= 200 && xhr.status < 400) {
			consoleLog(functionName + "SUCCESS: xhr.status='" + xhr.status
					+ "' and xhr.statusText='" + xhr.statusText
					+ "' and xhr.responseText='" + xhr.responseText
					+ "' for Driver URL '"
					+ JSON.stringify(urlArray.driverUrls[currentUrlIndex])
					+ "'.");
			try {
				// Deferring JQuery parsing of the Response to a future release, due to JSON parsing problems.
				// var $jq = jQuery.noConflict();
				// var driverCheckResult = $jq.parseJSON(xhr.responseText);
				// if (driverCheckResult && driverCheckResult.STATUS) {
				// 	consoleLog(functionName + "driverCheckResult.STATUS='" + driverCheckResult.STATUS + "'");
				// 	if (driverCheckResult.STATUS == CONSTANTS.STATUS_INVALID_PTC_CMD) {
				// 		// Old Driver
				// 		consoleLog(functionName + "OLD Driver Found...");
				// 	} else {
				// 		// New Driver
				// 		consoleLog(functionName + "NEW Driver Found...");
				// 	}
				// } else {
				// 	// Did not find a JSON Response as expected, assume this is an old Driver
				// }
			} catch(e) {
				logExceptionMessage(e, functionName);
			}

			urlArray.driverUrls[currentUrlIndex].status = CONSTANTS.urlStatus_PASSED;
			setDriverStatusIndicator("DriverStatusUp");
			document.getElementById(urlId).innerHTML = JSON.stringify(urlArray.driverUrls[currentUrlIndex]);
			validDriverUrl = urlArray.driverUrls[currentUrlIndex].driverUrl;
			// Stop processing URLs now
			var loopIndex;
			var driverUrlsLength = urlArray.driverUrls.length;
			for (loopIndex = (parseInt(currentUrlIndex) + 1); loopIndex < driverUrlsLength; loopIndex++) {
				var loopCurrentUrl = urlArray.driverUrls[loopIndex].url;
				var loopUrlId = urlArray.driverUrls[loopIndex].urlId;
				urlArray.driverUrls[loopIndex].status = CONSTANTS.urlStatus_SKIPPED;
				document.getElementById(loopUrlId).innerHTML = JSON.stringify(urlArray.driverUrls[loopIndex]);
				document.getElementById(CONSTANTS.currentUrlIndex).innerHTML = loopIndex;
			}
			// Tell the Server that we found a Driver
			var selectedAJAXDriverUrlDiv = document.getElementById(CONSTANTS.selectedAJAXDriverUrl);
			if (selectedAJAXDriverUrlDiv) {
				selectedAJAXDriverUrlDiv.innerHTML = validDriverUrl;
			} else {
				var driverUrlDiv = document.getElementById(CONSTANTS.driverUrlDiv);
				if (driverUrlDiv) {
					driverUrlDiv.appendChild(createDocumentFragment("<div id='" + CONSTANTS.selectedAJAXDriverUrl + "'>" + validDriverUrl + "</div>"));
				}
			}
			sendDriverStatus(true);
		} else {
			consoleLog(functionName + "ERROR: xhr.status='" + xhr.status
					+ "' and xhr.statusText='" + xhr.statusText
					+ "' and currentUrlIndex='" + currentUrlIndex + "'.");
			urlArray.driverUrls[currentUrlIndex].status = CONSTANTS.urlStatus_FAILED;
			document.getElementById(urlId).innerHTML = JSON
					.stringify(urlArray.driverUrls[currentUrlIndex]);
			// Make the call for the next URL test, if applicable
			if ((currentUrlIndex < urlArray.driverUrls.length - 1)) {
				currentUrlIndex = parseInt(currentUrlIndex) + 1;
				// Set the currentUrlIndex value BEFORE calling testDriverUrl()
				document.getElementById(CONSTANTS.currentUrlIndex).innerHTML = currentUrlIndex;
				consoleLog(functionName
						+ "About to attempt to test the next Driver Url '"
						+ generateDriverCheckUrlFromDriverUrl(urlArray.driverUrls[currentUrlIndex].driverUrl)
						+ "' with urlIndex '" + currentUrlIndex + "'.");
				testDriverUrl();
			} else {
				consoleLog(functionName
						+ "ERROR: No more DriverUrls are available so setting the DriverStatus to DOWN.");
				// We have run out of Driver URLs to check and none have passed
				// !
				setDriverStatusIndicator("DriverStatusDown");
				// Set a Server flag to indicate that no Driver is running
				// Tell the Server that we did NOT find a Driver
				sendDriverStatus(false);
			}
		}
	}
	consoleLog(functionName + "Exiting CALLBACK function...");
}

function testDriverUrl() {
	var functionName = "testDriverUrl(): ";
	consoleLog(functionName + "Entering " + functionName + "...");
	var currentUrlIndex = parseInt(document
			.getElementById(CONSTANTS.currentUrlIndex).innerHTML);
	var currentDriverCheckUrl = generateDriverCheckUrlFromDriverUrl(urlArray.driverUrls[currentUrlIndex].driverUrl);
	var urlId = urlArray.driverUrls[currentUrlIndex].urlId;
	var currentStatus = urlArray.driverUrls[currentUrlIndex].status;
	if (currentStatus != CONSTANTS.urlStatus_WAITING) {
		// We should only test URLs that are currently WAITING to be tested,
		// otherwise exit early
		consoleLog(functionName + "WARNING: Exiting early from " + functionName
				+ "because url had Status of '" + currentStatus
				+ "' instead of expected Status '"
				+ CONSTANTS.urlStatus_WAITING + "' ! url: "
				+ JSON.stringify(urlArray.driverUrls[currentUrlIndex]));
		return;
	}
	// Set the Status
	urlArray.driverUrls[currentUrlIndex].status = CONSTANTS.urlStatus_TESTING;
	document.getElementById(urlId).innerHTML = JSON
			.stringify(urlArray.driverUrls[currentUrlIndex]);
	consoleLog(functionName + "About to begin Testing URL: "
			+ JSON.stringify(urlArray.driverUrls[currentUrlIndex]) + ".");
	xhr = createXHR();
	// xhr = createCORSRequest("GET", currentDriverCheckUrl);
	if (!xhr) {
		throw new Error("Could not create xhr object after call to createXHR() !");
	}
	if (window.XDomainRequest) {
		// IE Browser
		try {
			consoleLog(functionName + "IE Browser detected...");
			consoleLog(functionName
					+ "IE: About to call xhr.onload = stateChangeHandler...");
			xhr.onload = stateChangeHandler;
			consoleLog(functionName + "IE: About to call xhr.open('GET', '"
					+ currentDriverCheckUrl + "', true)...");
			xhr.open("GET", currentDriverCheckUrl, true);
			consoleLog(functionName
					+ "IE: About to call xhr.send() on currentDriverCheckUrl '"
					+ currentDriverCheckUrl + "'...");
			xhr.send();
		} catch(e) {
			// Don't do anything at this point, just let it fail gracefully so the code won't abort
			logExceptionMessage(e, functionName);
		}
	} else {
		// Non-IE Browser
		try {
			consoleLog(functionName + "Non-IE Browser detected...");
			consoleLog(functionName + "Non-IE: About to call xhr.open('GET', '"
					+ currentDriverCheckUrl + "', true)...");
			xhr.open("GET", currentDriverCheckUrl, true);
			xhr.onreadystatechange = stateChangeHandler;
			consoleLog(functionName
					+ "Non-IE: About to call xhr.send() on currentDriverCheckUrl '"
					+ currentDriverCheckUrl + "'...");
			xhr.send();
		} catch(e) {
			logExceptionMessage(e, functionName);
		}
	}

	requestTimer = setTimeout(
			function() {
				consoleLog(functionName
						+ "Entering xhr.requestTimer TIMEOUT function...");
				var currentUrlIndex = parseInt(document
						.getElementById(CONSTANTS.currentUrlIndex).innerHTML);
				if (xhr) {
					consoleLog(functionName
							+ "Inside xhr.requestTimer TIMEOUT function: currentUrlIndex="
							+ currentUrlIndex + ". About to ABORT...");
					xhr.abort();
				}
				consoleLog(functionName
						+ "Exiting xhr.requestTimer TIMEOUT function...");
			}, checkDriverUsingAjaxMethodCallTimeoutMs);

	consoleLog(functionName + "Exiting " + functionName + "...");
}


function infoDriverUrlUsingJQuerygetJSON(useJSONP, driverUrl, maxTimeout, pollInterval, isRequestFromMaintenancePage) {
	var functionName = "infoDriverUrlUsingJQuerygetJSON(useJSONP='" + useJSONP
		+ "'): ";
	consoleLog(functionName + "Entering " + functionName + "...");

	var currentDriverCheckUrl = generateInfoDriverUrl(driverUrl);
	var errorMessage = "<%= MyMessages.getGlobalValue(CONSTANTS.STATUS_TRANSPORT_OFF) %>";
	var dataType = "json";
	if (useJSONP == "true") {
		dataType = "jsonp";
	}

	var remoteUrl = currentDriverCheckUrl;

	if ($jq) {
		if ($jq.support && ($jq.support.cors != "undefined")) {
			$jq.support.cors = true;
		}
		$jq.ajax({
			type : "GET",
			crossDomain : "true",
			dataType : 'json',
			contentType : "application/json",
			cache : "false",
			url : remoteUrl,
			success : function(data, status) {
				consoleLog(functionName
					+ "Inside success()");
				try {
					toggleAjaxLoader(true, this);
					var driverData = sendDriverDataFromInfoCommand(data.STATUS, data.PTC_XPTINFO, data.PTC_TRANSPORT_TYPE,data.PTC_TRANSPORT_GUID, data.CLN,isRequestFromMaintenancePage);
					var status = "";

					if (driverData && isRequestFromMaintenancePage) {
						status = driverData.split(",")[0].split("=")[1];
						if (driverData.split(",")[6].split("=")[1] != "" || status == CONSTANTS.STATUS_TRANSPORT_OFF) {
							document.getElementById("Form:MaintenanceMessage").style.display = "inline";
							document.getElementById("Form:ErrorMessageID").innerHTML = driverData.split(",")[6].split("=")[1];
						}
						if (driverData.split(",")[6].split("=")[1] != "" && status != CONSTANTS.STATUS_TRANSPORT_OFF) {
						var btn =document.getElementById("Form:CleanButton");
				        btn.disabled="true";	
						}	
						populateValuesForInfoCommand(driverData);
						pollingInit(driverData.split(",")[8].split("=")[1],driverData.split(",")[9].split("=")[1].split("}")[0],maxTimeout,pollInterval);
					}
					// rerender the TransportRecovey page form to render Cleaning recovery steps
					if(!isRequestFromMaintenancePage){
						rerenderForm();
					}
					toggleAjaxLoader(false, this);
					} catch (e) {
					logExceptionMessage(e, functionName);
					toggleAjaxLoader(false, this);
				}
			},
			error : function(data, status) {
				toggleAjaxLoader(true, this);
				var driverData = sendDriverDataFromInfoCommand(CONSTANTS.driverStatus_Unknown,"","","");
				document.getElementById("Form:ErrorMessageID").innerHTML = driverData.split(",")[6].split("=")[1];						
				document.getElementById("Form:MaintenanceMessage").style.display = "inline";
				var btn =document.getElementById("Form:CleanButton");
				btn.disabled="true";				
				populateValuesForErrors(driverData);
				pollingInit(driverData.split(",")[8].split("=")[1],driverData.split(",")[9].split("=")[1].split("}")[0],maxTimeout,pollInterval);
				toggleAjaxLoader(false, this);
				consoleLog(functionName + "Inside error(), currentUrlIndex='" + currentUrlIndex + "' and status='" + status + "'.");
			}
		});
	} else {
		consoleLog(functionName + "No jQuery defined, bypassing check of url '" + remoteUrl + "'.");
	}

	consoleLog(functionName + "Exiting " + functionName + "...");
}

function populateValuesForInfoCommand(driverData){
	            var status = driverData.split(",")[0].split("=")[1];
	            var imageLocation = driverData.split(",")[5].split("=")[1];	
	            document.getElementById("Form:ModelId").innerHTML = driverData.split(",")[1].split("=")[1];
				document.getElementById("Form:VendorID").innerHTML = driverData.split(",")[2].split("=")[1];
				if(document.getElementById("Form:SerialID")!=null)
				{		
				document.getElementById("Form:SerialID").innerHTML = driverData.split(",")[3].split("=")[1];
				}
			    if(document.getElementById("Form:LastCleanID")!=null)
				{
				document.getElementById("Form:LastCleanID").innerHTML = driverData.split(",")[4].split("=")[1];
				}
				document.getElementById("Form:ImageID").setAttribute("src",imageLocation);
}

function testDriverUrlUsingJQuerygetJSON(useJSONP) {
	var functionName = "testDriverUrlUsingJQuerygetJSON(useJSONP='" + useJSONP
			+ "'): ";
	consoleLog(functionName + "Entering " + functionName + "...");
	var currentUrlIndex = parseInt(document
			.getElementById(CONSTANTS.currentUrlIndex).innerHTML);
	var currentDriverCheckUrl = generateDriverCheckUrlFromDriverUrl(urlArray.driverUrls[currentUrlIndex].driverUrl);
	var urlId = urlArray.driverUrls[currentUrlIndex].urlId;
	var currentStatus = urlArray.driverUrls[currentUrlIndex].status;
	if (currentStatus != CONSTANTS.urlStatus_WAITING) {
		// We should only test URLs that are currently WAITING to be tested,
		// otherwise exit early
		consoleLog(functionName + "WARNING: Exiting early from " + functionName
				+ "because url had Status of '" + currentStatus
				+ "' instead of expected Status '"
				+ CONSTANTS.urlStatus_WAITING + "' ! url: "
				+ JSON.stringify(urlArray.driverUrls[currentUrlIndex]));
		return;
	}
	var dataType = "json";
	if (useJSONP == "true") {
		dataType = "jsonp";
	}
	// Set the Status
	urlArray.driverUrls[currentUrlIndex].status = CONSTANTS.urlStatus_TESTING;
	document.getElementById(urlId).innerHTML = JSON
			.stringify(urlArray.driverUrls[currentUrlIndex]);
	consoleLog(functionName + "About to begin Testing URL: "
			+ JSON.stringify(urlArray.driverUrls[currentUrlIndex]) + ".");

	var remoteUrl = currentDriverCheckUrl;

	if ($jq) {
		if ($jq.support && ($jq.support.cors != "undefined")) {
			$jq.support.cors = true;
		}
		$jq.ajax({
			type : "GET",
			crossDomain : "true",
			dataType : dataType,
			contentType : "application/json",
			cache : "false",
			url : remoteUrl,
			timeout : checkDriverUsingAjaxMethodCallTimeoutMs,
			success : function(data, status) {
				consoleLog(functionName
						+ "Inside success(), currentUrlIndex='"
						+ currentUrlIndex + "' and status='" + status
						+ "' and data='" + JSON.stringify(data) + "'.");
				try {
					var driverCheckResult = $jq.parseJSON(data);
					if (driverCheckResult && driverCheckResult.STATUS) {
						consoleLog(functionName + "driverCheckResult.STATUS='" + driverCheckResult.STATUS + "'");
						if (driverCheckResult.STATUS == CONSTANTS.STATUS_INVALID_PTC_CMD) {
							// Old Driver
							consoleLog(functionName + "OLD Driver Found...");
						} else {
							// New Driver
							consoleLog(functionName + "NEW Driver Found...");
						}
					}
				} catch(e) {
					logExceptionMessage(e, functionName);
				}
				
				validDriverUrl = urlArray.driverUrls[currentUrlIndex].driverUrl;
				urlArray.driverUrls[currentUrlIndex].status = CONSTANTS.urlStatus_PASSED;
				setDriverStatusIndicator("DriverStatusUp");
				document.getElementById(urlArray.driverUrls[currentUrlIndex].urlId).innerHTML = JSON.stringify(urlArray.driverUrls[currentUrlIndex]);
				// Tell the Server that we found a Driver
				document.getElementById(CONSTANTS.selectedAJAXDriverUrl).innerHTML = urlArray.driverUrls[currentUrlIndex].driverUrl;
				var driverInstalledField = document.getElementById("Form\\:DriverInstalled");
				if (driverInstalledField == null || driverInstalledField == 'undefined') {
					if (document.body) {
						driverInstalledField = createDocumentFragment("<div id='Form\\:DriverInstalled'></div>");
						document.body.appendChild(driverInstalledField);
					}
				}
				if (driverInstalledField) {
					driverInstalledField.value = "true";
				}
				var selectedAJAXDriverUrlDiv = document.getElementById(CONSTANTS.selectedAJAXDriverUrl);
				if (selectedAJAXDriverUrlDiv) {
					selectedAJAXDriverUrlDiv.innerHTML = validDriverUrl;
				} else {
					var driverUrlDiv = document.getElementById(CONSTANTS.driverUrlDiv);
					if (driverUrlDiv) {
						driverUrlDiv.appendChild(createDocumentFragment("<div id='" + CONSTANTS.selectedAJAXDriverUrl + "'>" + validDriverUrl + "</div>"));
					}
				}
				if (typeof sendDriverStatus !== "undefined") {
					sendDriverStatus(true);
				}
				if (typeof skipRemainingDriverUrls !== "undefined") {
					skipRemainingDriverUrls();
				}
				
			},
			error : function(data, status) {
				consoleLog(functionName + "Inside error(), currentUrlIndex='" + currentUrlIndex + "' and status='" + status + "'.");
				if (status == "timeout") {
					urlArray.driverUrls[currentUrlIndex].status = CONSTANTS.urlStatus_TIMEOUT;
				} else {
					urlArray.driverUrls[currentUrlIndex].status = CONSTANTS.urlStatus_FAILED;
				}
				document.getElementById(urlArray.driverUrls[currentUrlIndex].urlId).innerHTML = JSON.stringify(urlArray.driverUrls[currentUrlIndex]);
				testNextDriverUrlJSON();
			}
		});
	} else {
		consoleLog(functionName + "No jQuery defined, bypassing check of url '" + remoteUrl + "'.");
	}

	consoleLog(functionName + "Exiting " + functionName + "...");
}

function testNextDriverUrl() {
	var functionName = "testNextDriverUrl(): ";
	consoleLog(functionName + "Entering " + functionName + "...");
	var currentUrlIndex = parseInt(document
			.getElementById(CONSTANTS.currentUrlIndex).innerHTML);
	if ((currentUrlIndex < urlArray.driverUrls.length - 1)) {
		currentUrlIndex = parseInt(currentUrlIndex) + 1;
		// Set the currentUrlIndex value BEFORE calling testDriverUrl()
		document.getElementById(CONSTANTS.currentUrlIndex).innerHTML = currentUrlIndex;
		consoleLog(functionName
				+ "About to attempt to test the next Driver Check Url '"
				+ generateDriverCheckUrlFromDriverUrl(urlArray.driverUrls[currentUrlIndex].driverUrl)
				+ "' with urlIndex '" + currentUrlIndex + "'.");
		// Always use JSONP
		testDriverUrlUsingJQuerygetJSON("true");
	} else {
		consoleLog(functionName
				+ "ERROR: No more DriverUrls are available so setting the DriverStatus to DOWN.");
		// We have run out of Driver URLs to check and none have passed !
		setDriverStatusIndicator("DriverStatusDown");
		// Set a Server flag to indicate that no Driver is running
		// Tell the Server that we did NOT find a Driver
		sendDriverStatus(false);
	}
	consoleLog(functionName + "Exiting " + functionName + "...");
}

function testNextDriverUrlJSON() {
	var functionName = "testNextDriverUrlJSON(): ";
	consoleLog(functionName + "Entering " + functionName + "...");
	var currentUrlIndex = parseInt(document
			.getElementById(CONSTANTS.currentUrlIndex).innerHTML);
	if ((currentUrlIndex < urlArray.driverUrls.length - 1)) {
		currentUrlIndex = parseInt(currentUrlIndex) + 1;
		// Set the currentUrlIndex value BEFORE calling testDriverUrl()
		document.getElementById(CONSTANTS.currentUrlIndex).innerHTML = currentUrlIndex;
		consoleLog(functionName
				+ "About to attempt to test the next Driver Check Url '"
				+ generateDriverCheckUrlFromDriverUrl(urlArray.driverUrls[currentUrlIndex].driverUrl)
				+ "' with urlIndex '" + currentUrlIndex + "'.");
		// Always use JSONP
		testDriverUrlUsingJQuerygetJSON("true");
	} else {
		if (isCheckDriverWithoutContactingDriver) {
			// In this case, we want to assume the Driver is running and use the WorkstationDriverUrl value
			abortDriverCheck();
		} else {
			consoleLog(functionName
					+ "ERROR: No more DriverUrls are available so setting the DriverStatus to DOWN.");
			// We have run out of Driver URLs to check and none have passed !
			setDriverStatusIndicator("DriverStatusDown");
			// Set a Server flag to indicate that no Driver is running
			// Tell the Server that we did NOT find a Driver
			sendDriverStatus(false);
		}
	}
	consoleLog(functionName + "Exiting " + functionName + "...");
}

function skipRemainingDriverUrls() {
	var functionName = "skipRemainingDriverUrls(): ";
	consoleLog(functionName + "Entering " + functionName + "...");
	var currentUrlIndex = parseInt(document
			.getElementById(CONSTANTS.currentUrlIndex).innerHTML);
	urlArray.driverUrls[currentUrlIndex].status = CONSTANTS.urlStatus_PASSED;
	setDriverStatusIndicator("DriverStatusUp");
	document.getElementById(urlArray.driverUrls[currentUrlIndex].urlId).innerHTML = JSON
			.stringify(urlArray.driverUrls[currentUrlIndex]);
	// Stop processing URLs now
	var remainingDriverUrlsIterator;
	var remainingDriverUrlsLength = urlArray.driverUrls.length;
	for (remainingDriverUrlsIterator = (parseInt(currentUrlIndex) + 1); remainingDriverUrlsIterator < remainingDriverUrlsLength; remainingDriverUrlsIterator++) {
		var loopUrlId = urlArray.driverUrls[remainingDriverUrlsIterator].urlId;
		urlArray.driverUrls[remainingDriverUrlsIterator].status = CONSTANTS.urlStatus_SKIPPED;
		document.getElementById(loopUrlId).innerHTML = JSON
				.stringify(urlArray.driverUrls[remainingDriverUrlsIterator]);
		document.getElementById(CONSTANTS.currentUrlIndex).innerHTML = remainingDriverUrlsIterator;
	}
	consoleLog(functionName + "Exiting " + functionName + "...");
}

function setDriverStatusIndicator(statusClassName) {
	var functionName = "setDriverStatusIndicator(): ";
	consoleLog(functionName + "Entering " + functionName + "...");
	var driverStatusIndicatorElement = document.getElementById("NavForm2:DriverStatusIndicator");
	if (driverStatusIndicatorElement && driverStatusIndicatorElement.className) {
		driverStatusIndicatorElement.className = statusClassName;
	}
	consoleLog(functionName + "Exiting " + functionName + "...");
}

function driverCheckRepeat(driverUrlArray) {
	// This code is included in all situations, but we only want to execute it if required
	if (isPerformDriverCheckUsingAJAX) {
		var functionName = "repeat(driverUrlArray): ";
		pageLog(functionName + "Entering " + functionName + "...");
		var finished = false;
		if (driverUrlArray && driverUrlArray.driverUrls
				&& (driverUrlArray.driverUrls.length > 0)) {
			var urlArraySize = parseInt(driverUrlArray.driverUrls.length);
			pageLog(functionName + "urlArraySize=" + urlArraySize);
			var checkForDriverCompletionIterator;
			var passedFound = false;
			var waitingFound = false;
			var testingFound = false;
			var statusFound = false;
			var skipAbort = false;
			for (checkForDriverCompletionIterator = 0; checkForDriverCompletionIterator < urlArraySize; checkForDriverCompletionIterator++) {
				if (driverUrlArray.driverUrls[checkForDriverCompletionIterator]) {
					// Try and obtain the updated Status from the page Div
					var currentDriverUrl = driverUrlArray.driverUrls[checkForDriverCompletionIterator].driverUrl;
					var urlId = "url_" + currentDriverUrl.hashCode();
					var thisUrlDiv = document.getElementById(urlId);
					if (thisUrlDiv && thisUrlDiv.innerHTML) {
						if (typeof jQuery !== "undefined") {
							var $myJQuery = jQuery.noConflict();
						} else {
							finished = true;
							numberOfRetries = maximumNumberOfRetries + 1;
							abortDriverCheck();
						}
						if ($myJQuery && $myJQuery.parseJSON) {
							try {
								driverUrlArray.driverUrls[checkForDriverCompletionIterator].status = $myJQuery.parseJSON(thisUrlDiv.innerHTML).status;
								pageLog(functionName + "checkForDriverCompletionIterator=" + checkForDriverCompletionIterator
										+ ", driverUrlArray.driverUrls[checkForDriverCompletionIterator].driverUrl="
										+ driverUrlArray.driverUrls[checkForDriverCompletionIterator].driverUrl
										+ ", driverUrlArray.driverUrls[checkForDriverCompletionIterator].driverCheckUrl="
										+ generateDriverCheckUrlFromDriverUrl(driverUrlArray.driverUrls[checkForDriverCompletionIterator].driverUrl)
										+ ", driverUrlArray.driverUrls[checkForDriverCompletionIterator].status="
										+ driverUrlArray.driverUrls[checkForDriverCompletionIterator].status + ".");
								if (driverUrlArray.driverUrls[checkForDriverCompletionIterator].status) {
									statusFound = true;
								} else {
									// No status means that the Initialization step did NOT run - we want to abort looping in this case !
								}
								if (driverUrlArray.driverUrls[checkForDriverCompletionIterator].status == CONSTANTS.urlStatus_PASSED) {
									passedFound = true;
									validDriverUrl = driverUrlArray.driverUrls[checkForDriverCompletionIterator].driverUrl;
									var selectedAJAXDriverUrlDiv = document.getElementById(CONSTANTS.selectedAJAXDriverUrl);
									if (selectedAJAXDriverUrlDiv && selectedAJAXDriverUrlDiv.innerHTML) {
										selectedAJAXDriverUrlDiv.innerHTML = validDriverUrl;
									}
								} else if ((!driverUrlArray.driverUrls[checkForDriverCompletionIterator].status)
										|| (driverUrlArray.driverUrls[checkForDriverCompletionIterator].status == CONSTANTS.urlStatus_WAITING)) {
									waitingFound = true;
								} else if (driverUrlArray.driverUrls[checkForDriverCompletionIterator].status == CONSTANTS.urlStatus_TESTING) {
									testingFound = true;
								}
							} catch(e) {
								// Ignore and continue since we cannot parse a status out of the DIV
								logExceptionMessage(e, functionName);
							}
						}
					} else {
						pageLog(functionName + "Could not find an updated status property in the DIV for the current URL: '" + currentDriverUrl + "'");
						skipAbort = true;
					}
				}
			}
			pageLog(functionName + "Finished processing URL Array. waitingFound="
					+ waitingFound + " and passedFound=" + passedFound
					+ " and statusFound=" + statusFound + " and testingFound=" + testingFound
					+ " and validDriverUrl=" + validDriverUrl + ".");
			if (!statusFound) {
				// No statusFound means that the Initialization step did NOT run - we want to abort looping in this case !
				var warnMsg = functionName + "Finished processing URL Array and !statusFound. None of the URLs had a status property !" +
				" statusFound=" + statusFound + " and testingFound=" + testingFound + " and sendDriverInfo=" + sendDriverInfo +
				". Setting (finished = true)...";
				pageLog(warnMsg);
				consoleWarn(warnMsg);
				finished = true;
				if (!skipAbort) {
					pageLog(functionName + "Calling abortDriverCheck()...");
					abortDriverCheck();
				}
			}
			if (waitingFound && !passedFound && !finished) {
				// We are not done checking the Driver URLs yet, check again shortly
				finished = false;
			} else if (!finished) {
				if (testingFound) {
					// We are not done waiting at least one of the AJAX calls to complete
				} else {
					if (passedFound) {
						// A valid Driver URL was found :-)
						driverInstalled = true;
					} else {
						// A valid Driver URL was NOT found :-(
						driverInstalled = false;
					}
					finished = true;
					pageLog(functionName + "Finished processing URL Array, passedFound=" + passedFound + " and driverInstalled=" + driverInstalled + " and setting finished=true.");
				}
			}
			if (finished && !skipAbort) {
				if (!driverInstalled && isCheckDriverWithoutContactingDriver) {
					// In this case, we want to assume the Driver is running and use the WorkstationDriverUrl value
					pageLog(functionName + "(!driverInstalled && isCheckDriverWithoutContactingDriver). Setting driverInstalled=true and validDriverUrl=" +workstationDriverUrl + ".");
					driverInstalled = true;
					validDriverUrl = workstationDriverUrl;
				}
				pageLog(functionName + "Finished processing URL Array, passedFound=" + passedFound + "...");
				if (typeof sendDriverStatus == "function") {
					pageLog(functionName + "About to call sendDriverStatus(driverInstalled=" + driverInstalled + ")...");
					sendDriverStatus(driverInstalled);
				}
				toggleAjaxLoaderDriver(false, this);
			}
		} else {
			pageLog("driverUrlArray was not valid so could not check it !");
		}
		if (!finished) {
			pageLog(functionName + "(!finished) ! About to call checkForDriverCompletion(repeat) again...");
			checkForDriverCompletion(driverCheckRepeat);
		} else {
			pageLog(functionName + "(finished) ! About to call redirectToFinalUrl()...");
			// Only redirect to finalUrl if we are coming in through SSO !
			var currentWindowPathname = window.location.pathname;
			pageLog(functionName + "currentWindowPathname='" + currentWindowPathname + "'.");
			if (currentWindowPathname.endsWith("RemotePageLauncher.faces")) {
				pageLog(functionName + "window.location.pathname endsWith 'RemotePageLauncher.faces'! About to call redirectToFinalUrl()...");
				redirectToFinalUrl();
			} else {
				pageLog(functionName + "window.location.pathname does NOT endsWith 'RemotePageLauncher.faces'! Will NOT redirect here...");
			}
			pageLog(functionName + "Exiting " + functionName + "...");
		}
	}
}

function checkForDriverCompletion(callback) {
	var functionName = "checkForDriverCompletion(callback): ";
	if (isPerformDriverCheckUsingAJAX) {
		consoleLog(functionName + "(isPerformDriverCheckUsingAJAX === true), numberOfRetries=" + numberOfRetries + " and maximumNumberOfRetries=" + maximumNumberOfRetries + ".");
		if (numberOfRetries > maximumNumberOfRetries) {
			consoleLog(functionName + "No longer checking status ! numberOfRetries=" + numberOfRetries + " and maximumNumberOfRetries=" + maximumNumberOfRetries + ".");
			return;
		}
		numberOfRetries++;
		setTimeout(
				function() {
					var functionName = "checkForDriverCompletion TIMEOUT Function: ";
					pageLog(functionName + "Entering " + functionName + "...");
					if (callback && (callback instanceof Function)) {
						pageLog(functionName
								+ "About to call callback('" + JSON.stringify(urlArray) + "')...");
						callback(urlArray);
					}
				}, checkDriverUsingAjaxMethodCallTimeoutMs);
	}
}

function abortDriverCheck() {
	var functionName = "abortDriverCheck(): ";
	pageLog(functionName + "sendDriverInfo=" + sendDriverInfo + " and workstationDriverUrl=" + workstationDriverUrl + ".");
	var appendDocFragment = true;
	driverInstalled = true;
	sendDriverInfo = true;
	var driverUrlDiv = document.getElementById(CONSTANTS.driverUrlDiv);
	if (driverUrlDiv) {
		selectedAJAXDriverUrlDiv = document.getElementById(CONSTANTS.selectedAJAXDriverUrl);
		if (selectedAJAXDriverUrlDiv) {
			pageLog(functionName + "Current DriverUrl selectedAJAXDriverUrlDiv.innerHTML=" + selectedAJAXDriverUrlDiv.innerHTML + ".");
			if (selectedAJAXDriverUrlDiv.innerHTML && selectedAJAXDriverUrlDiv.innerHTML.length > 0) {
				pageLog(functionName + "Leaving Current DriverUrl set to " + selectedAJAXDriverUrlDiv.innerHTML + ".");
				sendDriverInfo = false;
			} else {
				pageLog(functionName + "Setting Current DriverUrl to " + workstationDriverUrl + ".");
				selectedAJAXDriverUrlDiv.innerHTML = workstationDriverUrl;
			}
			appendDocFragment = false;
		}
	}
	pageLog(functionName + "Aborting URL processing, driverInstalled=" + driverInstalled + " and sendDriverInfo=" + sendDriverInfo + " and appendDocFragment=" + appendDocFragment + ".");
	if (appendDocFragment) {
		driverUrlDiv.appendChild(createDocumentFragment("<div id='" + CONSTANTS.selectedAJAXDriverUrl + "' style='display:none;'>" + workstationDriverUrl + "</div>"));
	}
	if (typeof sendDriverStatus === "function" && sendDriverInfo) {
		pageLog(functionName + "Calling sendDriverStatus(true)...");
		sendDriverStatus(true);
	}
}
/*
 * the method is called to poll the upload status every polling_interval during max_time. 
 */	
	
function pollingInit(enablePolling, uploadDate, maxTimeout, pollInterval){
	  if (enablePolling == "stealthmode"){
		  showButtonText(false);
		  var stealth_interval_instance = setTimeout(function(){showButtonText(true)}, maxTimeout);
	  } else if(enablePolling == "true"){
    	//Hide uplaod botton and show "Uploading..." text
		 showButtonText(false);
    	 doPolling(maxTimeout,pollInterval, false);
      }else{ 
    	//show botton, last upload timestamp and hide "Uploading..." text ; 
    	  showButtonText(true);
		  if(document.getElementById("Form:UploadDateID")!=null)
		 {	  
    	  document.getElementById("Form:UploadDateID").innerHTML = uploadDate;
		 }
    	  clearIntervalInstance();
    	  clearTimeoutInstance(); 
      }   	
}
	
	
function doPolling(max_time,polling_interval){
	var functionName = "doPolling(): ";
	pageLog(functionName + "Polling upload status starts.");  
	timeout_instance= setTimeout(function(){reachMaxTimeout()}, max_time);
	interval_instance = setInterval(function(){ runPolling() }, polling_interval);
}



function runPolling(){
	//response acting as a flag determine if the upload log is in progress or not.
	var response = refreshStatus("runPolling");
	
	//response != null implies it's not in progress, either success or failure, so polling set off.
	if(response != false && response != "KeepPolling"){ 
	   showMessage();
	   pollingInit("false", response);
	}
	
}

function reachMaxTimeout(){
	clearIntervalInstance();
	var response = refreshStatus("doTimeout");
	showMessage();
	pollingInit("false", response);
}

function showButtonText(flag){
	if(flag){
		document.getElementById("Form:GetLogsButton").style.display = "";
    	document.getElementById("Form:UploadTextID").innerHTML = "";
	}else{
		document.getElementById("Form:GetLogsButton").style.display = "none";
    	document.getElementById("Form:UploadTextID").innerHTML = "Uploading...";
	}
}


function clearIntervalInstance(){
	clearInterval(interval_instance);
	
}

function clearTimeoutInstance(){
	clearTimeout(timeout_instance);
}
