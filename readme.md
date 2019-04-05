# preact-pwa-install

```
npm i preact-pwa-install
```

Prompt users to install your Preact Progessive Web Application(PWA) as a native application on desktop or mobile. [More information on the requirements for PWAs can be found here](https://developers.google.com/web/fundamentals/app-install-banners/).



### Installable Example Apps

[Preact 8 PWA](https://nifty-allen-800eb0.netlify.com/) ([Source](https://github.com/tmtek/pwa-install-test))

### Capturing the browser prompt

Before getting into the specifics of the tools on offer in this package, it is important to understand that the prompts the the browser hands off to this library can be given very early in the lifecycle of your application.

It is recommended that you call the following function as early as possible in the lifetime of your app:

```javascript
import { awaitInstallPrompt } from 'preact-pwa-install';

/*
The following function call will start listening 
for prompts from the browser. Prompts will be retained 
so that any calls in the future may utilize them.
*/
cancel = awaitInstallPrompt(); 

//cancel() //stops listening to the browser for prompts.

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

This function may be called with no arguments, and doing so will just start listening to the browser for prompts. Prompts that are receieved are retained so that additional calls to `awaitInstallPrompt` will be invoked automatically with the retained prompt.

## reset

The reset function exists to be able to clear any retained prompts and to remove all window listeners used to capture prompts from the browser. 

This function primarily for the purposes of testing. It is recommended that you use cancel functions returned from your `awaitInstallPrompt()` calls instead of turning to `reset()`.
