# footils
Kitchen sink utilities and framework-ish js for node and browser.

Named (foo)tils because other names for utility libs on npm were taken and foo is foo which rhymes with "u".

### timer for node
```javascript
npm install --save footils
const { timer } = require('footils');
```

```javascript

// logging example

timer.start('some task');
// do the task
timer.log('some task');
// output the average time taken
// some task: 1.23 s


// return a value example

timer.start('some task');
// do the task
const seconds = timer.end('some task');
// seconds variable holds the value 1.23


// log multiple/averages example

timer.start('start task');
// do the task
timer.end('start task');

timer.start('average task');
// do the task
timer.end('average task');

timer.start('average task');
// do the task again
timer.end('average task');

timer.log();
// output averages of all
// start task: 0.23 ms
// average task: 1.23 s
```