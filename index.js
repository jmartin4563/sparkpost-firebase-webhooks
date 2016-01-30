var Firebase = require('firebase')
  , db = new Firebase('https://jmartin-webhook.firebaseio.com/events')
  , _ = require('lodash')
  , actionableEventTypes = ['list_unsubscribe', 'link_unsubscribe', 'spam_complaint', 'bounce']
  , moneyMakerEventTypes = ['open', 'click']
  , hardBounceClasses = [10, 30, 90];

function processEventBatch(batch) {
  batch.forEach(function(event) {
    var eventGrouping = _.keys(event.msys)[0]
      , eventType = event.msys[eventGrouping].type;

    // Processing for events which would lead to you cleaning up your recipient lists (ie unsubscribes)
    if (_.includes(actionableEventTypes, eventType)) {
      if (eventType === 'bounce') {
        var bounceClass = event.msys[eventGrouping].bounce_class;
        if (_.includes(hardBounceClasses, bounceClass)) {
          console.log('🔥 🔥 🔥  Received ' + eventType + ' event from SparkPost!');
        }
      } else {
        console.log('🔥 🔥 🔥  Received ' + eventType + ' event from SparkPost!');
      }
    }

    // Processing for events which lead to revenue (ie opens and clicks)
    if (_.includes(moneyMakerEventTypes, eventType)) {
      console.log('💰 💰 💰  Received ' + eventType + ' event from SparkPost!');
    }
  });
};


console.log('Authenticating with Firebase instance...');
db.authWithCustomToken('Yx3r9poJxGazcQse9v82rPJyYweG90N1Yj5uSx9G', function(err, res) {
  if (err) {
    console.error('Unable to authenticate with Firebase:', err);
  } else {
    // Read from our backup on startup
    db.once('value', function(rawEvents) {
      console.log('Reading batches that came in while we were down...');

      _.forOwn(rawEvents.val(), function(batch, key) {
        processEventBatch(batch);
        db.child(key).remove();
      });

      console.log('Finished replaying events, listening for new batches...');
    });

    // Listen for any new events to come in
    db.on('child_added', function(rawEvents) {
      processEventBatch(rawEvents.val());
      db.child(rawEvents.key()).remove();
    });
  }
});
