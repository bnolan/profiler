var jobQueue = [];
var interval;
var runningJob;

// Singleton job runner for the whole app

module.exports = {
	start: () => {
		interval = setInterval(() => {
			// Job is running
			if (runningJob) {
				return;
			}

			// Nothing in the queue
			if (jobQueue.length === 0) {
				return;
			}

			// Get a job off the front of the queue
			runningJob = jobQueue.shift();

			// Job completed, clear running job
			function jobDone () {
				console.log('Job done ', jobQueue.length, ' jobs in the queue.');
				runningJob = null;
			}

			console.log('Starting job.');

			// Start the job and pass the done callback into the job
			runningJob(jobDone)
		}, 250);
	},

	stop: () {
		// We have no way of cancelling jobs
		clearInterval(interval);
	},

	enqueue: (task) => {
		// Add to the back of the queue
	  jobQueue.push(task);
	}
}
