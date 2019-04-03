/** Object.assign ponyfill (note: used by Rollup)
 *	@private
 */
export function assign(obj) {
	for (let i=1; i<arguments.length; i++) {
		// eslint-disable-next-line guard-for-in, prefer-rest-params
		for (let p in arguments[i]) obj[p] = arguments[i][p];
	}
	return obj;
}


export function getWindow() {
	try {
		if (window) return window;
	}
	catch (e) {
		return;
	}
}

