import {
  uuid,
  sparqlEscapeString,
  sparqlEscapeUri,
  sparqlEscapeDateTime
} from 'mu';
import { querySudo as query, updateSudo as update } from '@lblod/mu-auth-sudo';

import {
  PREFIXES,
  JOB_TYPE,
  TASK_TYPE,
  JOB_TIMEOUT_MINUTES,
  ERROR_TYPE,
  DELTA_ERROR_TYPE,
  STATUS_FAILED,
  STATUS_BUSY,
  STATUS_SCHEDULED,
  TASK_URI_PREFIX,
  JOB_URI_PREFIX,
  JOB_CREATOR_URI,
  ERROR_URI_PREFIX,
} from '../env-config.js';

export async function getJobs(jobOperationUri, statusFilterIn = [], statusFilterNotIn = []) {
  if (!jobOperationUri?.length) {
    return [];
  }
  let statusFilterInString = '';
  if (statusFilterIn.length) {
    const escapedFilters = statusFilterIn.map(s => sparqlEscapeUri(s)).join(', ');
    statusFilterInString = `FILTER(?status IN (${escapedFilters}))`;
  }

  let statusFilterNotInString = '';
  if (statusFilterNotIn.length) {
    const escapedFilters = statusFilterNotIn.map(s => sparqlEscapeUri(s)).join(', ');
    statusFilterNotInString = `FILTER(?status NOT IN (${escapedFilters}))`;
  }

  const queryIsActive = `
   ${PREFIXES}

   SELECT ?jobUri  ?status ?modified {
    GRAPH ?g {
      ?jobUri a ${sparqlEscapeUri(JOB_TYPE)}.
      ?jobUri task:operation ${sparqlEscapeUri(jobOperationUri)}.
      ?jobUri adms:status ?status.
      ?jobUri dct:modified ?modified.

      ${statusFilterInString}
      ${statusFilterNotInString}
    }
   }
  `;
  const result = await query(queryIsActive);
  return result.results.bindings.length ? result.results.bindings.map(r => {
    return {
      jobUri: r.jobUri.value,
      status: r.status.value,
      modified: r.modified.value
    };
  }) : [];
}

export async function cleanupJobs(jobs) {
  for (const job of jobs) {
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


export async function createJob(jobsGraph, jobOperationUri) {
  const jobId = uuid();
  const jobUri = JOB_URI_PREFIX + `${jobId}`;
  const created = new Date();
  const createJobQuery = `
    ${PREFIXES}
    INSERT DATA {
      GRAPH ${sparqlEscapeUri(jobsGraph)}{
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

export async function scheduleTask(jobsGraph, jobUri, taskOperationUri, taskIndex = "0") {
  const taskId = uuid();
  const taskUri = TASK_URI_PREFIX + `${taskId}`;
  const created = new Date();
  const createTaskQuery = `
    ${PREFIXES}
    INSERT DATA {
     GRAPH ${sparqlEscapeUri(jobsGraph)} {
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

export async function storeError(jobsGraph, errorCreatorUri, errorMsg) {
  const id = uuid();
  const uri = ERROR_URI_PREFIX + id;

  const queryError = `
    ${PREFIXES}

    INSERT DATA {
      GRAPH ${sparqlEscapeUri(jobsGraph)} {
        ${sparqlEscapeUri(uri)} a ${sparqlEscapeUri(ERROR_TYPE)}, ${sparqlEscapeUri(DELTA_ERROR_TYPE)} ;
          mu:uuid ${sparqlEscapeString(id)} ;
          dct:subject "Delta Producer Background Jobs Initiator" ;
          oslc:message ${sparqlEscapeString(errorMsg)} ;
          dct:created ${sparqlEscapeDateTime(new Date().toISOString())} ;
          dct:creator ${sparqlEscapeUri(errorCreatorUri)} .
      }
    }
  `;

  await update(queryError);
}

export async function updateStatusJob(jobsGraph, jobUri, status) {
  let dateModified = new Date();
  const updateQuery = `
    ${PREFIXES}
    DELETE {
      GRAPH ?g {
        ?job adms:status ?status;
           dct:modified ?modified.
      }
    }
    WHERE {
      GRAPH ?g {
       BIND(${sparqlEscapeUri(jobUri)} AS ?job)
       ?job a ${sparqlEscapeUri(JOB_TYPE)};
         adms:status ?status;
         dct:modified ?modified.
      }
    }
    ;
    INSERT DATA {
      GRAPH ${sparqlEscapeUri(jobsGraph)}{
        ${sparqlEscapeUri(jobUri)} adms:status ${sparqlEscapeUri(status)};
           dct:modified ${sparqlEscapeDateTime(dateModified)}.
      }
    }
  `;

  await update(updateQuery);


}

export async function updateAndFilterTimedOutJobs(jobsGraph, jobs) {
  if (jobs.length && JOB_TIMEOUT_MINUTES) {
    let timeoutMinutes = parseInt(JOB_TIMEOUT_MINUTES);
    let stillActiveJobs = [];
    for (const job of jobs) {
      if (job.status === STATUS_BUSY || job.status === STATUS_SCHEDULED) {
        let date = new Date(job.modified);
        let now = new Date();

        let diff = (now.getTime() - date.getTime()) * 1000 * 60;
        if (diff >= timeoutMinutes) {
          console.log(`job ${job.jobUri} has timed out. Setting status to failed...`);
          await updateStatusJob(jobsGraph, job.jobUri, STATUS_FAILED);
        } else {
          stillActiveJobs.push(job);
        }
      }

    }
    return stillActiveJobs;
  }
  return jobs;
}
