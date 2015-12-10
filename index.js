var _ = require('lodash');

module.exports = function chatupRatelimiter(options) {
  if (!options) {options = {}}
  var redisPrefix = options.redisPrefix || 'chatup:ratelimiter';

  var levelIncreaseRules = options.levelIncreaseRules || [{messages: 15, time: 30}];
  var levels = options.levels || [30 * 1000, 2 * 60 * 1000, 10 * 60 * 1000, 30 * 60 * 1000];

  var maxRuleMessages = 0;
  for (var i = 0; i < levelIncreaseRules.length; i++) {
    if (maxRuleMessages < levelIncreaseRules[i].messages) {
      maxRuleMessages = levelIncreaseRules[i].messages;
    }
  }

  return function(ctx, next) {
    ctx.redisConnection.multi()
    .get(redisPrefix + ':l:' + ctx.user.name)
    .ttl(redisPrefix + ':l:' + ctx.user.name)
    .lrange(redisPrefix + ':m:' + ctx.user.name, 0, -1)
    .exec(function(err, results) {
      if (err) {
        console.error('Redis Error on RateLimiter plugin:', err);
        return next({status: 'err', error: 'internalError'});
      }

      var currentLevel = results[0] === null ? -1 : Number(results[0]);
      if (currentLevel !== -1 && results[1] > levels[results[0]]) { // If there is a level and its TTL is superior to the level time
        return next({status: 'err', error: 'rateLimited', ttw: results[1] - levels[currentLevel]}); // TTW = Time to wait
      }
      next(); // Can return now as we will always accept his message

      var lastMessages = results[2].map(number => parseInt(number));
      lastMessages.unshift(Date.now());
      var ruleExceeded = false;
      for (var i = 0; i < levelIncreaseRules.length; i++) { // Test each rule
        var elapsedTime = (lastMessages[0] - lastMessages[levelIncreaseRules[i].messages - 1]) / 1000;
        if (lastMessages.length >= levelIncreaseRules[i].messages && elapsedTime < levelIncreaseRules[i].time) {
          ruleExceeded = true;
        }
      }

      var nextLevel = _.min([currentLevel + 1, levels.length - 1]);
      var nextLevelTime = levels[nextLevel];
      var multi = ctx.redisConnection.multi();
      multi.lpush(redisPrefix + ':m:' + ctx.user.name, Date.now());
      multi.ltrim(redisPrefix + ':m:' + ctx.user.name, 0, maxRuleMessages - 1); // Add the messages to the list
      if (ruleExceeded) { // Increase the ban level if the user has exceeded a rule
        multi.set(redisPrefix + ':l:' + ctx.user.name, nextLevel);
        multi.expire(redisPrefix + ':l:' + ctx.user.name, nextLevelTime * 2);
      }
      multi.exec(function(err) {
        if (err) {
          console.error('Redis Error on RateLimiter plugin:', err);
        }
      });
    });
  }
}
