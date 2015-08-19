# Quickstart
[![Build Status](https://travis-ci.org/alvassin/nodejs-icecast-auth.svg)](https://travis-ci.org/alvassin/nodejs-icecast-auth)

Package uses [listener authentication mechanism](http://icecast.org/docs/icecast-2.4.1/auth.html) to provide handy interface for collecting [detailed connection data](#connection) and performing following actions with listeners:
* [Accept connection](#accept)
* [Accept & move listener to another mounpoint](#accept)
* [Decline connection](#decline)
* [Require credentials](#requirecredentials)
* [Redirect to given url](#redirect)

To start run `npm install icecast-auth` command, configure icecast to [enable listener authentication](#icecast-configuration) and create executable file with following content. It will log listener's information & accept connections:
```js
#!/usr/bin/nodejs
var fs = require('fs');
var AuthHandler = require('icecast-auth');

var handler = new AuthHandler();
handler.on('connection', function(data) {

  // Log data somewhere
  fs.appendFileSync('/tmp/icecast-auth.log', JSON.stringify(data, null, ' '));

  // Accept connection
  handler.accept();
});
```

# Events
#### connection
Is emitted when data parsing is finished (received empty line from icecast). Provides following parameters:

Parameter    | Type   | Description
-------------|--------|------------
`mountpoint` | String | Requested mount name
`user`       | String | Basic HTTP auth provided username
`pass`       | String | Basic HTTP auth povided password
`ip`         | String | Listener's ip address
`agent`      | String | Listener's user agent
`referer`    | String | Url, where listener came from

# Methods
#### accept
Accepts listener connection. Allows to specify mount, where user should be moved instead of requested one (icecast internal redirect will be used, HTTP redirect is not performed in this case).

Parameter | Type   | Required | Description
----------|--------|----------|------------
`mount`   | String | No       | Mount, where user should be moved

```js
// Accept user to requested mount
handler.on('connection', function(data) {
  handler.accept();
});

// Accept user to another mount
handler.on('connection', function(data) {
  handler.accept('/other-mount');
});
```

#### requireCredentials
Requires listener to perform basic HTTP authentication (401 HTTP request).
```js
// Only users with "user" login and "secret" password will be allowed to stream
handler.on('connection', function(data) {
  if (data.user !== 'user' && password !== 'secret') {
    handler.requireCredentials();
  } else {
    handler.accept();
  }
});
```

#### redirect
Performs HTTP redirect to specified url.

Parameter | Type   | Required | Description
----------|--------|----------|------------
`url`     | String | Yes      | Url, where listener should be redirected

```js
handler.on('connection', function(data) {
  handler.redirect('http://example.com/');
});
```

#### decline
Declines listener with 403 HTTP code. Custom message can be specified.

Parameter | Type   | Required | Description
----------|--------|----------|------------
`message` | String | No       | Message, that will be sent to user, defaults to `Forbidden`

```js
handler.on('connection', function(data) {
  handler.decline('You shall not pass!');
});
```

# Icecast configuration
To enable icecast listener command-script authentication it is necessary to add following code in `mount` section for required mounts in your icecast configuration file:
```xml
<authentication type="command">
  <option name="listener_add" value="/path/to/your/script.js"/> 
  <option name="handlers" value="1"/> 
</authentication>
```
It is also possible to add authentication handler using wildcards, but there is a trick: by default icecast executes authentication handler for all requests. To use authentication handler only for mountpoints use following snippet:
```xml
<mount>
  <mount-name>/*.xml</mount-name>
</mount>      
<mount>
  <mount-name>/*.xsl</mount-name>
</mount>        
<mount>
  <mount-name>/*.html</mount-name>
</mount>    
<mount>
  <mount-name>/*.css</mount-name>
</mount>    
<mount>
  <mount-name>/*.jpg</mount-name>
</mount>    
<mount>
  <mount-name>/*.png</mount-name>
</mount>    
<mount>
  <mount-name>/*.ico</mount-name>
</mount>    
<mount>
  <mount-name>/*.m3u</mount-name>
</mount>
<mount>
  <mount-name>/*</mount-name>
  <authentication type="command">
    <option name="listener_add" value="/path/to/your/script.js"/> 
    <option name="handlers" value="1"/> 
  </authentication>
</mount>   
```
