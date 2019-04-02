# preact-pwa-install

```
npm i preact-pwa-install
```

A package that helps preact apps prompt users to install them as a Progessive Web Application(PWA). [More information on the requirements for PWAs can be found here](https://developers.google.com/web/fundamentals/app-install-banners/).

This package offers a Hook for PreactX+, a simple Higher Order Component(HOC) that you can use to wrap components (ie:buttons) and turn them into app installers, or you can use the installation functions directly if that suits your needs.

### Installable Example Apps

[Preact 8 PWA](https://nifty-allen-800eb0.netlify.com/) ([Source](https://github.com/tmtek/pwa-install-test))

Preact X PWA([Source](https://github.com/tmtek/pwa-install-testX))


## useInstaller Hook

For PreactX the `useInstaller` hook is available for you to use in your components:

```javascript
import { h } from 'preact';
import useInstaller from 'preact-pwa-install';

export default function InstallButton(){
	
	const { installPrompt, isStandalone } = useInstaller();

	return installPrompt && <a href="#" onclick={installPrompt}>Install as PWA</a> 
			|| isStandalone && 'PWA is installed!';
}
```

## installer HOC

Any component that the `installer` HOC wraps will be provided with the following props:

```javascript
import { h } from 'preact';
import { installer } from 'preact-pwa-install';

function InstallButton({ isStandalone, installPrompt }){
     return installPrompt && <a href="#" onclick={installPrompt}>Install as PWA</a> 
     		|| isStandalone && 'PWA is installed!';
 }

 export default installer()(InstallButton);
```

## isStandalone

You may import `isStandalone` to check to see if you are running as a PWA at any time:

```javascript
import { isStandalone } from 'preact-pwa-install';

let isStandalone = isStandalone(); //true/false
```

## awaitInstallPrompt

The `awaitInstallPrompt` function allows you to listen to the browser for permission to prompt the user to install your app. Permission comes in the form of a `prompt` function you may call at any time in the future:

```javascript
import { awaitInstallPrompt } from 'preact-pwa-install';

let cancel = awaitInstallPrompt(prompt => 
	prompt().then(success => console.log(
		success && 'Successfully installed app as PWA.' 
		|| 'User abandoned install.'
	))
	//On a successful install, listening will be stopped automatically.
);

/* 
cancel() at any time in the future to stop listening for prompts.
*/

```
