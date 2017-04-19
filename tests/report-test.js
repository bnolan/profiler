const test = require('tape');
const report = require('../report');
const path = require('path');

const trace = path.join(__dirname, 'fixtures', 'trace.json');
const reportJson = path.join(__dirname, 'fixtures', 'report.json');

test('report', (t) => {
  report({
    branch: 'master',
    url: 'http://examples.com/',
    selector: 'a',
    filename: trace,
    payloadSize: 42,
    javascriptTime: 1.414,
    longFrames: []
  }, (err, html) => {
    t.ok(!err);
    t.ok(html);

    console.log(html);

    t.end();
  });
});
