import { STATUS_BUSY,
         STATUS_SCHEDULED,
         INITIAL_PUBLICATION_GRAPH_SYNC_TASK_OPERATION,
       } from '../env-config.js';
import { getJobs, storeError, createJob, scheduleTask } from '../lib/utils';

export async function run(jobsGraph, initialPublicationGraphSyncJobOperation, dumpFileCreationJobOperation, healingJobOperation ){
  console.info(`Starting ${initialPublicationGraphSyncJobOperation} at ${new Date().toISOString()}`);
  try {

    let activeJobs = await getJobs(initialPublicationGraphSyncJobOperation);
    activeJobs = [...activeJobs, ...await getJobs(dumpFileCreationJobOperation, [ STATUS_BUSY, STATUS_SCHEDULED ] ) ];
    activeJobs = [...activeJobs, ...await getJobs(healingJobOperation, [ STATUS_BUSY, STATUS_SCHEDULED ] ) ];

    if(activeJobs.length){
      const message = `Incompatible jobs for
                       ${initialPublicationGraphSyncJobOperation}
                       already running, see ${activeJobs.map(j => j.jobUri).join(', ')}`;
      throw message;
    }
    else {
      const jobUri = await createJob(jobsGraph, initialPublicationGraphSyncJobOperation);
      await scheduleTask(jobsGraph, jobUri, INITIAL_PUBLICATION_GRAPH_SYNC_TASK_OPERATION);
    }

  }
  catch(error){
    console.error(`Error while scheduling job ${initialPublicationGraphSyncJobOperation}: ${error}`);
    console.error(error);
    await storeError(jobsGraph, error);
  }
}
