module.exports.timer = (() => {
  const _timers = {};
  const _records = {};

  const _timer = (label='_init', reset) => {
      if(!_timers[label] && !reset) {
          _timers[label] = process.hrtime();
          return;
      }
      if(reset){
        delete _timers[label];
        _records[label] = [];
        _timers[label] = process.hrtime();
      }
      const hrtime = process.hrtime(_timers[label]);
      return Number( (hrtime[0] + (hrtime[1] * 1e-9)).toPrecision(16) );
  };
  const prettyPrint = (label, seconds) => {
      if(seconds < 1e-6) return label + ': ' + (seconds * 1e9) + ' ns';
      if(seconds < 1) return label + ': ' + (seconds * 1e3) + ' ms';
      return label + ': ' + seconds + ' s' ;
  };

  _timer.start = (label) => _timer(label, true);

  _timer.end = (label) => {
      const seconds = _timer(label);
      _records[label] = _records[label] || [];
      _records[label].push(seconds);
      return seconds;
  };

  _timer.log = (label="") => {
      if(!label){
          console.log(_records);
          Object.keys(_records)
            .forEach(key => {
                console.log(prettyPrint(key, _records[key].reduce((a,b)=>a+b,0)/_records[key].length));
            });
          return;
      }
      const seconds = _timer(label);
      console.log(prettyPrint(label, seconds));
  };

  _timer.results = () => {
    return Object.keys(_records)
      .reduce((output, label) => {
        output[label] = _records[label].reduce((a,b)=>a+b,0) / _records[label].length;
        return output;
      }, {});
  }
  return _timer;
})();

