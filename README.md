# Sparkle Web App

Codebase for the Sparkle Platform, brought to you by [Sparkle](https://sparklespaces.com/).

## Getting started

The instructions below assume you already have a Firebase project setup and configured appropriately.

**Note**: If you're interested in setting up the project to run in your own environment but you're not sure how to go about it, feel free to [open an issue](https://github.com/sparkletown/sparkle/issues/new) asking for assistance.

### Frontend

First, clone the repo and `cd` into it:

```bash
git clone https://github.com/sparkletown/sparkle
cd sparkle
```

In the main `sparkle` folder, copy `.env.example` to a new file `.env.local`, and fill it with the appropriate details.

You can read more about the various `.env` files that you can use at:

- https://create-react-app.dev/docs/adding-custom-environment-variables#adding-development-environment-variables-in-env

**Note:** Before you run the next steps, you will need to ensure you have access to the Firebase project you want to use. This access can be set up through the Firebase web UI. The following variables are required to be set up:

```bash
REACT_APP_PROJECT_ID=
REACT_APP_API_KEY=
REACT_APP_APP_ID=
REACT_APP_MEASUREMENT_ID=
```

Install the platform dependencies with `npm`:

(**Note:** `npm` v7+ is not supported, it will cause issues with our `package-lock.json`, and you may end up with the wrong dependency versions)

```bash
npm install
```

Now you're ready to start the server! ✨

```bash
npm start
```

Once the server is started, your web browser will be opened at http://localhost:3000 (and then it'll be immediately redirected to https://sparklespaces.com/). You can opt out of this by adding the following line to your `.env.local`:

```bash
BROWSER=none
```

To start using the app, navigate to a URL such as http://localhost:3000/v/{venueName} - replacing `{venueName}` with the existing venue you'd like to use.

While you generally won't need to do this while developing locally, you can manually build the platform assets as follows:

```bash
npm run build
```

### Firebase functions

**Note**: You might need to emulate the firebase functions locally before the server can properly start. If you have issues using/editing the actual staging functions, try that.

In a new terminal, from the directory you cloned the code to, enter the following commands:

```bash
# While not necessary (as we already include it in our devDependencies), you can install the firebase-tools globally if desired
# npm install -g firebase-tools@latest

# Move into the firebase functions directory
cd functions

# Install the function dependencies
npm install

# Go back to the root app directory to use firebase package
cd ..

# Login to firebase with the account that has access to this project
npm run firebase login

# Switch to the 'staging' project in our local configuration (or whichever environment you are developing against)
npm run firebase use staging

# Copy the runtime config locally
npm run --silent firebase functions:config:get > ./functions/.runtimeconfig.json
```

Now you're ready to launch the backend function emulator! ✨

```bash
# Run the command in the root app directory
npm run firebase:emulate-functions

# Or if you don't want to use our helper scripts, you can do this directly:
# npm run firebase emulators:start --only functions
```

### Firebase emulators

Instead of running just the functions' emulator, the full suite of emulators can be used.
You can find out more at https://firebase.google.com/docs/emulator-suite.

**Note**: If your code accidentally invokes non-emulated (production) resources, there is a chance of data change, usage and billing.
To prevent this, you might opt in to use a Firebase project name beginning with `demo-` (e.g. `demo-staging`) in which case no production resources will be used.

First though, a **major version of 8** for the Firebase client is required:
```bash
npm i firebase@8
```
This might entail some code changes as well, to enable the emulation, e.g.
```javascript
// Enable the functions emulator when running in development at specific port
if (process.env.NODE_ENV === "development" && window.location.port === "5000") {
  firebaseApp.firestore().useEmulator("localhost", 8080);
}
```
or to account for changed and/or deprecated Firebase client API, e.g.
```javascript
// deprecated
// import firebase, { UserInfo } from "firebase/app";
// use instead
import firebase from "firebase/app";
type UserInfo = firebase.UserInfo;
```

You can start the emulators in a manner that can persist the data locally:
```bash
npx --no-install -- firebase "emulators:start" --import=./tmp --export-on-exit
```

You should be greeted with
```bash
All emulators ready! View status and logs at http://localhost:4000
```
That's the location you can access and manage the running emulators.
The data between emulator runs should be persisted at
```bash
tmp/firebase-export-metadata.json
tmp/firestore_export
```

### Stripe

**Note**: Stripe is NOT REQUIRED unless you will be testing ticketing integration.

First, you need to install the [Stripe CLI](https://stripe.com/docs/stripe-cli).

If you use Homebrew, you can install it as follows:

```bash
brew install stripe/stripe-cli/stripe
```

Otherwise, follow the installation instructions at https://stripe.com/docs/stripe-cli#install

Make sure that you have a Stripe account setup and know the login credentials, then run the following commands (replacing `TODO-PROJECTID` with your actual Firebase project ID:

```bash
stripe login
stripe listen --forward-to http://localhost:5001/TODO-PROJECTID/us-central1/payment-webhooks
```

You should see

```
> Ready! Your webhook signing secret is {YOUR_LOCAL_SIGNING_SECRET_KEY} (^C to quit)
```

Copy this value and add it to the file `functions/secrets.js`.

```js
// functions/secrets.js
...
const STRIPE_ENDPOINT_KEY = `${YOUR_LOCAL_SIGNING_SECRET_KEY}`;
```

## Our Git flow

If you're new to Git / GitHub flows, then you may find these guides helpful:

- https://guides.github.com/introduction/git-handbook/
- https://guides.github.com/activities/forking/
- https://guides.github.com/introduction/flow/

To contribute to the code base, please follow these steps:

- fork the repository (note: Sparkle team skip this step)
- create a new branch from `staging`
- write your code
- create a pull request to merge your branch into `staging`
- wait for code review
- fix any review comments
- once the review has been finalised, a team member will **squash-merge** the PR into `staging`, which will trigger the CI to deploy the `staging` environment

Then, to deploy to `production`:

- (a Sparkle team member will) create a PR to **merge staging into `master`** with a name such as **`deploy staging -> master`**
- add the `🚀 deployment` label
- copy the commit messages (including the `#1234` PR they were made in) and paste it into the PR description after `Deploys:` (see [example](https://github.com/sparkletown/sparkle/pull/1355))
- **merge (not squash-merge)** this 'deployment PR' into `master`, this will trigger the CI system to deploy to the '[OG](https://www.dictionary.com/e/slang/og/) `production`' environment
- push the `master` branch to any other environment branches (eg. `env/foo`) to trigger the CI system to deploy those environments as well

> When adding a quick fix to production:
>
> - create a branch from master
> - code
> - create a pull request on master
> - create a branch from staging
> - cherry-pick the commit
> - create a pull request on staging

## Deploying

Deploys are handled by CircleCI.

- Merging to `staging` will deploy to staging
- Merging to `master` will deploy to production
- Pushing the `master` branch to any of our other configured production branches will deploy to that environment

## Obtaining email addresses from firebase

WARNING: Only email people with consent. Permission based marketing is the best way to grow your email list.

```
$ firebase auth:export --project co-reality-map auth.json
$ jq '.users[] | "\(.createdAt) \(.email)"' auth.json|awk '$2!="null\"" {print $0}'|sed -e 's/^"//' -e 's/"$//'|awk '{print $1"\t"$2}'|pbcopy
```

Paste into a google sheet. Leftmost column is the [UNIX timestamp](https://en.wikipedia.org/wiki/Unix_time) of the account creation. This can be converted easily:

1. Create a new column to the right of the timestamp
2. Use the formula: `=A4/86400000 + DATE(1970,1,1)`
3. Fill down to get all values
4. Sort by timestamp or the calculated, human date
5. Consider not adding any with a "+"
6. Be mindful this is PII (personally identifiable information) so handle it carefully and treat it as sensitive. It may be subject to the GDPR data privacy requirements in the EU and the CCPA privacy laws in California.
7. Share the Google sheet, ready to import the users into our other email lists.
8. Email the new folks, welcome them, and say thanks for coming to the party!

## Addenda

Sparkle is using Bugsnag! We are proud to be part of Bugsnag's open source program and are glad that Bugsnag supports open source.

[![Bugsnag Logo](https://avatars3.githubusercontent.com/u/1058895?s=200&v=4)](https://www.bugsnag.com)
