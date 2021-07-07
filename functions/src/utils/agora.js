const functions = require("firebase-functions");

const { RtcTokenBuilder, RtcRole } = require("agora-access-token");

const AGORA_CONFIG = functions.config().agora;

const appId = AGORA_CONFIG.app_id;
const appCertificate = AGORA_CONFIG.app_certificate;

// @debt should we move this into AGORA_CONFIG, or maybe venue config in firestore or similar?
const expirationTimeInSeconds = 3600;

const getExpirationTime = () => {
  const currentTimestamp = Math.floor(Date.now() / 1000);

  return currentTimestamp + expirationTimeInSeconds;
};

const generateAgoraTokenForAccount = ({ channelName, account, role }) => {
  // @debt we should enforce a stricter security requirement on channelName. Maybe use UUIDs?
  if (typeof channelName !== "string" && channelName.length <= 0)
    throw new Error("channelName must be a string");

  if (typeof account !== "string" && account.length <= 0)
    throw new Error("account must be a string");

  if (![RtcRole.PUBLISHER, RtcRole.SUBSCRIBER].includes(role))
    throw new Error("role must be a valid value from the RtcRole enum");

  const token = RtcTokenBuilder.buildTokenWithAccount(
    appId,
    appCertificate,
    channelName,
    account,
    role,
    getExpirationTime()
  );

  return { appId, token };
};

exports.getExpirationTime = getExpirationTime;
exports.generateAgoraTokenForAccount = generateAgoraTokenForAccount;
exports.RtcRole = RtcRole;
