import { Model } from "@esandstedt/stellaris-model";
import React, { createRef } from "react";
import { saveSvgAsPng } from "save-svg-as-png";
import { Button } from "semantic-ui-react";
import { render } from "./render";
import { SvgDraw, SvgDrawElement } from "./render/SvgDraw";

const SIZE = 2000;

interface Props {
  model: Model;
  onClose: () => void;
}

interface State {
  elements: SvgDrawElement[];
}

export class Renderer extends React.Component<Props, State> {
  private svgRef = createRef<SVGSVGElement>();

  constructor(props: Props) {
    super(props);

    const draw = new SvgDraw(SIZE, SIZE);
    render(props.model, draw, {});

    this.state = {
      elements: draw.elements,
    };
  }

  generate = () => {
    const { model } = this.props;
    const draw = new SvgDraw(SIZE, SIZE);
    const options = {};
    render(model, draw, options);
    this.setState({ elements: draw.elements });
  };

  download = () => {
    const element = this.svgRef.current;
    if (element) {
      saveSvgAsPng(element, "map.png");
    }
  };

  reset = () => {
    this.setState({ elements: [] });
  };

  render() {
    const { elements } = this.state;
    return (
      <React.Fragment>
        <div style={{ display: "flex" }}>
          <div style={{ flexGrow: 1 }} />
          {/*
          <Button className="blue" onClick={this.generate}>
            Render
          </Button>
          */}
          <Button disabled={elements.length === 0} onClick={this.download}>
            Download
          </Button>
          {/*
          <Button disabled={elements.length === 0} onClick={this.reset}>
            Reset
          </Button>
          */}
          <Button onClick={this.props.onClose}>Close</Button>
        </div>
        <svg ref={this.svgRef} viewBox={`0 0 ${SIZE} ${SIZE}`}>
          {elements.map((element, index) =>
            React.createElement(element.type, { key: index, ...element.props })
          )}
        </svg>
      </React.Fragment>
    );
  }
}
