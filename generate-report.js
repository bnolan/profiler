
module.exports = (url, selector, options, callback) => {
	var report;

	ejs.renderFile(path.join(__dirname, 'views', 'report.ejs'), data, options, (err, str) => {

	if (err) {
	  throw new Error(err);
	}

	callback(null, str);
}