// Setup a debug flag to indicate if we want to enable console logging or not
var hostmachine = window.location.hostname;
var debug = hostmachine.match(/localhost|127.0.0.1/); // |153.71.98.*|153.71.28.*
// global variable to allow/disallow debug alerts
var enableAlert = false;
// global variable to allow/disallow debug level information to be inserted in the header for the post request
var enableDebugHeader = false;
// global variable to allow/disallow connection close for the post request
var enableConnectionClose = false;
// global variable to prevent simultaneous execution of checkForItemMessage() function
var isExecutingItemMessage = false;
// global variable to prevent simultaneous execution of pingServer() function
var isExecutingPingServer = false;
// global variable to control timeout for checkForItemMessage() function
var timeoutCFIM;
// global variable to control timeout for pingServer() function
var timeoutPS;

var waitForUpdateListComplete = false;
var waitForLastRefresh = false;
// BEGIN - Prepare Debug Token Data
// The lines below obtain timestamp information at the time of loading this
// script file. Each timestamp component is formated to be a fixed width string.
// An example timestamp: "20110120121705584". (Put together as 2011-01-20 12:17:05.584")
// When used it will have a prefix and the request id attached: "CFIM201101201217055840000000006".
//    (A string made up of Prefix: CFIM  TimeStamp: 2011-01-20 12:17:05.584  Request Id:  0000000006)

var d = new Date(); // obtain time data at start of session

// A sequence number to be included as part of X-NCR-TOKEN(header) and X_NCR_TOKEN(content)
// This will beincremented in the function before use and reset to 1 after 9999999999
// Note: It is the responsibility of the programmer to increment this in every function
var request_id = 1;
var curr_date = '00' + d.getDate();
var curr_month = d.getMonth();

// Month is returned as a number 0 to 11 -- so add 1 to bring it into 1 - 12 range
curr_month++;

var curr_month_str = '00' + curr_month;
var curr_year = d.getFullYear();
var curr_hour = '00' + d.getHours();
var curr_min = '00' + d.getMinutes();
var curr_sec = '00' + d.getSeconds();
var curr_msec = '0000' + d.getMilliseconds();

// Bring together all formatted components (Example result: 20110120121705584)
var timestamp = curr_year
 + curr_month_str.substring((curr_month_str.length) - 2)
 + curr_date.substring((curr_date.length) - 2)
 + curr_hour.substring((curr_hour.length) - 2)
 + curr_min.substring((curr_min.length) - 2)
 + curr_sec.substring((curr_sec.length) - 2)
 + curr_msec.substring((curr_msec.length) - 3);

// END - Prepare Debug Token Data

var theHelpMapId;
var cbg; //holds the background color of row during mouseover

//simple browser check (whether it is IE)
var agt = navigator.userAgent.toLowerCase();
var is_ie = ((agt.indexOf("msie") != -1) && (agt.indexOf("opera") == -1));
var is_ie9 = is_ie && (agt.indexOf("trident/5") > -1);

// Prevent back button.
history.forward();

function selectAll() {
	var e = document.getElementsByTagName("input");
	for (var i = 0;i<e.length;i++){
		if (e[i].type == "checkbox" && e[i].id != "Form:RejectDepositsCheckbox")
			e[i].checked = true;
	}
	return false;
}

function deSelectAll() {
	var e = document.getElementsByTagName("input");
	for (var i = 0;i<e.length;i++){
		if (e[i].type == "checkbox" && e[i].id != "Form:RejectDepositsCheckbox"){
			e[i].checked = false;
		}
	}
	return false;
}

function disableComponent(compId) {
     var component = document.getElementById("Form:"+compId);
     component.disabled=true;
}

/** focuses on the element defined by the global variable 'focusElement'
 * otherwise focuses on the first error input element of the page,
 * or first input if no error input found
 */
var focusInputName = 'Form:focusOnElement';
function focusOnInput() {
	if(document.activeElement.className=="InvalidInput")
		return;
	var focusOnElement = document.getElementById(focusInputName);
	if (focusOnElement != null) {
		try {
			focusOnElement.focus();
		}
		catch ( err ) {
			//Ignore exceptions since only trying to set focus
		}
		return false;
	}
}

function toggleFilter(idName){
	if (waitForUpdateListComplete) {
		var link = document.getElementById(idName+"Set");
		toggleAjaxLoader(true,link);
		setTimeout(function(){ toggleFilter(idName)}, 500);
	} else {
		toggleAjaxLoader(false,link);
		toggleFilterFor(idName);
	}
}

function toggleFilterFor(idName){
	var isOn = false;
	var identity = document.getElementById(idName);
	var link = document.getElementById(idName+"Set");
	var screenWidth = document.body.clientWidth;
	var boxWidth = 200; //assume the largest filter box is 200 pixels
	// var boxWidth = screenWidth / 3; //alternative to fixed box size
	var parent = document.getElementById(idName + "Set").offsetParent;
	var isShowDeposit = document.getElementById("Form:PageName").value == "/ShowDeposit.jsp";
	var isDepositList = document.getElementById("Form:PageName").value == "/DepositList.jsp";
	var pos = 0;

	while(parent != null) {
		pos += parent.offsetLeft;
		parent = parent.offsetParent;
	}

	var posString = (screenWidth - pos < boxWidth) ? "Right" : "Left";
	if(posString == "Right")
		identity.style.right = 0;
	else
		identity.style.left = 0;

	if(identity.className == "FilterBoxHide") {
		identity.className = "FilterBoxShow";
		isOn = true;
	} else {
		identity.className = "FilterBoxHide";
		isOn = false;
	}

	//since we turned something on we will turn all other filters boxes off
	if(isOn){
		var otherTags = document.getElementsByTagName("div");
		for (var i = 0; i < otherTags.length; i++) {
			if(otherTags[i].id.indexOf('FilterBox') != -1 && otherTags[i].id != idName){
				var otherFilter = document.getElementById(otherTags[i].id);
				otherFilter.className = "FilterBoxHide";
			}
		}

        if(isShowDeposit || isDepositList){
        	stopAJAXPoll();
        }

	}else{
    	if(isShowDeposit || isDepositList){
        	if (shouldItemListPoll || shouldAJAXPoll) {
				startItemPolling();
			}
        }
	}

	return isOn;
}

