import '@babel/polyfill';
import { stub, match } from 'sinon';
import 'undom/register';
import chai, { expect } from 'chai';
import sinonChai from 'sinon-chai';
import { h, render } from 'preact';
import { isStandalone, awaitInstallPrompt, reset, installer } from '../../src';
import * as Utils from '../../src/util';
chai.use(sinonChai);

describe(`preact-pwa-install`, () => {

	let notStandaloneWindow = () => ({
		addEventListener: () => {},
		removeEventListener: () => {}
	});

	//https://developers.google.com/web/fundamentals/app-install-banners/#display-mode_media_query
	let chromeStandaloneWindow = () => ({ matchMedia: () => ({
		matches: []
	}) });

	//https://developers.google.com/web/fundamentals/app-install-banners/#safari
	let safariStandaloneWindow = () => ({ navigator: { standalone: true } });

	let installPromptSimulation = () => ({
		window: {
			handlers: {},
			addEventListener(event,handler){
				this.handlers[event] = handler;
			},
			removeEventListener(event,handler){
				this.handlers[event] = null;
			}
		},
		prompt(userChoice){
			let handlers =  this.window.handlers;
			let f = {
				preventDefault: () => null,
				prompt() {
					this.userChoice = Promise.resolve({ outcome: userChoice });
					if (userChoice === 'accepted' && handlers.appinstalled) {
						handlers.appinstalled();
					}
				}
			};
			handlers.beforeinstallprompt && handlers.beforeinstallprompt(f);
		}
	});

	function sleep(millis=1000){
		return new Promise(resolve => setTimeout(resolve, millis));
	}

	describe(`isStandalone`, () => {
        
		it(`Should be a function`, () => {
			expect(isStandalone).to.be.a('function');
		});

		it(`Should return false from isStandalone and should not throw an error. We know this test enviornment is not considered standalone.`, () => {
			let isStub = stub(Utils, 'getWindow').callsFake(notStandaloneWindow);
			expect(() => isStandalone()).to.not.throw().and.to.be.equal(false);
			isStub.restore();
		});

		it(`Should return true if running in a Chrome Standalone window.`, () => {
			let isStub = stub(Utils, 'getWindow').callsFake(() => chromeStandaloneWindow);
			expect(() => isStandalone()).to.not.throw().and.to.be.equal(true);
			isStub.restore();
		});

		it(`Should return true if running in a Safari Standalone window.`, () => {
			let isStub = stub(Utils, 'getWindow').callsFake(safariStandaloneWindow);
			expect(() => isStandalone()).to.not.throw().and.to.be.equal(true);
			isStub.restore();
		});

	});

	describe(`awaitInstallPrompt`, () => {

		it(`Should be a function`, () => {
			expect(awaitInstallPrompt).to.be.a('function');
		});

		it(`Should not return a cancel function if window is falsy.`, () => {
			reset();
			let isStub = stub(Utils, 'getWindow').callsFake(() => null);
			let cancel = awaitInstallPrompt();
			expect(cancel).to.be.equal(null);
			isStub.restore();
		});

		it(`Should not return a cancel function if running in standalone mode.`, () => {
			reset();
			let isStub = stub(Utils, 'getWindow').callsFake(chromeStandaloneWindow);
			let cancel = awaitInstallPrompt();
			expect(cancel).to.be.equal(null);
			isStub.restore();
		});

		it(`Should return a cancel function given a proper window that can listen for install prompts.`, () => {
			reset();
			let installSim = installPromptSimulation();
			let isStub = stub(Utils, 'getWindow').callsFake(() => installSim.window);
			let cancel = awaitInstallPrompt();
			expect(cancel).to.be.a('function');
			isStub.restore();
		});

		it(`Should call your onPrompt function passing a function as the first argument when the window dispatches beforeinstallprompt.`, () => {
			reset();
			let installSim = installPromptSimulation();
			let winStub = stub(Utils, 'getWindow').callsFake(() => installSim.window);
			let result;
			awaitInstallPrompt(prompt => {
				result = prompt;
			});
			installSim.prompt('accepted');
			expect(result).is.a('function');
			winStub.restore();
		});

		it(`Should cache prompt if awaitInstallPrompt is called with no args, and next awaitInstallPrompt should use the result.`, async () => {
			reset();
			let installSim = installPromptSimulation();
			let winStub = stub(Utils, 'getWindow').callsFake(() => installSim.window);
			
			awaitInstallPrompt();
			installSim.prompt('accepted');

			await sleep(100);

			let result;
			awaitInstallPrompt(prompt => {
				result = prompt;
			});
			expect(result).is.a('function');
			result();
			winStub.restore();
		});

		it(`Should return a Promise that resolves to true from the prompt function supplied to your onPrompt if install was accepted.`, async () => {
			reset();
			let installSim = installPromptSimulation();
			let winStub = stub(Utils, 'getWindow').callsFake(() => installSim.window);
            
			let promptPromise;
			awaitInstallPrompt(prompt => {
				promptPromise = prompt && prompt();
			});
			installSim.prompt('accepted');
			expect(promptPromise).to.be.ok.and.to.have.property('then');
            
			let result = await promptPromise;
			expect(result).to.be.true;

			winStub.restore();
		});

		it(`Should return a Promise that resolves to false from the prompt function supplied to your onPrompt if install was rejected.`, async () => {
			reset();
			let installSim = installPromptSimulation();
			let winStub = stub(Utils, 'getWindow').callsFake(() => installSim.window);
            
			let promptPromise;
			awaitInstallPrompt(prompt => {
				promptPromise = prompt();
			});
			installSim.prompt('rejected');
			expect(promptPromise).to.have.property('then');

			let result = await promptPromise;
			expect(result).to.be.false;

			winStub.restore();
		});
	});

	describe(`installer`, () => {

		let scratch = document.createElement('div'),
			mount = jsx => root = render(jsx, scratch, root),
			root;

	    beforeEach( () => mount( () => null ) );

		it(`Should supply installPrompt values for wrapped component. installPrompt should be falsy until prompt is received from window, then it should be a function.`, async () => {
			reset();
			let installSim = installPromptSimulation();
			let winStub = stub(Utils, 'getWindow').callsFake(() => installSim.window);
			let Component = stub();
			let WrappedComponent = installer()(Component);
			await mount(<WrappedComponent />);
			expect(Component).to.have.been.calledWithMatch({ installPrompt: match.falsy });
			installSim.prompt();
			await mount(<WrappedComponent />);
			expect(Component).to.have.been.calledWithMatch({ installPrompt: match.func });
			winStub.restore();
		});

		it(`Should have multiple installers receive prompts, when prompt is triggered, both should update props correctly.`, async () => {
			reset();
			let installSim = installPromptSimulation();
			let winStub = stub(Utils, 'getWindow').callsFake(() => installSim.window);

			let triggerPrompt = {};

			let c = awaitInstallPrompt();

			let Component = stub().callsFake(({ installPrompt }) => {
				triggerPrompt.installPrompt = installPrompt;
			});
			let WrappedComponent = installer()(Component);

			let Component2 = stub();
			let WrappedComponent2 = installer()(Component2);

			let multi = (
				<div>
					<WrappedComponent />
					<WrappedComponent2 />
				</div>
			);

			await mount(multi);

			expect(Component).to.have.been.calledWithMatch({ installPrompt: match.falsy });
			expect(Component2).to.have.been.calledWithMatch({ installPrompt: match.falsy });

			Component.resetHistory();
			Component2.resetHistory();

			installSim.prompt('accepted');

			await sleep(100);

			expect(Component).to.have.been.calledWithMatch({ installPrompt: match.func });
			expect(Component2).to.have.been.calledWithMatch({ installPrompt: match.func });

			Component.resetHistory();
			Component2.resetHistory();

			triggerPrompt.installPrompt();

			await sleep(100);

			expect(Component).to.have.been.calledWithMatch({ installPrompt: match.falsy });
			expect(Component2).to.have.been.calledWithMatch({ installPrompt: match.falsy });

			c();

			winStub.restore();
		});

		it(`Should supply isStandalone=false when not running in a standalone browser.`, async () => {
			reset();
			let winStub = stub(Utils, 'getWindow').callsFake(notStandaloneWindow);
			let Component = stub();
			let WrappedComponent = installer()(Component);
			await mount(<WrappedComponent />);
			expect(Component).to.have.been.calledWithMatch({ isStandalone: match.falsy });
			winStub.restore();
		});

		it(`Should supply isStandalone=true when running in a standalone browser.`, async () => {
			reset();
			let winStub = stub(Utils, 'getWindow').callsFake(chromeStandaloneWindow);
			let Component = stub();
			let WrappedComponent = installer()(Component);
			await mount(<WrappedComponent />);
			expect(Component).to.have.been.calledWithMatch({ isStandalone: match.truthy });
			winStub.restore();
		});
	});
});