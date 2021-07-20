# Welcome to the Sparkle Summit 21 Hackathon!

### Resources

- Repo & ReadMe (this doc) to get started coding
- [Hub Post](https://thehub.github.com/news/2021-07-01-summit-hackathon/) about the hackathon
- [Discussions](https://github.com/github/github/discussions/185794) to find & form teams & post potential ideas
- [#summit-hackathon](https://github-partners.slack.com/archives/C027DMM2ZPA) - staffed with Sparkle dev in case you have technical questions; if you’re wanting to connect your local dev setup to the hack.sparkle.space sandbox, the minimal set of ENV vars that should get you up and running is pinned in #summit-hackathon

# Sparkle Web App

Codebase for the Sparkle platform, brought to you by [Sparkle](https://sparklespaces.com/), a platform for the most immersive & interactive virtual events.

### Getting started

What you will need:

- A free Firebase account
- Your favorite command-line interface (e.g. Terminal or zsh on a Mac)
- Optional: accounts with Stripe, Twilio
- A little fairy dust

## Set Up Your Local Environment

### Step 1: Clone the Sparkle Repository

First, clone the repo and `cd` into it:

```bash
git clone https://github.com/sparkletown/sparkle
cd sparkle
```

### Step 2: Install Packages

Install the platform dependencies with `npm`:

**Important** `npm` v7+ is not supported, it will cause issues with our `package-lock.json`, and you may end up with the wrong dependency versions. Check your current npm version with `npm -v`.

```bash
npm install
```

### Step 3: Set up Firebase project

If you haven't followed through these steps before then you're going to need to set up a new Firebase environment and configure it. That process is a little longer than would fit comfortably in this README, so we split it out for you:

See [Firebase setup](docs/create-new-environment.md)

### Step 4: Start Your Engines

See [Start application](docs/getting-started.md)

**Note**: You might need to emulate the firebase functions locally before the server can properly start. If you have issues using/editing your actual deployed environment functions, try that.

### Step 5: Firebase Emulators

See [Firebase Emulators](docs/firebase-emulators.md)

---

## Part Three: Contribute to Sparkle

### Our Git Flow

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

Then, to deploy to `production`, a Sparkle team member will:

- create a PR to **merge staging into `master`** with a name such as **`deploy staging -> master`**
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

### Deploying

Deploys are handled by CircleCI.

- Merging to `staging` will deploy to staging
- Merging to `master` will deploy to production
- Pushing the `master` branch to any of our other configured production branches will deploy to that environment

---

## Part Four: Addenda

Sparkle is using Bugsnag! We are proud to be part of Bugsnag's open source program and are glad that Bugsnag supports open source.

[![Bugsnag Logo](https://avatars3.githubusercontent.com/u/1058895?s=200&v=4)](https://www.bugsnag.com)