function disableClicks() {
	var submitPanelGrid = document.getElementById("Form:StartDepositButton");
	submitPanelGrid.style.display='none';
	var displayPanelGrid = document.getElementById("Form:NewDepositButton");
	displayPanelGrid.style.display='inline';
}

function disableWelcomeTab() {
	  var hotLinksPanel = document.getElementById("Form:HotLinks");
	  hotLinksPanel.disabled=true;
	  this.href ="javascript:void(0)";
}


// Based on a javascript include, create a hidden field with "true" if the driver is responding,
// and false otherwise.
function setDriverInstalled() {
	if (driverInstalled == true) {
		try {
			document.getElementById("Form:DriverInstalled").value="true";
		}
		catch(err) {
			// Unit tester fails with this code.
		}
	}

	if (sendDriverInfo == true) {
		sendDriverStatus(driverInstalled);
	}
}

function getCurrentTimestampISOFormat() {
	var now = new Date(),
		tzo = -now.getTimezoneOffset(),
		dif = tzo >= 0 ? '+' : '-',
		pad = function(num) {
			var norm = Math.abs(Math.floor(num));
			return (norm < 10 ? '0' : '') + norm;
		};
	return now.getFullYear() 
		+ '-' + pad(now.getMonth()+1)
		+ '-' + pad(now.getDate())
		+ 'T' + pad(now.getHours())
		+ ':' + pad(now.getMinutes()) 
		+ ':' + pad(now.getSeconds()) 
		+ dif + pad(tzo / 60) 
		+ ':' + pad(tzo % 60);
}

// This method will find the proper field to focus on the CheckLayer page
function focusFieldInput(){
	// determine the field to focus (check the error fields first)
	var docs = document.getElementsByTagName('input');
	var firstInput = null;
	// run through the input fields to find the first ERROR field
	for (var i = 0; i < docs.length; i++) {
		if (docs[i].type == 'text' && !docs[i].disabled && docs[i].name.indexOf('Filter_') == -1) {
			var fieldId = docs[i].id;
			if (fieldId.indexOf('fieldList') != -1 && (docs[i].className == 'ErrorFlag' || docs[i].className == 'EditItemFieldError')) {
				firstInput = docs[i];
				break;
			}
		}
	}

	// if we don't have an Input field then check non-errored fields
	if(firstInput == null){
		for (var i = 0; i < docs.length; i++) {
			if (docs[i].type == 'text' && !docs[i].disabled && docs[i].name.indexOf('Filter_') == -1) {
				var fieldId = docs[i].id;
				if (fieldId.indexOf('fieldList') != -1 && docs[i].className != 'ErrorFlag' && docs[i].className != 'EditItemFieldError') {
					firstInput = docs[i];
					break;
				}
			}
		}
	}

	if (firstInput != null){
		firstInput.focus();
		firstInput.select();
	}
}

// When tabbing through fields this method will SELECT the text in the field.
function selectFieldText(field){
	field.select();
}

function goToSave()
{
	var saveButton = document.getElementById("EditCheckForm:SaveButton");
	if (saveButton != null){
	saveButton.focus();
	}
}

function toggleButton(id, state) {
	var button = document.getElementById("Form:"+id);
	if (button != null) {
		button.disabled=state;
	}
}
// Will toggle the AJAX LOADER on/off
var bypassAjaxLoader = false;
function toggleAjaxLoader(turnOn, origElement){
	toggleAjaxLoaderForElementId(turnOn, origElement, "AjaxLoader","ajaxLoaderImg");
}
function toggleAjaxLoaderModal(turnOn, origElement){
	try {
		toggleAjaxLoaderForElementId(turnOn, origElement, "AjaxLoader","ajaxLoaderImg");
		if (turnOn) {
			onRequestStart();
		} else {
			onRequestEnd()
		}
	} 
	catch ( err ) {
		toggleAjaxLoaderForElementId(false, origElement, "AjaxLoader","ajaxLoaderImg");
		consoleWarn("Turning off the loader.");
	}
}
function toggleAjaxLoaderDriver(turnOn, origElement) {
	toggleAjaxLoaderForElementId(turnOn, origElement, "AjaxLoaderDriver","ajaxLoaderDriverImg");
}
function toggleAjaxLoaderForElementId(turnOn, origElement, elementId, elementImgId) {
	if (bypassAjaxLoader) {
		bypassAjaxLoader = false;
		return;
	}
	var loader = document.getElementById(elementId);
	// Only attempt to manipulate the AjaxLoader if it was found in the page
	if (loader && loader.style) {
		if (turnOn) {
			// determine the placement of the loader dialogue
			var elementPos = findPosition(origElement);
			
			// get the browser width and height (used to adjust position to left or right)
			var pageWidth = document.body.offsetWidth;
			var pageHeight = document.body.offsetHeight;
			
			// determine the vertical position
			if(elementPos[1] < (pageHeight/4)){
				loader.style.top = (elementPos[1] + 30) + "px";
			} else {
				loader.style.top = (elementPos[1] - 20) + "px";
			}
			
			// determine the horizontal position
			if(elementPos[0] > (pageWidth/4) * 3){
				// see if even after the -50 it extends off the page
				loader.style.left = (elementPos[0] - 50) + "px";
				if((elementPos[0] + 130 - 50) >= pageWidth){
					loader.style.left = (elementPos[0] - 100) + "px";
				}
			} else {
				loader.style.left = (elementPos[0] + 10) + "px";
			}
			loader.style.display = 'block';	
			loader.style.zIndex = "6000";
			loaderImg = document.getElementById(elementImgId);
			setTimeout("loaderImg.src = loaderImg.src",100); //Get around IE11 animation stop bug.
			
		}
		else {
			loader.style.display = 'none';
		}
	}
}

