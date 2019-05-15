import React from "react";
import { SatellitePosition, LatLong } from "../util/SharedTypes";

export type Props = {
  userLocation: LatLong;
  satData: Array<SatellitePosition>;
};

class Radar extends React.Component<Props> {
  private radarUi: React.RefObject<HTMLCanvasElement>;
  private satellitesOnRadar: React.RefObject<HTMLCanvasElement>;
  constructor(props: Props) {
    super(props);
    this.drawRadarStructure = this.drawRadarStructure.bind(this);
    this.drawSatOnRadar = this.drawSatOnRadar.bind(this);
    this.clearRadar = this.clearRadar.bind(this);
    this.getOverhead = this.getOverhead.bind(this);
    this.radarUi = React.createRef();
    this.satellitesOnRadar = React.createRef();
  }

  // we assume the radar canvas is square
  // the size is half the width along one side
  drawRadarStructure() {
    if (this.radarUi.current) {
      const ctx = this.radarUi.current.getContext("2d");
      const size = this.radarUi.current.width / 2;

      if (ctx) {
        // outer circle
        ctx.beginPath();
        ctx.ellipse(size, size, size, size, 0, 0, 2 * Math.PI);
        ctx.stroke();

        // inner circle
        ctx.beginPath();
        ctx.ellipse(size, size, size / 2, size / 2, 0, 0, 2 * Math.PI);
        ctx.stroke();

        // cross-hatch
        ctx.beginPath();
        ctx.moveTo(2, size);
        ctx.lineTo(size * 2, size);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(size, 0);
        ctx.lineTo(size, size * 2);
        ctx.stroke();
      }
    }
  }

  drawSatOnRadar(sat: SatellitePosition) {
    if (this.satellitesOnRadar.current) {
      const radarSize = this.satellitesOnRadar.current.width / 2;
      const ctx = this.satellitesOnRadar.current.getContext("2d");
      if (ctx) {
        // r comes from the elevation of the satellite
        // elevation 0 is at the far ring, elevation 1 is right in the center
        const r = (1 - sat.elevation) * radarSize;
        // do polar conversion, and account for the fact that a canvas origin
        // in the top left
        const x = r * Math.cos(sat.azimuth - Math.PI / 2) + radarSize;
        const y = r * Math.sin(sat.azimuth - Math.PI / 2) + radarSize;

        ctx.fillRect(x, y, 6, 6);
        ctx.fillText(sat.name, x + 8, y);
      }
    }
  }

  clearRadar() {
    if (this.satellitesOnRadar.current) {
      const ctx = this.satellitesOnRadar.current.getContext("2d");
      if (ctx) {
        ctx.clearRect(
          0,
          0,
          this.satellitesOnRadar.current.width,
          this.satellitesOnRadar.current.height
        );
      }
    }
  }

  getOverhead() {
    const overhead = [];
    for (const sat of this.props.satData) {
      if (sat.elevation > 0) {
        overhead.push(sat);
      }
    }
    return overhead;
  }

  componentDidMount() {
    this.drawRadarStructure();
  }

  componentDidUpdate() {
    this.clearRadar();
    this.getOverhead().map(sat => this.drawSatOnRadar(sat));
  }

  render() {
    return (
      <div className="radarDiv">
        <canvas
          className="radarCanvas"
          ref={this.radarUi}
          width={300}
          height={300}
        />
        <canvas
          className="satellitesCanvas"
          ref={this.satellitesOnRadar}
          width={300}
          height={300}
        />
      </div>
    );
  }
}

export default Radar;
