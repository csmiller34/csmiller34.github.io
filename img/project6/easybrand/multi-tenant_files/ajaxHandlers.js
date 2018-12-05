// global variable to allow/disallow debug alerts
var enableAlert = false;
// global variable to allow/disallow debug level information to be inserted in the header for the post request
var enableDebugHeader = false;
// global variable to allow/disallow connection close for the post request
var enableConnectionClose = false;
// global variable to prevent simultaneous execution of checkFormMessage() function
var isExecutingDepositMessage = false;
// global variable to control timeout for checkForMessage() function
var timeoutCFM;

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


/*
 *	This will send the POST request to the server and pass the location id as post parameters
 */
function locationChanged(submitButtonId) {
	try{
	var submitButton = document.getElementById('Form:'+submitButtonId);
	if (submitButton != null) {
		// Disable the button
		submitButton.disabled = true;
	}
	var options = document.getElementById("Form:LocationInput").options;
	var selectedIndex = options.selectedIndex;
	var locationId = options[selectedIndex].value;
	var req = newXMLHttpRequest();

	// Make a synchronous AJAX call (by sending a false parameter) to avoid timing problems
	req.open("GET", "servlet/XMLHTTPResponseServlet.do?command=location_changed&location_id=" + locationId, false);
	req.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
	req.setRequestHeader("Synchronized", "false");
	req.setRequestHeader("ncrCSRFToken",document.getElementById("ncrCSRFToken").value);

	if(enableConnectionClose) {
		req.setRequestHeader("Connection", "close");
	}
	// req.send("command=location_changed&location_id=" + locationId);
	req.send(null);
	updateAccount(req.responseXML);
	}
	catch(err){
	}
	finally{
	}
	var wtInput = document.getElementById('Form:WorkTypeInput');
	var hasWTOptions = false;
	if(wtInput)	{
		hasWTOptions = wtInput.options.length > 0;
	}
	var notForceLocationSelected = !(selectedIndex == 0 &&locationId == 0);
	if (submitButton != null && (wtInput ? notForceLocationSelected && hasWTOptions : notForceLocationSelected)) {
		// Enable the button
		submitButton.disabled = false;
	}
}

/*
 *	This will enable/disable the Requested button
*/
function dataTypeChanged(requestedButtonId, status) {
	var requestedButton = document.getElementById('Form:'+requestedButtonId);
	if (requestedButton != null) {
		// Disable the button
		requestedButton.disabled = status;
	}
}

/*
 * This will read the server response and update the account number and routing transit number fields in web page
 */
