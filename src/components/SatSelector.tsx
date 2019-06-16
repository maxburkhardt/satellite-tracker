import React from "react";
import ReactTable, { RowInfo } from "react-table";
import { Button } from "@blueprintjs/core";
import "react-table/react-table.css";
import { Satellite } from "../util/SharedTypes";

export type Props = {
  updateSatEnabledCallback: (satName: string) => void;
  deleteSatCallback: (satName: string) => void;
  addNewTleCallback: (name: string, line1: string, line2: string) => void;
  satData: Array<Satellite>;
};

class SatSelector extends React.Component<Props> {
  render() {
    const columns = [
      {
        Header: "Name",
        accessor: "name"
      },
      {
        Header: "Toggle Visibility",
        Cell: () => <div>Visible</div>
      },
      {
        Header: "Actions",
        Cell: (row: RowInfo) => (
          <Button
            onClick={() => this.props.deleteSatCallback(row.original.name)}
          >
            Delete
          </Button>
        )
      }
    ];
    return (
      <div className="scroll-container">
        <ReactTable data={this.props.satData} columns={columns} />
      </div>
    );
  }
}

export default SatSelector;
