import { PixiComponent } from "@inlet/react-pixi";
import { MovedEventData, Viewport, ZoomedEventData } from "pixi-viewport";

type ViewportProps = {
  screenWidth?: number;
  screenHeight?: number;
  worldWidth: number;
  worldHeight: number;
  interaction?: PIXI.InteractionManager;
  zoomedHandler: (data: ZoomedEventData) => void;
  movedHandler: (data: MovedEventData) => void;
};

export default PixiComponent("Viewport", {
  create: (props: ViewportProps) => {
    const viewport = new Viewport({
      worldWidth: props.worldWidth,
      worldHeight: props.worldHeight,
      interaction: props.interaction,
    })
      .drag({ factor: 0.9 })
      .pinch()
      .wheel({ percent: 0.5, smooth: 10 })
      .decelerate()
      .clamp({
        left: true,
        right: true,
        top: true,
        bottom: true,
      })
      .clampZoom({
        maxWidth: props.worldWidth,
        maxHeight: props.worldHeight,
      });

    viewport.moveCenter(props.worldWidth / 2, props.worldHeight / 2);
    viewport.on("zoomed", props.zoomedHandler); //Note: how unsubscribe?
    viewport.on("moved", props.movedHandler); //Note: how unsubscribe?

    return viewport;
  },
});
