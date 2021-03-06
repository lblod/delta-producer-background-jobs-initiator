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
* `JOBS_GRAPH`: URI of the graph where jobs are stored, defaults to `http://mu.semte.ch/graphs/system/jobs`
* `CRON_PATTERN_HEALING_JOB`: Pattern for periodical triggering, defaults to `0 0 0 * * *`
* `CRON_PATTERN_DUMP_JOB`: Pattern for periodical triggering, defaults to `0 0 0 * * *`
* `START_INITIAL_SYNC`: set to 'false' if no initial sync needed
* `HEAL_MUST_WAIT_FOR_INITIAL_SYNC`: set to 'false' if you don't want this. (Mainly for debugging purposes)
* `ENABLE_DUMP_FILE_CREATION`: set to 'false' if you don't want this
* `ENABLE_HEALING_JOB_OPERATION`: set to 'false' if you don't want this

### API
There is an api, mainly meant for debugging. Look at `app.js` if you want to use it.
