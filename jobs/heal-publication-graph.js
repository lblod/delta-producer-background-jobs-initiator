import { STATUS_BUSY,
         STATUS_SUCCESS,
         STATUS_SCHEDULED,
         HEALING_TASK_OPERATION,
       } from '../env-config.js';
import { getJobs, storeError, createJob, scheduleTask } from '../lib/utils';

export async function run(jobsGraph, healingJobOperation,initialPublicationGraphSyncJobOperation,dumpFileCreationJobOperation, healShouldNotWaitForInitialSync){
  console.info(`Starting ${healingJobOperation} at ${new Date().toISOString()}`);
  try {
    let healingJobs = await getJobs(initialPublicationGraphSyncJobOperation, [ STATUS_SUCCESS ]);

    if(!healShouldNotWaitForInitialSync && healingJobs.length == 0){
      throw "Healing must wait for initial sync to complete, but initial sync did not complete yet";
    }
    else {
      let activeJobs = await getJobs(healingJobOperation, [ STATUS_BUSY, STATUS_SCHEDULED ]);
      activeJobs = [...activeJobs, ...await getJobs(initialPublicationGraphSyncJobOperation, [ STATUS_BUSY, STATUS_SCHEDULED ] ) ];
      activeJobs = [...activeJobs, ...await getJobs(dumpFileCreationJobOperation, [ STATUS_BUSY, STATUS_SCHEDULED ] ) ];

      if(activeJobs.length){
        const message = `Incompatible jobs for
                         ${healingJobOperation}
                         already running, see ${activeJobs.map(j => j.jobUri).join(', ')}`;
        throw message;
      }
      else {
        const jobUri = await createJob(jobsGraph, healingJobOperation);
        await scheduleTask(jobsGraph, jobUri, HEALING_TASK_OPERATION);
      }
    }
  } catch (error) {
    console.error(`Error while scheduling job ${healingJobOperation}: ${error}`);
    console.error(error);
    await storeError(jobsGraph, error);
  }
}
