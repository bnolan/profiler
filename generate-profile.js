function Profiler (url, selector, callback) {
  Chrome((chrome) => {
    const javascriptRequests = {};

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