const URL = require('url');
const path = require('path');
const fs = require('fs');
const Chrome = require('chrome-remote-interface');
const summary = require('./summarize')
const _ = require('lodash');
const ejs = require('ejs');

const TRACE_CATEGORIES = ["-*", "devtools.timeline", "disabled-by-default-devtools.timeline", "disabled-by-default-devtools.timeline.frame", "toplevel", "blink.console", "disabled-by-default-devtools.timeline.stack", "disabled-by-default-devtools.screenshot", "disabled-by-default-v8.cpu_profile", "disabled-by-default-v8.cpu_profiler", "disabled-by-default-v8.cpu_profiler.hires"];

var rawEvents = [];


module.exports = (url, selector, options, callback) => {
  var report;

  ejs.renderFile(path.join(__dirname, 'views', 'report.ejs'), data, options, (err, str) => {

  if (err) {
    throw new Error(err);
  }

  callback(null, str);
};

