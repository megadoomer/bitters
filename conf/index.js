/*jshint node:true, laxcomma: true, smarttabs: true*/
'use strict';
/**
 * Default configuration for logging
 * @module alice-log/conf
 * @author Eric Satterwhite
 * @since 0.1.0
 * @requires path
 * @requires os
 * @requires util
 */
var util = require('util')
  , path = require('path')
  , os   = require('os')
  ;

module.exports = {
    /**
     * @property {Object} [log]
     * @property {Object} [log.syslog]
     * @property {Object} [log.file] options for file logging transport
     * @property {Object} [log.file.label=alice ( `PID` )`HOST`] a prefix to tag each message with]
     * @property {String} [log.file.dir='.'] a path to a directory to store files
     * @property {String} [log.file.filename=alice ( `PID` )`HOST`]
     * @property {Boolean} [log.file.prettyPrint=false] true if to format json output
     * @property {String} [log.file.level='http'] the highest level of logs to record
     * @property {Boolean} [log.file.json=false] true to enable full object logging.
     * @property {Object} [log.stdout] Options for the stdout logger
     * @property {String} [log.stdout.label=alice ( `PID` )`HOST`] a prefix to tag each message with
     * @property {Boolean} [log.stdout.prettyPrint=true]
     * @property {Boolean} [log.stdout.colorize=true] true to colorize output
     * @property {Boolean} [log.stdout.exitOnError=false] true if the process should exit when an error is encountered
     * @property {Boolean} [log.stdout.timestamp=true] true to tag every log message with a timestamp
     * @property {String} [log.stdout.level="info"] The Highest loglevel to record
     **/
    log:{

        stdout:{
            label: util.format( "alice ( %s ) %s", os.hostname(), process.pid )
            , prettyPrint:true
            , colorize:true
            , exitOnError:false
            , timestamp:true
            , level:"info"
        }

        ,stderr:{
            label: util.format( "alice ( %s ) %s", os.hostname(), process.pid )
            , prettyPrint:true
            , colorize:true
            , handleExceptions: true
            , exitOnError:false
            , timestamp:true
            , level:"error"
            , json:false
        }

        ,syslog:{
             host:"localhost"
            ,port:undefined
            ,app:process.title || 'alice:log'
            ,identity:process.title || 'alice:log'
            ,protocol:'udp4'
            ,type:"BSD"
            ,facility:"local0"
        }


        ,file:{
            label: util.format( "alice ( %s ) %s", os.hostname(), process.pid )
            , dir:"."
            , filename: path.join( process.cwd(), 'alice.log' )
            , prettyPrint:false
            , level:"http"
            , json: false
            , options:{
                highWatermark:24
                ,flags:'a'
            }
        }
    }	
};
