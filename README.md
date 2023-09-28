<a name="readme-top"></a>

<br />
<div align="center">
  <h1 align="center">delta-producer-background-jobs-initiator</h1>
  <p align="center">
    Periodically creates jobs of different types
    <br />
    <a href="https://github.com/lblod/delta-producer-background-jobs-initiator/pulls">Report Bug</a>
    ·
    <a href="https://github.com/lblod/delta-producer-background-jobs-initiator/issues">Open PR</a>
  </p>
</div>


## 📖 Description

This service manages the creation of jobs commonly used during data synchronizations:
- **Initial sync jobs** - jobs that are usually meant to run once, to initialize a synchronization between two sources (can be two graphs, two apps...)
- **Healing jobs** - jobs that run periodically to compensate for errors that might have happend during the live-sync flow (for ex. [here](https://github.com/lblod/delta-producer-publication-graph-maintainer#post-delta))
- **Dump jobs** - jobs that run periodically to immortalize the state of a graph by dumping all the content of the graph to a ttl file

This service initiates jobs that are then picked up by other services via the deltas, see [Related services](#📦-related-services) to find examples of delta configuration that pick up the newly created jobs.

It ensures that the chronology is respected, aka the initial sync job should happen and be successfull before any healing job can be scheduled.

Initial sync jobs creation is triggered when the service is started, and cron jobs are triggering the creation of the healing and dump jobs.

The content of the jobs is not defined in this service, but on the service(s) that listen to the jobs' creation.

### 📦 Related services

This service helps manage the consumer-producer flow. The following services are closely related to this one:

- [delta-producer-publication-graph-maintainer](https://github.com/lblod/delta-producer-publication-graph-maintainer): service triggered by the creation of the initial sync and healing jobs
- [delta-producer-dump-file-publisher](https://github.com/lblod/delta-producer-dump-file-publisher): service triggered by the creation of the dump jobs

Note that the delta-producer-background-jobs-initiator can also technically be used outside of the context of delta sync to orchestrate sync jobs that are not related to the producer-consumer flow, as the implementation of the jobs themselves is very free.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## ⏩ Quick setup
### 🐋 Docker-compose.yml
```yaml
  delta-producer-background-jobs-initiator-some-theme:
    image: lblod/delta-producer-background-jobs-initiator:0.0.1
    environment:
      INITIAL_PUBLICATION_GRAPH_SYNC_JOB_OPERATION: 'http://redpencil.data.gift/id/jobs/concept/JobOperation/deltas/initialPublicationGraphSyncing/SomeTheme'
      DUMP_FILE_CREATION_JOB_OPERATION: 'http://redpencil.data.gift/id/jobs/concept/JobOperation/deltas/deltaDumpFileCreation/SomeTheme'
      HEALING_JOB_OPERATION: 'http://redpencil.data.gift/id/jobs/concept/JobOperation/deltas/healingOperation/SomeTheme'
    labels:
      - "logging=true"
    restart: always
    logging: *default-logging
```

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## 🔑 Environment variables

| ENV  | description | default | required |
|---|---|---|---|
| INITIAL_PUBLICATION_GRAPH_SYNC_JOB_OPERATION | URI of the job operation related to the initial sync | N/A | X (if `START_INITIAL_SYNC=true`) |
| INITIAL_PUBLICATION_GRAPH_SYNC_TASK_OPERATION | URI of the task operation related to the initial sync | `http://redpencil.data.gift/id/jobs/concept/TaskOperation/deltas/initialPublicationGraphSyncing`  | |
| DUMP_FILE_CREATION_JOB_OPERATION | URI of the job operation related to the dump files creation | N/A | X (if `ENABLE_DUMP_FILE_CREATION=true`) |
| DUMP_FILE_CREATION_TASK_OPERATION | URI of the task operation related to the dump files creation | `http://redpencil.data.gift/id/jobs/concept/TaskOperation/deltas/deltaDumpFileCreation`  | |
| HEALING_JOB_OPERATION | URI of the job operation related to the healing | N/A | X (if `ENABLE_HEALING_JOB_OPERATION=true`) |
| HEALING_TASK_OPERATION | URI of the task operation related to the healing | `http://redpencil.data.gift/id/jobs/concept/TaskOperation/deltas/patchPublicationGraph`  | |
| JOBS_GRAPH | URI of the graph where jobs are stored | `http://mu.semte.ch/graphs/system/jobs` | |
| CRON_PATTERN_HEALING_JOB | Pattern for periodical triggering healing job creation | `0 0 0 * * *` | |
| CRON_PATTERN_DUMP_JOB | Pattern for periodical triggering dump job creation | `0 0 0 * * *` | |
| START_INITIAL_SYNC | Allow initial sync to be executed (on service's startup or via the API) | `false`  | |
| HEAL_MUST_WAIT_FOR_INITIAL_SYNC | Prevents healing from triggering before initial sync has ran successfully. Setting it to false will mostly be used for debugging purposes. | `true`  | |
| ENABLE_DUMP_FILE_CREATION | Allows dump jobs to be created. If set to `false`, job operations of type `DUMP_FILE_CREATION_JOB_OPERATION` will not be created | `true`  | |
| ENABLE_HEALING_JOB_OPERATION | Allows healing jobs to be created. If set to `false`, job operations of type `HEALING_JOB_OPERATION` will not be created | `true`  | |

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## 🐸 Gotcha's

Some environment variables are commonly set in the `docker-compose.override.yml` file, and not in the regular `docker-compose.yml`. The most important one is `START_INITIAL_SYNC`. We do it this way to ensure that we have manual control over when the first initial sync will run, as it often depends on external factors (some migrations might have to run first, business approval...)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## 🧠 Advanced

The advanced section is used to go a bit more in depth. It explains possible config files, how to setup stuff, how to test, API's and other topics. The paragraph you are currently reading can be removed.

### 🛠️ Development

The following snippet can be added to your docker-compose.override.yml file.

 ```yaml
  delta-producer-background-jobs-initiator-some-theme:
    image: lblod/delta-producer-background-jobs-initiator:0.0.1
    environment:
      NODE_ENV: "development"
      START_INITIAL_SYNC: "true"
=======
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
As mentionned in [🐸 Gotcha's](#-🐸-gotcha's), we set `START_INITIAL_SYNC` in the override for extra safety.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

### API

This service has an API that is uniquely here for debugging purposes as it should be autonomous in the way it creates jobs. The API can be handy when developping a sync logic or to manually trigger a new healing / dump job, during a deploy for example if some configuration changed in the services implementing the jobs.

#### POST /dump-publication-graph-jobs

Create a new dump file creation job

##### Request body

N/A

##### Response

{ msg: 'Dump publication graph job ${jobUri} triggered' }

#### DELETE /dump-publication-graph-jobs

Deletes all dump file creation jobs in the db

##### Request body

N/A

##### Response

{ msg: 'Dump publication graph job cleaned' }

#### POST /healing-jobs

Create a new healing job

##### Request body

N/A

##### Response

{ msg: 'Healing job ${jobUri} triggered' }

#### DELETE /healing-jobs

Deletes all healing jobs in the db

##### Request body

N/A

##### Response

{ msg: 'Healing job cleaned' }


#### POST /initial-sync-jobs

Create a new initial sync job

##### Request body

N/A

##### Response

{ msg: 'Sync job started ${jobUri}' }

#### DELETE /initial-sync-jobs

Deletes all initial sync jobs in the db

##### Request body

N/A

##### Response

{ msg: 'Sync job cleaned ${jobs.map(j => j.jobUri).join(', ')}' }

<p align="right">(<a href="#readme-top">back to top</a>)</p>

### 🔬 Testing

#### Automatic flow

After setting up the service, you can following these steps to test if everthing works

1. Set `START_INITIAL_SYNC: "true"` in your `docker-compose.override.yml` configuration
2. `docker-compose up -d`
3. Check the logs `docker-compose logs --tail=100 -f my_service`. You should see a job and a task being inserted via two `INSERT DATA` queries in the logs, this is the initial sync being scheduled
4. Wait for the other service listening to this job creation to get triggered and to process it
5. Check that, when the cron pattern should trigger, logs mention that the service has been triggered and tries to create a new dump / healing job.

#### Manual trigger flow

To manually trigger the jobs creation, you can use the following method (the stack needs to be up):

1. `drc exec my_service bash`
2. `wget --post-data='' http://localhost/initial-sync-jobs` or `wget --post-data='' http://localhost/healing-jobs` or `wget --post-data='' http://localhost/dump-publication-graph-jobs`
3. Check the logs `docker-compose logs --tail=100 -f my_service`. You should see a job and a task being inserted via two `INSERT DATA` queries in the logs

<p align="right">(<a href="#readme-top">back to top</a>)</p>
=======
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
