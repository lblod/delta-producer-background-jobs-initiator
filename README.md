# delta-producer-background-jobs-initiator
This service is responsible for periodically triggering delta-related background jobs. For a comprehensive overview of how deltas function, please refer to the [delta-tutorial](https://github.com/lblod/delta-tutorial).
## How
### Add the service to a stack

To include the service in your `docker-compose.yml`, the minimum configuration is as follows:

```yaml
  delta-producer-background-jobs-initiator-some-theme:
    image: lblod/delta-producer-background-jobs-initiator:1.0.0
    volumes:
      - ./config/delta-producer/background-job-initiator/config.json:/config/config.json
```

## Reference
#### Environment Variables
The following environment variables can be configured:
* `INITIAL_PUBLICATION_GRAPH_SYNC_TASK_OPERATION`: Specifies the initial sync task operation. Default: `http://redpencil.data.gift/id/jobs/concept/TaskOperation/deltas/initialPublicationGraphSyncing`.
* `DUMP_FILE_CREATION_TASK_OPERATION`: Specifies the dump file task operation. Default: `http://redpencil.data.gift/id/jobs/concept/TaskOperation/deltas/deltaDumpFileCreation`.
* `HEALING_TASK_OPERATION`: Specifies the healing task operation. Default: `http://redpencil.data.gift/id/jobs/concept/TaskOperation/deltas/patchPublicationGraph`.
* `JOB_TIMEOUT_MINUTES`: Set a value greater than 0 to apply a timeout to the job, measured in minutes.

#### Configuration File

The JSON file contains an array of job configurations. The properties are:

* `name`: (Required) The name of the job configuration.
* `jobsGraph`: (Required) URI indicating where jobs are stored.
* `disableDumpFileCreation`: Determines whether the healing job is disabled. Default: `false`.
* `dumpFileCreationJobOperation`: (Required) URI associated with dump files.
* `startInitialSync`: (Required) Determines whether the initial sync is enabled.
* `initialPublicationGraphSyncJobOperation`: (Required) URI related to the initial publication sync.
* `disableHealingJobOperation`: Indicates if the healing job is disabled. Default: `false`.
* `healingJobOperation`: (Required) URI related to dump files production.
* `cronPatternDumpJob`: Specifies the pattern for periodic triggering. Default: `0 0 0 * * *`.
* `cronPatternHealingJob`: Pattern for periodic triggering. Default: `0 0 0 * * *`.
* `errorCreatorUri`: URI identifying the error creator. While this is optional, a sensible default will be used if not provided.

```json
[
    {
        "name": "leidinggevenden",
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
There is an API, primarily intended for debugging. Refer to `app.js` for its usage.
#### Quick Example
If you are running the service in `docker-compose`, named `delta-producer-background-jobs-initiator`, and you have a delta stream named `besluiten`, use the following command:

```
docker-compose exec delta-producer-background-jobs-initiator curl -X POST http://localhost/besluiten/dump-publication-graph-jobs
```
This will trigger the dump-file creation.
