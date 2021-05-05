import { app,
         errorHandler,
         uuid,
         sparqlEscapeString,
         sparqlEscapeUri,
         sparqlEscapeDateTime
       } from 'mu';
import { CronJob } from 'cron';
import { querySudo as query, updateSudo as update } from '@lblod/mu-auth-sudo';

import { PREFIXES,
         JOB_TYPE,
         TASK_TYPE,
         ERROR_TYPE,
         DELTA_ERROR_TYPE,
         JOBS_GRAPH,
         STATUS_BUSY,
         STATUS_SCHEDULED,
         STATUS_FAILED,
         STATUS_CANCELED,
         TASK_URI_PREFIX,
         JOB_URI_PREFIX,
         JOB_CREATOR_URI,
         ERROR_URI_PREFIX,
         INITIAL_CACHE_SYNC_JOB_OPERATION,
         INITIAL_CACHE_SYNC_TASK_OPERATION,
         DUMP_FILE_CREATION_JOB_OPERATION,
         DUMP_FILE_CREATION_TASK_OPERATION,
         HEALING_JOB_OPERATION,
         HEALING_TASK_OPERATION,
         CRON_PATTERN_HEALING_JOB,
         CRON_PATTERN_DUMP_JOB
       } from './env-config.js';

import { waitForDatabase } from './database-utils';

app.get('/', function (_, res) {
  res.send('Hello from delta-producer-background-jobs-initiator :)');
});

waitForDatabase(scheduleInitialSync);

async function scheduleInitialSync(){
  try {
    const jobs = await getJobs(INITIAL_CACHE_SYNC_JOB_OPERATION);
    if(jobs.length){
      console.info(`Initial sync ${INITIAL_CACHE_SYNC_JOB_OPERATION} exists, see ${jobs.map(j => j.jobUri).join(', ')}`);
      console.info('skipping');
    }
    else {
      const jobUri = await createJob(INITIAL_CACHE_SYNC_JOB_OPERATION);
      await scheduleTask(jobUri, INITIAL_CACHE_SYNC_TASK_OPERATION);
    }
  }
  catch(error){
    console.error(`Error while scheduling job: ${error}`);
    await storeError(error);
  }
}

new CronJob(CRON_PATTERN_DUMP_JOB, async function() {
  const now = new Date().toISOString();
  console.info(`First check triggered by cron job at ${now}`);
  try {
    const activeJobs = await getJobs(DUMP_FILE_CREATION_JOB_OPERATION, [ STATUS_BUSY, STATUS_SCHEDULED ] );
    if(activeJobs.length){
      console.warn(`WARNING: Same type of jobs already running, see: ${activeJobs.map(j => j.jobUri).join(' ')}`);
    }
    else {
      const jobUri = await createJob(DUMP_FILE_CREATION_JOB_OPERATION);
      await scheduleTask(jobUri, DUMP_FILE_CREATION_TASK_OPERATION);
    }
  } catch (err) {
    console.log(`An error occurred during initiaton at ${now}: ${err}`);
  }
}, null, true);

new CronJob(CRON_PATTERN_HEALING_JOB, async function() {
  const now = new Date().toISOString();
  console.info(`First check triggered by cron job at ${now}`);
  try {
    // schedule for cronjob flow differs from manual triggering, as we want only one job to run and mark the other one as failed.(more visible to user)
    const activeJobs = await await getJobs(HEALING_JOB_OPERATION, [], [ STATUS_BUSY, STATUS_SCHEDULED ]);
    if(activeJobs.length){
      console.warn(`WARNING: Same type of jobs already running, see: ${activeJobs.map(j => j.jobUri).join(' ')}`);
    }
    else {
      const jobUri = await createJob(HEALING_JOB_OPERATION);
      await scheduleTask(jobUri, HEALING_TASK_OPERATION);
    }
  } catch (err) {
    console.log(`An error occurred during initiaton at ${now}: ${err}`);
  }
}, null, true);

/*
 * ENDPOINTS CURRENTLY MEANT FOR DEBUGGING
 */
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

/*
 * HELPERS
 */
