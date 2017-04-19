var test = require('tape');
var runner = require('../job-runner');

test('start', (t) => {
  runner.start();
  t.end();
});

test('task starts async', (t) => {
  t.plan(4);

  var first = true;

  runner.enqueue((done) => {
    t.ok(!first);

    done();

    t.ok(runner.isIdle());
    t.ok(runner.isEmpty());
  });

  t.ok(first);
  first = false;
});

test('three tasks happen in order', (t) => {
  t.plan(6);

  var i = 1;

  runner.enqueue((done) => {
    t.equal(i, 1);
    i++;

    done();

    t.ok(!runner.isEmpty());
  });

  runner.enqueue((done) => {
    t.equal(i, 2);
    i++;

    done();

    t.ok(!runner.isEmpty());
  });

  runner.enqueue((done) => {
    t.equal(i, 3);
    i++;

    done();

    t.ok(runner.isEmpty());
  });
});

test('stop', (t) => {
  runner.stop();
  t.end();
});
