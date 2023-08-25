import { app, errorHandler } from 'mu';
import { CronJob } from 'cron';
import {
  INITIAL_PUBLICATION_GRAPH_SYNC_TASK_OPERATION,
  HEALING_TASK_OPERATION,
  DUMP_FILE_CREATION_TASK_OPERATION,
  CONFIG_FILE_JSON,
  DEFAULT_CRON_PATTERN_JOB
} from './env-config.js';
import { getJobs, createJob, scheduleTask, cleanupJobs } from './lib/utils';
import { waitForDatabase } from './lib/database-utils';
import { run as runDumpPublicationGraphJob } from './jobs/dump-publication-graph';
import { run as runHealPublicationGraphJob } from './jobs/heal-publication-graph';
import { run as runInitialSyncPublicationGraphJob } from './jobs/initial-sync-publication-graph';
import fs from 'fs';


app.get('/', function(_, res) {
  res.send('Hello from delta-producer-background-jobs-initiator :)');
});


async function init() {
  await waitForDatabase();

  const configFile = fs.readFileSync(CONFIG_FILE_JSON);
  const config = JSON.parse(configFile);

  for (const conf of config) {
    let {
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
      errorCreatorUri
    } = conf;

    if (!name) {
      throw "missing mandatory name in config";
    }
    if (!jobsGraph) {
      throw `missing mandatory jobsGraph in config ${name}`;
    }

    if (!errorCreatorUri) {
      errorCreatorUri = "http://lblod.data.gift/services/delta-producer-background-jobs-initiator";
    }

    console.log(`setup background job ${name}`);

    console.info(
      `INFO: start initial sync for ${name} is set to: ${startInitialSync}`
    );
    if (startInitialSync) {
      if (!initialPublicationGraphSyncJobOperation) {
        throw `missing mandatory initialPublicationGraphSyncJobOperation in config ${name}`;
      }
      runInitialSyncPublicationGraphJob(
        jobsGraph,
        initialPublicationGraphSyncJobOperation,
        dumpFileCreationJobOperation,
        healingJobOperation,
        disableDumpFileCreation, disableHealingJobOperation, errorCreatorUri
      );
    }

    console.info(
      `INFO: disable dump file creation for ${name} set to: ${!!disableDumpFileCreation}`
    );
    if (!disableDumpFileCreation) {
      if (!dumpFileCreationJobOperation) {
        throw `Expected 'dumpFileCreationJobOperation' to be provided. for job ${name}`;
      }

      console.info(
        `INFO: Scheduling dump file creation for ${name}, with cronPatternDumpJob set to: ${cronPatternDumpJob}`
      );

      new CronJob(
        cronPatternDumpJob || DEFAULT_CRON_PATTERN_JOB,
        async function() {
          const now = new Date().toISOString();
          console.info(`First check triggered by cron job for ${name} at ${now}`);
          await runDumpPublicationGraphJob(
            jobsGraph,
            dumpFileCreationJobOperation,
            initialPublicationGraphSyncJobOperation,
            healingJobOperation,
            errorCreatorUri
          );
        },
        null,
        true
      );
    }
    console.info(
      `INFO: disable Healing Job Operation for ${name} set to: ${!!disableHealingJobOperation}`
    );

    if (!disableHealingJobOperation) {
      if (!healingJobOperation) {
        throw `Expected 'healingJobOperation' to be provided. for job ${name}`;
      }

      console.info(
        `INFO: Scheduling healing for ${name}, with cronPatternHealingJob set to: ${cronPatternHealingJob}`
      );
      new CronJob(
        cronPatternHealingJob || DEFAULT_CRON_PATTERN_JOB,
        async function() {
          const now = new Date().toISOString();
          console.info(`First check triggered by cron job for ${name} at ${now}`);
          await runHealPublicationGraphJob(
            jobsGraph,
            healingJobOperation,
            initialPublicationGraphSyncJobOperation,
            dumpFileCreationJobOperation,
            healShouldNotWaitForInitialSync,
            errorCreatorUri
          );
        },
        null,
        true
      );
    }

    /*
     * ENDPOINTS CURRENTLY MEANT FOR DEBUGGING
     */
    if (dumpFileCreationJobOperation) {
      app.post(`/${name}/dump-publication-graph-jobs`, async function(_, res) {
        const jobUri = await createJob(jobsGraph, dumpFileCreationJobOperation);
        await scheduleTask(jobsGraph, jobUri, DUMP_FILE_CREATION_TASK_OPERATION);
        res.send({ msg: `Dump publication graph job ${jobUri} triggered` });
      });
      app.delete(`/${name}/dump-publication-graph-jobs`, async function(_, res) {
        const jobs = await getJobs(dumpFileCreationJobOperation);
        await cleanupJobs(jobs);
        res.send({ msg: "Dump publication graph job cleaned" });
      });
    }

    if (healingJobOperation) {
      app.post(`/${name}/healing-jobs`, async function(_, res) {
        const jobUri = await createJob(jobsGraph, healingJobOperation);
        await scheduleTask(jobsGraph, jobUri, HEALING_TASK_OPERATION);
        res.send({ msg: `Healing job ${jobUri} triggered` });
      });

      app.delete(`/${name}/healing-jobs`, async function(_, res) {
        const jobs = await getJobs(jobsGraph, healingJobOperation);
        await cleanupJobs(jobs);
        res.send({ msg: "Healing job cleaned" });
      });
    }
    if (initialPublicationGraphSyncJobOperation) {
      app.post(`/${name}/initial-sync-jobs`, async function(_, res) {
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

      app.delete(`/${name}/initial-sync-jobs`, async function(_, res) {
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
}

init().then(() => app.use(errorHandler));

