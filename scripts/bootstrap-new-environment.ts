#!/usr/bin/env node -r esm -r ts-node/register -r tsconfig-paths/register -r ignore-styles

import { resolve } from "path";

// @debt We seemingly can't import these types currently because the module loader fails to find a transient dependency
//   Theoretically we could use https://github.com/dividab/tsconfig-paths to alias things, but when I tried that I ran into
//   other problems. The error I am seeing currently is:
//     Error: Cannot find module 'settings'
//
// import { PartyMapVenue, VenueTemplate } from "../src/types/venues";
//
// import { WithoutId } from "../src/utils/id";

import { AdminRole } from "../src/hooks/roles";

import { initFirebaseAdminApp, makeScriptUsage } from "./lib/helpers";

const usage = makeScriptUsage({
  description: "Bootstrap a newly created Sparkle Firebase environment.",
  usageParams: "PROJECT_ID [CREDENTIAL_PATH]",
  exampleParams: "my-new-environment [theMatchingAccountServiceKey.json]",
});

const [projectId, credentialPath] = process.argv.slice(2);

// Note: no need to check credentialPath here as initFirebaseAdmin defaults it when undefined
if (!projectId) {
  usage();
}

const app = initFirebaseAdminApp(projectId, {
  credentialPath: credentialPath
    ? resolve(__dirname, credentialPath)
    : undefined,
});

const adminRoleRef = app.firestore().collection("roles").doc("admin");
const adminRoleData: AdminRole = {
  allowAll: false,
  users: [],
};

const bootstrapVenueRef = app.firestore().collection("venues").doc("bootstrap");

// @debt We can't import these types currently due to the module loader issue described at the top of this file
// const bootstrapVenueData: WithoutId<PartyMapVenue> = {
//   template: VenueTemplate.partymap,
const bootstrapVenueData = {
  template: "partymap",
  name: "Bootstrap",
  host: {
    icon: "/sparkle-logo.png",
  },
  config: {
    landingPageConfig: {
      subtitle: "Simplifying your environment setup!",
      description: "For easily bootstrapping new environments",
      coverImageUrl: "/sparkle-header.png",
    },
    theme: {
      primaryColor: "#bc271a",
    },
  },
  owners: [],
};

app
  .firestore()
  .runTransaction(async (transaction) => {
    console.log(`Bootstrapping ${projectId} environment..`);

    console.log(`\nChecking if environment already bootstrapped..`);
    const [existingAdminRole, existingBootstrapVenue] = await Promise.all([
      transaction.get(adminRoleRef),
      transaction.get(bootstrapVenueRef),
    ]);
    console.log(
      `  roles collection + admin role exists : ${existingAdminRole.exists}`
    );
    console.log(
      `  bootstrap venue exists               : ${existingBootstrapVenue.exists}`
    );

    // Set up the roles collection + admin role in firestore
    console.log(
      `\nBootstrapping 'roles' collection + 'admin' role structure..`
    );
    if (!existingAdminRole.exists) {
      transaction.set(adminRoleRef, adminRoleData);
      console.log("  Done");
    } else {
      console.warn(`  'admin' role already exists, skipping..`);
    }

    // Create a minimal 'bootstrap' venue so we can create accounts and log in
    console.log(`\nCreating 'bootstrap' venue..`);
    if (!existingBootstrapVenue.exists) {
      transaction.set(bootstrapVenueRef, bootstrapVenueData);
      console.log("  Done");
    } else {
      console.warn(`  'bootstrap' venue already exists, skipping..`);
    }

    console.log("\nBootstrapping complete!");

    // Mention some other useful scripts that can be run next
    console.log("\nNext, you might want to try some of the following scripts:");
    console.log("  ./create-users.ts");
    console.log("  ./update-admin-role-users.ts");
    console.log("  ./clone-data-across-firebase-projects.ts");
    console.log("  ./clone-events-across-firebase-projects.ts");
    console.log("  ./configure-venue-access.ts");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
