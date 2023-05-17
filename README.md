# delta-producer-background-jobs-initiator

Service responsible for (periodically) triggering a delta-related background jobs.

## How
### Add the service to a stack
Add the service to your `docker-compose.yml`, minimal config being:

```
  delta-producer-background-jobs-initiator-some-theme:
    image: lblod/delta-producer-background-jobs-initiator:0.0.1
    environment:
      INITIAL_PUBLICATION_GRAPH_SYNC_JOB_OPERATION: 'http://redpencil.data.gift/id/jobs/concept/JobOperation/deltas/initialPublicationGraphSyncing/SomeTheme'
      DUMP_FILE_CREATION_JOB_OPERATION: 'http://redpencil.data.gift/id/jobs/concept/JobOperation/deltas/deltaDumpFileCreation/SomeTheme'
      HEALING_JOB_OPERATION: 'http://redpencil.data.gift/id/jobs/concept/JobOperation/deltas/healingOperation/SomeTheme'
```

## Reference
#### Environment variables
The following enviroment variables can be configured:
* `INITIAL_PUBLICATION_GRAPH_SYNC_JOB_OPERATION`: URI of job related to the initial publication sync. Mostly you want this. [REQUIRED if START_INITIAL_SYNC]
* `DUMP_FILE_CREATION_JOB_OPERATION`: URI of job related to the dump files production. [REQUIRED if ENABLE_DUMP_FILE_CREATION]
* `HEALING_JOB_OPERATION`: URI of job related to the dump files production. [REQUIRED if ENABLE_HEALING_JOB_OPERATION]
* `INITIAL_PUBLICATION_GRAPH_SYNC_TASK_OPERATION`: The initial sync task operation, defaults to `http://redpencil.data.gift/id/jobs/concept/TaskOperation/deltas/initialPublicationGraphSyncing`
* `DUMP_FILE_CREATION_TASK_OPERATION`: The dump file task operation, defaults to `http://redpencil.data.gift/id/jobs/concept/TaskOperation/deltas/deltaDumpFileCreation`
* `HEALING_TASK_OPERATION`: The healing task operation, defaults to `http://redpencil.data.gift/id/jobs/concept/TaskOperation/deltas/patchPublicationGraph`
* `JOB_TIMEOUT_MINUTES`: set a value greater than 0 if you want to set a timeout to the job (in minutes) 

#### Configuration file

The json file represents an array of job configurations. Here are the properties :

* `name` : required, the name of the job configuration
* `jobsGraph`: required, URI of the graph where jobs are stored
* `disableDumpFileCreation`: weither healing job is disabled or not (default to `false`)
* `dumpFileCreationJobOperation`: required if `disableDumpFileCreation` is not set to `true`,  URI of job related to the dump files 
* `startInitialSync`: required, weither initial sync is enabled or not.
* `initialPublicationGraphSyncJobOperation`: required if `startInitialSync` is  set to `true`,   URI of job related to the initial publication sync. Mostly you want this.
* `disableHealingJobOperation`: weither healing job is disabled or not (default to `false`)
* `healingJobOperation`: required if `disableHealingJobOperation` is not set to `true`, URI of job related to the dump files production.
* `cronPatternDumpJob`: Pattern for periodical triggering, defaults to `0 0 0 * * *`
* `cronPatternHealingJob`: Pattern for periodical triggering, defaults to `0 0 0 * * *`,
* E.g:

```json
[
  	{
		"name": "delta-producer-background-jobs-initiator-leidinggevenden",
		"jobsGraph": "http://mu.semte.ch/graphs/organizations/141d9d6b-54af-4d17-b313-8d1c30bc3f5b/LoketAdmin",
		"dumpFileCreationJobOperation": "http://redpencil.data.gift/id/jobs/concept/JobOperation/deltas/deltaDumpFileCreation/leidinggevenden",
		"initialPublicationGraphSyncJobOperation": "http://redpencil.data.gift/id/jobs/concept/JobOperation/deltas/initialPublicationGraphSyncing/leidinggevenden",
		"healingJobOperation": "http://redpencil.data.gift/id/jobs/concept/JobOperation/deltas/healingOperation/leidinggevenden",
		"cronPatternDumpJob": "0 0 0 * * 6",
		"cronPatternHealingJob": "0 0 2 * * *",
		"startInitialSync": false
	}
]
```

### API
There is an api, mainly meant for debugging. Look at `app.js` if you want to use it.
