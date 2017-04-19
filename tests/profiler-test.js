var test = require('tape');
var profiler = require('../profiler');

test('launch chrome', (t) => {
  profiler.start((err) => {
    t.ok(!err);
    t.end();
  });
});

test('loads trademe.co.nz', (t) => {
  t.plan(2);

  profiler.generate('https://www.trademe.co.nz/', '#searchString', (err, result) => {
    t.ok(!err);
    t.ok(result);
  });
});

test('stop', (t) => {
  profiler.stop();
  t.end();
});