function updateAccount(accountXML) {
	var bank = accountXML.getElementsByTagName("bank")[0];
	var showAccountSearch = (accountXML.getElementsByTagName("showAccountButton")[0]).getAttribute("value");
	var remittanceTypeCode = (accountXML.getElementsByTagName("remittanceTypeCode")[0]).getAttribute("value");
	var showSimpleRemittance = (accountXML.getElementsByTagName("showSimpleRemittance")[0]).getAttribute("value");
	var selectedAccount ="";

	try{
		selectedAccount = (accountXML.getElementsByTagName("selectedAccount")[0]).getAttribute("id");
	}
	catch(err){	}

	var accounts = bank.getElementsByTagName("account");
	var accountNumber = document.getElementById("Form:AccountNumberInput");
	//var button = document.getElementById("Form:StartDepositButton") || document.getElementById("Form:SaveButton");

	// Enable and disable controls depending on the account size
	if(showAccountSearch == "true") {
		document.getElementById("Form:AccountNumberGrid").style.display = "inline";
		document.getElementById("Form:AccountNumberInput").style.display = "none";
		document.getElementById("Form:ShowAccountNumberInput").value = "";

		try {
			var clearingChannelInput = document.getElementById("Form:ClearingChannelInput");
			clearingChannelInput.style.display = "none";
		}catch(ex){ }

	} else {
		document.getElementById("Form:AccountNumberGrid").style.display = "none";
		document.getElementById("Form:AccountNumberInput").style.display = "inline";
	}

	// clearing all the existing account options
	var removeCount = accountNumber.options.length;
	for(var j = removeCount-1; j >= 0; j--) {
		accountNumber.options[j] = null;
	}

	// populating new account options
	for (var i = 0 ; i < accounts.length; i++) {
		var accountId = accounts[i].getAttribute("id");
		var accountName = accounts[i].getAttribute("name");
		accountNumber.options[i] = new Option(accountName, accountId);
		if (accountId == selectedAccount) {
			options = document.getElementById("Form:AccountNumberInput").options;
			options.selectedIndex = i;
		}
	}

	// update the routing number
	var routing = bank.getElementsByTagName("routing")[0];
	var routingNumber = '';
	if(routing != null){
		routingNumber = routing.getAttribute("number");
	} else {
		routingNumber = "";
	}
	var routingNumberField = document.getElementById("Form:RoutingTransitNumberInput");
	// setting the routing transit field
	routingNumberField.value = routingNumber;

	// If we are on the new deposit page...
	if(document.getElementById("Form:RemittanceShowPanel") != null) {
		// ...update the simple/remittance radio buttons.
		if(showSimpleRemittance == "true") {
			document.getElementById("Form:RemittanceShowPanel").style.display = 'none';
			document.getElementById("Form:SimpleShowPanel").style.display = 'none';
			document.getElementById("Form:RemittanceInputPanel").style.display = 'inline';
			document.getElementById("Form:RemittanceInput").value = remittanceTypeCode;
		} else {
			document.getElementById("Form:RemittanceInputPanel").style.display = 'none';
			if (remittanceTypeCode == "0") {
				document.getElementById("Form:RemittanceShowPanel").style.display = 'none';
				document.getElementById("Form:SimpleShowPanel").style.display = 'inline';
			} else {
				document.getElementById("Form:RemittanceShowPanel").style.display = 'inline';
				document.getElementById("Form:SimpleShowPanel").style.display = 'none';
			}
		}
	}
}

/*
 *	This will send the POST request to the server and pass the account number as post parameters
 */
function accountChanged(submitButtonId) {
	if( document.getElementById("Form:RoutingTransitNumberInput") == null ) {
		// Don't bother checking if there's no field to populate.
		return;
	}

	try{
	var submitButton = document.getElementById('Form:'+submitButtonId);
	if (submitButton != null) {
		// Disable the button
		submitButton.disabled = true;
	}
	/** If no location id, don't send. There should be a default customer location */
	var locationId = null;
	var locationInput = document.getElementById("Form:LocationInput");
	if( locationInput ) {
		var options = document.getElementById("Form:LocationInput").options;
		var selectedIndex = options.selectedIndex;
		locationId = options[selectedIndex].value;
	}

	options = document.getElementById("Form:AccountNumberInput").options;
	selectedIndex = options.selectedIndex;
	var accountId = options[selectedIndex].value;

	var req = newXMLHttpRequest();
	// Make a synchronous AJAX call (by sending a false parameter) to avoid timing problems
	req.open("GET", "servlet/XMLHTTPResponseServlet.do?command=account_changed&account_number=" + accountId + (locationId != null? "&location_id=" + locationId : ""), false);
	req.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
	req.setRequestHeader("Synchronized", "false");
	req.setRequestHeader("ncrCSRFToken",document.getElementById("ncrCSRFToken").value);
	if(enableConnectionClose) {
		req.setRequestHeader("Connection", "close");
	}
	// req.send("command=account_changed&account_number=" + accountId + (locationId != null? "&location_id=" + locationId : "" ) );
	req.send(null);
	updateRoutingNumber(req.responseXML);
	}
	catch(err){
	}
	finally{
	}
	if (submitButton != null) {
		// Enable the button
		submitButton.disabled = false;
	}
}

/*
 *	This will send the POST request to the server and pass the customer deposit type option
 */
