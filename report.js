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

module.exports = (data, callback) => {
  var filename = data.filename;
  var events = require('fs').readFileSync(filename, 'utf8');

  // events can be either a string of the trace data or the JSON.parse'd equivalent
  var model = new DevtoolsTimelineModel(events);

  console.log(model.frameModel());

  // filmstrip model, incl screenshots
  console.log(model.filmStripModel());

  const options = {};

  ejs.renderFile(path.join(__dirname, 'views', 'report.ejs'), data, options, (err, html) => {
    if (err) {
      console.error(err);
      callback(err);
      return;
    }

    callback(false, html);
  });
};
