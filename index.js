const express = require('express');
const app = express();
const GenerateReport = require('./GenerateReport');

const jobRunner = require('./job-runner');

app.set('view engine', 'ejs');

app.get('/', function (req, res) {
  res.json(
    {
      success: true,
      message: `Profiler.\n\nUse /profile/new?url=http://example.com/&selector=a endpoint to get statistics. May take up to 30 seconds to return`
    }
  );
});

app.get('/profile/new', (req, res) => {
  const url = req.query.url;
  const selector = req.query.selector;

  if (!selector || !url) {
    res.json({
      success: false, error: 'Error: selector or url not specified'
    });
  }

  jobRunner.enqueue((done) => {
    GenerateReport(url, selector, {}, (err, result) => {
      if (err) {
        res.json({
          success: false,
          message: err
        });

        return;
      }

      res.render('hi there');
      done();
    });
  });
});

app.listen(3500);
console.log('Listening on port :3500');
