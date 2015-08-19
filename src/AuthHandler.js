/**
 * Dependencies
 */
var EventEmitter = require('events').EventEmitter; 
var inherits = require('util').inherits;
var readline = require('readline');
var stream = require('stream');

/**
 * Module exports
 */
module.exports = AuthHandler;

/**
 * Constructor
 * @param {object} options
 */
function AuthHandler(options) {

  // Event emitter constructor
  EventEmitter.call(this);

  // Default options
  this.options = {
    input: process.stdin,
    output: process.stdout
  };

  // Handle input
  for (key in options) {
    if (typeof this.options[key] !== 'undefined') {
      if ( ! (options[key] instanceof stream.Stream)) {
        throw new Error('Expected stream.Stream instance for "' + key + '" option'); 
      }
      this.options[key] = options[key];
    }
  }

  // Init emitter
  this.init();
}
inherits(AuthHandler, EventEmitter);

/**
 * Inits auth handler
 */
AuthHandler.prototype.init = function() {

  var handler = this;

  // Init input stream
  handler.input = readline.createInterface({
    input: handler.options.input,
    terminal: false
  });

  // Init output stream
  handler.output = handler.options.output;

  var data = {
    date: new Date().toUTCString(),
    mountpoint: null,
    user: null,
    pass: null,
    agent: null,
    referer: null
  };

  handler.input.on('line', function(line) {
    parsed = handler.parseLine(line);
    if (parsed !== false) {

      // Decode urlencoded user agent
      if (parsed.key === 'agent' || parsed.key === 'referer') {
        parsed.value = decodeURIComponent(parsed.value);
      }

      data[parsed.key] = parsed.value;
      return;
    }

    // Do not accept any more input information
    handler.input.close();

    // Emit event after sync code is executed
    setImmediate(function(){

      handler.emit('connection', data);
    });
  });
}

/**
 * Parses given line.
 * @param {string} line
 * @return {object|false}
 */
AuthHandler.prototype.parseLine = function(line) {

  var pos = line.indexOf(':');

  // Bad line?
  if (pos === -1) {
    return false;
  }

  return {
    key: line.substring(0, pos).toLowerCase().trim(),
    value: line.substring(pos + 1, line.length).trim(),
  }
}

/**
 * Accepts connection. Listener will be moved to specific mount instead of requested one, if specified.
 * @param {string} mount
 */
AuthHandler.prototype.accept = function(mount) {
  if (typeof mount === 'string') {
    this.output.write('Mountpoint: ' + mount + '\n');
  }
  this.output.write('icecast-auth-user: 1\n\n');
};

/**
 * Requires client to perform basic auth
 */
AuthHandler.prototype.requireCredentials = function() {
  this.output.write('icecast-auth-message: 401 Unauthorized\n\n');
};

/**
 * Redirects client to specified url
 * @param {string} url
 */
AuthHandler.prototype.redirect = function(url) {
  this.output.write('Location: ' + url + '\n\n');
};

/**
 * Denies connection with 403 http status & custom message
 * @param {string} message
 */
AuthHandler.prototype.decline = function(message) {
  if (typeof message === 'undefined') {
    message = 'Forbidden';
  }
  this.output.write('icecast-auth-message: 403 ' + message + '\n\n');
};

