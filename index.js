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
		result.push(_parseRow(buffer, OFFSET))
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
        var record = _parseRow(this._buffer, OFFSET)
        this.push(record)
    }

    done()
}

function _parseRow (buffer, OFFSET) {
    var row = {}
    //row.unknown = [ buffer[OFFSET], buffer[OFFSET+1] ]
    row.userId  = int24.readUInt24BE(buffer, OFFSET+2)
    row.time    = new Date(BASEDATE.getTime()+buffer.readUInt32BE(OFFSET+5)*1000)

    row.code    = buffer.readUInt8(OFFSET+10)
    if      (row.code === 0) row.code = 'IN'
    else if (row.code === 1) row.code = 'OUT'
    else if (row.code === 2) row.code = 'BREAK'

    row.type    = buffer.readUInt8(OFFSET+9)
    if      (row.type === 1) row.type = 'FINGER 1'
    else if (row.type === 2) row.type = 'FINGER 2'
    else if (row.type === 4) row.type = 'PASSWORD'

    row.jobId   = int24.readUInt24BE(buffer, OFFSET+11)

    return row
}
