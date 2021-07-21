var firebase = require("firebase/app");
require("firebase/auth");
require("firebase/firestore");
var read = require("read");

function usage() {
  console.log(`
${process.argv[1]}: Add an event to a venue

Specify the name, time, duration in minutes, description.

Usage: node ${process.argv[1]} API_KEY PROJECT_ID VENUE UTC_TIME DURATION_MINUTES NAME DESCRIPTION

Example: node ${process.argv[1]} aaazzz111222333 co-reality-map examplevenue 2020-08-01T19:00:00Z 180 "The Virtual Jazz Bar" "Join us in Virtual jazz bar on Saturday for three sets of fabulous jazz from the House band."
`);
  process.exit(1);
}

const argv = process.argv.slice(2);
if (argv.length < 7) {
  usage();
}
const apiKey = argv[0];
const projectId = argv[1];
const venueId = argv[2];
const start_utc_seconds = Date.parse(argv[3]) / 1000;
const duration_minutes = argv[4];
const name = argv[7];
const description = argv[8];

read({ prompt: "Username:" }, function (err, username) {
  if (err) {
    console.error("Error obtaining username:", err);
    process.exit(1);
  }
  read({ prompt: "Password:", silent: true }, function (err, password) {
    if (err) {
      console.error("Error obtaining password:", err);
      process.exit(1);
    }
    const firebaseConfig = {
      apiKey,
      projectId,
    };
    firebase.initializeApp(firebaseConfig);
    firebase
      .auth()
      .signInWithEmailAndPassword(username, password)
      .then(function () {
        const event = {
          name,
          descriptions: [description],
          start_utc_seconds,
          duration_minutes,
        };
        firebase
          .firestore()
          .doc(`venues/${venueId}`)
          .collection("events")
          .add(event)
          .catch(function (err) {
            console.error("Add event error:", err);
          });
      })
      .catch(function (err) {
        console.error("Login error:", err);
      });
  });
});
