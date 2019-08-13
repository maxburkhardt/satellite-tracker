import React from "react";
import { SatellitePosition, LatLong } from "../util/SharedTypes";
import ReactResizeDetector from "react-resize-detector";

export type Props = {
  userLocation: LatLong;
  satData: Array<SatellitePosition>;
  requestPassTableSelectionCallback: (sat: string) => void;
};

export type State = {
  width: number;
  height: number;
};

class Radar extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    // Initial values that will immediately get overwritten by the size detector
    this.state = {
      width: 0,
      height: 0
    };
    this.onResize = this.onResize.bind(this);
    this.getOverhead = this.getOverhead.bind(this);
  }

  onResize(width: number, height: number): void {
    this.setState({ width: width, height: height });
  }

  generateSatIcon(
    sat: SatellitePosition,
    xOffset: number,
    yOffset: number,
    radius: number
  ): JSX.Element {
    const elevationSpecificRadius = (1 - sat.elevation) * radius;
    const xPos =
      elevationSpecificRadius * Math.cos(sat.azimuth - Math.PI / 2) + xOffset;
    const yPos =
      elevationSpecificRadius * Math.sin(sat.azimuth - Math.PI / 2) + yOffset;
    const iconSize = 10;
    return (
      <g
        className="pointer"
        onClick={() => this.props.requestPassTableSelectionCallback(sat.name)}
        key={sat.name}
      >
        <rect
          x={xPos - iconSize / 2}
          y={yPos - iconSize / 2}
          height={iconSize}
          width={iconSize}
        />
        <text x={xPos + iconSize} y={yPos + 5} className="underline">
          {sat.name}
        </text>
      </g>
    );
  }

  getOverhead(): Array<SatellitePosition> {
    const overhead = [];
    for (const sat of this.props.satData) {
      if (sat.elevation > 0) {
        overhead.push(sat);
      }
    }
    return overhead;
  }

  render() {
    let radius = Math.min(this.state.width, this.state.height) / 2 - 10;
    if (radius <= 0) {
      // Sometimes radius is negative during load. Use a default in this case to avoid console errors.
      radius = 100;
    }
    const xCenter = this.state.width / 2;
    const yCenter = this.state.height / 2;
    const uiColor = "rgb(0,0,0)";
    const satellites = this.getOverhead().map(sat =>
      this.generateSatIcon(sat, xCenter, yCenter, radius)
    );
    return (
      <div className="radarDiv">
        <ReactResizeDetector
          handleHeight
          handleWidth
          onResize={this.onResize}
        />
        <svg className="radarSvg" xmlns="http://www.w3.org/2000/svg">
          <circle
            cx={xCenter}
            cy={yCenter}
            r={radius}
            fill="none"
            stroke={uiColor}
          />
          <circle
            cx={xCenter}
            cy={yCenter}
            r={radius / 2}
            fill="none"
            stroke={uiColor}
          />
          <line
            x1={xCenter - radius}
            y1={yCenter}
            x2={xCenter + radius}
            y2={yCenter}
            stroke={uiColor}
          />
          <line
            x1={xCenter}
            y1={yCenter - radius}
            x2={xCenter}
            y2={yCenter + radius}
            stroke={uiColor}
          />
          {satellites}
        </svg>
      </div>
    );
  }
}

export default Radar;
