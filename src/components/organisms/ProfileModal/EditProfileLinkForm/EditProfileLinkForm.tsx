import React, { useCallback, useMemo } from "react";
import { useForm } from "react-hook-form";
import * as Yup from "yup";

import { updateProfileLinks } from "api/profile";

import { ProfileLink, User } from "types/User";

import { WithId } from "utils/id";
import { isDefined } from "utils/types";

import { Button } from "components/atoms/Button";
import { InputField } from "components/atoms/InputField";

import { UserProfileMode } from "../ProfilePopoverContent";

import "./EditProfileLinkForm.scss";

export interface EditProfileLinkFormProps {
  edit?: boolean;
  user?: WithId<User>;
  profileLink?: ProfileLink;
  setUserProfileMode: (mode: UserProfileMode) => void;
}

export const EditProfileLinkForm: React.FC<EditProfileLinkFormProps> = ({
  edit = false,
  user,
  profileLink,
  setUserProfileMode,
}) => {
  const title = edit ? "Edit your profile link" : "Add a profile link";
  const saveButtonText = edit ? "Save changes" : "Add link";

  const validateUniqueTitle = useCallback(
    (checkTitle: string) => {
      if (checkTitle === profileLink?.title) return true;

      const isDuplicateTitle =
        user?.profileLinks?.find((link) => link.title === checkTitle) ?? false;

      return !isDuplicateTitle;
    },
    [profileLink, user?.profileLinks]
  );

  const validationSchema = useMemo(
    () =>
      Yup.object().shape<ProfileLink>({
        title: Yup.string()
          .required("Title is required")
          .test("unique title", "Title must be unique", validateUniqueTitle),
        url: Yup.string()
          .required("URL is required")
          .matches(/^https?:\/\/\w+/, "URL must be valid"),
      }),
    [validateUniqueTitle]
  );

  const { register, handleSubmit, errors } = useForm<ProfileLink>({
    validationSchema,
    mode: "onBlur",
    reValidateMode: "onChange",
  });

  const onSubmit = useCallback(
    async (profileLinkFormData: ProfileLink) => {
      if (!isDefined(user)) return;

      const newProfileLinks = [...(user.profileLinks ?? [])];
      const profileLinkToEdit = newProfileLinks.findIndex(
        (link) => link.title === profileLink?.title
      );

      if (profileLinkToEdit > -1) {
        newProfileLinks[profileLinkToEdit] = profileLinkFormData;
      } else {
        newProfileLinks.push(profileLinkFormData);
      }

      await updateProfileLinks({
        profileLinks: newProfileLinks,
        userId: user.id,
      });

      setUserProfileMode(UserProfileMode.DEFAULT);
    },
    [setUserProfileMode, user, profileLink]
  );

  const removeProfileLink = useCallback(async () => {
    if (!isDefined(user)) return;

    await updateProfileLinks({
      profileLinks:
        user.profileLinks?.filter(
          (userProfileLink) => userProfileLink.title !== profileLink?.title
        ) ?? [],
      userId: user.id,
    });

    setUserProfileMode(UserProfileMode.DEFAULT);
  }, [setUserProfileMode, profileLink?.title, user]);

  return (
    <div className="EditProfileLinkForm">
      <div className="EditProfileLinkForm__title">{title}</div>
      <form onSubmit={handleSubmit(onSubmit)}>
        <InputField
          name="title"
          containerClassName="EditProfileLinkForm__input-container"
          inputClassName="EditProfileLinkForm__input"
          type="text"
          autoComplete="off"
          placeholder="Link Title"
          error={errors.title}
          defaultValue={profileLink?.title}
          ref={register()}
        />

        <InputField
          name="url"
          containerClassName="EditProfileLinkForm__input-container"
          inputClassName="EditProfileLinkForm__input"
          type="text"
          autoComplete="off"
          placeholder="Link URL"
          error={errors.url}
          defaultValue={profileLink?.url}
          ref={register()}
        />

        <div className="EditProfileLinkForm__buttons">
          <Button
            customClass="EditProfileLinkForm__button EditProfileLinkForm__button--cancel"
            onClick={() => setUserProfileMode(UserProfileMode.DEFAULT)}
            type="reset"
          >
            Cancel
          </Button>
          {edit && (
            <Button
              customClass="EditProfileLinkForm__button EditProfileLinkForm__button--remove"
              onClick={removeProfileLink}
            >
              Remove Link
            </Button>
          )}
          <Button
            customClass="EditProfileLinkForm__button EditProfileLinkForm__button--save"
            type="submit"
          >
            {saveButtonText}
          </Button>
        </div>
      </form>
    </div>
  );
};
