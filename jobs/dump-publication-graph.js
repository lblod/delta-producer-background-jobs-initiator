import {
  ACTIVE_STATUSES,
  DUMP_FILE_CREATION_TASK_OPERATION,
} from '../env-config.js';
import { getJobs, storeError, createJob, scheduleTask, updateAndFilterTimedOutJobs } from '../lib/utils';

export async function run(
  {
    jobsGraph,
    dumpFileCreationJobOperation,
    initialPublicationGraphSyncJobOperation,
    healingJobOperation,
    errorCreatorUri
  },
  debug = false ) {
  console.info(`Starting ${dumpFileCreationJobOperation} at ${new Date().toISOString()}`);
  try {
    let activeJobs = await getJobs(dumpFileCreationJobOperation, ACTIVE_STATUSES);
    activeJobs = [...activeJobs, ...await getJobs(initialPublicationGraphSyncJobOperation, ACTIVE_STATUSES)];
    activeJobs = [...activeJobs, ...await getJobs(healingJobOperation, ACTIVE_STATUSES)];
    activeJobs = await updateAndFilterTimedOutJobs(jobsGraph, activeJobs);

    if (activeJobs.length && !debug) {
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
    await storeError(jobsGraph, errorCreatorUri, error);
  }
}
