var fs     = require('fs')
var reader = require('../index.js')
var JSONStream = require('JSONStream') // WARN: Must be installed separately, it's not a dependency.

var filename = './BAK.KQ'

// Sync
var records = reader.readFileSync(filename)
console.log('Sync: ', records)

// Async
reader.readFile(filename, function(records) {
    console.log('Async: ', records)
})

// Stream
fs.createReadStream(filename)
.pipe(reader.Stream())
.pipe(JSONStream.stringify())
.pipe(process.stdout)
