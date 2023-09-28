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
export const ACTIVE_STATUSES = [STATUS_BUSY, STATUS_SCHEDULED];

export const JOB_TYPE = 'http://vocab.deri.ie/cogs#Job';
export const TASK_TYPE = 'http://redpencil.data.gift/vocabularies/tasks/Task';

export const JOB_URI_PREFIX = 'http://redpencil.data.gift/id/job/';
export const TASK_URI_PREFIX = 'http://redpencil.data.gift/id/task/';


export const JOB_CREATOR_URI = 'http://lblod.data.gift/services/delta-producer-background-jobs-initiator';
export const ERROR_URI_PREFIX = 'http://redpencil.data.gift/id/jobs/error/';
export const DEFAULT_CRON_PATTERN_JOB = '0 0 0 * * *'; // every day at midnight
// delta-initial-publication-graph-sync-job
export const INITIAL_PUBLICATION_GRAPH_SYNC_TASK_OPERATION = process.env.INITIAL_PUBLICATION_GRAPH_SYNC_TASK_OPERATION || 'http://redpencil.data.gift/id/jobs/concept/TaskOperation/deltas/initialPublicationGraphSyncing';

// delta-dump-file-creation-job
export const DUMP_FILE_CREATION_TASK_OPERATION = process.env.DUMP_FILE_CREATION_TASK_OPERATION || 'http://redpencil.data.gift/id/jobs/concept/TaskOperation/deltas/deltaDumpFileCreation';

// delta-healing-job
export const HEALING_TASK_OPERATION = process.env.HEALING_TASK_OPERATION || 'http://redpencil.data.gift/id/jobs/concept/TaskOperation/deltas/healing/patchPublicationGraph';

export const CONFIG_FILE_JSON = "/config/config.json";

export const JOB_TIMEOUT_MINUTES = process.env.JOB_TIMEOUT_MINUTES || false;
