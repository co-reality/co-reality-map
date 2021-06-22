import React, { useEffect, useRef, useState } from "react";
import { Provider, ReactReduxContext } from "react-redux";
import { AppConsumer, Container, Stage, useApp } from "@inlet/react-pixi";
import { AnimateMapVenue } from "types/venues";
import { useUser } from "hooks/useUser";
import { useSelector } from "hooks/useSelector";
import { animateMapStageOptionsSelector } from "utils/selectors";

import "./AnimateMap.scss";

import { MapContainer } from "./components/Map/MapContainer";
import { MAP_IMAGE } from "./constants/Resources";

export interface AnimateMapProps {
  venue: AnimateMapVenue;
}

export const AnimateMap: React.FC<AnimateMapProps> = () => {
  const options = useSelector(animateMapStageOptionsSelector);

  const containerRef = useRef<HTMLDivElement>(null);
  const { user, profile } = useUser();

  if (!user || !profile) {
    return <>Loading..</>;
  }

  const container = containerRef.current ?? null;

  return (
    <div ref={containerRef} className="AnimateMap">
      {container && (
        <ReactReduxContext.Consumer>
          {({ store }) => (
            <Stage
              width={container.offsetWidth}
              height={container.offsetHeight}
              options={{ ...options, resizeTo: container }}
              className="pixi-canvas AnimateMap__pixi-canvas"
            >
              <AppConsumer>
                {(app) => (
                  <Provider store={store}>
                    {app ? <LoadingContainer /> : <Container />}
                  </Provider>
                )}
              </AppConsumer>
            </Stage>
          )}
        </ReactReduxContext.Consumer>
      )}
    </div>
  );
};

const LoadingContainer = () => {
  const app = useApp();

  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isLoading || !app) return;

    setIsLoading(true);

    app.loader.reset().add(MAP_IMAGE).load();
    app.loader.onLoad.add(() => setIsLoaded(true));
    app.loader.onError.add(
      (loader: PIXI.Loader, resource: PIXI.LoaderResource) =>
        console.error(resource)
    );
  }, [isLoading, app]);

  if (!isLoaded) {
    return <Container />;
  }

  return <RootContainer />;
};

const RootContainer = () => {
  return <MapContainer />;
};
