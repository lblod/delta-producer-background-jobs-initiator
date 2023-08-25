import { app, errorHandler } from 'mu';
import { CronJob } from 'cron';
import {
  INITIAL_PUBLICATION_GRAPH_SYNC_TASK_OPERATION,
  HEALING_TASK_OPERATION,
  DUMP_FILE_CREATION_TASK_OPERATION,
  CONFIG_FILE_JSON,
  DEFAULT_CRON_PATTERN_JOB
} from './env-config.js';
import { getJobs, cleanupJobs } from './lib/utils';
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

  for (let conf of config) {
    ensureDefaultsConfig(conf);
    validateConfig(conf);

    console.log(`setup background job ${conf.name}`);

    console.info(
      `INFO: start initial sync for ${conf.name} is set to: ${conf.startInitialSync}`
    );

    if (conf.startInitialSync) {
      runInitialSyncPublicationGraphJob(conf);
    }

    scheduleJobs(conf);
    setupDebugEndpoints(conf);
  }
}

init().then(() => app.use(errorHandler));

function validateConfig(config) {
    const requiredKeys = [
        "name",
        "jobsGraph",
        "dumpFileCreationJobOperation",
        "initialPublicationGraphSyncJobOperation",
        "healingJobOperation",
        "cronPatternDumpJob",
        "cronPatternHealingJob",
        "startInitialSync",
        "disableDumpFileCreation",
        "disableHealingJobOperation",
        "healShouldNotWaitForInitialSync",
        "errorCreatorUri"
    ];

    requiredKeys.forEach(key => {
        if (config[key] === undefined) {
            throw `missing mandatory ${key} in config${config.name ? ' ' + config.name : ''}`;
        }
    });
}

function ensureDefaultsConfig(config) {
  config.cronPatternHealingJob = config.cronPatternHealingJob || DEFAULT_CRON_PATTERN_JOB,
  config.cronPatternDumpJob = config.cronPatternDumpJob || DEFAULT_CRON_PATTERN_JOB;
  config.disableDumpFileCreation = config.disableDumpFileCreation || false;
  config.disableHealingJobOperation = config.disableHealingJobOperation || false;
  config.healShouldNotWaitForInitialSync = config.healShouldNotWaitForInitialSync || false;
  if(!config.errorCreatorUri){
    config.errorCreatorUri = 'http://lblod.data.gift/services/delta-producer-background-jobs-initiator';
    if(config.name) {
      config.errorCreatorUri = config.errorCreatorUri + '/' + config.name;
    }
  }
  return config;
}

function scheduleJobs(conf) {
  console.info(
    `INFO: Is dump file creation disabled for ${conf.name}? : ${!!conf.disableDumpFileCreation}`
  );

  if (!conf.disableDumpFileCreation) {
    console.info(
      `INFO: Scheduling dump file creation for ${conf.name}, with cronPatternDumpJob set to: ${conf.cronPatternDumpJob}`
    );
    new CronJob(conf.cronPatternDumpJob,
      async function() {
        const now = new Date().toISOString();
        console.info(`Dump file job triggered for ${conf.name} at ${now}`);
        await runDumpPublicationGraphJob(conf);
      },
      null,
      true
    );
  }
  console.info(
    `INFO: Is Healing Job Operation for ${conf.name} disabled? ${!!conf.disableHealingJobOperation}`
  );

  if (!conf.disableHealingJobOperation) {
    console.info(
      `INFO: Scheduling healing for ${conf.name}, with cronPatternHealingJob set to: ${conf.cronPatternHealingJob}`
    );
    new CronJob(conf.cronPatternHealingJob,
      async function() {
        const now = new Date().toISOString();
        console.info(`Healing job triggered for ${conf.name} at ${now}`);
        await runHealPublicationGraphJob(conf);
      },
      null,
      true
    );
  }
}

function setupDebugEndpoints(conf) {

  app.post(`/${conf.name}/dump-publication-graph-jobs`, async function(_, res) {
    runDumpPublicationGraphJob(conf, true);
    res.send({ msg: `Dump publication graph job triggered` });
  });

  app.delete(`/${conf.name}/dump-publication-graph-jobs`, async function(_, res) {
      const jobs = await getJobs(conf.dumpFileCreationJobOperation);
      await cleanupJobs(jobs);
      res.send({ msg: "Dump publication graph job cleaned" });
    });

  app.post(`/${conf.name}/healing-jobs`, async function(_, res) {
    runHealPublicationGraphJob(conf, true);
    res.send({ msg: `Healing job triggered`});
  });

  app.delete(`/${conf.name}/healing-jobs`, async function(_, res) {
    const jobs = await getJobs(conf.healingJobOperation);
    await cleanupJobs(jobs);
    res.send({ msg: "Healing job cleaned" });
  });

  app.post(`/${conf.name}/initial-sync-jobs`, async function(_, res) {
    runInitialSyncPublicationGraphJob(conf, true);
    res.send({ msg: `Initial sync job started` });
  });

  app.delete(`/${conf.name}/initial-sync-jobs`, async function(_, res) {
    const jobs = await getJobs(conf.initialPublicationGraphSyncJobOperation);
    await cleanupJobs(jobs);
    res.send({
      msg: `Sync jobs cleaned ${jobs.map((j) => j.jobUri).join(", ")}`
    });
  });
}
