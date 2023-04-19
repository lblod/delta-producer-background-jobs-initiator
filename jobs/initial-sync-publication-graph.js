import { STATUS_BUSY,
         STATUS_SCHEDULED,
         INITIAL_PUBLICATION_GRAPH_SYNC_JOB_OPERATION,
         INITIAL_PUBLICATION_GRAPH_SYNC_TASK_OPERATION,
         DUMP_FILE_CREATION_JOB_OPERATION,
         HEALING_JOB_OPERATION,
         ENABLE_DUMP_FILE_CREATION,
         ENABLE_HEALING_JOB_OPERATION
       } from '../env-config.js';
import { getJobs, storeError, createJob, scheduleTask } from '../lib/utils';

export async function run(){
  console.info(`Starting ${INITIAL_PUBLICATION_GRAPH_SYNC_JOB_OPERATION} at ${new Date().toISOString()}`);
  try {
    let activeJobs = await getJobs(INITIAL_PUBLICATION_GRAPH_SYNC_JOB_OPERATION);
    if (ENABLE_DUMP_FILE_CREATION) {
      activeJobs = [...activeJobs, ...await getJobs(DUMP_FILE_CREATION_JOB_OPERATION, [ STATUS_BUSY, STATUS_SCHEDULED ] ) ];
    }
    if (ENABLE_HEALING_JOB_OPERATION) {
      activeJobs = [...activeJobs, ...await getJobs(HEALING_JOB_OPERATION, [ STATUS_BUSY, STATUS_SCHEDULED ] ) ];
    }

    if(activeJobs.length){
      const message = `Incompatible jobs for
                       ${INITIAL_PUBLICATION_GRAPH_SYNC_JOB_OPERATION}
                       already running, see ${activeJobs.map(j => j.jobUri).join(', ')}`;
      throw message;
    }
    else {
      const jobUri = await createJob(INITIAL_PUBLICATION_GRAPH_SYNC_JOB_OPERATION);
      await scheduleTask(jobUri, INITIAL_PUBLICATION_GRAPH_SYNC_TASK_OPERATION);
    }

  }
  catch(error){
    console.error(`Error while scheduling job ${INITIAL_PUBLICATION_GRAPH_SYNC_JOB_OPERATION}: ${error}`);
    console.error(error);
    await storeError(error);
  }
}