async function getJobs(jobOperationUri, statusFilterIn = [], statusFilterNotIn = []){
  let statusFilterInString = '';

  if(statusFilterIn.length){
    const escapedFilters = statusFilterIn.map(s => sparqlEscapeUri(s)).join(', ');
    statusFilterInString = `FILTER(?status IN (${escapedFilters}))`;
  }

  let statusFilterNotInString = '';
  if(statusFilterNotIn.length){
    const escapedFilters = statusFilterNotIn.map(s => sparqlEscapeUri(s)).join(', ');
    statusFilterNotInString = `FILTER(?status NOT IN (${escapedFilters}))`;
  }

  const queryIsActive = `
   ${PREFIXES}

   SELECT ?jobUri {
    GRAPH ?g {
      ?jobUri a ${sparqlEscapeUri(JOB_TYPE)}.
      ?jobUri task:operation ${sparqlEscapeUri(jobOperationUri)}.
      ?jobUri adms:status ?status.

      ${statusFilterInString}
      ${statusFilterNotInString}
    }
   }
  `;
  const result = await query(queryIsActive);
  return result.results.bindings.length ? result.results.bindings.map( r => { return { jobUri: r.jobUri.value }; }) : [];
}

async function cleanupJobs(jobs){
  for(const job of jobs){
    const cleanupQuery = `
      ${PREFIXES}

      DELETE {
        GRAPH ?g {
          ?job ?jobP ?jobO.
          ?task ?taskP ?taskO.
        }
      }
      WHERE {
         BIND(${sparqlEscapeUri(job.jobUri)} as ?job)
         GRAPH ?g {
          ?job ?jobP ?jobO.
          OPTIONAL {
            ?task dct:isPartOf ?job.
            ?task ?taskP ?taskO.
          }
         }
      }
    `;
    await update(cleanupQuery);
  }
}


async function createJob(jobOperationUri){
  const jobId = uuid();
  const jobUri = JOB_URI_PREFIX + `${jobId}`;
  const created = new Date();
  const createJobQuery = `
    ${PREFIXES}
    INSERT DATA {
      GRAPH ${sparqlEscapeUri(JOBS_GRAPH)}{
        ${sparqlEscapeUri(jobUri)} a ${sparqlEscapeUri(JOB_TYPE)};
                                   mu:uuid ${sparqlEscapeString(jobId)};
                                   dct:creator ${sparqlEscapeUri(JOB_CREATOR_URI)};
                                   adms:status ${sparqlEscapeUri(STATUS_BUSY)};
                                   dct:created ${sparqlEscapeDateTime(created)};
                                   dct:modified ${sparqlEscapeDateTime(created)};
                                   task:operation ${sparqlEscapeUri(jobOperationUri)}.
      }
    }
  `;

  await update(createJobQuery);

  return jobUri;
}

async function scheduleTask(jobUri, taskOperationUri, taskIndex = "0"){
  const taskId = uuid();
  const taskUri = TASK_URI_PREFIX + `${taskId}`;
  const created = new Date();
  const createTaskQuery = `
    ${PREFIXES}
    INSERT DATA {
     GRAPH ${sparqlEscapeUri(JOBS_GRAPH)} {
         ${sparqlEscapeUri(taskUri)} a ${sparqlEscapeUri(TASK_TYPE)};
                                  mu:uuid ${sparqlEscapeString(taskId)};
                                  adms:status ${sparqlEscapeUri(STATUS_SCHEDULED)};
                                  dct:created ${sparqlEscapeDateTime(created)};
                                  dct:modified ${sparqlEscapeDateTime(created)};
                                  task:operation ${sparqlEscapeUri(taskOperationUri)};
                                  task:index ${sparqlEscapeString(taskIndex)};
                                  dct:isPartOf ${sparqlEscapeUri(jobUri)}.
      }
    }`;

  await update(createTaskQuery);

  return taskUri;
}

async function storeError(errorMsg){
 const id = uuid();
  const uri = ERROR_URI_PREFIX + id;

  const queryError = `
   ${PREFIXES}

   INSERT DATA {
    GRAPH ${sparqlEscapeUri(JOBS_GRAPH)}{
      ${sparqlEscapeUri(uri)} a ${sparqlEscapeUri(ERROR_TYPE)}, ${sparqlEscapeUri(DELTA_ERROR_TYPE)};
        mu:uuid ${sparqlEscapeString(id)};
        oslc:message ${sparqlEscapeString(errorMsg)}.
    }
   }
  `;

  await update(queryError);
}

app.use(errorHandler);