//Resetting the Tabindex for EditItem to NextError when all the checboxes are checked for the item
function toggleTabIndex(setOn, OrigElement, focusElement){
	var checkboxes = document.getElementsByTagName("input");
	var checked = [];
	var unchecked = [];
	var totalcheckboxes = checkboxes.length;
	for (var i = 0; i < totalcheckboxes; i++){
		if(checkboxes[i].name != "EditCheckForm:OverrideACHOptOut" ){
			if (checkboxes[i].checked){
				checked.push(checkboxes[i]);
			}else{
				unchecked.push(checkboxes[i]);
			}
		}
	}
	if (totalcheckboxes > 0){
		if (unchecked.length > 0)
		{
			//do nothing
		}
		else
		{
			setFocus(focusElement);
		}
	}
}
//
// will find the ABSOLUTE position of the element
function findPosition(obj) {
	var curleft = curtop = 0;
	if (obj.offsetParent) {
		curleft = obj.offsetLeft;
		curtop = obj.offsetTop;
		while (obj = obj.offsetParent) {
			curleft += obj.offsetLeft;
			curtop += obj.offsetTop;
		}
	}
	return [curleft,curtop];
}

var shouldAJAXPoll = false;
var shouldItemListPoll = false;
function stopAJAXPoll(){
	shouldAJAXPoll = false;
	shouldItemListPoll = false;
}

function stopItemListPoll(){
	shouldItemListPoll = false;
}

function startItemListPoll(){
	shouldItemListPoll = true;
}

var itemlistPollingInterval = 5000;

function setItemlistPollingInterval(interval) {
	if (interval >= 1000) {
		itemlistPollingInterval = interval; 
	} else {
		itemlistPollingInterval = 1000;
		consoleWarn("ItemlistRefreshPollingInterval should not be less than 1000 ms, using default interval 1000 ms");
	}
}
function isEditItemOpenOnShowDeposit() {
	 // If the EditItem page is opened and this is not the ShowDepositBranch or ShowDepositRemittance page, then do not send the itemlist_changed request and do not poll.
	var editItemOpenOnShowDepositScreen = false;
	var opened = document.getElementById('EditCheckForm:OpenLayer');
    if( opened != null && opened.value == 'true' ) {
    	 var isShowDepositBranch = document.getElementById("Form:PageName").value.indexOf("/ShowDepositBranch", 0) == 0;
		 var isShowDepositRemittance = document.getElementById("Form:PageName").value.indexOf("/ShowDepositRemittance", 0) == 0;
		 if (isShowDepositBranch || isShowDepositRemittance) {
			 editItemOpenOnShowDepositScreen = false;
		 } else {
			 editItemOpenOnShowDepositScreen = true;
		 }
    }
    return editItemOpenOnShowDepositScreen;
}
// This function is used in Edit Item page for reset checkbox on cancel event.
function resetCheckboxOnCancel(){
	var imageOverrideCheckbox = document.getElementById("EditCheckForm:ImageOverride");
	if(imageOverrideCheckbox != null && imageOverrideCheckbox.checked){
		imageOverrideCheckbox.checked = false;
	}
	var documentSizeOverrideCheckbox = document.getElementById("EditCheckForm:DocumentSizeOverride");
	if(documentSizeOverrideCheckbox != null && documentSizeOverrideCheckbox.checked){
		documentSizeOverrideCheckbox.checked = false;
	}
	var duplicateOverrideCheckbox = document.getElementById("EditCheckForm:DuplicateOverride");
	if(duplicateOverrideCheckbox != null && duplicateOverrideCheckbox.checked){
		duplicateOverrideCheckbox.checked = false;
	}
	var maxItemAmountOverrideCheckbox = document.getElementById("EditCheckForm:OverrideMaxItemAmountError");
	if(maxItemAmountOverrideCheckbox != null && maxItemAmountOverrideCheckbox.checked){
		maxItemAmountOverrideCheckbox.checked = false;
	}
	var hotlistRejectOverrideCheckbox = document.getElementById("EditCheckForm:OverrideHotlistReject");
	if(hotlistRejectOverrideCheckbox != null && hotlistRejectOverrideCheckbox.checked){
		hotlistRejectOverrideCheckbox.checked = false;
	}
	var achOptoutOverrideCheckbox = document.getElementById("EditCheckForm:OverrideACHOptOut");
	if(achOptoutOverrideCheckbox != null && achOptoutOverrideCheckbox.checked){
		achOptoutOverrideCheckbox.checked = false;
	}
	var wrongPocketOverrideCheckbox = document.getElementById("EditCheckForm:WrongPocketOverride");
	if(wrongPocketOverrideCheckbox != null && wrongPocketOverrideCheckbox.checked){
		wrongPocketOverrideCheckbox.checked = false;
	}
	var showDepositSlipErrorOverrideCheckbox = document.getElementById("EditCheckForm:ShowDepositSlipErrorOverride");
	if(showDepositSlipErrorOverrideCheckbox != null && showDepositSlipErrorOverrideCheckbox.checked){
		showDepositSlipErrorOverrideCheckbox.checked = false;
	}
	var staleDatedOverrideCheckbox = document.getElementById("EditCheckForm:OverrideStaleDated");
	if(staleDatedOverrideCheckbox != null && staleDatedOverrideCheckbox.checked){
		staleDatedOverrideCheckbox.checked = false;
	}
	var postDatedOverrideCheckbox = document.getElementById("EditCheckForm:OverridePostDated");
	if(postDatedOverrideCheckbox != null && postDatedOverrideCheckbox.checked){
		postDatedOverrideCheckbox.checked = false;
	}
}

