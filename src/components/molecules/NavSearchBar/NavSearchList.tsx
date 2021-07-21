import React, { Key } from "react";
import { FixedSizeList } from "react-window";

import "./NavSearchList.scss";

import {
  NavSearchResultProps,
  NavSearchResult,
} from "./NavSearchResult";

// @debt refactor this into .scss or find more ergonomic component with same desired functionality as FixedSizeList
// values are used here due to quirks of the FixedSizeList component
// NOTE: keep in sync with the .scss files mentioned in comments
const propsFor = (length: number) => ({
  itemCount: length,
  itemSize: 48, // 2 * $search-result-padding--vertical + $search-result-image--size; @see navSearchBarConstants.scss
  height:
    length === 0
      ? 40 // $search-dropdown-height--empty; @see navSearchBarConstants.scss
      : Math.min(
          480, // $search-dropdown-height--max; @see NavSearchBar.scss
          48 * length // 2 * $search-result-padding--vertical + $search-result-image--size; @see navSearchBarConstants.scss
        ),
  width: "18.125rem", // $search-dropdown-width; @see navSearchBarConstants.scss
});

export type NavSearchListItem = NavSearchResultProps & { key: Key };

export interface NavSearchListProps {
  items?: NavSearchListItem[];
}

export const NavSearchList: React.FC<NavSearchListProps> = ({ items = [] }) => {
  const children = items.map(
    ({ key, ...props }) => <NavSearchResult key={key} {...props} />,
    [items]
  );

  return (
    <FixedSizeList
      className="NavSearchList NavSearchList__list"
      {...propsFor(items.length)}
    >
      {({ index, style }) => (
        <div
          style={style}
          key={items[index].key}
          className="NavSearchList__item"
        >
          {children[index]}
        </div>
      )}
    </FixedSizeList>
  );
};
