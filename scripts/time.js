var CronJob = require('cron').CronJob;
var jobs = []
// new Date()
var job = new CronJob('* * * * * *', function() {
  console.log('You will see this message every second');
}, function() {
  console.log('jhob termuino');
}, null, false, 'America/Guayaquil');

var job1 = new CronJob({
  cronTime: '* * * * * *',
  onTick: function() {
    job1.stop();
    console.log('hola');
  },
  onComplete: function() {
    console.log('complete');
  },
  start: true,
  timeZone: 'America/Guayaquil'
})
jobs.push(job1)
console.log('sdads');
// job1.start();
console.log('fin');
console.log(job1.running)
// setTimeout(function() {
//   console.log(jobs);
//   job1.stop()
// },5000);