function checkForItemMessage(state) {
   if(!isExecutingItemMessage) {
	   // A global sentinel variable introduced to protect this function from being called white it is executing
       isExecutingItemMessage = true;
       var isRemoteEditItem = false;
    
       //Check if this is from a RemoteEditItem page
       if(document.getElementById("PageName") != null){
    	   if(document.getElementById("PageName").value != null){
    		   isRemoteEditItem = document.getElementById("PageName").value.indexOf("/RemoteEditItem", 0) == 0;
    	   }
       }   
       
       //If dragging is active then skip polling for now
	   if( dragging == true) {
	   	   if (timeoutCFIM != null) {
				clearTimeout(timeoutCFIM);
			}
	   	   timeoutCFIM = setTimeout("checkForItemMessage()", itemlistPollingInterval);
	   } else if(shouldAJAXPoll && isRemoteEditItem){
		   	//PWE-32821: From RemoteEditItem page, there is no list to refresh, but need to reset itemTypeChange variable (see RemoteEditItem.jsp-updateList)
	 		updateList();
	 		if (timeoutCFIM != null) {
	 			clearTimeout(timeoutCFIM);
	 		}
	 	   	timeoutCFIM = setTimeout("checkForItemMessage()", itemlistPollingInterval);
       // If doing ajax polling, only send the itemlist_changed request if the EditItem page is not opened on the ShowDeposit page, or if there isn't an explicit poll requested.

	   }  else if(shouldAJAXPoll && ((state != null && state == 'poll') || !isEditItemOpenOnShowDeposit())) {	
		    var req;
		    var prefix;
		    var message;
		    var refresh;
		    var action;
		    var polling = "Yes"; //Make default always polling in case a network failure occurs, client side never stops trying to
		    					 //reconnect to obtain response for XMLHTTPRequest sent to server.
		    var totalItems, scanned_items;
		    // preventive code added to catch an exception - PWE-5385
			// The try/catch ensures that the sentinel variable is handled
			// correctly when an exception occurs
		    var isShowDeposit = document.getElementById("Form:PageName").value.indexOf("/ShowDeposit", 0) == 0;
	   		try {
				prefix = "Exception from newXMLHttpRequest() : ";
			    req = newXMLHttpRequest();
			    request_id++;
			    if(request_id > 9999999999) {
			    	request_id = 1;
			    }
			    request_id_str = '0000000000' + request_id;
			    request_id_str = request_id_str.substring((request_id_str.length) - 10);

				// Make a synchronous AJAX call (by sending a false parameter) to avoid timing problems
				prefix = "Exception from req.open() : ";
				req.open("GET", "servlet/XMLHTTPResponseServlet.do?command=itemlist_changed&X_NCR_TOKEN="+"CFIM" + timestamp + request_id_str, false);

				prefix = "Exception from req.setRequestHeader(Content-Type) : ";
				req.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
				req.setRequestHeader("Synchronized", "false");
				req.setRequestHeader("ncrCSRFToken",document.getElementById("ncrCSRFToken").value);

				var isSimpleDeposit = "No";
				if (document.getElementById("Form:itemListSize")){
					var value = document.getElementById("Form:itemListSize").value;
					scanned_items = value.replace(/[^0-9]/g, '');
					isSimpleDeposit = "Yes";
				}

				if(enableDebugHeader) {
					prefix = "Exception from req.setRequestHeader(X-NCR-TOKEN) : ";
					// The CFIM prefix stands for checkForItemMessage()
					req.setRequestHeader("X-NCR-TOKEN", "CFIM" + timestamp + request_id_str);
				}

				if(enableConnectionClose) {
					prefix = "Exception from req.setRequestHeader(Connection) : ";
					req.setRequestHeader("Connection", "close");
				}

//				prefix = "Exception from req.send(command=itemlist_changed) : ";
//				if(enableDebugHeader) {
//					req.send("command=itemlist_changed&X_NCR_TOKEN="+"CFIM" + timestamp + request_id_str);
//				}
//				else {
//					req.send("command=itemlist_changed");
//				}

				req.send(null);

				prefix = "Exception from getting message : ";
				message = req.responseXML.getElementsByTagName("message")[0];

				prefix = "Exception from getting refresh : ";
				refresh = message.getElementsByTagName("refresh");

				prefix = "Exception from getting action : ";
				action = refresh[0].getAttribute("action");

				prefix = "Exception from getting polling : ";
				polling = refresh[0].getAttribute("polling");

				if (isSimpleDeposit == "Yes"){
					totalItems = refresh[0].getAttribute("scanneditems");
				}

				//check if we still need to do action polling if the items scanned (or updated on screen)
				//are less than what is stored in DB if so update screen one more time.
				//alert("action before " + action);
				if ((action == "No") && (isSimpleDeposit == "Yes")){
					if (scanned_items < totalItems){
						action = "Yes";
					}
				}
			}
			catch(e) {
			    isExecutingItemMessage = false;
				if(enableAlert) {
					alert(prefix + e.message);
				}
			}

            if(action == "Yes" || waitForLastRefresh) {
                if (isShowDeposit && !waitForUpdateListComplete) {
					if(shouldItemListPoll){
						waitForUpdateListComplete = true;
						updateList();
					}else {
                        updateCount();
				}
                    waitForLastRefresh = false;
                } else {
                        if (isShowDeposit) {
                                waitForLastRefresh = true;
                                polling = "Yes"; // clear & restart the timeout
                        }
                }
			}
			if(polling == "Yes") {
				if (timeoutCFIM != null) {
					clearTimeout(timeoutCFIM);
				}
		   	    timeoutCFIM = setTimeout("checkForItemMessage()", itemlistPollingInterval);
				// restart the timer
			}
			req = null;
			prefix = message = refresh = action = polling = null;
		}else{
			//polling is disabled retry to poll after 5 sec in case if polling is enabled
			timeoutCFIM = setTimeout("checkForItemMessage()", itemlistPollingInterval);
		}
    	isExecutingItemMessage =  false;
	}
}
function startItemPolling(state) {
	checkForItemMessage(state);
}

function refreshAfterCancelAddVirtualItem(){
	if(document.getElementById('EditCheckForm:isAddVirtualItem').value == "true"){
		updateList();
	}
}

/*
 * Ping the server once every couple of seconds so that the application knows that
 * the browser for this session is still alive.
 */
