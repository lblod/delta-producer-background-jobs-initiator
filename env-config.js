export const PREFIXES = `
  PREFIX mu: <http://mu.semte.ch/vocabularies/core/>
  PREFIX task: <http://redpencil.data.gift/vocabularies/tasks/>
  PREFIX dct: <http://purl.org/dc/terms/>
  PREFIX prov: <http://www.w3.org/ns/prov#>
  PREFIX nie: <http://www.semanticdesktop.org/ontologies/2007/01/19/nie#>
  PREFIX ext: <http://mu.semte.ch/vocabularies/ext/>
  PREFIX oslc: <http://open-services.net/ns/core#>
  PREFIX cogs: <http://vocab.deri.ie/cogs#>
  PREFIX adms: <http://www.w3.org/ns/adms#>
`;

export const STATUS_BUSY = 'http://redpencil.data.gift/id/concept/JobStatus/busy';
export const STATUS_SUCCESS = 'http://redpencil.data.gift/id/concept/JobStatus/success';
export const STATUS_SCHEDULED = 'http://redpencil.data.gift/id/concept/JobStatus/scheduled';
export const STATUS_FAILED = 'http://redpencil.data.gift/id/concept/JobStatus/failed';
export const STATUS_CANCELED = 'http://redpencil.data.gift/id/concept/JobStatus/canceled';
export const ERROR_TYPE = 'http://open-services.net/ns/core#Error';
export const DELTA_ERROR_TYPE = 'http://redpencil.data.gift/vocabularies/deltas/Error';

export const JOB_TYPE = 'http://vocab.deri.ie/cogs#Job';
export const TASK_TYPE = 'http://redpencil.data.gift/vocabularies/tasks/Task';

export const JOB_URI_PREFIX = 'http://redpencil.data.gift/id/job/';
export const TASK_URI_PREFIX = 'http://redpencil.data.gift/id/task/';

export const JOBS_GRAPH = process.env.JOBS_GRAPH || 'http://mu.semte.ch/graphs/system/jobs';

export const JOB_CREATOR_URI = 'http://lblod.data.gift/services/delta-producer-background-jobs-initiator';
export const ERROR_CREATOR_URI = process.env.ERROR_CREATOR_URI || 'http://lblod.data.gift/services/delta-producer-background-jobs-initiator';
export const ERROR_URI_PREFIX = 'http://redpencil.data.gift/id/jobs/error/';
export const CRON_PATTERN_HEALING_JOB  = process.env.CRON_PATTERN_HEALING_JOB || '0 0 0 * * *'; // every day at midnight
export const CRON_PATTERN_DUMP_JOB = process.env.CRON_PATTERN_DUMP_JOB || '0 0 0 * * *'; // every day at midnight

// delta-initial-publication-graph-sync-job
export const INITIAL_PUBLICATION_GRAPH_SYNC_TASK_OPERATION = process.env.INITIAL_PUBLICATION_GRAPH_SYNC_TASK_OPERATION || 'http://redpencil.data.gift/id/jobs/concept/TaskOperation/deltas/initialPublicationGraphSyncing';

// delta-dump-file-creation-job
export const DUMP_FILE_CREATION_TASK_OPERATION = process.env.DUMP_FILE_CREATION_TASK_OPERATION || 'http://redpencil.data.gift/id/jobs/concept/TaskOperation/deltas/deltaDumpFileCreation';

// delta-healing-job
export const HEALING_TASK_OPERATION = process.env.HEALING_TASK_OPERATION || 'http://redpencil.data.gift/id/jobs/concept/TaskOperation/deltas/healing/patchPublicationGraph';

// Configure initial sync parameters
export const START_INITIAL_SYNC = process.env.START_INITIAL_SYNC == 'false' ? false : true ;

if(START_INITIAL_SYNC && !process.env.INITIAL_PUBLICATION_GRAPH_SYNC_JOB_OPERATION)
  throw `Expected 'INITIAL_PUBLICATION_GRAPH_SYNC_JOB_OPERATION' to be provided.`;
export const INITIAL_PUBLICATION_GRAPH_SYNC_JOB_OPERATION = process.env.INITIAL_PUBLICATION_GRAPH_SYNC_JOB_OPERATION;
// End configure initial sync parameters

// Configure dump file creation parameters
export const ENABLE_DUMP_FILE_CREATION = process.env.ENABLE_DUMP_FILE_CREATION == 'false' ? false : true;

if(ENABLE_DUMP_FILE_CREATION && !process.env.DUMP_FILE_CREATION_JOB_OPERATION)
  throw `Expected 'DUMP_FILE_CREATION_JOB_OPERATION' to be provided.`;
export const DUMP_FILE_CREATION_JOB_OPERATION = process.env.DUMP_FILE_CREATION_JOB_OPERATION;
// End configure dump file creation parameters

// Configure healing job parameters
export const ENABLE_HEALING_JOB_OPERATION = process.env.ENABLE_HEALING_JOB_OPERATION == 'false'? false : true;
if(ENABLE_HEALING_JOB_OPERATION && !process.env.HEALING_JOB_OPERATION)
  throw `Expected 'HEALING_JOB_OPERATION' to be provided.`;
export const HEALING_JOB_OPERATION = process.env.HEALING_JOB_OPERATION;
// End configure healing job parameters

//mainly for debugging purposes
export const HEAL_MUST_WAIT_FOR_INITIAL_SYNC = process.env.HEAL_MUST_WAIT_FOR_INITIAL_SYNC == 'false' ? false : true ;
