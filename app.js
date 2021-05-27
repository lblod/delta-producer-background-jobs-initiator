import { app, errorHandler } from 'mu';
import { CronJob } from 'cron';
import { INITIAL_CACHE_SYNC_JOB_OPERATION,
         INITIAL_CACHE_SYNC_TASK_OPERATION,
         HEALING_JOB_OPERATION,
         HEALING_TASK_OPERATION,
         DUMP_FILE_CREATION_JOB_OPERATION,
         DUMP_FILE_CREATION_TASK_OPERATION,
         CRON_PATTERN_HEALING_JOB,
         CRON_PATTERN_DUMP_JOB,
         START_INITIAL_SYNC
       } from './env-config.js';
import { getJobs, createJob, scheduleTask, cleanupJobs } from './lib/utils';
import { waitForDatabase } from './lib/database-utils';
import { run as runDumpCacheGraphJob } from './jobs/dump-cache-graph';
import { run as runHealCacheGraphJob } from './jobs/heal-cache-graph';
import { run as runInitialSyncCacheGraphJob } from './jobs/initial-sync-cache-graph';

app.get('/', function (_, res) {
  res.send('Hello from delta-producer-background-jobs-initiator :)');
});

console.info(`INFO: START_INITIAL_SYNC set to: ${START_INITIAL_SYNC}`);
if(START_INITIAL_SYNC){
  waitForDatabase(runInitialSyncCacheGraphJob);
}

new CronJob(CRON_PATTERN_DUMP_JOB, async function() {
  const now = new Date().toISOString();
  console.info(`First check triggered by cron job at ${now}`);
  await runDumpCacheGraphJob();

}, null, true);

new CronJob(CRON_PATTERN_HEALING_JOB, async function() {
  const now = new Date().toISOString();
  console.info(`First check triggered by cron job at ${now}`);
  await runHealCacheGraphJob();
}, null, true);

/*
 * ENDPOINTS CURRENTLY MEANT FOR DEBUGGING
 */
app.post('/dump-cache-graph-jobs', async function (_, res) {
   const jobUri = await createJob(DUMP_FILE_CREATION_JOB_OPERATION);
   await scheduleTask(jobUri, DUMP_FILE_CREATION_TASK_OPERATION);
  res.send({ msg: `Dump cache graph job ${jobUri} triggered` });
});

app.delete('/dump-cache-graph-jobs', async function (_, res) {
  const jobs = await getJobs(DUMP_FILE_CREATION_JOB_OPERATION);
  await cleanupJobs(jobs);
  res.send({ msg: 'Dump cache graph job cleaned' });
});

app.post('/healing-jobs', async function (_, res) {
   const jobUri = await createJob(HEALING_JOB_OPERATION);
   await scheduleTask(jobUri, HEALING_TASK_OPERATION);
  res.send({ msg: `Healing job ${jobUri} triggered` });
});

app.delete('/healing-jobs', async function (_, res) {
  const jobs = await getJobs(HEALING_JOB_OPERATION);
  await cleanupJobs(jobs);
  res.send({ msg: 'Healing job cleaned' });
});

app.post('/initial-sync-jobs', async function (_, res){
  const jobUri = await createJob(INITIAL_CACHE_SYNC_JOB_OPERATION);
  await scheduleTask(jobUri, INITIAL_CACHE_SYNC_TASK_OPERATION);
  res.send({ msg: `Sync jobs started ${jobUri}` });
});

app.delete('/initial-sync-jobs', async function (_, res){
  const jobs = await getJobs(INITIAL_CACHE_SYNC_JOB_OPERATION);
  await cleanupJobs(jobs);
  res.send({ msg: `Sync jobs cleaned ${jobs.map(j => j.jobUri).join(', ')}` });
});

app.use(errorHandler);
