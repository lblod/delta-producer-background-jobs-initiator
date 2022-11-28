import { app, errorHandler } from 'mu';
import { CronJob } from 'cron';
import {
  INITIAL_PUBLICATION_GRAPH_SYNC_TASK_OPERATION,
  HEALING_TASK_OPERATION,
  } from './env-config.js';
import { getJobs, createJob, scheduleTask, cleanupJobs } from './lib/utils';
import { waitForDatabase } from './lib/database-utils';
import { run as runDumpPublicationGraphJob } from './jobs/dump-publication-graph';
import { run as runHealPublicationGraphJob } from './jobs/heal-publication-graph';
import { run as runInitialSyncPublicationGraphJob } from './jobs/initial-sync-publication-graph';

import config from '/config';

app.get('/', function (_, res) {
  res.send('Hello from delta-producer-background-jobs-initiator :)');
});

async function init() {
  await waitForDatabase();
  for (const conf of config) {
    const {
      name,
      jobsGraph,
      dumpFileCreationJobOperation,
      initialPublicationGraphSyncJobOperation,
      healingJobOperation,
      cronPatternDumpJob,
      cronPatternHealingJob,
      startInitialSync,
      disableDumpFileCreation,
      disableHealingJobOperation,
      healShouldNotWaitForInitialSync,
    } = conf;
    console.log(`setup background job ${name}`);

    console.info(
      `INFO: disable start initial sync is set to: ${startInitialSync}`
    );
    if (startInitialSync) {
      runInitialSyncPublicationGraphJob(
        jobsGraph,
        initialPublicationGraphSyncJobOperation,
        dumpFileCreationJobOperation,
        healingJobOperation
      );
    }

    console.info(
      `INFO: disable dump file creation set to: ${!!disableDumpFileCreation}`
    );
    if (!disableDumpFileCreation) {
      console.info(
        `INFO: Scheduling dump file creation, with cronPatternDumpJob set to: ${cronPatternDumpJob}`
      );
      new CronJob(
        cronPatternDumpJob,
        async function () {
          const now = new Date().toISOString();
          console.info(`First check triggered by cron job at ${now}`);
          await runDumpPublicationGraphJob(
            jobsGraph,
            dumpFileCreationJobOperation,
            initialPublicationGraphSyncJobOperation,
            healingJobOperation
          );
        },
        null,
        true
      );
    }
    console.info(
      `INFO: disable Healing Job Operation set to: ${!!disableHealingJobOperation}`
    );

    if (!disableHealingJobOperation) {
      console.info(
        `INFO: Scheduling healing, with cronPatternHealingJob set to: ${cronPatternHealingJob}`
      );
      new CronJob(
        cronPatternHealingJob,
        async function () {
          const now = new Date().toISOString();
          console.info(`First check triggered by cron job at ${now}`);
          await runHealPublicationGraphJob(
            jobsGraph,
            healingJobOperation,
            initialPublicationGraphSyncJobOperation,
            dumpFileCreationJobOperation,
            healShouldNotWaitForInitialSync
          );
        },
        null,
        true
      );
    }

    /*
     * ENDPOINTS CURRENTLY MEANT FOR DEBUGGING
     */
    app.post(`/${name}/dump-publication-graph-jobs`, async function (_, res) {
      const jobUri = await createJob(jobsGraph, dumpFileCreationJobOperation);
      await scheduleTask(jobsGraph, jobUri, dumpFileCreationJobOperation);
      res.send({ msg: `Dump publication graph job ${jobUri} triggered` });
    });

    app.delete(`/${name}/dump-publication-graph-jobs`, async function (_, res) {
      const jobs = await getJobs(dumpFileCreationJobOperation);
      await cleanupJobs(jobs);
      res.send({ msg: "Dump publication graph job cleaned" });
    });

    app.post(`/${name}/healing-jobs`, async function (_, res) {
      const jobUri = await createJob(jobsGraph, healingJobOperation);
      await scheduleTask(jobsGraph, jobUri, HEALING_TASK_OPERATION);
      res.send({ msg: `Healing job ${jobUri} triggered` });
    });

    app.delete(`/${name}/healing-jobs`, async function (_, res) {
      const jobs = await getJobs(jobsGraph, healingJobOperation);
      await cleanupJobs(jobs);
      res.send({ msg: "Healing job cleaned" });
    });

    app.post(`/${name}/initial-sync-jobs`, async function (_, res) {
      const jobUri = await createJob(
        jobsGraph,
        initialPublicationGraphSyncJobOperation
      );
      await scheduleTask(
        jobsGraph,
        jobUri,
        INITIAL_PUBLICATION_GRAPH_SYNC_TASK_OPERATION
      );
      res.send({ msg: `Sync jobs started ${jobUri}` });
    });

    app.delete(`/${name}/initial-sync-jobs`, async function (_, res) {
      const jobs = await getJobs(
        jobsGraph,
        initialPublicationGraphSyncJobOperation
      );
      await cleanupJobs(jobs);
      res.send({
        msg: `Sync jobs cleaned ${jobs.map((j) => j.jobUri).join(", ")}`,
      });
    });
  }
}


init().then(()=> app.use(errorHandler));

