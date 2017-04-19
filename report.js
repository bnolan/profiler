const path = require('path');
const ejs = require('ejs');
const DevtoolsTimelineModel = require('devtools-timeline-model');

// // tracing model
// model.tracingModel()
// // timeline model, all events
// model.timelineModel()
// // interaction model, incl scroll, click, animations
// model.interactionModel()
// // frame model, incl frame durations
// model.frameModel()
// // filmstrip model, incl screenshots
// model.filmStripModel()

// // topdown tree
// model.topDown()
// // bottom up tree
// model.bottomUp()
// // bottom up tree, grouped by URL
// model.bottomUpGroupBy('URL') // accepts: None Category Subdomain Domain URL EventName

/*
 var file = path.join(outputPath, 'profile-' + Date.now() + '.devtools.trace');
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
*/


module.exports = (events, callback) => {
  // events can be either a string of the trace data or the JSON.parse'd equivalent
  var model = new DevtoolsTimelineModel(events);

  console.log('wut?');
  // console.log(model.frameModel());
  console.log('Frame model frames:\n', model.frameModel().frames().length);

  // filmstrip model, incl screenshots
  console.log('wut?');
  // console.log(model.filmStripModel());

  const data = {

  };
  const options = {

  };

  ejs.renderFile(path.join(__dirname, 'views', 'report.ejs'), data, options, (err, html) => {
    if (err) {
      console.error(err);
      callback(err);
      return;
    }

    callback(false, html);
  });
};
