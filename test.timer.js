const { timer } = require('./index');

timer.start('hello');

setTimeout(() => {
  timer.end('hello');
  timer.log();
  console.log(timer.results());
}, 10)
