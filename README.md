# ChatUp Rate Limiter Plugin

A Chatup plugin to limit the number of messages a user can send and avoid spamming.

## How does it works

You declare rules in `X` messages per `Y` seconds. If the last `X` messages have been sent in less then `Y` seconds, the rule is exceeded and the banning level of the user is incremented.

The banning level are just increasing period of times. When a user is limited, he cannot send a message during the period of time `Z` specified by the level. After being unbanned, if he exceed a rule before `Z` seconds, his level is increased once again. If he doesn't break a rule after this time, his last level go back to -1.

You can specify as much rules and levels as you want.

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
