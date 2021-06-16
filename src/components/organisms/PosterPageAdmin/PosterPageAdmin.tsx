import React, { useState } from "react";

import firebase from "firebase/app";

import { AnyVenue } from "types/venues";
import { UserInfo } from "firebase/app";

import "./PosterPageAdmin.scss";

interface PosterPageAdminProps {
  user: UserInfo;
  venueId?: string;
  venue: AnyVenue;
}

// @debt This component is almost exactly the same as IframeAdmin, we should refactor them both to use the same generic base component
//   BannerAdmin is the 'canonical example' to follow when we do this
export const PosterPageAdmin: React.FC<PosterPageAdminProps> = ({
  user,
  venueId,
  venue,
}) => {
  //const pdfPath = 'posters/'+user.uid+'/'+venueId+".pdf";
  const pdfPath = "posters/" + venueId + ".pdf";

  const [url, setUrl] = useState<string>();
  function findURL() {
    const storageRef = firebase.storage().ref();
    const pdfRef = storageRef.child(pdfPath);
    pdfRef.getDownloadURL().then(setUrl).catch(console.error);
  }

  findURL();

  //const url = firebase.storage().refFromURL('gs://posters/poster1042.pdf');
  //console.log("path", url);

  //const [error, setError] = useState<string | null>();
  const [pdfFile, setPdfFile] = useState<File>();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    setPdfFile(e.target.files[0]);
  };

  const [uploading, setUploading] = useState<boolean>();
  const savePDF = () => {
    if (!pdfFile) return;

    const storageRef = firebase.storage().ref();
    const metadata = {
      customMetadata: {
        owners: venue.owners.join(), //can't store array
      },
    };

    setUploading(true);
    storageRef
      .child(pdfPath)
      .put(pdfFile, metadata)
      .then((snapshot) => {
        setUploading(false);
        findURL();
      })
      .catch((err) => {
        setUploading(false);
        console.error(err);
      });
  };

  return (
    <div className="container">
      <div className="ppa">
        <span className="ppa-header">PDF</span>
        <input
          type="file"
          accept="application/pdf"
          onChange={handleFileChange}
        />
        {url && <iframe title="pdf-preview" src={url} />}
        {uploading ? (
          <span className="ppa-submit">Uploading..</span>
        ) : (
          <button
            className="btn btn-primary ppa-submit"
            type="button"
            onClick={savePDF}
          >
            Upload PDF
          </button>
        )}
        <br className="clear" />
      </div>
    </div>
  );
};
