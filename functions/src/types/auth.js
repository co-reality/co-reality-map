const yup = require("yup");

// TODO: should we nest these different subsets of keys?
const AuthConfigSchema = yup.object().shape({
  // OAuth
  clientId: yup.string().required(),
  clientSecret: yup.string().required(),
  tokenHost: yup.string().required(),
  tokenPath: yup.string(),
  revokePath: yup.string(),
  authorizeHost: yup.string(),
  authorizePath: yup.string(),

  // I4A
  // @debt This is required for the current I4A implementation, but in future we should refactor this schema be more generic
  i4aApiKey: yup.string().required(),
  i4aOAuthUserInfoUrl: yup.string().required(),
  i4aGetUserMeetingInfoUrl: yup.string().required(),
});

exports.AuthConfigSchema = AuthConfigSchema;