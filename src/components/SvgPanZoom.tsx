import { useWindowSize } from "@react-hook/window-size";
import { useEffect, useRef, useState } from "react";
import {
  ReactSVGPanZoom,
  TOOL_PAN,
  Tool,
  Value,
  fitToViewer,
} from "react-svg-pan-zoom";

const INITIAL_VALUE: any = {};

interface Props {
  svg: any;
}

export const SvgPanZoom: React.FC<Props> = (props) => {
  const [width, height] = useWindowSize();
  const ref = useRef<any>(null);
  const [tool, setTool] = useState<Tool>(TOOL_PAN);
  const [value, setValue] = useState<Value>(INITIAL_VALUE);

  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (initialized) {
      return;
    }

    // Wait until there is a valid value.
    if (
      !value.SVGWidth ||
      !value.SVGHeight ||
      !value.viewerWidth ||
      !value.viewerHeight
    ) {
      return;
    }

    var padding = 0.05;
    var scale = 1 - 2 * padding;

    var zoom = Math.min(
      scale * (value.viewerWidth / value.SVGWidth),
      scale * (value.viewerHeight / value.SVGHeight)
    );

    setValue(
      Object.assign({}, fitToViewer(value), {
        a: zoom,
        d: zoom,
        e: (value.viewerWidth - zoom * value.SVGWidth) / 2,
        f: padding * value.viewerHeight,
      })
    );

    setInitialized(true);
  }, [value]);

  return (
    <ReactSVGPanZoom
      width={width}
      height={height}
      ref={ref}
      tool={tool}
      onChangeTool={setTool}
      value={value}
      onChangeValue={setValue}
      toolbarProps={{
        position: "none",
        SVGAlignX: "center",
        SVGAlignY: "center",
      }}
      miniatureProps={{ position: "none", background: "", height: 0, width: 0 }}
      background="white"
    >
      {props.svg}
    </ReactSVGPanZoom>
  );
};
