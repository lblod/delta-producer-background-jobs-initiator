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
* `cronPatternHealingJob`: Pattern for periodical triggering, defaults to `0 0 0 * * *`
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
