#!/usr/bin/env node -r esm -r ts-node/register

// @debt replace this with the below line when we require node 14+
//   https://nodejs.org/docs/latest-v14.x/api/fs.html#fs_promise_example
// import { readFile, writeFile } from "fs/promises";
import { promises as fsPromises } from "fs";
import puppeteer, { Page } from "puppeteer";

import { makeScriptUsage } from "../scripts/lib/helpers";

const { readFile, writeFile } = fsPromises;

// ---------------------------------------------------------
// Configuration (this is the bit you should edit)
// ---------------------------------------------------------

// Set to the dates one day before and one day after the day of reports to extract (MM/DD/YYYY)
const from = "10/05/2020";
const to = "10/08/2020";

// Zoom has a captcha, so save cookies to avoid logging in too many times.
// Set this to true to log in and save cookies.
// Set to false if cookies are already available.
const newLogin = false;

// The correct URL for accessing the reports is different for admin users who can
// access reports for all accounts under the zoom account. If you are trying to get
// reports from a standalone, non-admin user, set this to false.
const isAdmin = true;

// If the process crashes halfway through, set this to the page it was on to skip
// some pages - and hopefully avoid another crash.
const resumeFromPage = 1;

// If this is set, then the script will attempt to enable the 'Add tracking field to columns -> Event'
// column and then only download .csv reports that match the string defined here.
const desiredEventTrackingFieldValue: string | undefined = undefined;

// Login credentials (only needed if newLogin is true)
const username: string = "";
const password: string = "";

// ---------------------------------------------------------
// HERE THERE BE DRAGONS (edit below here at your own risk)
// ---------------------------------------------------------

const reportPageUrl = isAdmin
  ? `https://zoom.us/account/report/user?from=${from}&to=${to}`
  : `https://zoom.us/account/my/report?from=${from}&to=${to}`;

const loginEmailFieldSelector = "#login-form #email";
const loginPasswordFieldSelector = "#login-form #password";
const loginButtonSelector =
  "#login-form > .form-group > .controls > .signin > .btn";

const numberOfReportsTotalSelector = "#meetingList span[name=totalRecords]";
const addTrackingFieldToColumnsButtonSelector =
  "#meetingList #trackfieldDropdownMenu > button";
const addEventTrackingFieldColumnCheckboxSelector =
  "#meetingList #trackfieldDropdownMenu label[alt=Event] > input[type=checkbox]";
const nextPageLinkSelector =
  "#meetingList > .list-col > .dynamo_pagination > li:nth-child(2) > a";

const meetingListTableRowsSelector = "#meeting_list > tbody > tr";

const modalExportWithMeetingDataSelector =
  ".modal-dialog #contentDiv #withMeetingHeaderDiv input#withMeetingHeader";
const modalExportButtonSelector =
  ".modal-dialog #contentDiv button#btnExportParticipants";
const modalMeetingInfoSelector = ".modal-dialog #contentDiv #meetingInfo";

const COOKIES_PATH = "./cookies.json";

const CONFIRM_VALUE = "i-have-edited-the-script-config-and-am-sure";

const usage = makeScriptUsage({
  description:
    "Fetch zoom usage reports from the admin console using a headless Chrome browser via puppeteer",
  usageParams: CONFIRM_VALUE,
  exampleParams: CONFIRM_VALUE,
});

const [confirmationCheck] = process.argv.slice(2);
if (confirmationCheck !== CONFIRM_VALUE) {
  usage();
}

if (newLogin && username === "" && password === "") {
  console.error("Error: username/password are required when newLogin=true.");
  process.exit(1);
}

const keypress = async () => {
  process.stdin.setRawMode(true);
  return new Promise((resolve) =>
    process.stdin.once("data", (data) => {
      process.stdin.setRawMode(false);
      resolve(data);
    })
  );
};

const makeHandleLogin = (page: Page) => async (
  username: string,
  password: string
) => {
  // Enter email address
  await page.waitForSelector(loginEmailFieldSelector);
  await page.type(loginEmailFieldSelector, username);

  // Enter password
  await page.type(loginPasswordFieldSelector, password);

  // Click login
  await page.waitForSelector(loginButtonSelector);
  await page.click(loginButtonSelector);

  // Note: the user may have to solve a captcha at this point, so don't timeout while they are doing so
  await page.waitForNavigation({ timeout: 0 });
};

const makeGetNumberOfReportsTotal = (
  page: Page
) => async (): Promise<string> => {
  await page.waitForSelector(numberOfReportsTotalSelector, {
    visible: true,
  });

  const numberOfReportsTotal = await page.$eval(
    numberOfReportsTotalSelector,
    (el) => el.innerHTML
  );
  console.log(`Number of reports total: ${numberOfReportsTotal}`);

  return numberOfReportsTotal;
};

