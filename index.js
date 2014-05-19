var fs    = require('fs')
var int24 = require('int24')

var BASEDATE = new Date(2000,0,2)

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