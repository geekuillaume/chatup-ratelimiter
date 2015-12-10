# ChatUp Rate Limiter Plugin

A Chatup plugin to limit the number of messages a user can send and avoid spamming.

## Example

Start by installing `chatup-ratelimiter` npm module with `npm install --save chatup-ratelimiter`, then in your ChatUp worker file, do something like this:

```js
var conf = {}; // Your configuration
var worker = new ChatUp.ChatWorker(conf);

worker.registerMiddleware(require('chatup-ratelimiter')({
  redisPrefix: 'chatup:ratelimiter',
  levelIncreaseRules:[{
    messages: 15,
    time: 30
  }, {
    messages: 5,
    time: 5
  }],
  levels: [30, 2 * 60, 10 * 60, 30 * 60]
}));

worker.listen();
```
