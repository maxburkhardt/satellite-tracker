import React from "react";
import ReactTable, { RowInfo } from "react-table";
import "react-table/react-table.css";
import ReactResizeDetector from "react-resize-detector";
import { SatellitePosition, SatellitePass } from "../util/SharedTypes";
import { HTMLSelect, FormGroup, Button } from "@blueprintjs/core";
import { Moment } from "moment";
import { radiansToDegrees, formatDate } from "../util/DisplayUtil";

export type Props = {
  satData: Array<SatellitePosition>;
  satPasses: { [key: string]: Array<SatellitePass> };
  requestedSelection: string;
  updateSatPassesCallback: (satellite: string) => void;
  viewPassDetailsCallback: (satellite: string, startTime: Moment) => void;
};

export type State = {
  selected: string;
  numRows: number;
};

class PassTable extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { numRows: 20, selected: "No satellites available." };
    this.handleChange = this.handleChange.bind(this);
    this.onResize = this.onResize.bind(this);
  }

  onResize(width: number, height: number) {
    this.setState({ numRows: Math.floor((height - 115) / 33) });
  }

  handleChange(event: React.SyntheticEvent) {
    const target = event.target as HTMLSelectElement;
    this.setState({ selected: target.value });
    this.props.updateSatPassesCallback(target.value);
  }

  componentDidMount() {
    if (this.props.satData.length > 0) {
      const firstSatName = this.props.satData[0].name;
      this.setState({ selected: firstSatName }, () =>
        this.props.updateSatPassesCallback(firstSatName)
      );
    }
  }

  componentDidUpdate(prevProps: Props) {
    if (
      prevProps.satData === null ||
      prevProps.satData.length !== this.props.satData.length
    ) {
      // If satData has been changed and thus autoselect may have changed, update the table to match what is currently selected
      if (this.props.satData.length > 0) {
        const firstSatName = this.props.satData[0].name;
        this.setState({ selected: firstSatName }, () =>
          this.props.updateSatPassesCallback(firstSatName)
        );
      }
    }

    // if a requested selection has been passed down that has a value, and isn't currently selected, then select that and update the data
    if (
      this.props.requestedSelection !== "" &&
      prevProps.requestedSelection !== this.props.requestedSelection &&
      this.props.requestedSelection !== this.state.selected
    ) {
      this.setState({ selected: this.props.requestedSelection });
      this.props.updateSatPassesCallback(this.props.requestedSelection);
    }
  }

  render() {
    const columns = [
      {
        Header: "AOS",
        id: "aos",
        accessor: (d: SatellitePass) => formatDate(d.aos)
      },
      {
        Header: "AOS Azimuth",
        id: "aosAzimuth",
        accessor: (d: SatellitePass) => radiansToDegrees(d.aosAzimuth)
      },
      {
        Header: "Max Elevation",
        id: "maxElevation",
        accessor: (d: SatellitePass) => radiansToDegrees(d.maxElevation)
      },
      {
        Header: "LOS",
        id: "los",
        accessor: (d: SatellitePass) => formatDate(d.los)
      },
      {
        Header: "LOS Azimuth",
        id: "losAzimuth",
        accessor: (d: SatellitePass) => radiansToDegrees(d.losAzimuth)
      },
      {
        Header: "Actions",
        filterable: false,
        Cell: (row: RowInfo) => (
          <Button
            small
            onClick={() =>
              this.props.viewPassDetailsCallback(
                this.state.selected,
                row.original.aos
              )
            }
          >
            See Details
          </Button>
        )
      }
    ];
    const satelliteOptions = this.props.satData.map(sat => (
      <option key={sat["name"]} value={sat["name"]}>
        {sat["name"]}
      </option>
    ));
    let data: Array<SatellitePass>;
    if (this.state.selected) {
      data = this.props.satPasses[this.state.selected];
    } else {
      data = [];
    }
    return (
      <div className="scroll-container">
        <ReactResizeDetector handleHeight onResize={this.onResize} />
        <FormGroup>
          <HTMLSelect value={this.state.selected} onChange={this.handleChange}>
            {satelliteOptions}
          </HTMLSelect>
        </FormGroup>
        <ReactTable
          data={data}
          columns={columns}
          pageSize={this.state.numRows}
        />
      </div>
    );
  }
}

export default PassTable;
