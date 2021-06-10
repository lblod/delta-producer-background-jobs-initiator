import { STATUS_BUSY,
         STATUS_SUCCESS,
         STATUS_SCHEDULED,
         INITIAL_PUBLICATION_GRAPH_SYNC_JOB_OPERATION,
         HEALING_JOB_OPERATION,
         DUMP_FILE_CREATION_JOB_OPERATION,
         HEALING_TASK_OPERATION,
         HEAL_MUST_WAIT_FOR_INITIAL_SYNC
       } from '../env-config.js';
import { getJobs, storeError, createJob, scheduleTask } from '../lib/utils';

export async function run(){
  console.info(`Starting ${HEALING_JOB_OPERATION} at ${new Date().toISOString()}`);
  try {
    let healingJobs = await getJobs(INITIAL_PUBLICATION_GRAPH_SYNC_JOB_OPERATION, [ STATUS_SUCCESS ]);

    if(HEAL_MUST_WAIT_FOR_INITIAL_SYNC && healingJobs.length == 0){
      throw "Healing must wait for initial sync to complete, but initial sync did not complete yet";
    }
    else {
      let activeJobs = await getJobs(HEALING_JOB_OPERATION, [ STATUS_BUSY, STATUS_SCHEDULED ]);
      activeJobs = [...activeJobs, ...await getJobs(INITIAL_PUBLICATION_GRAPH_SYNC_JOB_OPERATION, [ STATUS_BUSY, STATUS_SCHEDULED ] ) ];
      activeJobs = [...activeJobs, ...await getJobs(DUMP_FILE_CREATION_JOB_OPERATION, [ STATUS_BUSY, STATUS_SCHEDULED ] ) ];

      if(activeJobs.length){
        const message = `Incompatible jobs for
                         ${HEALING_JOB_OPERATION}
                         already running, see ${activeJobs.map(j => j.jobUri).join(', ')}`;
        throw message;
      }
      else {
        const jobUri = await createJob(HEALING_JOB_OPERATION);
        await scheduleTask(jobUri, HEALING_TASK_OPERATION);
      }
    }
  } catch (error) {
    console.error(`Error while scheduling job ${HEALING_JOB_OPERATION}: ${error}`);
    console.error(error);
    await storeError(error);
  }
}
