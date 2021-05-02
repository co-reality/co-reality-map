import React from "react";

import "./Twitter.scss";

export const Twitter: React.FC = () => {
  const rulesURL = "https://api.twitter.com/2/tweets/search/stream/rules";
  // const streamURL =
  //   "https://api.twitter.com/2/tweets/search/stream?tweet.field=public_metrics&expansions=author_id";

  // const rules = [{ value: "giveaway" }];

  const TWITTER_TOKEN =
    "AAAAAAAAAAAAAAAAAAAAADE3OQEAAAAA%2Bw%2BR5YrALbtW5jEFWB3Fcm7k4x0%3DJTw8kejELP3Sh9DWq1fNgQ2CEt2Pg3SbQr078SYjInxK52ls8W";

  async function getRules() {
    const response = await fetch(rulesURL, {
      method: "GET",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        Authorization: `Bearer ${TWITTER_TOKEN}`,
        "Access-Control-Allow-Origin": "*",
      },
    });
    console.log(response);
  }

  return (
    <div className="venue-chat">
      <span onClick={() => getRules()}>Click me</span>

      <script async src="https://platform.twitter.com/widgets.js"></script>
    </div>
  );
};
