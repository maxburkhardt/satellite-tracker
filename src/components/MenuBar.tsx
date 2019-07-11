import React from "react";
import { Navbar, Alignment, Button, MenuItem, Menu, Position, Popover } from "@blueprintjs/core";
import { ViewId } from "../containers/TrackerContainer";

export type Props = {
    resetDataCallback: () => void;
    addWindowCallback: (windowName: ViewId) => void;
}

class MenuBar extends React.Component<Props> {
    render() {
        const addWindowMenu = (
            <Menu>
                <MenuItem icon="dashboard" text="Controls" onClick={() => this.props.addWindowCallback("controls")} />
                <MenuItem icon="th" text="Pass Table" onClick={() => this.props.addWindowCallback("passTable")} />
                <MenuItem icon="locate" text="Radar" onClick={() => this.props.addWindowCallback("radar")} />
                <MenuItem icon="globe" text="Map" onClick={() => this.props.addWindowCallback("map")} />
                <MenuItem icon="satellite" text="Satellite Selector" onClick={() => this.props.addWindowCallback("selector")} />
            </Menu>
        );
        return (
            <Navbar>
                <Navbar.Group align={Alignment.LEFT}>
                    <Navbar.Heading>Satellite Tracking</Navbar.Heading>
                    <Navbar.Divider />
                    <Popover content={addWindowMenu} position={Position.TOP}>
                        <Button icon="add">Add a Window</Button>
                    </Popover>
                    <Button icon="trash" onClick={this.props.resetDataCallback}>Clear Local Data</Button>
                </Navbar.Group>
            </Navbar>
        );
    }
}

export default MenuBar;