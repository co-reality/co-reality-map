import React, { useState, useCallback, useEffect } from "react";
import { FieldError, useForm } from "react-hook-form";
import "firebase/functions";
import firebase from "firebase/app";

interface ImageInputProps {
  collectionPath: string;
  disabled: boolean;
  imageUrl?: string;
  image?: FileList;
  fieldName: string;
  register: ReturnType<typeof useForm>["register"];
  containerClassName?: string;
  imageClassName?: string;
  error?: FieldError;
  imageType: string;
  setValue: ReturnType<typeof useForm>["setValue"];
}

// eslint-disable-next-line
export const ImageCollectionInput: React.FC<ImageInputProps> = (props) => {
  const {
    imageUrl: imageUrlFromAPI,
    imageClassName,
    error,
    disabled,
    collectionPath,
    fieldName,
    register,
    imageType,
    setValue,
  } = props;

  // these functions should be non mutating
  const [imageCollection, setImageCollection] = useState<Array<string>>([]);
  const [fileInputKey, setFileInputKey] = useState(0);

  useEffect(() => {
    register(`${fieldName}File`);
  }, [register, fieldName]);

  useEffect(() => {
    const f = async () => {
      const storageRef = firebase.storage().ref();
      const list = await storageRef.child(collectionPath).listAll();
      const promises = list.items.map((item) => item.getDownloadURL());
      const urls: Array<string> = await Promise.all(promises);
      setImageCollection(urls);
    };
    f();
  }, [collectionPath]);

  const [selectedCollectionImageUrl, setSelectedCollectionImageUrl] = useState<
    string | undefined
  >(imageUrlFromAPI);
  const [imageFiles, setImageFiles] = useState<FileList>();
  const [imageUrlForPreview, setImageUrlForPreview] = useState<
    string | undefined
  >(imageUrlFromAPI);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setImageFiles(e.target.files ?? undefined);
      setSelectedCollectionImageUrl(undefined);
    },
    []
  );

  const handleSelectCollection = useCallback(
    (url: string) => () => {
      setSelectedCollectionImageUrl(url);
      setImageFiles(undefined);
      setFileInputKey((key) => key + 1);
    },
    []
  );

  // this keeps the component state synchronised with the parent form state
  useEffect(() => {
    if (selectedCollectionImageUrl) {
      setValue(`${fieldName}File`, undefined, false);
      setValue(`${fieldName}Url`, selectedCollectionImageUrl, false);
      setImageUrlForPreview(selectedCollectionImageUrl);
    } else if (imageFiles && imageFiles.length > 0) {
      setValue(`${fieldName}File`, imageFiles, false);
      setValue(`${fieldName}Url`, undefined, false);
      setImageUrlForPreview(URL.createObjectURL(imageFiles[0]));
    }
  }, [selectedCollectionImageUrl, imageFiles, setValue, fieldName]);

  return (
    <>
      <div style={{ marginTop: 10, fontSize: "16px" }}>
        {`Upload your own file`}
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <input
          // trick react to recreate the file input. This is so that when a default image is selected, the file inputs forgets about the previously uploaded file
          key={fileInputKey.toString()}
          name={`${fieldName}File`}
          style={{ flex: 1 }}
          disabled={disabled}
          type="file"
          onChange={handleFileChange}
          accept="image/png,image/x-png,image/gif,image/jpeg,image/webp"
          className="default-input"
          ref={register}
        />
        <div style={{ overflow: "hidden" }}>
          {imageUrlForPreview &&
            !imageCollection.find((url) => url === imageUrlForPreview) && (
              <img
                style={{ width: 200 }}
                className={`default-image ${imageClassName}`}
                src={imageUrlForPreview}
                alt="upload"
              />
            )}
        </div>
      </div>
      <input
        type="hidden"
        name={`${fieldName}Url`}
        ref={register}
        value={imageUrlForPreview}
      />
      {error?.message && <span className="input-error">{error.message}</span>}
      <div style={{ marginTop: 10, fontSize: "16px" }}>
        {`Or choose one of our popular ${imageType}`}
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "flex-start",
          flexWrap: "wrap",
          paddingBottom: 10,
          paddingLeft: 10,
        }}
      >
        {imageCollection.map((imageCollectionUrl) => (
          <div
            onClick={handleSelectCollection(imageCollectionUrl)}
            key={imageCollectionUrl}
            style={{
              marginRight: 10,
              marginTop: 10,
              borderStyle: "solid",
              borderWidth: 4,
              borderRadius: 10,
              overflow: "hidden",
              cursor: "pointer",
              borderColor:
                selectedCollectionImageUrl === imageCollectionUrl
                  ? "yellow"
                  : "white",
            }}
          >
            <img
              alt="imageCollectionUrl"
              src={imageCollectionUrl}
              style={{
                width: "90px",
                height: "90px",
              }}
            />
          </div>
        ))}
      </div>
    </>
  );
};
