var stream = require('stream');
var util = require('util');

module.exports = FakeStream;

/**
 * Constructor
 */
function FakeStream () {
  stream.Writable.call(this);

  /**
   * Data storage
   * @var {string}
   */
  this.data = '';
};
util.inherits(FakeStream, stream.Writable);

/**
 * Saves data written to the stream.
 * @param chunk
 * @param encoding
 * @param {function} done
 */
FakeStream.prototype._write = function (chunk, encoding, done) {
  this.data += chunk.toString();
  done();
}

/**
 * Returns data, that was written to the stream
 * @return {string}
 */
FakeStream.prototype.getData = function () {
  return this.data;
}

/**
 * Clears stored data
 */
FakeStream.prototype.clearData = function () {
  this.data = '';
}
