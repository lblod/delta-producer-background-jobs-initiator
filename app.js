import { app, errorHandler } from 'mu';
import { CronJob } from 'cron';
import {
  START_INITIAL_SYNC,
  INITIAL_PUBLICATION_GRAPH_SYNC_JOB_OPERATION,
  INITIAL_PUBLICATION_GRAPH_SYNC_TASK_OPERATION,
  ENABLE_HEALING_JOB_OPERATION,
  HEALING_JOB_OPERATION,
  HEALING_TASK_OPERATION,
  CRON_PATTERN_HEALING_JOB,
  ENABLE_DUMP_FILE_CREATION,
  DUMP_FILE_CREATION_JOB_OPERATION,
  DUMP_FILE_CREATION_TASK_OPERATION,
  CRON_PATTERN_DUMP_JOB
  } from './env-config.js';
import { getJobs, createJob, scheduleTask, cleanupJobs } from './lib/utils';
import { waitForDatabase } from './lib/database-utils';
import { run as runDumpPublicationGraphJob } from './jobs/dump-publication-graph';
import { run as runHealPublicationGraphJob } from './jobs/heal-publication-graph';
import { run as runInitialSyncPublicationGraphJob } from './jobs/initial-sync-publication-graph';

app.get('/', function (_, res) {
  res.send('Hello from delta-producer-background-jobs-initiator :)');
});

console.info(`INFO: START_INITIAL_SYNC set to: ${START_INITIAL_SYNC}`);
if(START_INITIAL_SYNC){
  waitForDatabase(runInitialSyncPublicationGraphJob);
}

console.info(`INFO: ENABLE_DUMP_FILE_CREATION set to: ${ENABLE_DUMP_FILE_CREATION}`);
if(ENABLE_DUMP_FILE_CREATION) {
  console.info(`INFO: Scheduling dump file creation, with CRON_PATTERN_DUMP_JOB set to: ${CRON_PATTERN_DUMP_JOB}`);
  new CronJob(CRON_PATTERN_DUMP_JOB, async function() {
    const now = new Date().toISOString();
    console.info(`First check triggered by cron job at ${now}`);
    await runDumpPublicationGraphJob();

  }, null, true);
}

console.info(`INFO: ENABLE_HEALING_JOB_OPERATION set to: ${ENABLE_HEALING_JOB_OPERATION}`);
if(ENABLE_HEALING_JOB_OPERATION) {
  console.info(`INFO: Scheduling healing, with CRON_PATTERN_HEALING_JOB set to: ${CRON_PATTERN_HEALING_JOB}`);
  new CronJob(CRON_PATTERN_HEALING_JOB, async function() {
    const now = new Date().toISOString();
    console.info(`First check triggered by cron job at ${now}`);
    await runHealPublicationGraphJob();
  }, null, true);
}

/*
 * ENDPOINTS CURRENTLY MEANT FOR DEBUGGING
 */
app.post('/dump-publication-graph-jobs', async function (_, res) {
   const jobUri = await createJob(DUMP_FILE_CREATION_JOB_OPERATION);
   await scheduleTask(jobUri, DUMP_FILE_CREATION_TASK_OPERATION);
  res.send({ msg: `Dump publication graph job ${jobUri} triggered` });
});

app.delete('/dump-publication-graph-jobs', async function (_, res) {
  const jobs = await getJobs(DUMP_FILE_CREATION_JOB_OPERATION);
  await cleanupJobs(jobs);
  res.send({ msg: 'Dump publication graph job cleaned' });
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
  const jobUri = await createJob(INITIAL_PUBLICATION_GRAPH_SYNC_JOB_OPERATION);
  await scheduleTask(jobUri, INITIAL_PUBLICATION_GRAPH_SYNC_TASK_OPERATION);
  res.send({ msg: `Sync jobs started ${jobUri}` });
});

app.delete('/initial-sync-jobs', async function (_, res){
  const jobs = await getJobs(INITIAL_PUBLICATION_GRAPH_SYNC_JOB_OPERATION);
  await cleanupJobs(jobs);
  res.send({ msg: `Sync jobs cleaned ${jobs.map(j => j.jobUri).join(', ')}` });
});

app.use(errorHandler);
