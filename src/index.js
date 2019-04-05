import { h, Component } from 'preact';
import { assign, getWindow } from './util'; // eslint-disable-line no-unused-vars

/**
 * Returns true if the application is running as an installed PWA.
 *
 * @example
 * let isStandalone = isStandAlone();
 *
 */
export function isStandalone() {
	let window = getWindow();
	if (!window) return false;

	return window.matchMedia && window.matchMedia('(display-mode: standalone)').matches ||
            window.navigator && window.navigator.standalone === true || false;
}

const CACHE = {
	prompt: null,
	installPromptListener: null,
	appInstalledListener: null,
	onPrompts: []
};

/**
 * Any window listeners and cached prompts that have been captured by awaitInstallPrompt() are removed.
 */
export function reset() {
	let window = getWindow();
	if (CACHE.installPromptListener) {
		window && window.removeEventListener && window.removeEventListener('beforeinstallprompt', CACHE.installPromptListener);
		CACHE.installPromptListener = null;
	}
	if (CACHE.appInstalledListener) {
		window && window.removeEventListener && window.removeEventListener('appinstalled', CACHE.appInstalledListener);
		CACHE.appInstalledListener = null;
	}
	CACHE.prompt = null;
	CACHE.onPrompts = [];
}

function removeOnPrompt(func) {
	CACHE.onPrompts = CACHE.onPrompts.filter(onPrompt => onPrompt !== func);
}

function dispatchToOnPrompt() {
	CACHE.onPrompts.forEach(onPrompt => onPrompt(CACHE.prompt));
}

/**
 * This function allows you to listen to the browser for the install prompt
 * that allows you to install the application standalone.
 *
 * Different browsers have different criteria for when this prompt is made available.
 * Currently Chrome requires that  the user "interact" with the content on your domain
 * for at least 30 seconds.
 *
 * More info can be found here:
 * https://developers.google.com/web/fundamentals/app-install-banners/
 *
 * awaitInstallPrompt offers the following capabilities:
 * * Listen to the browser for an install prompt.
 * * Stop listening at any time.
 * * Trigger the prompt to request app installation.
 *
 * @param {Function} onPrompt (prompt, cancel) => {} A function that will be called when
 * the browser delivers a prompt that we can present. The first argument prompt is a function
 * you can call at any time the triggers the install process. cancel is another function
 * that allows you to stop listening for prompts.
 *
 * @returns {Function} An function that when called, will stop listening for incoming prompts from the browser.
 *
 * @example
 * let cancel = awaitInstallPrompt((prompt) => {
 *      prompt().then(
 *          success => console.log(
 *              success && 'Successfully installed app as PWA.'
 *                      || 'User abandoned install.'
 *          )
 *      )
 * })
 */
export function awaitInstallPrompt(onPrompt) {
	if (!CACHE.installPromptListener) {
		let window = getWindow();
		if (!window || isStandalone()) return null;
		CACHE.installPromptListener = e => {
			e.preventDefault();
			let installPrompt = e;
			CACHE.prompt = () =>  new Promise(resolve => {
				CACHE.appInstalledListener = () => {
					resolve(true);
				};
				window.addEventListener('appinstalled', CACHE.appInstalledListener);
				installPrompt.prompt();
				installPrompt.userChoice.then(choiceResult => {
					choiceResult.outcome !== 'accepted' && resolve(false);
				});
			}).then(success => {
				installPrompt = null;
				CACHE.appInstalledListener && window.removeEventListener('appinstalled', CACHE.appInstalledListener);
				if (success) {
					CACHE.prompt = null;
					dispatchToOnPrompt();
				}
				return success;
			});
			dispatchToOnPrompt();
		};
		window.addEventListener('beforeinstallprompt', CACHE.installPromptListener);
	}
	if (onPrompt) {
		CACHE.onPrompts.push(onPrompt);
		CACHE.prompt && onPrompt(CACHE.prompt);
		return () => removeOnPrompt(onPrompt);
	}
	return () => reset();
}

/**
 * A Higher Order Component that implements the awaitInstallPrompt() lifecycle and provides
 * the wrapped component with only the meaning full artifacts as props:
 *
 * Props:
 * * isStandalone - true if the app is running in standalone mode.
 * * prompt - the prompt function that you call at any time.
 *
 * @example
 * export installer()(
 *      function({isStandalone, installPrompt}){
 *          return (
 *              isStandalone && <p>Running as Standalone</p> ||
 *              installPrompt && <a href="#" onclick={installPrompt}>Install App</a>
 *          );
 *      }
 * );
 */
export function installer() {
	return Child => {
		class Installer extends Component {
			cancel() {
				this.setState({ prompt: null });
				this.canceltoken && this.canceltoken();
			}
        
			componentWillMount() {
				let standalone = isStandalone();
				this.setState({ isStandalone: standalone });
				if (!standalone) {
					this.canceltoken = awaitInstallPrompt(prompt => {
						this.setState({ prompt });
					});
				}
			}
			componentWillUnmount() {
				this.cancel();
			}
        
			render(props, { isStandalone, prompt }) {
				return h(Child, { ...props, isStandalone, installPrompt: prompt } );
			}
		}
		return Installer;
	};
}

export default installer;