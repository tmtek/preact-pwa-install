# preact-pwa-install

Prompt users to install your Preact Progessive Web Application(PWA) as a native application on desktop or mobile. [Details on requirements can be found here](https://developers.google.com/web/fundamentals/app-install-banners/).

#### Preact 8: 

```
npm i preact-pwa-install
```

#### Preact X:

```
npm i preact-pwa-install@preactx
```

#### Installation Example Apps

* [Preact 8 PWA](https://nifty-allen-800eb0.netlify.com/) ([Source](https://github.com/tmtek/pwa-install-test))
* Preact X PWA([Source](https://github.com/tmtek/pwa-install-testX))

### Important: Capturing the Prompt

Before getting started, it is important to understand that the browser can dispatch the event to capture the install prompt very early in your application's lifecycle. You may not yet be listening for the event and will miss it.

To ensure that you always capture it you must call `awaitInstallPrompt()` (with no args) as soon as you know a `window` object exists. Calling the function this way will cache any received prompt so that any calls to it later by other components will capture the reference.




## Preact X Hook

### useInstaller

The `useInstaller` hook is available for you to use in your components:

```javascript
import { h } from 'preact';
import useInstaller from 'preact-pwa-install';

export default function InstallButton(){
	
	const { installPrompt, isStandalone } = useInstaller();

	return installPrompt && <a href="#" onclick={installPrompt}>Install as PWA</a> 
			|| isStandalone && 'PWA is installed!';
}
```

## Preact 8 HOC

### installer

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

## Functions

### isStandalone

You may import `isStandalone` to check to see if you are running as a PWA at any time:

```javascript
import { isStandalone } from 'preact-pwa-install';

let isStandalone = isStandalone(); //true/false
```

### awaitInstallPrompt

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
