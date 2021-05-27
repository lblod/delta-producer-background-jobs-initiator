import { STATUS_BUSY,
         STATUS_SCHEDULED,
         INITIAL_CACHE_SYNC_JOB_OPERATION,
         DUMP_FILE_CREATION_JOB_OPERATION,
         DUMP_FILE_CREATION_TASK_OPERATION,
         HEALING_JOB_OPERATION,
       } from '../env-config.js';
import { getJobs, storeError, createJob, scheduleTask } from '../lib/utils';

export async function run(){
  console.info(`Starting ${DUMP_FILE_CREATION_JOB_OPERATION} at ${new Date().toISOString()}`);
  try {
    let activeJobs = await getJobs(DUMP_FILE_CREATION_JOB_OPERATION, [ STATUS_BUSY, STATUS_SCHEDULED ] );
    activeJobs = [...activeJobs, ...await getJobs(INITIAL_CACHE_SYNC_JOB_OPERATION, [ STATUS_BUSY, STATUS_SCHEDULED ] ) ];
    activeJobs = [...activeJobs, ...await getJobs(HEALING_JOB_OPERATION, [ STATUS_BUSY, STATUS_SCHEDULED ] ) ];

    if(activeJobs.length){
      const message = `Incompatible jobs for
                       ${DUMP_FILE_CREATION_JOB_OPERATION}
                       already running, see ${activeJobs.map(j => j.jobUri).join(', ')}`;
      throw message;
    }
    else {
      const jobUri = await createJob(DUMP_FILE_CREATION_JOB_OPERATION);
      await scheduleTask(jobUri, DUMP_FILE_CREATION_TASK_OPERATION);
    }

  } catch (error) {
    console.error(`Error while scheduling job ${DUMP_FILE_CREATION_JOB_OPERATION}: ${error}`);
    console.error(error);
    await storeError(error);
  }
}