var pollingInterval = 0;
function pingServer() {
	try {
		if(!isExecutingPingServer) {
			isExecutingPingServer = true;
			var req = newXMLHttpRequest();
			request_id++;
			if(request_id > 9999999999) {
				request_id = 1;
			}
			request_id_str = '0000000000' + request_id;
			request_id_str = request_id_str.substring((request_id_str.length) - 10);
			// Make a synchronous "ping" AJAX call to the server.
			req.open("GET", "servlet/XMLHTTPResponseServlet.do?command=ping_server&X_NCR_TOKEN="+"PS" + timestamp + request_id, false);
			req.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
			req.setRequestHeader("Synchronized", "false");
			req.setRequestHeader("ncrCSRFToken",document.getElementById("ncrCSRFToken").value);
			if(enableDebugHeader) {
				req.setRequestHeader("X-NCR-TOKEN", "PS" + timestamp + request_id_str);
			}
			if(enableConnectionClose) {
				req.setRequestHeader("Connection", "close");
			}
//			if(enableDebugHeader) {
//				req.send("command=ping_server&X_NCR_TOKEN="+"PS" + timestamp + request_id);
//			}
//			else {
//				req.send("command=ping_server");
//			}

			req.send(null);

			// Get the response and see if we are supposed to keep pinging.
			var message = req.responseXML.getElementsByTagName("message")[0];
			var refresh = message.getElementsByTagName("refresh");
			var pinging = refresh[0].getAttribute("pinging");

			if(pinging == "Yes" && pollingInterval != 0) {
				if (timeoutPS != null) {
					clearTimeout(timeoutPS);
				}
				// Restart the timer.
				timeoutPS = setTimeout("pingServer()", pollingInterval);
			}
			isExecutingPingServer =  false;
		}
	} catch ( err ) {
		isExecutingPingServer =  false;
		// Ignore exceptions.  Will restart on the next page refresh.
	}
}

/*
 * Start pinging the server, but wait the interval passed first.
 */
function startPingingServer(interval) {
	if (interval != 0) {
		// Start the ping timer for the first time.
		pollingInterval = interval*1000; // Convert to seconds.
		timeoutPS = setTimeout("pingServer()", pollingInterval);
	}
}

// stop pinging server
function stopPinging() {
	if (timeoutPS != null) {
		clearTimeout(timeoutPS);
	}
}

// Will watch for the enter key, when pressed will CLICK the provided button
function captureEnter(elementId, e){
	var theKey = (e.which != null ? e.which : window.event.keyCode);
	if (theKey == 13){
		setFocus(elementId);
		document.getElementById(elementId).click();
		return false;
	}
	return true;
}

// disable autocomplete for all forms for current document
function disableAutoComplete() {
	var form_nodes = document.getElementsByTagName("form");
	var intForms = form_nodes.length;
	for (var i = 0; i < intForms ; i++)
	{
		form_nodes[i].setAttribute("autocomplete", "off");
		//form_nodes[i].autoComplete='off';
	}
}

function goDriverInstall(url) {
	if (driverAvailabilityEnable == true && driverInstalled == false) {
		window.location.href = url;
	}
}

function goBackDriverInstall(url) {
	//For IE 9, the user can remain on the DriverDownload page even when the driver has been installed so we need to send
	//the user back to the previous page they came from when there is no need to download the driver. See PWE-10173
	if (is_ie9 && driverAvailabilityEnable == true && driverInstalled == true && url != null)
		window.location.href = url;
}

// Will execute the default action for the row.
// The actionId can be upto 2 actions separate them with the pipe (|)
function executeDefaultRowAction(rowObject, actionId, e) {
	//check if an input element within the row was clicked
	//if so, don't execute default row action
	e = e || window.event;
	var target = e.srcElement || e.target;
	if (target.tagName.toLowerCase() == 'input')
		return;

	// actionId could be multiple objects if the page displays multiple controls
	var actionOptions = new Array();
	if(actionId.indexOf("|") == -1)
		actionOptions[0] = actionId;
	else {
		// separate the actions
		actionOptions = actionId.split("|");
	}

	// use the row objects id to find the proper row actions
	var actionObject = null;
	for(var i=0; i<actionOptions.length; i++){
		actionObject = findElementRecursively(rowObject, actionOptions[i]);
		if(actionObject != null)
			break;
	}

	// if we found the object then click it
	if(actionObject != null)
		actionObject.click();

	return true;
}

// used in conjuction with the above method, this recurses the DOM nodes to try
// to find the matching action
function findElementRecursively(element, actionName){
	var actionObject = null;
	var fullActionName = null;
	var children = element.childNodes;
	if(children != null && actionObject == null){
		for(var i=0; i<children.length; i++){
			var child = children.item(i);
			if(child.attributes != null){
				var item = child.attributes.getNamedItem("id");
				if(item != null && item.nodeValue.indexOf(actionName) != -1){
					fullActionName = item.nodeValue;
					break;
				}
			}

			if(child.childNodes.length > 0)
				actionObject = findElementRecursively(child, actionName);

			if(actionObject != null)
				break;
		}
	}

	// we found the item to click
	if(fullActionName != null)
		actionObject = document.getElementById(fullActionName);
	return actionObject;
}

//variables to track onmouseover and onchange events for the dropdown lists
var over = new Array();
var changed = new Array();

//tracks the dropdown box events and returns true if the event should trigger AJAX
function dropdownSubmit(event, object)
{
	var event_type = event.type.toLowerCase();

	if (event_type == "focus")
		changed[object.name] = false;
	else if (event_type == "change")
		changed[object.name] = true;
	else if (event_type == "mouseover")
		over[object.name] = true;
	else if (event_type == "mouseout")
		over[object.name] = false;
	else if ((event_type == "blur" || event_type == "click" && (is_ie ? !over[object.name] : true)) && changed[object.name])
	{
		changed[object.name] = false;
		return true;
	}

	return false;
}

// set focus to supplied id (used by validation SetFocusListener)
function setFocus(id) {
    var element = document.getElementById(id);
    if (element && element.focus) {
        element.focus();
    }
}

// highlight elements of supplied ids
function setHighlight(ids) {
    var idsArray = ids.split(",");
    for (var i = 0; i < idsArray.length; i++) {
        var element = document.getElementById(idsArray[i]);
        if (element) {
            if(element.className){
            	element.className = element.className + " InvalidInput";
            } else {
            	element.className = 'InvalidInput';
            }
        }
    }
}

