import _QUnit from 'https://cdn.skypack.dev/@dev.mohe/qunit';
//import QUnit from 'https://cdn.skypack.dev/qunit';

export const logJSON = x => console.log(JSON.stringify(x,null,2))

_QUnit.config.autostart = false;
//QUnit.start()
//QUnit.begin(console.log);
//QUnit.done(console.log);
//QUnit.on( "runEnd", console.log);

function browserRender(){
	const { childSuites } = arguments[0]
	let allErrors = [];
	const testDom = (item) => {
		const { status, name, runtime, tests, errors } = item;
		const testItem = document.createElement('div');
		if(!tests || !tests.length){
			const isIgnored = ['todo', 'skipped'].includes(status);

			testItem.innerHTML = `
				<span class="status ${status}"></span>
				<span>${name}</span>
				${ !isIgnored
					? `<span>(${runtime.toFixed(3)} ms)</span>`
					: " " || `<span>{${status}}</span>`
				}
			`;
			document.body.append(testItem)
			if(!isIgnored && errors.length){
				errors.forEach(e => {
					allErrors.push({
						...e,
						name
					})
				})
				
			}
			return;
		}
		
		testItem.classList.add('header');
		testItem.innerHTML = `
			<span class="overall-status ${status} light-text">${status}</span>
			<span class="light-text">${name}</span>
			${ !['todo', 'skipped'].includes(status)
				? `<span>(${runtime.toFixed(3)} ms)</span>`
				: " " || `<span>{${status}}</span>`
			}
		`;
		//console.log(item)
		document.body.append(testItem)
		tests?.length && tests.forEach(testDom);
	}
	childSuites.forEach(testDom)
	
	const errorDom = (error) => {
		const errorItem = document.createElement('div');
		errorItem.classList.add('error')
		errorItem.innerHTML = `
			<div>TEST: ${error.name}</div>
			<div>MSG: ${error.message || '<blank>'}</div>
			<div>STACK: ${error.stack}</div>
		`;
		document.body.append(errorItem);
	};
	allErrors.forEach(errorDom);
	//console.log(arguments)
}

/*
	"runStart",
	"suiteStart",
	"testStart",
	"assertion",
	"testEnd",
	"suiteEnd",
	"runEnd"
*/
/*
_QUnit.on("suiteStart", (...args) => {
	console.log(args);
});
*/
_QUnit.on("runEnd", browserRender);
export const QUnit = _QUnit

const suites = [];
function debounce (fn, wait) {
	let t
	return function () {
		clearTimeout(t)
		t = setTimeout(() => fn.apply(this, arguments), wait)
	}
}
const debounceTimeout = 1500;
const runTests = debounce(() => {
	const hasOnly = suites.find(x => x.only);
	suites.forEach(s => {
		if(s.only) {
			return _QUnit.module(s.desc, s.test || (() => {}) );
		}
		if(hasOnly && !s.skip) return
		if(s.skip){
			return  _QUnit.module.skip(s.desc, s.test || (() => {}) );
		}
		_QUnit.module(s.desc, s.test || (() => {}) );
	});
	_QUnit.start();
}, debounceTimeout);

export class Mock {
	history = [];

	constructor(){
		function self(...args){
			return this.exec(...args);
		};
		this.self = self.bind(this);
		this.self.history = this.history;
		this.self.returns = this.returns.bind(this);
		Object.defineProperty(this.self, 'wasCalled', {
			get() { return this.history.length > 0; }
		});
		return this.self;
	}
	returns = (res) => {
		this.returns = res;
		return this.self;
	}
	exec = (...args) => {
		this.history.push(args);
		return this.returns;
	}
}

export const it = (desc, cb) => {
	if(!cb) return _QUnit.test.bind(QUnit)(desc, () => {})
	_QUnit.test.bind(QUnit)( desc, () => {
		cb();
		expect(true).toEqual(true)
	});
}
it.todo = (desc, cb) => _QUnit.todo(desc, cb || (() => {}));
it.skip = _QUnit.skip;
it.only = _QUnit.only;

export const expect = (actual) => {
	return {
		toEqual: (expected) => {
			const msg = `expected ${actual} to equal ${expected}`;
			_QUnit.assert.true(actual === expected, msg)
		}
	}
}

//TODO: these should follow the same debounce pattern as above
export const describe = (desc, test) => {
	suites.push({ desc, test });
	runTests();
};
describe.skip = (desc, test) => {
	suites.push({ desc, test, skip: true });
	runTests();
};
describe.only = (desc, test) => {
	suites.push({ desc, test, only: true });
	runTests();
};

if(document){
document.head.innerHTML += `
<style>
	body {
		display: flex;
		flex-direction: column;
		align-items: start;
		justify-content: start;
		overflow: auto;
		margin: 4em 1.5em;
		color: #ababab;
		font-family: monospace;
		line-height: 1.4em;
	}

	::-webkit-scrollbar { width: 5px; }
	::-webkit-scrollbar-track { background: transparent; }
	::-webkit-scrollbar-thumb { background: #888; }
	::-webkit-scrollbar-thumb:hover { background: #555; }

	body > div + .header,
	body > div + .error {
		margin-top: 2em;
		overflow-wrap: break-word;
	}

	.light-text { color: white; }

	.overall-status {
		padding: 0 0.5em;
		text-transform: uppercase;
	}
	.overall-status.passed { background: green; }
	.overall-status.failed { background: red; }
	.overall-status.skipped { background: sienna; color: gainsboro; }
	.overall-status.todo { background: #737; }

	.status {
		margin-left: 1.5em;
	}
	.status.passed:before {
		content: '√';
		color: lightgreen;
	}
	.status.failed:before {
		content: '×';
		color: red;
	}
	.status.skipped:before {
		content: '○';
		color: yellow;
	}
	.status.todo:before {
		content: '»';
		color: #b6b;
	}
	.error {
		background: #bb002147;
		color: #f08f8f;
		padding: 1em;
		width: 97%;
	}
</style>
`;
}