function depositTypeOptionChanged(screenfunction) {
	// set selected deposit type option
	var depTypeOption=getDepositTypeInputOption();	
	// Make a synchronous AJAX call (by sending a false parameter) to avoid timing problems to set the new selected deposit type list and get the default deposit type to set.
	var req = newXMLHttpRequest();
	req.open("GET", "servlet/XMLHTTPResponseServlet.do?command=deposit_type_option&function=" + screenfunction + "&deposittype_option=" + depTypeOption, false);	
	req.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
	req.setRequestHeader("Synchronized", "false");
	req.setRequestHeader("ncrCSRFToken",document.getElementById("ncrCSRFToken").value);
	req.send(null);
	// Update the page with the new default deposit type 
	return updateDepositTypeOption(req.responseXML);	
}
/*
 *	This will send the POST request to the server and pass the account deposit type option
 */
function getDepositTypeInputOption() {
	var options = document.getElementById("Form:AllowedDepositTypesInput").getElementsByTagName('input');
	var label = document.getElementById("Form:AllowedDepositTypesInput").getElementsByTagName('label');		
	// set selected deposit type option
	var depTypeOption="";
	for (var j = 0 ; j < options.length; j++) {	
		if (options.item(j).checked) {
			depTypeOption=depTypeOption + options.item(j).value + ";/";
		}
	}	
	return depTypeOption;	
}
/*
 * This will read the server response and update the deposit type option and default value in web page
 */
function updateDepositTypeOption(xml) {
	var selectedDepositTypeOptionLabel= (xml.getElementsByTagName("selectedDepositTypeOptionLabel")[0]).getAttribute("key");
	var defaultDepositTypeInput = document.getElementById("Form:DefaultDepositTypeInput").getElementsByTagName('input');
	var defaultDepositTypeLabel = document.getElementById("Form:DefaultDepositTypeInput").getElementsByTagName('label');
	var found = 0;
	for (var j = 0 ; j < defaultDepositTypeInput.length; j++) {	
		var theLabel = defaultDepositTypeLabel.item(j).textContent;
		if (defaultDepositTypeLabel.item(j).textContent.substr(0, 1) == ' ') {
			theLabel = defaultDepositTypeLabel.item(j).textContent.substr(1);
		}		
		if (theLabel == selectedDepositTypeOptionLabel) {			
			defaultDepositTypeInput.item(j).checked = true;	
			found = 1;			
		} else {
			defaultDepositTypeInput.item(j).checked = false;			
		}
	}	
	return defaultDepositTypeInput.length;
}
/*
 * If there is one default deposit type on the page, mark it selected. 
 */
function updateFirstDepositTypeOption() {
	var updated = 0;
	var cnt = getNumAllowedDepositTypesInputChecked();
	var defaultDepositTypes = document.getElementById("Form:DefaultDepositTypeInput").getElementsByTagName('input');		
	if (cnt == 1) {
		if (defaultDepositTypes.length == 1 && !defaultDepositTypes.item(0).checked) {	
			defaultDepositTypes.item(0).checked = true;
			updated = 1;		
		}
	} else {
		var isChecked = 0;
		for (var j = 0 ; j < defaultDepositTypes.length; j++) {
			if (defaultDepositTypes.item(j).checked) {
				isChecked = 1;	
			}				
		}
		if (isChecked == 0 && defaultDepositTypes.length > 0) {	
			defaultDepositTypes.item(0).checked = true;
			updated = 1;			
		}
	}
	return updated;
}
/*
 * Gets the number of selected allowed deposit types.
 */
function getNumAllowedDepositTypesInputChecked() {
	var allowedDepositTypes = document.getElementById("Form:AllowedDepositTypesInput").getElementsByTagName('input');	
	var cnt = 0;
	for (var j = 0 ; j < allowedDepositTypes.length; j++) {			
		if (allowedDepositTypes.item(j).checked) {				
			cnt++;		
		}
	}	
	return cnt;
}
/*
 *	This will send the POST request to the server and pass the depository account type as post parameters
 */
