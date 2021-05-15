import styled from "styled-components";

interface WrapperProps {
  hasSelectedVenue?: boolean;
}

export const Wrapper = styled.div<WrapperProps>`
  display: grid;
  height: 100vh;
  grid-template-columns: auto;

  position: relative;
  scrollbar-width: thin;

  input:disabled {
    cursor: not-allowed;
    color: rgba(255, 255, 255, 0.3);
  }
`;

export const ViewWrapper = styled.div`
  padding: 2rem;
`;

export const ItemWrapper = styled.div`
  width: 80%;
  margin-bottom: 2rem;

  position: relative;
`;

export const ItemHeader = styled.header``;

export const TitleWrapper = styled.div`
  display: flex;
  width: 100%;
  align-items: center;

  &::before,
  &::after {
    content: "";
    background-color: ${(props) => props.theme.colors.white};
    height: 1px;
  }

  &::before {
    width: 3rem;
  }

  &::after {
    flex: 1;
  }
`;

export const ItemTitle = styled.h2`
  margin: 0 1rem;
`;

export const ItemSubtitle = styled.h3`
  margin: 1em 0;

  font-size: 1.2rem;
  font-weight: normal;
`;

export const ItemBody = styled.div`
  display: flex;
  margin: 1rem 0 0;
  align-items: center;
  justify-content: space-between;

  .form-group {
    flex: 1;
    margin-left: 5rem;
  }

  input[type="text"] {
    cursor: auto;
  }
`;
