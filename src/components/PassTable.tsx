import React from "react";
import ReactTable from "react-table";
import "react-table/react-table.css";
import { SatellitePosition, SatellitePass } from "../util/SharedTypes";

export type Props = {
  satData: Array<SatellitePosition>;
  satPasses: { [key: string]: Array<SatellitePass> };
  updateSatPassesCallback: (satellite: string) => void;
};

export type State = {
  selected?: string;
};

class PassTable extends React.Component<Props, State> {
  private satSelector: React.RefObject<HTMLSelectElement>;
  constructor(props: Props) {
    super(props);
    this.state = {};
    this.handleChange = this.handleChange.bind(this);
    this.satSelector = React.createRef();
  }

  handleChange(event: React.SyntheticEvent) {
    const target = event.target as HTMLSelectElement;
    this.setState({ selected: target.value });
    this.props.updateSatPassesCallback(target.value);
  }

  componentDidMount() {
    const selector = this.satSelector.current;
    if (selector && selector.value.length > 0) {
      this.setState({ selected: selector.value });
      this.props.updateSatPassesCallback(selector.value);
    }
  }

  componentDidUpdate(prevProps: Props) {
    if (prevProps.satData === null || prevProps.satData.length === 0) {
      const selector = this.satSelector.current;
      if (selector && selector.value.length > 0) {
        this.setState({ selected: selector.value });
        this.props.updateSatPassesCallback(selector.value);
      }
    }
  }

  radiansToDegrees(rad: number) {
    return ((rad * 180) / Math.PI).toFixed(2);
  }

  render() {
    const columns = [
      {
        Header: "AOS",
        id: "aos",
        accessor: (d: SatellitePass) => d.aos.toString()
      },
      {
        Header: "AOS Azimuth",
        id: "aosAzimuth",
        accessor: (d: SatellitePass) =>
          this.radiansToDegrees(d.aosAzimuth).toString()
      },
      {
        Header: "Max Elevation",
        id: "maxElevation",
        accessor: (d: SatellitePass) =>
          this.radiansToDegrees(d.maxElevation).toString()
      },
      {
        Header: "LOS",
        id: "los",
        accessor: (d: SatellitePass) => d.los.toString()
      },
      {
        Header: "LOS Azimuth",
        id: "losAzimuth",
        accessor: (d: SatellitePass) =>
          this.radiansToDegrees(d.losAzimuth).toString()
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
      <div>
        <select
          value={this.state.selected}
          ref={this.satSelector}
          onChange={this.handleChange}
        >
          {satelliteOptions}
        </select>
        <ReactTable data={data} columns={columns} />
      </div>
    );
  }
}

export default PassTable;