// Set the hidden time stamp field.
function setTimeStamp() {
	//timestamp is required for DuplicateClickFilter to avoid sending duplicate requests (ex. doubleclick)
	var date = new Date();
	//expecting a form with id "Form", sometimes may not be available (ex error page)
	if (document.getElementById("Form")) {
		//form found, check if timestamp exists
		var timeStamp = document.getElementById("Form:TimeStamp");
		if (timeStamp == null) {
			//no timestamp, create one
			timeStamp = document.createElement("input");
			timeStamp.setAttribute("type", "hidden");
			timeStamp.setAttribute("id", "Form:TimeStamp");
			timeStamp.setAttribute("name", "Form:TimeStamp");
			timeStamp.setAttribute("value", "");
			document.getElementById("Form").appendChild(timeStamp);
		}
		//set timestamp value to current time
		timeStamp.value = date.getTime();
	}
}

// Switch between check mark icon and spacer icon based on objectValue
function changeCheckMarkImageSrc(sourceObject, targetObject, prefix) {
	var value = sourceObject.value;
	value = value.replace(/(?:(?:^|\n)\s+|\s+(?:$|\n))/g,'').replace(/\s+/g,' ');
	if (value != '') {
		targetObject.src=prefix+'icon_checkmark.png';
	} else {
		targetObject.src=prefix+'spacer.gif';
	}
}

//Scroll in the list box so that the selected items are visible
function scrollToSelectedItems(listBoxId) {
	var listBox = document.getElementById("Form:" + listBoxId);

	for(var index = 0; index < listBox.options.length; index++) {
		if(listBox.options[index].selected == true) {
			listBox.options[index].selected = false;
			listBox.options[index].selected = true;
		}
	}
}

function confirmAlert(message) {
	var message = message.split("|");
//	message = message.split("|");
	if(message[0] == "ALERT"){
		alert(message[1]);
		return false;
	} else if(message[0] == "CONFIRM"){
		return confirm(message[1]);
	} else {
		return  true;
	}
}

function embedReportInBrowser(url) {
	window.open(url, '_blank', 'height=768,width=1024,resizable=yes,status=no,toolbar=no,menubar=no,location=no,scrollbars=yes');
}

function frameBusting(bust) {
	//disable presentation of page if it is framed.
	if (bust && is_ie) {
		if(self == top) {
		       document.documentElement.style.display = 'block';
		   } else {
		       //top.location = self.location;
			   alert("An unauthorized attempt has been made to frame your browser window. You must close this browser and open up a new browser to continue using application. If this problem continues, please contact your System Administrator.");
			   top.location.replace(self.location.href);
		   }
	}
}
// Safely log debug and error output, if running in the local development environment
function consoleLog() {
  if (debug && window.console && window.console.log) {
    for (var i = 0, ii = arguments.length; i < ii; i++) {
      window.console.log(arguments[i]);
    }
  }
}
function consoleWarn(message) {
	if (window.console && window.console.warn) {
		window.console.warn(message);
	}
}
function consoleError(message) {
	if (window.console && window.console.error) {
		window.console.error(message);
	}
}
function pageLog(info) {
	consoleLog(info);
	var debugInfoDiv = document.getElementById("debugInfo");
	if (debugInfoDiv) {
		debugInfoDiv.appendChild(createDocumentFragment("<div id='" + debugInfoDivId + "'>" + info + "</div><br />"));
		debugInfoDivId = parseInt(debugInfoDivId) + 1;
	}
}
// A helper function for creating DOM Elements
function createDocumentFragment(newContent) {
	var docFragment = document.createDocumentFragment();
	var divElement = document.createElement('div');
	divElement.innerHTML = newContent;
	while (divElement.firstChild) {
		docFragment.appendChild(divElement.firstChild);
	}
	return docFragment;
}

//update body style class dynamically depend on SideNav exists or not
function updateBodyStyle(){
	var styleClass = "BodyNav";
	if(!document.getElementById("SideNav")){
		styleClass = "BodyNoNav";
	} 
	document.getElementsByTagName("body")[0].className = styleClass;
}

/*
 * usage:
 * $jq('#YOUR selectOneMenu ID').combobox({
 * 		css_combobox: "YOUR CSS STYLE CLASS FOR COMBOBOX",
    	css_input: "YOUR CSS STYLE CLASS FOR COMBOBOX INPUT",
    	css_toggle: "YOUR CSS STYLE CLASS FOR COMBOBOX DROPDOWN TOGGLE BUTTON"
 * })
 * 
 * or
 * 
 * $jq('#YOUR selectOneMenu ID').combobox() this will use the default css style classes
 * 
 * reference: https://jqueryui.com/autocomplete/#combobox
 */
