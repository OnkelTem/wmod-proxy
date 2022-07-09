# Website Modification Proxy

![npm](https://img.shields.io/npm/v/wmod-proxy)

`wmod-proxy` is a simple javascript MITM HTTP/HTTPS proxy built with [Mockttp](https://github.com/httptoolkit/mockttp) toolkit.

It's used to inject scripts into existing websites. [Website Modification Script: Twitter](https://github.com/OnkelTem/wmod-script-twitter)
is an example of such a script. See its README for more details.

MITM stands for [man-in-the-middle](https://en.wikipedia.org/wiki/Man-in-the-middle_attack) cyberattack.
It's also a great opportunity to modify almost any existing website or web application in a big scale.

But what about browser extensions, you say, ain't they created for that purpose?

Well, they are. But after years of browser development, they have been finally rendered pretty limited
in their capabilities. They're executed in a separate process, and they can't effectively interfere
with a web app, they can't even read what the app receives via the network. But we could perfectly achieve that by _injecting_ a script into the page itself.

It's an experimental project and is still under active development.

## Install

```
$ npm i wmod-proxy
```

## Usage

To run the proxy on port 8000 and to start injecting scripts from `path/to/wmod`:

```
$ npx wmod-proxy 8000 path/to/wmod
```

It will look for `manifest.js` file, which describes the modification details.

## `Manifest.js`

Here is an example of Manifest-file, which can be found
[here](https://github.com/OnkelTem/wmod-proxy/blob/master/test/fixtures/example1/manifest.js):

```js
module.exports = {
  // Wmod name
  name: 'test',
  // Wmod version
  version: '0.0.1',
  // Wmod description
  description: 'Test1',
  // A list of available modification script groups i.e. "scripts"
  scripts: [
    {
      // A name of the script
      name: 'default',
      // A list of files of the script
      files: [
        {
          // A path to the file
          path: 'inject.js',
          // A boolean flag indicating, if this file should be injected.
          // F.e. source map files don't need an injection.
          inject: true,
        },
      ],
    },
  ],
  rules: [
    // A list of rules of response modifications: files injections,
    // connection abortions etc
    {
      // URL hostname to match
      hostname: 'twitter.com',
      // URL path to match
      path: /^\/(home|search)/,
      // What has to be done with the matched reponses
      action: {
        // A list of script names to apply for the rule
        scripts: ['default'],
      },
    },
    {
      hostname: 'ton.local.twitter.com',
      action: {
        // HTTP status code to send as a response
        response: 404,
      },
    },
  ],
};
```

## Plans

Currently, we can essentially inject only one script at a time. Thus, one obvious direction of development is to make it a script manager with its own script storage.
