const test = require('tape');
const report = require('../report');
const path = require('path');
const fs = require('fs');

const trace = fs.readFileSync(path.join(__dirname, 'fixtures', 'trace.json'));

test('report', (t) => {
  console.log(trace.length);
  report(trace, (err, html) => {
    t.ok(!err);
    t.ok(html);

    console.log(html);

    t.end();
  });
});
