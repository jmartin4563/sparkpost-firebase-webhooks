# So I heard you like mudki... I mean... webhooks.
The first two sections are all you need to get Firebase to consume events from your SparkPost.com Webhook. If you want to go a few steps further with this integration, read further.

## Setting up Firebase
 * Create a Firebase account if you don't already have one (https://www.firebase.com/signup/)
 * Create a new Firebase app (https://www.firebase.com/account/#/)
 * Once your new app is created, click "Manage App" to go to your app's dashboard
 * The URL you're redirected to is your Firebase URL, copy this down somewhere

## Configuring your SparkPost Webhook
 * Create a SparkPost account if you don't already have one (https://app.sparkpost.com/sign-up)
 * Navigate to the "Accounts" section of the SparkPost app
 * Navigate to the "Webhooks" section of the SparkPost app
 * Click the "New Webhook" button
 * Enter in whatever name you'd like for the webhook
 * In the "Target" field, enter in your Firebase URL, followed by a name for the bucket you want to hold your events
   * For example: https://something.firebaseio.com/raw-events.json (the .json part is required, it tells Firebase that you want to use their REST API interface)
 * Click the "Add Webhook" button to save. If you see the green success bar at the top, you're ready to rock!

## Post-Processing your SparkPost events

## Querying your SparkPost events

## Securing your Firebase Data

## Docs and References