// Log in to zoom, and download all participants reports from the above selected dates.
(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  await page.setViewport({ width: 1400, height: 900 });

  // Setup our helpers
  const handleLogin = makeHandleLogin(page);
  const getNumberOfReportsTotal = makeGetNumberOfReportsTotal(page);

  const waitForVisibleSelector = async (selector: string) =>
    page.waitForSelector(selector, {
      visible: true,
    });

  const navigationPromise = page.waitForNavigation();

  if (!newLogin) {
    console.log("Loading cookies");
    const cookiesString = await readFile(COOKIES_PATH).then((buffer) =>
      buffer.toString()
    );

    const cookies = JSON.parse(cookiesString);
    await page.setCookie(...cookies);
  }

  console.log("Loading reports page");
  await page.goto(reportPageUrl);

  if (newLogin) {
    await handleLogin(username, password);
  }

  console.log("Press any key to continue...");
  await keypress();

  if (newLogin) {
    console.log("Saving cookies");
    const cookies = await page.cookies();
    await writeFile(COOKIES_PATH, JSON.stringify(cookies, null, 2));
  }

  console.log("Beginning export");

  await getNumberOfReportsTotal();

  let onLastPageAndExportedAll = false;
  let pageNum = 1;
  let reportsDownloaded = 0;
  while (!onLastPageAndExportedAll) {
    await page.waitForSelector(meetingListTableRowsSelector);

    const numberOfReportsOnPage = (await page.$$(meetingListTableRowsSelector))
      .length;
    console.log(
      `Number of reports on page ${pageNum}: ${numberOfReportsOnPage}`
    );

    await page.waitFor(2000);

    if (pageNum >= resumeFromPage) {
      let i = 1;
      let shouldDownloadCsv = true;

      if (desiredEventTrackingFieldValue) {
        // Click the 'Add tracking field to columns' button
        await waitForVisibleSelector(addTrackingFieldToColumnsButtonSelector);
        await page.click(addTrackingFieldToColumnsButtonSelector);

        // Select the 'Event' column
        await waitForVisibleSelector(
          addEventTrackingFieldColumnCheckboxSelector
        );
        await page.click(addEventTrackingFieldColumnCheckboxSelector);
      }

      while (i <= numberOfReportsOnPage) {
        console.log(`Page ${pageNum}: row ${i}...`);

        await waitForVisibleSelector(meetingListTableRowsSelector);

        if (desiredEventTrackingFieldValue) {
          // @debt use the id from the 'tracking field column checkbox' to match the correct td[data-column="XXX"] value
          const eventFieldColumnSelector = `#meeting_list > tbody > tr:nth-child(${i}) > td.trackfieldcol`;

          await waitForVisibleSelector(eventFieldColumnSelector);
          const event = await page.$eval(
            eventFieldColumnSelector,
            (el) => el.innerHTML
          );

          // Only download the CSV if the event matches what we want
          shouldDownloadCsv =
            event.trim() === desiredEventTrackingFieldValue.trim();

          console.log(
            "  Event:",
            event,
            `(matchesDesiredEventTrackingField=${shouldDownloadCsv})`
          );
        }

        if (shouldDownloadCsv) {
          console.log(`  Exporting report...`);

          // Click the download link on this row
          const participantsColumnLinkSelector = `#meeting_list > tbody > tr:nth-child(${i}) > .col6 > a`;
          await waitForVisibleSelector(participantsColumnLinkSelector);
          await page.click(participantsColumnLinkSelector);

          // Select the 'export with meeting data' checkbox on the modal
          await waitForVisibleSelector(modalExportWithMeetingDataSelector);
          await page.click(modalExportWithMeetingDataSelector);
          await waitForVisibleSelector(modalMeetingInfoSelector);

          // Click the export button
          await waitForVisibleSelector(modalExportButtonSelector);
          await page.click(modalExportButtonSelector);

          // ?Confirm the file download?
          await page.mouse.click(10, 10);

          await page.waitFor(1000);

          reportsDownloaded += 1;
        }

        i += 1;
      }
    }

    console.log("Moving on to next page...");

    await page.waitForSelector(nextPageLinkSelector);
    await page.click(nextPageLinkSelector);

    await navigationPromise;

    const nextButtonDisabled =
      (await page.$(
        "#meetingList > .list-col > .dynamo_pagination > li:nth-child(2).disabled > a"
      )) !== null;

    onLastPageAndExportedAll = nextButtonDisabled;

    if (onLastPageAndExportedAll) {
      console.log("Looks like that was the last page!");
    }

    pageNum += 1;
  }

  console.log("Reports Downloaded:", reportsDownloaded);

  console.log("Press any key to continue...");
  await keypress();

  await browser.close();
})()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => {
    console.log("Finished");
    process.exit(0);
  });