function depositoryAccountTypeChanged() {
	var options = document.getElementById("Form:DepositoryAccountTypeInput").options;
	var selectedIndex = options.selectedIndex;
	var depositoryAccountType = options[selectedIndex].value;
	var req = newXMLHttpRequest();

	// Make a synchronous AJAX call (by sending a false parameter) to avoid timing problems
	req.open("GET", "servlet/XMLHTTPResponseServlet.do?command=depository_account_type_changed&depository_account_type=" + depositoryAccountType, false);
	req.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
	req.setRequestHeader("Synchronized", "false");
	req.setRequestHeader("ncrCSRFToken",document.getElementById("ncrCSRFToken").value);
	// req.send("command=depository_account_type_changed&depository_account_type=" + depositoryAccountType);
	req.send(null);
	updateBillingSystem(req.responseXML);

}

/*
 *	This will send the POST request to the server and pass the billing system as post parameters
 */
function billingSystemChanged() {
	var options = document.getElementById("Form:BillingSystemInput").options;
	var selectedIndex = options.selectedIndex;
	var billingsystem = options[selectedIndex].value;
	var req = newXMLHttpRequest();

	// Make a synchronous AJAX call (by sending a false parameter) to avoid timing problems
	req.open("GET", "servlet/XMLHTTPResponseServlet.do?command=billing_system_changed&billing_system=" + billingsystem, false);
	req.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
	req.setRequestHeader("Synchronized", "false");
	req.setRequestHeader("ncrCSRFToken",document.getElementById("ncrCSRFToken").value);
	// req.send("command=depository_account_type_changed&depository_account_type=" + depositoryAccountType);
	req.send(null);
	updateDepositoryAccountType(req.responseXML);
}
/*
 *	This will send the POST request to the server and pass the billing system selected on customer add account page as post parameters
 */
function billingSystemChangedOnNewCustomerAccount() {
	var options = document.getElementById("Form:BillingSystemInput").options;
	var selectedIndex = options.selectedIndex;
	var billingsystem = options[selectedIndex].value;
	var req = newXMLHttpRequest();

	// Make a synchronous AJAX call (by sending a false parameter) to avoid timing problems
	req.open("GET", "servlet/XMLHTTPResponseServlet.do?command=billingsystem_changed_on_new_customer_account&billing_system=" + billingsystem, false);
	req.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
	req.setRequestHeader("Synchronized", "false");
	req.setRequestHeader("ncrCSRFToken",document.getElementById("ncrCSRFToken").value);
	// req.send("command=billingsystem_changed_on_new_customer_account&billingsystem=" + billingsystem);
	req.send(null);
	updateDepositoryAccountType(req.responseXML);
}
/*
 *	This will send the POST request to the server and pass the depository account type as post parameters
 */
function depositoryAccountTypeChangedOnNewCustomerAccount() {
	var options = document.getElementById("Form:DepositoryAccountTypeInput").options;
	var selectedIndex = options.selectedIndex;
	var depositoryAccountType = options[selectedIndex].value;
	var req = newXMLHttpRequest();

	// Make a synchronous AJAX call (by sending a false parameter) to avoid timing problems
	req.open("GET", "servlet/XMLHTTPResponseServlet.do?command=depository_account_type_changed_on_new_customer_account&depository_account_type=" + depositoryAccountType, false);
	req.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
	req.setRequestHeader("Synchronized", "false");
	req.setRequestHeader("ncrCSRFToken",document.getElementById("ncrCSRFToken").value);
	// req.send("command=depository_account_type_changed_on_new_customer_account&depository_account_type=" + depositoryAccountType);
	req.send(null);
	updateBillingSystem(req.responseXML);

}

/*
 * This will read the server response and update the billing system and default value in web page
 */
