import React, { useEffect, useCallback, useState, useMemo } from "react";

import { getUsersEmails } from "api/auth";

import { User } from "types/User";

import { useWorldUsers } from "hooks/users";

import { WithId } from "utils/id";
import { downloadGeneratedCSVFileUsers } from "utils/csv";

import Form from "react-bootstrap/Form";

import { LoadingPage } from "components/molecules/LoadingPage/LoadingPage";

import "./VenueUsersReport.scss";
import { AdminUsersTableChart } from "components/molecules/AdminUserTableChart";

interface EmailInterface {
  email: string;
  uid: string;
}

export const VenueUsersReport: React.FC = () => {
  const { worldUsers } = useWorldUsers();

  const [headers, setHeaders] = useState<string[]>([]);
  const [headersSelected, setHeadersSelected] = useState<string[]>([]);
  const [customFieldValue, setCustomFieldValue] = useState("");
  const [emails, setEmails] = useState<EmailInterface[]>([]);

  const userIsComplete = useCallback((user: WithId<User>) => {
    return user.partyName && user.pictureUrl;
  }, []);

  const getUsersHeaders = useCallback(() => {
    const completeUser: WithId<User> = worldUsers.find((user) =>
      userIsComplete(user)
    ) ?? { id: "" };
    setHeaders(Object.keys(completeUser));
  }, [worldUsers, userIsComplete]);

  const getVenueUsersEmails = useCallback(async () => {
    setEmails(
      (await getUsersEmails(worldUsers.map((user) => user.id ?? ""))).data ?? []
    );
  }, [worldUsers]);

  useEffect(() => {
    getUsersHeaders();
    getVenueUsersEmails();
  }, [worldUsers, getUsersHeaders, getVenueUsersEmails]);

  const downloadCSV = useCallback(() => {
    downloadGeneratedCSVFileUsers(
      worldUsers.map((user) => {
        return {
          ...user,
          email: emails.find((email) => email.uid === user.id)?.email ?? "",
        };
      }),
      [...headersSelected, "email"]
    );
  }, [worldUsers, emails, headersSelected]);

  const updateSelectedHeaders = useCallback(
    (selected: string) => {
      if (headersSelected.includes(selected)) {
        headersSelected.splice(headersSelected.indexOf(selected), 1);
        setHeadersSelected([...headersSelected]);
      } else {
        setHeadersSelected([...headersSelected, selected]);
      }
    },
    [headersSelected]
  );

  const addCustomField = useCallback(() => {
    if (!headers.includes(customFieldValue)) {
      setHeaders([...headers, customFieldValue]);
    }
  }, [customFieldValue, headers]);

  const updateCustomFieldValue = useCallback((field: string) => {
    setCustomFieldValue(field);
  }, []);

  const getHeadersCheckBox = useMemo(() => {
    return headers.map((header) => (
      <div className="VenueUserReport__filter-box__headers__item" key={header}>
        <Form.Check
          type="switch"
          id={header}
          label={header}
          checked={headersSelected.includes(header)}
          onChange={() => updateSelectedHeaders(header)}
        />
      </div>
    ));
  }, [headers, headersSelected, updateSelectedHeaders]);

  if (!worldUsers) {
    return <LoadingPage />;
  }

  return (
    <div className="VenueUserReport">
      <h4>Users Reports</h4>
      <div className="VenueUserReport__filter-box">
        <div className="VenueUserReport__filter-box__headers">
          {getHeadersCheckBox}
        </div>
        <div className="VenueUserReport__filter-box__custom-field">
          <label>Add custom field:</label>
          <input
            className="VenueUserReport__filter-box__custom-field__input"
            onChange={(event) => updateCustomFieldValue(event.target.value)}
          />
          <button className="btn btn-primary" onClick={() => addCustomField()}>
            Add field
          </button>
        </div>
        <button
          className="btn btn-primary VenueUserReport__filter-box__download-btn"
          onClick={() => downloadCSV()}
        >
          Download
        </button>
      </div>
      <AdminUsersTableChart users={worldUsers} emails={emails} />
    </div>
  );
};
