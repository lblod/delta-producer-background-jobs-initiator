import {
  ACTIVE_STATUSES,
  STATUS_SUCCESS,
  HEALING_TASK_OPERATION,
} from '../env-config.js';
import { getJobs, storeError, createJob, scheduleTask, updateAndFilterTimedOutJobs } from '../lib/utils';

export async function run(
  {
    jobsGraph,
    healingJobOperation,
    initialPublicationGraphSyncJobOperation,
    dumpFileCreationJobOperation,
    healShouldNotWaitForInitialSync,
    errorCreatorUri
  }, debug = false ) {
  console.info(`Starting ${healingJobOperation} at ${new Date().toISOString()}`);
  try {
    let healingJobs = await getJobs(initialPublicationGraphSyncJobOperation, [STATUS_SUCCESS]);

    if (!healShouldNotWaitForInitialSync && healingJobs.length == 0) {
      throw "Healing must wait for initial sync to complete, but initial sync did not complete yet";
    }
    else {
      let activeJobs = await getJobs(healingJobOperation, ACTIVE_STATUSES);
      activeJobs = [...activeJobs, ...await getJobs(initialPublicationGraphSyncJobOperation, ACTIVE_STATUSES)];
      activeJobs = [...activeJobs, ...await getJobs(dumpFileCreationJobOperation, ACTIVE_STATUSES)];
      activeJobs = await updateAndFilterTimedOutJobs(jobsGraph,activeJobs);
      if (activeJobs.length && !debug) {
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
    await storeError(jobsGraph, errorCreatorUri, error);
  }
}
