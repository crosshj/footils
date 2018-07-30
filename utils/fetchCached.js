/*
 DONE, but some features are WIP
 - setup test to fire off multiple calls to fetchCached and make fetchCached do debouncing
 - not 100% generalized just yet
 - use some other method for envs that don't support local storage
*/


function rejectStatusError(response) {
	if (!response.ok) {
		var message = response.statusText;
		if(response.url.includes('purchaseApp')){
			message = response.json().then(json => {
				const MAX_LENGTH = 250;
				var msg = json.body.message.slice(0, MAX_LENGTH);
				if(msg.length >= MAX_LENGTH){
					msg += ' ...';
				}
				throw Error(`${json.body.code} : ${msg}`);
			});
			return message;
		}
		throw Error(message);
	}
	return response;
}

function removeCached(condition) {
	var arr = []; // Array to hold the keys
	// Iterate over localStorage and insert the keys that meet the condition into arr
	var i, j;
	for (i = 0; i < localStorage.length; i++) {
		if (condition(localStorage.key(i))) {
			arr.push(localStorage.key(i));
		}
	}

	// Iterate over arr and remove the items by key
	for (j = 0; j < arr.length; j++) {
		localStorage.removeItem(arr[j]);
	}
}

// test to see if localStorage is supported (properly)
// https://stackoverflow.com/a/16427747
function localStorageIsSupported() {
	// NOTE: IE should have been abandoned at v9, Edge should never have been created!
	if (document.documentMode || /Edge/.test(navigator.userAgent)) {
		return false;
	}
	var test = 'test';
	try {
		localStorage.setItem(test, test);
		localStorage.removeItem(test);
		return true;
	} catch (e) {
		return false;
	}
}

//https://stackoverflow.com/a/7616484
function hashCode(stringToHash = '') {
	var hash = 0, i, chr;
	if (stringToHash.length === 0) return hash;
	for (i = 0; i < stringToHash.length; i++) {
		chr = stringToHash.charCodeAt(i);
		hash = ((hash << 5) - hash) + chr;
		hash |= 0; // Convert to 32bit integer
	}
	return hash;
}

//adapted from: https://www.sitepoint.com/cache-fetched-ajax-requests/
const fetchCached = (url, options = {}) => {
	if (!localStorageIsSupported()) {
		return fetch(url, options);
	}

	const defaultKey = 'omgCHANGEmeTHISneedsTObeDYNAMIC';
  const sessionHash = hashCode( 
  options.sessionKey && typeof options.sessionKey === 'string'
    ? sessionKey
    : defaultKey
  );

  // each cached item will expire n minutes after it was created
	const expiry = typeof options.expireSeconds === 'number'
		? options.expireSeconds
		: 5 * 60; // 5 min default

  const cacheKey = url;
	const cached = localStorage.getItem(cacheKey);
	const whenCached = localStorage.getItem(cacheKey + ':ts');
	const sessionToken = localStorage.getItem('session_hash');

	// clear and don't cache if we don't have a proper session cache key
	var currentToken = `${sessionHash}`;
	if(currentToken === '0'){
		removeCached(key => key.includes('/'));  //TODO: this is stupid, need to figure out a way to identify what to delete
		removeCached(key => key === 'session_hash');
		return fetch(url, options);
	}

	let age = whenCached
		? (Date.now() - whenCached) / 1000
		: expiry;
	const sessionTokenIsValid = currentToken === sessionToken;

	// return cached results if all is well
	if (cached && age < expiry && sessionTokenIsValid) {
		let response = new Response(new Blob([cached]));
		return Promise.resolve(response);
	}

	// clear cache and start again if session key is new/different
	if(!sessionTokenIsValid){
		localStorage.setItem('session_hash', currentToken);
		removeCached(key => key.includes('/embeddable/'));
	}

	// clear item cache, fetch then cache
	localStorage.removeItem(cacheKey);
	localStorage.removeItem(cacheKey + ':ts');


	/*
		NOTE: perhaps this promise could be cloned and given to subsequent and immediate
		fetch's of same url  as a form of debounce?

		Maybe check to see if matching promises were pushed to an array and resolve them
	*/
	const fetchPromise = fetch(url, options)
		.then(rejectStatusError)
		.then(response => {
			let ct = response.headers.get('Content-Type');

			// only cache text and json
			if (!ct || !(ct.match(/application\/json/i) || ct.match(/text\//i))) {
				return response;
			}

			// don't cache when response has json.error in body
			var error = undefined;
			try {
				error = JSON.parse(content).error;
			} catch (e) {
				// do nothing
			}
			if(error){
				return response;
			}

			// cache resonse
			response.clone().text()
				.then(content => {
					localStorage.setItem(cacheKey, content);
					localStorage.setItem(cacheKey + ':ts', Date.now());
				});

			return response;
		});
	return fetchPromise;
};

export default fetchCached;
