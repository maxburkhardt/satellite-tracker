import React from "react";
import ReactTable from "react-table";
import "react-table/react-table.css";
import ReactResizeDetector from "react-resize-detector";
import { TimedSatellitePosition, LatLong } from "../util/SharedTypes";
import { radiansToDegrees, formatDate } from "../util/DisplayUtil";
import { Text } from "@blueprintjs/core";
import moment from "moment";

export type Props = {
  passData: Array<TimedSatellitePosition>;
  userLocation: LatLong;
};

export type State = {
  numRows: number;
};

class PassDetails extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { numRows: 5 };
    this.onResize = this.onResize.bind(this);
  }

  onResize(width: number, height: number) {
    this.setState({ numRows: Math.floor((height - 140) / 33) });
  }

  render() {
    const columns = [
      {
        Header: "Time",
        id: "time",
        accessor: (d: TimedSatellitePosition) => formatDate(moment(d.time))
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
        <div className="padded">
          <Text>
            Pass details for {this.props.passData[0].position.name} beginning at{" "}
            {formatDate(moment(this.props.passData[0].time))} for observer at
            latitude {this.props.userLocation.latitude}, longitude{" "}
            {this.props.userLocation.longitude}
          </Text>
        </div>
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
