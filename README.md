### anviz-backup-reader

Reads Anviz's Fingerprint Reader BAK.KQ backup files.

#### Install

`npm install anviz-backup-reader`

#### Usage

Sync/Async methods:
```js
var reader     = require('anviz-backup-reader')
var filename   = './BAK.KQ'

// Sync
var records = reader.readFileSync(filename)
console.log('Sync: ', records)

// Async
reader.readFile(filename, function(records) {
    console.log('Async: ', records)
})

// Async Row by Row. Prefered method for bigger files.
reader.readFile(filename, function(row) {
    console.log(row)
}, function() {
    console.log('END')
})
```

Read as Stream:
```js
var fs         = require('fs')
var reader     = require('anviz-backup-reader')
// WARN: JSONStream must be installed separately, it's not a dependency.
var JSONStream = require('JSONStream') 

// Stream
fs.createReadStream(filename)
.pipe(reader.Stream())
.pipe(JSONStream.stringify())
.pipe(process.stdout)
```

#### Comments

Not related to http://www.anviz.com/
