import { STATUS_BUSY,
         STATUS_SCHEDULED,
         DUMP_FILE_CREATION_TASK_OPERATION,
       } from '../env-config.js';
import { getJobs, storeError, createJob, scheduleTask } from '../lib/utils';

export async function run(jobsGraph, dumpFileCreationJobOperation,initialPublicationGraphSyncJobOperation, healingJobOperation){
  console.info(`Starting ${dumpFileCreationJobOperation} at ${new Date().toISOString()}`);
  try {
    let activeJobs = await getJobs(dumpFileCreationJobOperation, [ STATUS_BUSY, STATUS_SCHEDULED ] );
    activeJobs = [...activeJobs, ...await getJobs(initialPublicationGraphSyncJobOperation, [ STATUS_BUSY, STATUS_SCHEDULED ] ) ];
    activeJobs = [...activeJobs, ...await getJobs(healingJobOperation, [ STATUS_BUSY, STATUS_SCHEDULED ] ) ];

    if(activeJobs.length){
      const message = `Incompatible jobs for
                       ${dumpFileCreationJobOperation}
                       already running, see ${activeJobs.map(j => j.jobUri).join(', ')}`;
      throw message;
    }
    else {
      const jobUri = await createJob(jobsGraph, dumpFileCreationJobOperation);
      await scheduleTask(jobsGraph, jobUri, DUMP_FILE_CREATION_TASK_OPERATION);
    }

  } catch (error) {
    console.error(`Error while scheduling job ${dumpFileCreationJobOperation}: ${error}`);
    console.error(error);
    await storeError(jobsGraph, error);
  }
}
