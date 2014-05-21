var fs        = require('fs')
var int24     = require('int24')
var Transform = require('stream').Transform
var util      = require('util')

var BASEDATE = new Date(2000,0,2)

/**
 * Reads a BAK.KQ file and returns an array of records.
 * Works for small files. It will block and use a lot of memory for big files.
 * @param  {String}   filename
 * @return {Array}    records
 */
module.exports.readFileSync = function (filename) {
	var buffer = fs.readFileSync(filename)
	var n = int24.readUInt24BE(buffer,0)
	var result = []
	for (i=0;i<n;i++) {
		var OFFSET = 3+i*14
		result.push({
			unknown: [ buffer[OFFSET], buffer[OFFSET+1] ],
			userId:  int24.readUInt24BE(buffer, OFFSET+2),
			time:    new Date(BASEDATE.getTime()+buffer.readUInt32BE(OFFSET+5)*1000),
			type:    buffer.readUInt8(OFFSET+9),
			code:    buffer.readUInt8(OFFSET+10),
			jobId:   int24.readUInt24BE(buffer, OFFSET+11)
		})
	}
	return result
}

/**
 * Reads a BAK.KQ file and parses its contents.
 * If rowCallback is supplied, each row will sent to that callback.
 * If not supplied, it will send an Array to callback, but it is more expensive.
 * @param  {String}   filename
 * @param  {Function} rowCallback (Optional)
 * @param  {Function} callback
 */
module.exports.readFile = function (filename, rowCallback, endCallback) {
    if (typeof rowCallback !== 'function') throw new TypeError('Callback is required!')
    if (typeof endCallback !== 'function') {
        endCallback = rowCallback
        rowCallback = null
        var _data   = []
    }

    fs.createReadStream(filename)
    .pipe(Stream())
    .on('data', function(data) {
        if (!!rowCallback) rowCallback(data)
        else _data.push(data)
    })
    .on('end', function() {
        if (!!rowCallback) endCallback()
        else endCallback(_data)
    })
}

/* Stream 
 * ======
 */

module.exports.Stream = Stream
util.inherits(Stream, Transform)

function Stream (options) {
    if (this instanceof Stream === false) return new Stream(options)
    Transform.call(this)
    this._readableState.objectMode = true
    this._length = null
    this._buffer = Buffer(0)
}

Stream.prototype._transform = function (chunk, encoding, done) {

    this._buffer = Buffer.concat([ this._buffer, chunk ], this._buffer.length + chunk.length)
    
    // Read Header
    if (this._length === null) {
        if (this._buffer.length < 3) return done()
        this._length = int24.readUInt24BE(this._buffer, 0)
        this._buffer = this._buffer.slice(3)
        this.emit('header', this._length)
    }

    // Records
    var n = parseInt(this._buffer.length/14)
    for (i=0;i<n;i++) {
        var OFFSET = i*14
        var record = {
            unknown: [ this._buffer[OFFSET], this._buffer[OFFSET+1] ],
            userId:  int24.readUInt24BE(this._buffer, OFFSET+2),
            time:    new Date(BASEDATE.getTime()+this._buffer.readUInt32BE(OFFSET+5)*1000),
            type:    this._buffer.readUInt8(OFFSET+9),
            code:    this._buffer.readUInt8(OFFSET+10),
            jobId:   int24.readUInt24BE(this._buffer, OFFSET+11)
        }
        this.push(record)
    }

    done()
}