function updateBillingSystem(billingSystemXML) {
	var bank = billingSystemXML.getElementsByTagName("bank")[0];
	var selectedbillingsystem = (billingSystemXML.getElementsByTagName("selectedbillingsystem")[0]).getAttribute("key");
	var billingsystemlist = document.getElementById("Form:BillingSystemInput");

	// set selected billing system
	for (var i = 0 ; i < billingsystemlist.length; i++) {
		var bsKey = billingsystemlist.options[i].value;
		if (bsKey==selectedbillingsystem) {
			billingsystemlist.selectedIndex=i;
		}
	}
}
/*
 * This will read the server response and update the billing system and default value in web page
 */
function updateDepositoryAccountType(xml) {
	var bank = xml.getElementsByTagName("bank")[0];
	var selectedDepositoryAccountType = (xml.getElementsByTagName("selectedbillingsystem")[0]).getAttribute("key");
	var list = document.getElementById("Form:DepositoryAccountTypeInput");

	// set selected depository account type
	for (var i = 0 ; i < list.length; i++) {
		var bsKey = list.options[i].value;
		if (bsKey==selectedDepositoryAccountType) {
			list.selectedIndex=i;
		}
	}
}

var depositlistPollingInterval = 5000;

function setDepositlistPollingInterval(interval) {
	if (interval >= 1000) {
		depositlistPollingInterval = interval; 
	} else {
		depositlistPollingInterval = 1000;
		consoleWarn("DepositlistRefreshPollingInterval should not be less than 1000 ms, using default interval 1000 ms");
	}
}

function checkForMessage() {
    if(!isExecutingDepositMessage) {
    	// A global sentinel variable introduced to protect this
     	// function from being called white it is executing
        isExecutingDepositMessage = true;
    	if(shouldAJAXPoll) {
	        var req;
		    var prefix;
		    var message;
		    var refresh;
		    var action;
		    var polling;
	        // preventive code added to catch an exception - PWE-5385
	     	// The try/catch ensures that the sentinel variable is handled
	     	// correctly when an exception occurs
		    try {
			    req = newXMLHttpRequest();
			    request_id++;
			    if(request_id > 9999999999) {
			    	request_id = 1;
			    }
			    request_id_str = '0000000000' + request_id;
			    request_id_str = request_id_str.substring((request_id_str.length) - 10); // make it fixed length 10 characters

				// Make a synchronous AJAX call (by sending a false parameter) to avoid timing problems
				prefix = "Exception from req.open() : ";
				req.open("GET", "servlet/XMLHTTPResponseServlet.do?command=depositlist_changed", false);

				prefix = "Exception from req.setRequestHeader(Content-Type) : ";
				req.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
				req.setRequestHeader("Synchronized", "false");
				req.setRequestHeader("ncrCSRFToken",document.getElementById("ncrCSRFToken").value);

				if(enableDebugHeader) {
					prefix = "Exception from req.setRequestHeader(X-NCR-TOKEN) : ";
					// The CFM prefix stands for checkForMessage()
					req.setRequestHeader("X-NCR-TOKEN", "CFM" + timestamp + request_id_str);
				}

				if(enableConnectionClose) {
					prefix = "Exception from req.setRequestHeader(Connection) : ";
					req.setRequestHeader("Connection", "close");
				}

				prefix = "Exception from req.send(command=depositlist_changed) : ";
				// req.send("command=depositlist_changed");
				req.send(null);

				prefix = "Exception from getting message : ";
				message = req.responseXML.getElementsByTagName("message")[0];

				prefix = "Exception from getting refresh : ";
				refresh = message.getElementsByTagName("refresh");

				prefix = "Exception from getting action : ";
				action = refresh[0].getAttribute("action");

				prefix = "Exception from getting polling : ";
				polling = refresh[0].getAttribute("polling");
			}
			catch(e) {
			    isExecutingDepositMessage = false;
				if(enableAlert) {
					alert(prefix + e.message);
				}
			}

			if(action == "Yes") {
				updateDepositList();
			}

			if(polling == "Yes") {
				if (timeoutCFM != null) {
					clearTimeout(timeoutCFM);
				}
				// restart the timer
				timeoutCFM = setTimeout("checkForMessage()", depositlistPollingInterval);
			}
    	}else{
    		//polling is disabled retry to poll after 5 sec in case if polling is enabled
    		timeoutCFM = setTimeout("checkForMessage()", depositlistPollingInterval);
    	}
	}
    isExecutingDepositMessage =  false;
}

