import styled from "styled-components";

export const Wrapper = styled.div`
  display: flex;
  height: 100%;
  padding: 0.5rem 0.5rem 2rem;
  flex-direction: column;
  position: sticky;
  top: 0;

  background-image: linear-gradient(141deg, #5a35ad 0%, #26144f 100%);
`;

export const InnerWrapper = styled.div`
  margin-top: 2rem;

  .nav-link {
    text-decoration: none;
    &.active {
      font-weight: bold;
    }
  }
`;
