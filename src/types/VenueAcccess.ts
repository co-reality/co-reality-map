// @debt Should we add some kind of 'none'/'disabled' entry to VenueAccessMode?
// @debt Refactor VenueAccessMode to use lowercase, non-plural keys (but also figure how to backfill the database to account for this change first)
export enum VenueAccessMode {
  Emails = "Emails",
  Codes = "Codes",
  Password = "Password",
}

export type VenueAccessPassword = {
  password?: string;
};

export type VenueAccessCodes = {
  codes?: string[];
};

export type VenueAccessEmails = {
  emails?: string[];
};
