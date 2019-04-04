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

export const CACHE = {};

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

	if (CACHE.prompt) {
		onPrompt(CACHE.prompt, () => {});
		return;
	}

	let window = getWindow();
	if (!window || isStandalone()) return null;

	let installPrompt;
	let installPromptListener;
	let appInstalledListener;
    
	let cancel = () => installPromptListener && window.removeEventListener('beforeinstallprompt', installPromptListener);
    
	installPromptListener = e => {
		e.preventDefault();
		installPrompt = e;
		let prompt = () =>  new Promise(resolve => {
			CACHE.prompt = null;
			appInstalledListener = () => {
				resolve(true);
			};
			window.addEventListener('appinstalled', appInstalledListener);
			installPrompt.prompt();
			installPrompt.userChoice.then(choiceResult => {
				choiceResult.outcome !== 'accepted' && resolve(false);
			});
		}).then(success => {
			installPrompt = null;
			appInstalledListener && window.removeEventListener('appinstalled', appInstalledListener);
			return success;
		});
		if (onPrompt) {
			onPrompt(prompt, cancel);
		}
		else {
			CACHE.prompt = prompt;
			cancel();
		}
	};
	window.addEventListener('beforeinstallprompt', installPromptListener);
	return cancel;
}

export function capturePrompt() {
	let installer = {};
	awaitInstallPrompt((prompt, cancel) => {
		installer.prompt = prompt;
		cancel();
	});
	return installer;
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
export default function installer() {
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
						this.setState({ prompt: () =>
							prompt().then(installed => {
								installed && this.cancel();
								return installed;
							})
						});
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