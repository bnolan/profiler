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

function Profiler (url, selector, callback) {
  Chrome((chrome) => {
    const javascriptRequests = {};

    with (chrome) {
      Network.loadingFinished((params) => {
        // console.log(params.encodedDataLength + ' bytes for ' + params.requestId);

        if (javascriptRequests[params.requestId]) {
          javascriptRequests[params.requestId].length = params.encodedDataLength;
        }
      });

      Network.requestWillBeSent(function (params) {
        // console.log(params);
        // console.log(params.request.url);

        const uri = URL.parse(params.request.url);
        
        if(path.extname(uri.path) === '.js') {
          javascriptRequests[params.requestId] = {
            url: params.request.url
          }
        }
      });

      Page.loadEventFired(close);
      Network.clearBrowserCache(true);
      Network.enable();

      Page.enable();

      Tracing.start({
        // "categories": TRACE_CATEGORIES.join(','),
        "options": "sampling-frequency=100"  // 1000 is default and too slow.
      });

      var rawEvents = [];

      Tracing.tracingComplete(function () {
        console.log('Tracing#tracingComplete');
         var file = 'profile-' + Date.now() + '.devtools.trace';
         fs.writeFileSync(file, JSON.stringify(rawEvents, null, 2));
          // console.log('Trace file: ' + file);
          // console.log('You can open the trace file in DevTools Timeline panel. (Turn on experiment: Timeline tracing based JS profiler)\n')

          var events = summary.report(file); // superfluous

          var grouped = _.groupBy(events, (event) => {
            return Object.keys(event)[0].split(/[:.]/)[0];
          });

          const payloadSize = 1234;

          const data = {
            grouped: grouped,
            branch: 'default',
            createdAt: new Date(),
            url: url,
            selector: selector,
            payloadSize: payloadSize,
            timeAt128: _.payloadSize / 128,
            javascriptTime: _.sumBy(grouped['v8'], (pair) => _.values(pair)[0].sum),
            _: _
          };

          const options = {
          };

          ejs.renderFile(path.join(__dirname, 'views', 'report.ejs'), data, options, (err, str) => {
            if (err) {
              throw new Error(err);
            }

            console.log(str);
          });

          // chrome.close();
      });

      Tracing.dataCollected(function(data){
        // console.log('#Tracing.dataCollected');
        var events = data.value;
        rawEvents = rawEvents.concat(events);

        // // this is just extra but not really important
        summary.onData(events)
      });

      var interval;

      var pollingFunc = () => {
        DOM.getDocument((error, response) => {
          const rootNodeId = response.root.nodeId;
          
          const options = {
              nodeId: rootNodeId,
              selector: selector
          };

          chrome.DOM.querySelector(options, (error, response) => {
            // console.log(error, response.nodeId);
            // const nodeId = response.nodeId;
            // chrome.DOM.requestChildNodes({nodeId: nodeId, depth: -1});

            if (response.nodeId) {
              stopPolling();
            }
          });
        });
      };

      function generateStats () {
        var requests = []

        Object.keys(javascriptRequests).forEach((key) => {
          requests.push(javascriptRequests[key]);
        });

        requests = _.sortBy(requests, [(r) => r.length]);

        console.log(requests.map((r) => [r.length, r.url]).join('\n'));
      }

      function stopPolling () {
        clearInterval(interval);

        pollingFunc = () => {};

        console.log('Page loaded!');
        clearInterval(interval);
        Tracing.end();

        generateStats();
      }

      function startPolling () {
        clearInterval(interval);
        
        interval = setInterval(() => {
          pollingFunc();
        }, 250);
      }

      once('ready', function () {
        Page.navigate({'url': url});
        startPolling();
      });
    }
  }).on('error', function (e) {
    console.error('Cannot connect to Chrome', e);
    callback(`Cannot connect to Chrome ${e}`);
  });
}

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

  Profiler(url, selector, (err, result) => {
    if (err) {
      res.json({ success: false, error: err });
      return;
    }

    res.render('report', {
      result: result
    });

    // res.json({ success: true, result: result })
  });
});
 
// app.listen(3500)
// console.log('Listening on port :3500');

console.log('Profiling..');
Profiler('https://preview.trademe.co.nz/', '#search-trade-me')
