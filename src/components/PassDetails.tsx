import React from "react";
import ReactTable from "react-table";
import "react-table/react-table.css";
import ReactResizeDetector from "react-resize-detector";
import { TimedSatellitePosition } from "../util/SharedTypes";
import { radiansToDegrees, formatDate } from "../util/DisplayUtil";

export type Props = {
  passData: Array<TimedSatellitePosition>;
};

export type State = {
  numRows: number;
};

class PassDetails extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { numRows: 20 };
    this.onResize = this.onResize.bind(this);
  }

  onResize() {}

  render() {
    const columns = [
      {
        Header: "Time",
        id: "time",
        accessor: (d: TimedSatellitePosition) => formatDate(d.time)
      },
      {
        Header: "Azimuth",
        id: "azimuth",
        accessor: (d: TimedSatellitePosition) =>
          radiansToDegrees(d.position.azimuth)
      },
      {
        Header: "Elevation",
        id: "elevation",
        accessor: (d: TimedSatellitePosition) =>
          radiansToDegrees(d.position.elevation)
      }
    ];
    return (
      <div className="scroll-container">
        <ReactResizeDetector handleHeight onResize={this.onResize} />
        Pass details for {this.props.passData[0].position.name} beginning at{" "}
        {formatDate(this.props.passData[0].time)}
        <ReactTable
          data={this.props.passData}
          columns={columns}
          pageSize={this.state.numRows}
        />
      </div>
    );
  }
}

export default PassDetails;
