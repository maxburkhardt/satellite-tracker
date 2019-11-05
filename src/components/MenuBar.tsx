import React from "react";
import {
  Navbar,
  Alignment,
  Button,
  MenuItem,
  Menu,
  Position,
  Popover
} from "@blueprintjs/core";
import { WindowType } from "../containers/TrackerContainer";
import { inCondensedMode } from "../util/DisplayUtil";

export type Props = {
  resetDataCallback: () => void;
  addWindowCallback: (windowName: WindowType) => void;
  themeToggleCallback: () => void;
  useDarkTheme: boolean;
};

class MenuBar extends React.Component<Props> {
  render(): React.ReactNode {
    const addWindowMenu = (
      <Menu>
        <MenuItem
          icon="dashboard"
          text="Controls"
          onClick={(): void => this.props.addWindowCallback("controls")}
        />
        <MenuItem
          icon="th"
          text="Pass Table"
          onClick={(): void => this.props.addWindowCallback("passTable")}
        />
        <MenuItem
          icon="locate"
          text="Radar"
          onClick={(): void => this.props.addWindowCallback("radar")}
        />
        <MenuItem
          icon="globe"
          text="Map"
          onClick={(): void => this.props.addWindowCallback("map")}
        />
        <MenuItem
          icon="satellite"
          text="Satellite Selector"
          onClick={(): void => this.props.addWindowCallback("selector")}
        />
      </Menu>
    );
    return (
      <Navbar className={this.props.useDarkTheme ? "bp3-dark" : ""}>
        <Navbar.Group align={Alignment.LEFT}>
          <Navbar.Heading>Satellite Tracking</Navbar.Heading>
          <Navbar.Divider />
          <Popover content={addWindowMenu} position={Position.TOP}>
            <Button icon="add">{!inCondensedMode() && "Add a Window"}</Button>
          </Popover>
          <Button icon="trash" onClick={this.props.resetDataCallback}>
            {!inCondensedMode() && "Clear Local Data"}
          </Button>
          <Button
            icon="git-branch"
            onClick={(): Window | null =>
              window.open(
                "https://github.com/maxburkhardt/satellite-tracker",
                "_blank"
              )
            }
          >
            {!inCondensedMode() && "GitHub"}
          </Button>
          <Button
            icon={this.props.useDarkTheme ? "flash" : "moon"}
            onClick={this.props.themeToggleCallback}
          >
            {!inCondensedMode() &&
              (this.props.useDarkTheme ? "Light Mode" : "Dark Mode")}
          </Button>
        </Navbar.Group>
      </Navbar>
    );
  }
}

export default MenuBar;
