// retrieves the value from local storage given a key.
// if local storage is not supported, return undefined
function retrieveValue(key) {
	if(window.localStorage) {
		return localStorage.getItem(key);		
	}
	return undefined;
}

// store the value in local storage given a key.
// if local storage is not supported, return undefined. else return the value.
function storeValue(key, value) {
	if(window.localStorage) {
		localStorage.setItem(key, value);
		return localStorage.getItem(key);
	}
	return undefined;
}

// clears all local storage.
function clearLocalStorage() {
	if(window.localStorage) {
		localStorage.clear();
	}
	return undefined;
}