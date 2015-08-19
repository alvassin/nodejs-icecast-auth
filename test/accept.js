
var assert = require('assert');
var AuthHandler = require(__dirname + '/../index');
var FakeStream = require(__dirname + '/FakeStream');
var fs = require('fs');

describe('AuthHandler', function() {

  /**
   * Test connection event
   */
  describe('connection', function () {
    it('should emit connection event', function (done) {

      var handler = new AuthHandler({
        input: fs.createReadStream(__dirname + '/input.txt'),
        output: new FakeStream()
      });

      var errTimeout = setTimeout(function () {
        assert(false, 'Event never fired');
      }, 1000)

      handler.on('connection', function(data) {
        clearTimeout(errTimeout);

        assert.strictEqual(data.mountpoint, '/test.mp3', 'Mountpoint does not match');
        assert.strictEqual(data.user, '', 'User does not match');
        assert.strictEqual(data.pass, '', 'Pass does not match');
        assert.strictEqual(data.ip, '127.0.0.1', 'Mountpoint does not match');
        assert.strictEqual(data.agent, 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_4) AppleWebKit/537.36 (KHTML, like Gecko) Cf44.0.2403.125 Safari/537.36', 'Mountpoint does not match');
        assert.strictEqual(data.referer, 'http://example.com', 'Referer does not match');

        done();
      });

    });
  });

  /**
   * AuthHandler.accept
   */
  describe('#accept()', function () {
    it('should accept listener connection', function () {

      var fakeStream = new FakeStream();
      var handler = new AuthHandler({
        input: fs.createReadStream(__dirname + '/input.txt'),
        output: fakeStream
      });

      // Accept to requested mount
      handler.accept();
      assert.equal(fakeStream.getData(), 'icecast-auth-user: 1\n\n');
      fakeStream.clearData();

      // Accept to specified mount
      handler.accept('/other');
      assert.equal(fakeStream.getData(), 'Mountpoint: /other\nicecast-auth-user: 1\n\n');
    });
  });

  /**
   * AuthHandler.requireCredentials
   */
  describe('#requireCredentials', function () {
    it('should respond with 401 HTTP header', function () {

      var fakeStream = new FakeStream();
      var handler = new AuthHandler({
        input: fs.createReadStream(__dirname + '/input.txt'),
        output: fakeStream
      });

      handler.requireCredentials();
      assert.equal(fakeStream.getData(), 'icecast-auth-message: 401 Unauthorized\n\n');

    });
  });

  /**
   * AuthHandler.redirect
   */
  describe('#redirect', function () {
    it('should respond with Location HTTP header', function () {

      var fakeStream = new FakeStream();
      var handler = new AuthHandler({
        input: fs.createReadStream(__dirname + '/input.txt'),
        output: fakeStream
      });

      var url = 'http://example.com';
      handler.redirect(url);
      assert.equal(fakeStream.getData(), 'Location: ' + url + '\n\n');
    });
  });

  /**
   * AuthHandler.decline
   */
  describe('#decline', function () {
    it('should respond with 403 HTTP header', function () {

      var fakeStream = new FakeStream();
      var handler = new AuthHandler({
        input: fs.createReadStream(__dirname + '/input.txt'),
        output: fakeStream
      });

      handler.decline();
      assert.equal(fakeStream.getData(), 'icecast-auth-message: 403 Forbidden\n\n');
      fakeStream.clearData();

      var message = 'You shall not pass';
      handler.decline(message);
      assert.equal(fakeStream.getData(), 'icecast-auth-message: 403 ' + message + '\n\n');
    });
  });
});
