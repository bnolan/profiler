const URL = require('url');
const path = require('path');
const fs = require('fs');
const Chrome = require('chrome-remote-interface');
const summary = require('./summarize')
const _ = require('lodash');
const spawn = require('child_process').spawn;

var outputPath = path.join(__dirname, 'profiles');

var browser;

const TRACE_CATEGORIES = ["-*", "devtools.timeline", "disabled-by-default-devtools.timeline", "disabled-by-default-devtools.timeline.frame", "toplevel", "blink.console", "disabled-by-default-devtools.timeline.stack", "disabled-by-default-devtools.screenshot", "disabled-by-default-v8.cpu_profile", "disabled-by-default-v8.cpu_profiler", "disabled-by-default-v8.cpu_profiler.hires"];

module.exports = {
  start: (callback) => {
    if (browser) {
      throw new Error('Chrome already started');
    }

    const path = '/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome';

    const params = [
      '--remote-debugging-port=9222',
      '--user-data-dir=/tmp/chrome-profiling',
      '--no-first-run',
      '--no-default-browser-check',
      '--headless'
    ];

    browser = spawn(path, params);

    // Wait for chrome to start, could do this in a smarter way
    setTimeout(() => {
      callback(false);
    }, 2500);
  },

  stop: () => {
    browser.kill('SIGKILL');
  },

  generate: (url, selector, callback) => {
    Chrome((chrome) => {
      const javascriptRequests = {};

      global.log = console.log.bind(console);

      with (chrome) {
        Network.loadingFinished((params) => {
          // console.log(params.encodedDataLength + ' bytes for ' + params.requestId);

          if (javascriptRequests[params.requestId]) {
            javascriptRequests[params.requestId].length = params.encodedDataLength;
            console.log(javascriptRequests[params.requestId].url);
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

        // Page.loadEventFired(close);
        Network.clearBrowserCache(true);

        // InspectorBackend.registerCommand("Network.setBlockedURLs", [], [], false);

        const blockedURLs = [
          'https://ads.trademe.co.nz*',
          'http://partner.googleadservices.com*',
          'https://munchkin.marketo.net*',
          'http://tracker.marinsm.com*',
          'https://www.googletagservices.com*',
          'https://securepubads.g.doubleclick.net*',
          'https://secure-nz.imrworldwide.com*',
          'https://securepubads.g.doubleclick.net*',
          'https://pagead2.googlesyndication.com*',
          'https://www.googleadservices.com*'
          // /google\.com\/ads/,
          // /doubleclick\.net\//,
          // /adsafeprotected\.com\//,
          // /tracker\.marinsm\.com/,
          // /secure-nz\.imrworldwide\.com/
        ];
        Network.enable();

        // chrome.send('Network.setBlockedURLs', blockedURLs, console.log);
        // chrome.send('Network.addBlockedURL', {url: blockedURLs[0]}, console.log);

        // Network.setBlockedURLs(blockedURLs);

        blockedURLs.forEach((url) => {
          console.log(`Blocking ${url}`);
          Network.addBlockedURL({url: url});
        });

        Page.enable();

        Tracing.start({
          "categories": TRACE_CATEGORIES.join(','),
          "options": "sampling-frequency=100"  // 1000 is default and too slow.
        });

        var rawEvents = [];

        Tracing.tracingComplete(function () {
            console.log('Tracing#tracingComplete');
            callback(false, rawEvents);

            fs.writeFileSync('/tmp/boop.json', JSON.stringify(rawEvents));
            chrome.close();
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
            // console.log('polling');
          }, 15);
        }

        once('ready', function () {
          var polling = false;

          Page.loadEventFired(() => {
            if (!polling) {
              startPolling();
              polling = true;
            }
          });

          Page.navigate({'url': url})
        });
      }
    }).on('error', function (e) {
      console.error('Cannot connect to Chrome', e);
      callback(`Cannot connect to Chrome ${e}`);
    });
  }
}