function createAutoCompleteComboBoxWidget(){
	
	$jq.widget( "custom.combobox", {
    	
    	options: {
    		// default options
    		css_combobox: "custom-combobox",
    		css_input: "custom-combobox-input",
    		css_toggle: "custom-combobox-toggle"
    	},
    	
        _create: function() {
          this.wrapper = $jq( "<span>" )
            .addClass( this.options.css_combobox )
            .insertAfter( this.element );
   
          this.element.hide();
          this._createAutocomplete();
          this._createShowAllButton();
        },
   
        _createAutocomplete: function() {
          var selected = this.element.children( ":selected" ),
            value = selected.val() ? selected.text() : "";
   
          this.input = $jq( "<input>" )
            .appendTo( this.wrapper )
            .val( value )
            .attr( "title", "" )
            .addClass( this.options.css_input )
            .autocomplete({
              delay: 0,
              minLength: 0,
              source: $jq.proxy( this, "_source" )
            })
   
          this._on( this.input, {
            autocompleteselect: function( event, ui ) {
              ui.item.option.selected = true;
              this._trigger( "select", event, {
                item: ui.item.option
              });
            },
   
            autocompletechange: "_removeIfInvalid"
          });
        },
   
        _createShowAllButton: function() {
          var input = this.input,
            wasOpen = false;
   
          $jq( "<a>" )
            .attr( "tabIndex", -1 )
            .attr( "title", "" )
            .tooltip()
            .appendTo( this.wrapper )
            .button({
              icons: {
                primary: "ui-icon-triangle-south"
              },
              text: false
            })
            .removeClass( "ui-corner-all" )
            .addClass( this.options.css_toggle + " ui-corner-right" )
            .mousedown(function() {
              wasOpen = input.autocomplete( "widget" ).is( ":visible" );
            })
            .click(function() {
              input.focus();
   
              // Close if already visible
              if ( wasOpen ) {
                return;
              }
   
              // Pass empty string as value to search for, displaying all results
              input.autocomplete( "search", "" );
            });
        },
   
        _source: function( request, response ) {
          var matcher = new RegExp( $jq.ui.autocomplete.escapeRegex(request.term), "i" );
          response( this.element.children( "option" ).map(function() {
            var text = $jq( this ).text();
            if ( this.value && ( !request.term || matcher.test(text) ) )
              return {
                label: text,
                value: text,
                option: this
              };
          }) );
        },
   
        _removeIfInvalid: function( event, ui ) {
   
          // Selected an item, nothing to do
          if ( ui.item ) {
            return;
          }
   
          // Search for a match (case-insensitive)
          var value = this.input.val(),
            valueLowerCase = value.toLowerCase(),
            valid = false;
          this.element.children( "option" ).each(function() {
            if ( $jq( this ).text().toLowerCase() === valueLowerCase ) {
              this.selected = valid = true;
              return false;
            }
          });
   
          // Found a match, nothing to do
          if ( valid ) {
            return;
          }
   
          // Remove invalid value
          this.input
            .val( "" )
            .attr( "title", "")
            .tooltip( "open" );
          this.element.val( "" );
          this._delay(function() {
            this.input.tooltip( "close" ).attr( "title", "" );
          }, 2500 );
          this.input.autocomplete( "instance" ).term = "";
        },
   
        _destroy: function() {
          this.wrapper.remove();
          this.element.show();
        }
      });
}

/**
 * Don't hide the date picker when clicking a date. Only apply if new JQuery variable has been assigned.
 */
try {

	$jq.datepicker._selectDateOverload = $jq.datepicker._selectDate;
	$jq.datepicker._selectDate = function(id, dateStr) {
	    var target = $jq(id);
	    var inst = this._getInst(target[0]);
	    inst.inline = true;
	    $jq.datepicker._selectDateOverload(id, dateStr);
	    inst.inline = false;
	    this._updateDatepicker(inst);
	};
} catch (nojq) {
	// OK. Will only happen on pages where $jq has not been defined yet.
}

/**
 *  Script to add the date/time picker to a text input field.
 * 
 * @param fieldName The name of the calander icon that was clicked. The input field to associate the picker control with must have the same name with an "Input" suffix. 
 * @param dateFormat The format of the date portion of the control.
 * @param timeFormat The format of the time portion of the control.
 * @param language The current locale two letter languege code.
 */
function setupDateTimePicker(fieldName, dateFormat, timeFormat, language) {
	// Initialize datetimepicker in the text field in the same panelgroup as the clicked button, field IDs will be the same except input box has "input" string added on
	var escapedInputFieldName = '#' + fieldName.replace(new RegExp(':', 'g'), '\\:') + 'Input';
	var isChangeYear = true;
	var isChangeMonth = true;
	var isChangeDay = true;
	var stepMonths = 1;
	if (dateFormat !== "") {
		if (dateFormat.toLowerCase().indexOf('y') == -1) {
			isChangeYear = false;
		}
		if (dateFormat.toLowerCase().indexOf('m') == -1) {
			isChangeMonth = false;
			stepMonths = 0;
		}
		if (dateFormat.toLowerCase().indexOf('d') == -1) {
			isChangeDay = false;
			$jq('<style type="text/css"> .ui-datepicker-current { display: none; } </style>').appendTo("head");
		} else {
			$jq('<style type="text/css"> .ui-datepicker-current { display: inline; } </style>').appendTo("head");
		}
	}
	
	// If field does not have a datetimepicker have to add one.
	if ($jq(escapedInputFieldName).attr("data-calendar") != "true") {
		if (dateFormat !== "" && timeFormat !== "") {
			$jq(escapedInputFieldName).datetimepicker({
				showOn: "none",
				dateFormat: dateFormat,
	         	showButtonPanel: true,
	         	changeYear: isChangeYear,
	         	changeMonth: isChangeMonth,
	         	stepMonths: stepMonths,
	         	beforeShowDay: function(date) {
	         		return checkChangeDay(isChangeDay);
	         	},
			 	timeInput: false,
			 	timeFormat: timeFormat,
			 	onClose: function( dateText, input ) {
			 		// Since we are not showing days have to update the month and year values.
			 		if (!isChangeDay) {
			 			var month = 1;
			 			if (isChangeMonth) {
			 				month = $jq("#ui-datepicker-div .ui-datepicker-month :selected").val();
			 			}
			            var year = $jq("#ui-datepicker-div .ui-datepicker-year :selected").val();
			            $jq(this).datepicker('setDate', new Date(year, month, 1));
			 		}
			 		$jq(escapedInputFieldName).datetimepicker("destroy");
			 		$jq(escapedInputFieldName).attr("data-calendar", "false");
			 		$jq(escapedInputFieldName).prop("readonly", false).prop('disabled', false);
				},
			 	// controlType: "select",
			 	oneLine: true},
			 	$jq.timepicker.regional[language],
				$jq.datepicker.regional[language]
			).attr("data-calendar", "true").focus(function () {
				if (!isChangeDay) {
					$jq(".ui-datepicker-calendar").hide();
	                $jq("#ui-datepicker-div").position({
	                    my: "center top",
	                    at: "center bottom",
	                    of: $(this)
	                });
				}
			});
		} else if (dateFormat !== "") {
			$jq(escapedInputFieldName).datepicker({
				showOn: "none",
				dateFormat: dateFormat,
				showButtonPanel: true,
				changeYear: isChangeYear,
				changeMonth: isChangeMonth,
				stepMonths: stepMonths,
				beforeShowDay: function(date) {
					return checkChangeDay(isChangeDay);
	         	},
				onClose: function( dateText, input ) {
					// Since we are not showing days have to update the month and year values.
			 		if (!isChangeDay) {
			 			var month = 1;
			 			if (isChangeMonth) {
			 				month = $jq("#ui-datepicker-div .ui-datepicker-month :selected").val();
			 			}
			 			var year = $jq("#ui-datepicker-div .ui-datepicker-year :selected").val();
			            $jq(this).datepicker('setDate', new Date(year, month, 1));
			 		}
					$jq(escapedInputFieldName).datepicker("destroy");
					$jq(escapedInputFieldName).attr("data-calendar", "false");
					$jq(escapedInputFieldName).prop("readonly", false).prop('disabled', false);
				}},		
				$jq.datepicker.regional[language]
			).attr("data-calendar", "true").focus(function () {
				if (!isChangeDay) {
					$jq(".ui-datepicker-calendar").hide();
	                $jq("#ui-datepicker-div").position({
	                    my: "center top",
	                    at: "center bottom",
	                    of: $(this)
	                });
				}
			});
		} else {
			$jq(escapedInputFieldName).timepicker({
				showOn: "none",
			 	timeFormat: timeFormat,
			 	timeInput: false,
			 	// controlType: "select",
			 	onClose: function( dateText, input ) {
			 		$jq(escapedInputFieldName).timepicker("destroy");
			 		$jq(escapedInputFieldName).attr("data-calendar", "false");
			 		$jq(escapedInputFieldName).prop("readonly", false).prop('disabled', false);
				},
			 	oneLine: true},
			 	$jq.timepicker.regional[language]
			).attr("data-calendar", "true");
		}
	}
	if (dateFormat !== "" && timeFormat !== "") {
		// Show the datetimepicker.
		$jq(escapedInputFieldName).datetimepicker("show");
	} else if (dateFormat !== "") {
		// Show the datetimepicker.
		$jq(escapedInputFieldName).datepicker("show");
	} else {
		$jq(escapedInputFieldName).timepicker("show");
	}
	$jq(escapedInputFieldName).prop("readonly", true).prop('disabled', true);
}

