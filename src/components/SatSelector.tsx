import React from "react";
import ReactTable, { RowInfo, Filter } from "react-table";
import { Button, Switch } from "@blueprintjs/core";
import "react-table/react-table.css";
import { Satellite } from "../util/SharedTypes";

export type Props = {
  updateSatEnabledCallback: (satName: string) => void;
  bulkSetEnabledCallback: (newState: boolean) => void;
  deleteSatCallback: (satName: string) => void;
  addNewTleCallback: (name: string, line1: string, line2: string) => void;
  satData: Array<Satellite>;
};

class SatSelector extends React.Component<Props> {
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
        <ReactTable
          data={this.props.satData}
          columns={columns}
          pageSize={3}
          filterable
        />
      </div>
    );
  }
}

export default SatSelector;
