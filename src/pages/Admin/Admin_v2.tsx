import React from "react";
import "firebase/storage";
import dayjs from "dayjs";
import advancedFormat from "dayjs/plugin/advancedFormat";

import { useOwnedVenues } from "hooks/useConnectOwnedVenues";
import { useUser } from "hooks/useUser";
import { useRoles } from "hooks/useRoles";
import { useIsAdminUser } from "hooks/roles";

import { AdminVenues } from "components/organisms/AdminVenues/AdminVenues";
import {
  AuthenticationModal,
  AuthOptions,
} from "components/organisms/AuthenticationModal";
import { LoadingPage } from "components/molecules/LoadingPage";

import "./Admin.scss";
import * as S from "./Admin.styles";

dayjs.extend(advancedFormat);

const Admin_v2: React.FC = () => {
  const { user } = useUser();

  const { ownedVenues, isLoading } = useOwnedVenues({});

  const { roles } = useRoles();

  const { isAdminUser } = useIsAdminUser(user?.uid);

  if (isLoading || !roles) {
    return <LoadingPage />;
  }

  if (!user) {
    return <>You need to log in first.</>;
  }

  if (!roles.includes("admin") || !isAdminUser) {
    return <>Forbidden</>;
  }

  return (
    <>
      <S.Wrapper className="no-venue-selected">
        <S.ViewWrapper>
          <AdminVenues venues={ownedVenues} />
        </S.ViewWrapper>
      </S.Wrapper>

      <AuthenticationModal
        show={!user}
        onHide={() => {}}
        showAuth={AuthOptions.login}
      />
    </>
  );
};

export default Admin_v2;
