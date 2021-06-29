import React, { useCallback, useMemo, useState } from "react";
import { useParams } from "react-router";
import { useAsyncFn } from "react-use";
import classNames from "classnames";

import { updateVenue_v2 } from "api/admin";

import { DEFAULT_MAP_BACKGROUND, DEFAULT_MAP_ICON_URL } from "settings";

import { Room, RoomData_v2, RoomType } from "types/rooms";
import { VenueTemplate } from "types/venues";

import { useUser } from "hooks/useUser";
import { useConnectCurrentVenueNG } from "hooks/useConnectCurrentVenueNG";

import { RoomsContainer } from "pages/Account/Venue/VenueMapEdition";

import "./AdminTemplates.scss";

export interface Template {
  title: string;
  description: string;
  background: string;
}

export interface Recipe {
  title: string;
  rooms: RoomData_v2[];
}

// @debt Populate all of these when product decides what the templates should look like
const templates: Template[] = [
  {
    title: "Template 1",
    description: "Description 1",
    background: DEFAULT_MAP_BACKGROUND,
  },
  {
    title: "Template 2",
    description: "Description 2",
    background: DEFAULT_MAP_BACKGROUND,
  },
  {
    title: "Template 3",
    description: "Description 3",
    background: DEFAULT_MAP_BACKGROUND,
  },
  {
    title: "Template 4",
    description: "Description 4",
    background: DEFAULT_MAP_BACKGROUND,
  },
];

const recipeRooms: RoomData_v2[] = [
  {
    type: RoomType.unclickable,
    template: VenueTemplate.jazzbar,
    isEnabled: true,
    url: window.location.host,
    title: "Jazzbar 1",
    image_url: DEFAULT_MAP_ICON_URL,
    x_percent: 10,
    y_percent: 10,
    width_percent: 21,
    height_percent: 20,
  },
  {
    type: RoomType.unclickable,
    isEnabled: true,
    url: window.location.host,
    title: "Room 1",
    description: "",
    image_url: DEFAULT_MAP_ICON_URL,
    x_percent: 40,
    y_percent: 30,
    width_percent: 20,
    height_percent: 20,
  },
];

// @debt Populate all of these when product decides rooms layout
const recipes: Recipe[] = [
  { title: "Recipe 1", rooms: recipeRooms },
  { title: "Recipe 2", rooms: [] },
  { title: "Recipe 3", rooms: [] },
  { title: "Blank Canvas", rooms: [] },
];

export const AdminTemplates: React.FC = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<Template>();
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe>(recipes[0]);

  const { user } = useUser();
  const { venueId } = useParams<{ venueId: string }>();
  const { currentVenue: venue } = useConnectCurrentVenueNG(venueId);

  const selectTemplate = useCallback((template: Template) => {
    setSelectedTemplate(template);
  }, []);

  const [{ loading: isLoading }, chooseTemplate] = useAsyncFn(async () => {
    if (!venue || !user) return;

    const venueInput = {
      name: venue.name,
      rooms: selectedRecipe.rooms,
    };

    await updateVenue_v2(venueInput, user)
      .then(() => {
        //TODO: Redirect
      })
      .catch(() => {
        //TODO: Handle error and UX
      });
  }, [selectedRecipe.rooms, user, venue]);

  const renderRecipes = useMemo(
    () =>
      recipes.map((recipe, index) => (
        <button
          key={`${recipe.title}-${index}`}
          onClick={() => setSelectedRecipe(recipe)}
          className={classNames("AdminTemplates__recipe", {
            "AdminTemplates__recipe--selected": recipe === selectedRecipe,
          })}
        >
          {recipe.title}
        </button>
      )),
    [selectedRecipe]
  );

  const renderTemplates = useMemo(
    () =>
      templates.map((template, index) => (
        <div
          key={`${template.title}-${index}`}
          className={classNames("AdminTemplates__template", {
            "AdminTemplates__template--disabled": isLoading,
          })}
          onClick={() => selectTemplate(template)}
        >
          <div
            style={{ backgroundImage: `url(${template.background})` }}
            className="AdminTemplates__template-background"
          />
          <div className="AdminTemplates__template-title">{template.title}</div>
          <div className="AdminTemplates__template-description">
            {template.description}
          </div>
        </div>
      )),
    [isLoading, selectTemplate]
  );

  return (
    <div className="AdminTemplates">
      {selectedTemplate && (
        <>
          <div className="AdminTemplates__nav-buttons">
            <button
              className="AdminTemplates__nav-buttons--cancel"
              onClick={() => setSelectedTemplate(undefined)}
            >
              Back to the templates
            </button>
            <button
              className="AdminTemplates__nav-buttons--confirm"
              onClick={chooseTemplate}
            >
              Choose this template
            </button>
          </div>

          <div className="AdminTemplates__title">{selectedTemplate.title}</div>
          <div className="AdminTemplates__subtitle">
            {selectedTemplate.description}
          </div>

          <div className="AdminTemplates__recipes">{renderRecipes}</div>

          <div className="AdminTemplates__template-preview">
            <RoomsContainer
              rooms={selectedRecipe.rooms as Room[]}
              iconsMap={{}}
              coordinatesBoundary={{ width: 60, height: 60 }}
              interactive={false}
              resizable={true}
              backgroundImage={selectedTemplate.background}
            />
          </div>
        </>
      )}
      {!selectedTemplate && (
        <>
          <div className="AdminTemplates__title">Choose a Template</div>
          <div className="AdminTemplates__subtitle">
            You can edit it during the next steps
          </div>
          <button
            disabled={isLoading}
            className={classNames("AdminTemplates__header-button", {
              "AdminTemplates__header-button--disabled": isLoading,
            })}
          >
            {`I'd rather start from scratch`}
          </button>

          <div className="AdminTemplates__templates-section">
            {renderTemplates}
          </div>
        </>
      )}
    </div>
  );
};
