import React from "react";
import ReactTable, { RowInfo, Filter } from "react-table";
import ReactResizeDetector from "react-resize-detector";
import { Button, Switch, FormGroup, InputGroup } from "@blueprintjs/core";
import "react-table/react-table.css";
import { Satellite } from "../util/SharedTypes";

export type Props = {
  updateSatEnabledCallback: (satName: string) => void;
  bulkSetEnabledCallback: (newState: boolean) => void;
  deleteSatCallback: (satName: string) => void;
  addNewTleCallback: (name: string, line1: string, line2: string) => void;
  satData: Array<Satellite>;
};

export type State = {
  numRows: number;
  newSatName: string;
  newSatLine1: string;
  newSatLine2: string;
}

class SatSelector extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      numRows: 5,
      newSatName: "",
      newSatLine1: "",
      newSatLine2: "",
    }

    this.onResize = this.onResize.bind(this);
    this.submitNewSat = this.submitNewSat.bind(this);
  }

  onResize(width: number, height: number) {
    this.setState({numRows: Math.floor((height - 340) / 45)})
  }

  submitNewSat() {
    this.props.addNewTleCallback(this.state.newSatName, this.state.newSatLine1, this.state.newSatLine2);
    this.setState({newSatName: "", newSatLine1: "", newSatLine2: ""});
  }

  render() {
    const columns = [
      {
        Header: "Name",
        accessor: "name",
        filterMethod: (filter: Filter, row: { [key: string]: string }) =>
          row[filter.id].includes(filter.value)
      },
      {
        Header: "Toggle Visibility",
        Cell: (row: RowInfo) => (
          <Switch
            checked={row.original.enabled}
            onChange={() =>
              this.props.updateSatEnabledCallback(row.original.name)
            }
          />
        ),
        Filter: () => (
          <div>
            <Button
              small
              onClick={() => this.props.bulkSetEnabledCallback(true)}
            >
              Enable All
            </Button>
            <br />
            <Button
              small
              onClick={() => this.props.bulkSetEnabledCallback(false)}
            >
              Disable All
            </Button>
          </div>
        )
      },
      {
        Header: "Actions",
        Cell: (row: RowInfo) => (
          <Button
            onClick={() => this.props.deleteSatCallback(row.original.name)}
          >
            Delete
          </Button>
        ),
        filterable: false
      }
    ];
    return (
      <div className="scroll-container">
        <ReactResizeDetector handleHeight onResize={this.onResize} />
        <FormGroup label="Add new satellite">
          <InputGroup value={this.state.newSatName} placeholder="Name" onChange={(event: React.SyntheticEvent) => this.setState({newSatName: (event.target as HTMLInputElement).value})}/>
          <InputGroup value={this.state.newSatLine1} placeholder="TLE Line 1" onChange={(event: React.SyntheticEvent) => this.setState({newSatLine1: (event.target as HTMLInputElement).value})}/>
          <InputGroup value={this.state.newSatLine2} placeholder="TLE Line 2" onChange={(event: React.SyntheticEvent) => this.setState({newSatLine2: (event.target as HTMLInputElement).value})}/>
          <Button onClick={this.submitNewSat}>Save</Button>
        </FormGroup>
        <ReactTable
          data={this.props.satData}
          columns={columns}
          pageSize={this.state.numRows}
          filterable
        />
      </div>
    );
  }
}

export default SatSelector;
