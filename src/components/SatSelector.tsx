import React from "react";
import ReactTable, { RowInfo, Filter } from "react-table";
import ReactResizeDetector from "react-resize-detector";
import {
  Button,
  Switch,
  FormGroup,
  InputGroup,
  HTMLSelect,
  ButtonGroup
} from "@blueprintjs/core";
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
};

class SatSelector extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      numRows: 5,
      newSatName: "",
      newSatLine1: "",
      newSatLine2: ""
    };

    this.onResize = this.onResize.bind(this);
    this.submitNewSat = this.submitNewSat.bind(this);
  }

  onResize(width: number, height: number): void {
    this.setState({ numRows: Math.floor((height - 384) / 45) });
  }

  submitNewSat(): void {
    this.props.addNewTleCallback(
      this.state.newSatName,
      this.state.newSatLine1,
      this.state.newSatLine2
    );
    this.setState({ newSatName: "", newSatLine1: "", newSatLine2: "" });
  }

  render(): React.ReactNode {
    const columns = [
      {
        Header: "Name",
        accessor: "name",
        filterMethod: (
          filter: Filter,
          row: { [key: string]: string }
        ): boolean =>
          row[filter.id].toLowerCase().includes(filter.value.toLowerCase())
      },
      {
        Header: "Enabled?",
        accessor: "enabled",
        Cell: (row: RowInfo): JSX.Element => (
          <Switch
            checked={row.original.enabled}
            onChange={(): void =>
              this.props.updateSatEnabledCallback(row.original.name)
            }
          />
        ),
        Filter: ({
          filter,
          onChange
        }: {
          filter: Filter;
          onChange: (selected: string) => void;
        }): JSX.Element => (
          <HTMLSelect
            value={filter ? filter.value : "all"}
            onChange={(event): void => onChange(event.target.value)}
          >
            <option value="all">All</option>
            <option value="enabled">Enabled</option>
            <option value="disabled">Disabled</option>
          </HTMLSelect>
        ),
        filterMethod: (
          filter: Filter,
          row: { [key: string]: boolean }
        ): boolean => {
          if (filter.value === "enabled") {
            return row[filter.id];
          } else if (filter.value === "disabled") {
            return !row[filter.id];
          } else {
            return true;
          }
        }
      },
      {
        Header: "Actions",
        Cell: (row: RowInfo): React.ReactNode => (
          <Button
            onClick={(): void =>
              this.props.deleteSatCallback(row.original.name)
            }
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
          <InputGroup
            value={this.state.newSatName}
            placeholder="Name"
            onChange={(event: React.SyntheticEvent): void =>
              this.setState({
                newSatName: (event.target as HTMLInputElement).value
              })
            }
          />
          <InputGroup
            value={this.state.newSatLine1}
            placeholder="TLE Line 1"
            onChange={(event: React.SyntheticEvent): void =>
              this.setState({
                newSatLine1: (event.target as HTMLInputElement).value
              })
            }
          />
          <InputGroup
            value={this.state.newSatLine2}
            placeholder="TLE Line 2"
            onChange={(event: React.SyntheticEvent): void =>
              this.setState({
                newSatLine2: (event.target as HTMLInputElement).value
              })
            }
          />
          <Button onClick={this.submitNewSat} icon="saved">
            Save
          </Button>
        </FormGroup>
        <FormGroup label="Global Visibility">
          <ButtonGroup>
            <Button
              small
              onClick={(): void => this.props.bulkSetEnabledCallback(true)}
            >
              Enable All
            </Button>
            <Button
              small
              onClick={(): void => this.props.bulkSetEnabledCallback(false)}
            >
              Disable All
            </Button>
          </ButtonGroup>
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
