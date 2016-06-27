## Bitters
A multi transport logging package for the hive platform. The logger can support any logger the implements the [winston](https://www.npmjs.org/package/winston) logging interface. Out of the box the logging package supports `file` transports for a log file that will get rotated every day, `stdout` which simply dumps all logs to the host computers stdout, and `syslog` which attempts to send logs to a running syslog server over udp.

### Configuration

Logging options are set using the hive conf package so you can set you logging options as you would everything else. You use the `--logger` or `-l` the flag can be passed mutliple times to specify multiple transports. There is always an exception transport called `stderr` in the config that will always write to stdout For example, if you wanted to log to syslog, but also get feedback from stdout:

```sh
node server.js --logger=stdout --logger=syslog
```

trasport specific configuration can be specified using the `log`:`<TRANSPORT>` prefix. For example you can disable the json formatting by passing the `prettyPrint` option a falsy value.


```sh
node server --logger=stdout --log:stdout:prettyPrint=0
node server --log:stderr:prettyPrint=1
```

#### Available Transports

 Name | Description |
:------:|-----------|
stdout | prints output to the current stdout |
syslog | sends logs to a syslog server over `UDP` |
file | Writes logs to a file that is rotated daily |
papertrail | Sends logs to a configured papertrail server |

### Logging

The logging package exports a fully configured winston interface that supports syslog logging levels. Each level is method on the interface that logs with the logging level, tag and logging level


```js
var logger = require('bitters')
logger.http('hello world')
logger.debug('hello world')
logger.info('hello world')
logger.notice('hello world')
logger.warning('hello world')
logger.error('hello world')
logger.crit('hello world')
logger.alert('hello world')
logger.emerg('hello world')
```

#### Formatting
The loggers suppport the same formatting options and Node's [util](http://nodejs.org/api/util.html#util_util_format_format) module.

```js
var logger = require('bitters');

logger.debug('Hi, %s, my name is %', "Bill", variable)
```

The last argument to any of the log method can be a serialiable object and it will be included in the log data in an appropriate format.

```js
var logger = require('bitters');

logger.debug("Dude, I just got some %s data", 'crazy', {key:'value'} )
```