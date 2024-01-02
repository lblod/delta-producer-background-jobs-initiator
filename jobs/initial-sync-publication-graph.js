import {
  ACTIVE_STATUSES,
  INITIAL_PUBLICATION_GRAPH_SYNC_TASK_OPERATION,
} from '../env-config.js';
import { getJobs, storeError, createJob, scheduleTask, updateAndFilterTimedOutJobs } from '../lib/utils';

export async function run(
  { jobsGraph,
    initialPublicationGraphSyncJobOperation,
    dumpFileCreationJobOperation,
    healingJobOperation,
    disableDumpFileCreation,
    disableHealingJobOperation,
    errorCreatorUri
  }, debug = false ) {
  console.info(`Starting ${initialPublicationGraphSyncJobOperation} at ${new Date().toISOString()}`);
  try {
    let activeJobs = await getJobs(initialPublicationGraphSyncJobOperation);
    if (activeJobs.length) {
      console.log(`Initial sync already ran. continue...`);
      return;
    }
    if (!disableDumpFileCreation) {
      activeJobs = [...activeJobs, ...await getJobs(dumpFileCreationJobOperation, ACTIVE_STATUSES)];
    }
    if (!disableHealingJobOperation) {
      activeJobs = [...activeJobs, ...await getJobs(healingJobOperation, ACTIVE_STATUSES)];
    }
    activeJobs = await updateAndFilterTimedOutJobs(jobsGraph, activeJobs);

    if (activeJobs.length && !debug) {
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
  catch (error) {
    console.error(`Error while scheduling job ${initialPublicationGraphSyncJobOperation}: ${error}`);
    console.error(error);
    await storeError(jobsGraph, errorCreatorUri, error);
  }
}
