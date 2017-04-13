const express = require('express')
const app = express()
const URL = require('url');
const path = require('path');
const fs = require('fs');
const Chrome = require('chrome-remote-interface');
const summary = require('./summarize')
const _ = require('lodash');
const ejs = require('ejs');

var TRACE_CATEGORIES = ["-*", "devtools.timeline", "disabled-by-default-devtools.timeline", "disabled-by-default-devtools.timeline.frame", "toplevel", "blink.console", "disabled-by-default-devtools.timeline.stack", "disabled-by-default-devtools.screenshot", "disabled-by-default-v8.cpu_profile", "disabled-by-default-v8.cpu_profiler", "disabled-by-default-v8.cpu_profiler.hires"];

var rawEvents = [];

const jobRunner = require('./job-runner');

app.set('view engine', 'ejs');

app.get('/', function (req, res) {
  res.json(
    {
      success: true,
      message: `Profiler.\n\nUse /profile/new?url=http://example.com/&selector=a endpoint to get statistics. May take up to 30 seconds to return`
    }
  );
})

app.get('/profile/new', (req, res) => {
  const url = req.query.url;
  const selector = req.query.selector;

  if (!selector || !url) {
    res.json({ success: false, error: 'Error: selector or url not specified'});
  }

  jobRunner.enqueue((done) => {
    GenerateReport(url, selector, {}, (err, result) => {
      res.render('hi there');
      done();
    });
  });

  // Profiler(url, selector, (err, result) => {
  //   if (err) {
  //     res.json({ success: false, error: err });
  //     return;
  //   }

  //   res.render('report', {
  //     result: result
  //   });

  //   // res.json({ success: true, result: result })
  // });
});
 
// app.listen(3500)
// console.log('Listening on port :3500');

console.log('Profiling..');
// Profiler('https://preview.trademe.co.nz/', '#search-trade-me')

Profiler('https://www.trademe.co.nz/', '#searchString')

// Profiler('https://touch.trademe.co.nz/', '#SearchString')