function startPolling() {
	checkForMessage();
}

/*
 * This will read the server response and update the routing transit number fields in web page
 */
function updateRoutingNumber(accountXML) {
	var bank = accountXML.getElementsByTagName("bank")[0];

	var routing = bank.getElementsByTagName("routing");
	var routingNumber = routing[0].getAttribute("number");
	var routingNumberField = document.getElementById("Form:RoutingTransitNumberInput");
	// setting the routing transit field
	routingNumberField.value = routingNumber;
}

/*
 * This will send a POST request to the server informing it of the driver active status.
 */
function sendDriverStatus(status) {
	var req = newXMLHttpRequest();

	if (req) {
	    // make synchronous call
		var url = "servlet/XMLHTTPResponseServlet.do?command=driver_status&driver_status=" + status;
		var responseReturned = driverRequestInformation(req,url);
		return responseReturned;
	}
	else {
		return false;
	}		
	
}


/*
 * This will send a POST request to the server to provide driver related information.
 */
function sendDriverDataFromInfoCommand(status,xptInfo,transportType,guid,cln, isRequestFromMaintenancePage) {
	var req = newXMLHttpRequest();

	if (req) {
	    // make synchronous call
		var url = "servlet/XMLHTTPResponseServlet.do?command=driver_info&driver_status=" + status + "&driver_xptinfo=" + xptInfo + "&driver_transport=" + transportType +"&driver_guid="+ guid +"&driver_cln="+ cln +"&isRequestFromMaintenancePage=" + isRequestFromMaintenancePage;
		var responseReturned = driverRequestInformation(req,url);
		return responseReturned;
	}
	else {
		return false;
	}		
}

function driverRequestInformation(req,url) {
	
	if (checkDriverUsingAJAX) {
		var selectedAJAXUrl = document.getElementById(CONSTANTS.selectedAJAXDriverUrl);
		if (selectedAJAXUrl && selectedAJAXUrl.innerHTML && (selectedAJAXUrl.innerHTML != "")) {
			url = url + "&driverUrl=" + selectedAJAXUrl.innerHTML;
		}
	}
	req.open("GET", url, false);
	req.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
	req.setRequestHeader("Synchronized", "false");
	req.setRequestHeader("ncrCSRFToken",document.getElementById("ncrCSRFToken").value);
	if(enableConnectionClose) {
		req.setRequestHeader("Connection", "close");
	}
	// See PWE-19523 IE8 browser hangs from March 31, 2014
	req.send(null);
	return req.responseText;

}


/*
 * Handle the return from the send driver call.
 */
function sendDriverStatusHandler() {
	// Do nothing.

}

function refreshStatus (request_type){
	var url = "servlet/XMLHTTPResponseServlet.do?command=driver_info&request_type=" + request_type+"&isRequestFromMaintenancePage=true"; 
	return sendSyncGetRequestToUrl(url);
}

/*
 * This will send an asynchronous GET request to the specified url.
 */
function sendAsyncGetRequestToUrl(url) {
        var req = newXMLHttpRequest();
        if (req) {
                req.open("GET", url, true);
                req.setRequestHeader("Content-Type", "text/plain");
                // See PWE-19523 IE8 browser hangs from March 31, 2014
                req.send(null);
                return req.responseText;
        }
        else {
                return false;
        }
}
/*
 * This will send a synchronous GET request to the specified url.
 */
function sendSyncGetRequestToUrl(url) {
    var req = newXMLHttpRequest();
    if (req) {
            req.open("GET", url, false);
            req.setRequestHeader("Content-Type", "text/plain");
            req.setRequestHeader("ncrCSRFToken",document.getElementById("ncrCSRFToken").value);
            req.send(null);
            return req.responseText;
    }
    else {
            return false;
    }
}