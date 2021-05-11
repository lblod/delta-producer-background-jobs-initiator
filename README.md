# delta-producer-background-jobs-initiator

Service responsible for (periodically) triggering a delta-related background jobs.

## How
### Add the service to a stack
Add the service to your `docker-compose.yml`, minimal config being:

```
  delta-producer-background-jobs-initiator-some-theme:
    image: lblod/delta-producer-background-jobs-initiator:0.0.1
    environment:
      INITIAL_CACHE_SYNC_JOB_OPERATION: 'http://redpencil.data.gift/id/jobs/concept/JobOperation/deltas/initialCacheGraphSyncing/SomeTheme'
      DUMP_FILE_CREATION_JOB_OPERATION: 'http://redpencil.data.gift/id/jobs/concept/JobOperation/deltas/deltaDumpFileCreation/SomeTheme'
      HEALING_JOB_OPERATION: 'http://redpencil.data.gift/id/jobs/concept/JobOperation/deltas/healingOperation/SomeTheme'
```

## Reference
#### Environment variables
The following enviroment variables can be configured:
* `INITIAL_CACHE_SYNC_JOB_OPERATION`: URI of job related to the initial cache sync. [REQUIRED]
* `DUMP_FILE_CREATION_JOB_OPERATION`: URI of job related to the dump files production. [REQUIRED]
* `JOBS_GRAPH`: URI of the graph where jobs are stored, defaults to `http://mu.semte.ch/graphs/system/jobs`
* `CRON_PATTERN_HEALING_JOB`: Pattern for periodical triggering, defaults to `0 0 0 * * *`
* `CRON_PATTERN_DUMP_JOB`: Pattern for periodical triggering, defaults to `0 0 0 * * *`

### API
There is an api, mainly meant for debugging. Look at `app.js` if you want to use it.