/**
 * Return true if days can be selected, false otherwise.
 * @param dateFormat The format used to show the date.
 * @returns {Array}
 */
function checkChangeDay(isChangeDay) {
	if (isChangeDay) {
		return [true, "", ""];
	} else {
		return [false, "", ""];
	};
} 

function setFocusForResearchPage(rowIndex){
	var obj = document.getElementById('Form:criteriaList:'+rowIndex+':stringParm');
	if (obj != null) {
		obj.focus();
	}
	var obj = document.getElementById('Form:criteriaList:'+rowIndex+':decimalParm');
	if (obj != null) {
		obj.focus();
	}
	var obj = document.getElementById('Form:criteriaList:'+rowIndex+':bigDecimalParm');
	if (obj != null) {
		obj.focus();
	}
	var obj = document.getElementById('Form:criteriaList:'+rowIndex+':integerParm');
	if (obj != null) {
		obj.focus();
	}
	var obj = document.getElementById('Form:criteriaList:'+rowIndex+':longParm');
	if (obj != null) {
		obj.focus();
	}
}

/**
 * Script to highlight error field(s) when creating or editing Rules Accounts required field(s) that are refreshed via AJAX
 */
function validateRulesAccountsRequiredFields(){
    // PWE-30229
    var requiredValidationFields = ["Form:ACHSelectedItems", "Form:ACFSelect", "Form:CustomFieldValueInput"];
    for (var i = 0; i < requiredValidationFields.length; i++) { 
    	var requiredFieldElement = document.getElementById(requiredValidationFields[i] + "Required");
	    if(requiredFieldElement && requiredFieldElement.innerText === "*"){
	    	var fieldElement = document.getElementById(requiredValidationFields[i]);
		    if(fieldElement.className === "FormValue") {
		    	fieldElement.className = "FormValue InvalidInput";
			} 
		}
	}
}

function doEndCapture() {
	try {
		consoleLog("About to call sendAsyncGetRequestToUrl()...");
		var endDepositDriverUrl = "<%= EndDepositController.getDriverURLForAjaxEndCapture(true) %>";
		sendAsyncGetRequestToUrl(endDepositDriverUrl);
		consoleLog("Done with call to sendAsyncGetRequestToUrl()...");
	} catch (except) {
		// Do nothing since the User is logging out anyway.
		consoleLog("Exception caught on attempt to call sendAsyncGetRequestToUrl(): " + except);
	}
}

function disableBriefly(elem,callback,duration) {
	// freeze by 3 seconds if duration parameter is not provided
	elem.disabled=true;
	if (!duration) {
		duration=3000;
	}
	setTimeout(function() {
		if (elem.disabled) {
			elem.disabled=false;
			if (callback) {
				callback();
			}
		}		
	},duration);
}

var viewItemHistoryRef = {};
function viewItemHistory(sequenceNumber) {
	if(typeof(viewItemHistoryRef[sequenceNumber]) == 'undefined' || viewItemHistoryRef[sequenceNumber].closed){
		// Not created yet or closed, so open the window.
		viewItemHistoryRef[sequenceNumber] = window.open('ViewItemHistory.faces', '_blank', 'height=600,width=900,status=no,toolbar=no,menubar=no,location=no,scrollbars=yes');
	} else {
		// Give it focus (in case it got burried).
		viewItemHistoryRef[sequenceNumber].focus();
	}
}

var waitDialogShown = false;
function showWaitDialog() {
//avoid attempt to show it if it is already shown
	if (!waitDialogShown) {
		var body = document.body,
		html = document.documentElement;

		var height = Math.max( body.scrollHeight, body.offsetHeight, 
                       html.clientHeight, html.scrollHeight, html.offsetHeight );
		waitDialogShown = true;
		divObj = document.getElementById('wait-dialog-invisible');
		divObj.style.display = "block";
		divObj.style.height = height +'px';
		consoleLog("showWaitDialog");
	}
}
 
function onRequestStart() {
	consoleLog("onRequestStart");
	showWaitDialog();
}

function onRequestEnd() {
	if (waitDialogShown) {
		waitDialogShown = false;
		divObj = document.getElementById('wait-dialog-invisible');
		divObj.style.display = "none";
		consoleLog("onRequestEnd");
	}
}
