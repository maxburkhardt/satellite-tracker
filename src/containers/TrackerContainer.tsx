import React from "react";
import MenuBar from "../components/MenuBar";
import {
  Mosaic,
  MosaicWindow,
  MosaicNode,
  getPathToCorner,
  Corner,
  getNodeAtPath,
  MosaicParent,
  MosaicDirection,
  getOtherDirection,
  updateTree
} from "react-mosaic-component";
import dropRight from "lodash/dropRight";
import Controls from "../components/Controls";
import Radar from "../components/Radar";
import PassTable from "../components/PassTable";
import SatMap from "../components/SatMap";
import SatSelector from "../components/SatSelector";
import "react-mosaic-component/react-mosaic-component.css";
import "@blueprintjs/core/lib/css/blueprint.css";
import "@blueprintjs/icons/lib/css/blueprint-icons.css";
import {
  LatLong,
  SatellitePass,
  SatellitePosition,
  Satellite
} from "../util/SharedTypes";
import {
  getDefaultSatellites,
  calculateSatellitePosition,
  getFuturePasses,
  parseTleData
} from "../data/Space";
import {
  getSavedSatellites,
  getSavedUserLocation,
  saveUserLocation,
  getSavedSatellite,
  saveMosaicLayout,
  getMosaicLayout,
  deleteSavedSatellite,
  saveSatellite,
  clearLocalData,
  getWindowTypeMap,
  saveWindowTypeMap
} from "../data/LocalStorage";
import { inCondensedMode } from "../util/DisplayUtil";

export type Props = {};

export type State = {
  userLocation: LatLong;
  satPositions: Array<SatellitePosition>;
  satProperties: Array<Satellite>;
  satPasses: { [key: string]: Array<SatellitePass> };
  requestedPassTableSelection: string;
  mosaicRootNode: MosaicNode<number> | null;
  windowTypeMap: WindowTypeMap;
  condensedView: boolean;
};

export type WindowType =
  | "controls"
  | "radar"
  | "passTable"
  | "map"
  | "selector";
export type WindowTypeMap = { [key: string]: WindowType };
export type WindowElementMap = { [key: string]: JSX.Element };

class TrackerContainer extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    let rootNode: MosaicNode<number>, windowMap: WindowTypeMap;
    if (inCondensedMode()) {
      ({ rootNode, windowMap } = this.getCondensedMosaicLayout());
    } else {
      ({ rootNode, windowMap } = this.getExpandedMosaicLayout());
    }
    this.state = {
      userLocation: this.getUserLocation(),
      satPositions: [],
      satProperties: [],
      satPasses: {},
      requestedPassTableSelection: "",
      mosaicRootNode: rootNode,
      windowTypeMap: windowMap,
      condensedView: inCondensedMode()
    };
    this.addNewTleCallback = this.addNewTleCallback.bind(this);
    this.updateUserLocation = this.updateUserLocation.bind(this);
    this.updateSatPassesCallback = this.updateSatPassesCallback.bind(this);
    this.updateSatEnabledCallback = this.updateSatEnabledCallback.bind(this);
    this.bulkSetEnabledCallback = this.bulkSetEnabledCallback.bind(this);
    this.deleteSatCallback = this.deleteSatCallback.bind(this);
    this.addWindowCallback = this.addWindowCallback.bind(this);
    this.processLocalSatData = this.processLocalSatData.bind(this);
    this.periodicProcessLocalSatData = this.periodicProcessLocalSatData.bind(
      this
    );
    this.requestPassTableSelectionCallback = this.requestPassTableSelectionCallback.bind(
      this
    );
    this.createNewWindow = this.createNewWindow.bind(this);
    this.onMosaicChange = this.onMosaicChange.bind(this);
    this.onMosaicRelease = this.onMosaicRelease.bind(this);
    this.updateWindowDimensions = this.updateWindowDimensions.bind(this);
  }

  updateUserLocation(location: LatLong) {
    // re-process local data since changing observer changes satellite position
    this.setState({ userLocation: location }, () => this.processLocalSatData());
    saveUserLocation(location);
  }

  getUserLocation(): LatLong {
    const saved = getSavedUserLocation();
    if (saved) {
      return saved;
    } else {
      // Default is the Johnson Space Center
      return { latitude: 29.559406, longitude: -95.089692 };
    }
  }

  getExpandedMosaicLayout(): {
    rootNode: MosaicNode<number>;
    windowMap: WindowTypeMap;
  } {
    let initialRootNode: MosaicNode<number> | null = getMosaicLayout(false);
    let initialWindowTypeMap: {
      [key: string]: WindowType;
    } | null = getWindowTypeMap();
    if (initialRootNode === null || initialWindowTypeMap === null) {
      initialRootNode = {
        direction: "row",
        first: {
          direction: "row",
          first: {
            direction: "column",
            first: 1,
            second: 2
          },
          second: {
            direction: "column",
            first: 3,
            second: 4
          },
          splitPercentage: 30
        },
        second: 5,
        splitPercentage: 80
      };
      initialWindowTypeMap = {
        "1": "controls",
        "2": "radar",
        "3": "passTable",
        "4": "map",
        "5": "selector"
      };
    }
    return { rootNode: initialRootNode, windowMap: initialWindowTypeMap };
  }

  getCondensedMosaicLayout(): {
    rootNode: MosaicNode<number>;
    windowMap: WindowTypeMap;
  } {
    const { rootNode, windowMap } = this.getExpandedMosaicLayout();
    return {
      rootNode: this.condenseLayoutVertical(rootNode),
      windowMap: windowMap
    };
  }

  condenseLayoutVertical(node: MosaicNode<number>): MosaicNode<number> {
    if (typeof node !== "object") {
      // This is just a ViewId
      return node;
    }
    // We should recurse
    return {
      direction: "column",
      first: this.condenseLayoutVertical(node.first),
      second: this.condenseLayoutVertical(node.second)
    };
  }

  processLocalSatData() {
    const calculated: Array<SatellitePosition> = [];
    this.setState({ satProperties: getSavedSatellites() }, () => {
      for (let sat of getSavedSatellites()) {
        try {
          if (sat.enabled) {
            calculated.push(
              calculateSatellitePosition(
                sat,
                this.state.userLocation,
                new Date()
              )
            );
          }
        } catch {
          console.log(`Skipping calculation for ${sat.name} due to an error.`);
        }
      }
      this.setState({ satPositions: calculated });
    });
  }

  periodicProcessLocalSatData() {
    this.processLocalSatData();
    setTimeout(this.periodicProcessLocalSatData, 1000 * 15);
  }

  updateSatPassesCallback(satellite: string) {
    const sat = getSavedSatellite(satellite);
    if (sat) {
      const satSpecificPasses = getFuturePasses(sat, this.state.userLocation);
      const passes = { ...this.state.satPasses };
      passes[satellite] = satSpecificPasses;
      this.setState({ satPasses: passes });
    }
  }

  updateSatEnabledCallback(name: string): void {
    const record = getSavedSatellite(name);
    if (record) {
      record.enabled = !record.enabled;
      saveSatellite(record);
      this.processLocalSatData();
    }
  }

  bulkSetEnabledCallback(newState: boolean): void {
    for (const sat of this.state.satProperties) {
      sat.enabled = newState;
      saveSatellite(sat);
    }
    this.processLocalSatData();
  }

  addNewTleCallback(name: string, line1: string, line2: string): void {
    parseTleData(name, line1, line2);
    this.processLocalSatData();
  }

  deleteSatCallback(name: string): void {
    deleteSavedSatellite(name);
    this.processLocalSatData();
  }

  requestPassTableSelectionCallback(satellite: string): void {
    this.setState({ requestedPassTableSelection: satellite });
  }

  generateWindowElementMap(types: WindowTypeMap): WindowElementMap {
    const elementMap: WindowElementMap = {};
    for (let i of Object.keys(types)) {
      elementMap[i] = this.createNewWindow(types[i]);
    }
    return elementMap;
  }

  createNewWindow(type: WindowType): JSX.Element {
    if (type === "controls") {
      return (
        <Controls
          userLocation={this.state.userLocation}
          updateLocationCallback={this.updateUserLocation}
        />
      );
    } else if (type === "radar") {
      return (
        <Radar
          userLocation={this.state.userLocation}
          satData={this.state.satPositions}
        />
      );
    } else if (type === "passTable") {
      return (
        <PassTable
          satData={this.state.satPositions}
          satPasses={this.state.satPasses}
          requestedSelection={this.state.requestedPassTableSelection}
          updateSatPassesCallback={this.updateSatPassesCallback}
        />
      );
    } else if (type === "selector") {
      return (
        <SatSelector
          updateSatEnabledCallback={this.updateSatEnabledCallback}
          bulkSetEnabledCallback={this.bulkSetEnabledCallback}
          addNewTleCallback={this.addNewTleCallback}
          deleteSatCallback={this.deleteSatCallback}
          satData={this.state.satProperties}
        />
      );
    } else {
      return (
        <SatMap
          userLocation={this.state.userLocation}
          satData={this.state.satPositions}
          requestPassTableSelectionCallback={
            this.requestPassTableSelectionCallback
          }
        />
      );
    }
  }

  addWindowCallback(windowName: WindowType): void {
    let newRootNode: MosaicNode<number>;
    const newWindow = Object.keys(this.state.windowTypeMap).length + 1;
    if (this.state.mosaicRootNode) {
      const path = getPathToCorner(this.state.mosaicRootNode, Corner.TOP_RIGHT);
      const parent = getNodeAtPath(
        this.state.mosaicRootNode,
        dropRight(path)
      ) as MosaicParent<number>;
      const destination = getNodeAtPath(
        this.state.mosaicRootNode,
        path
      ) as MosaicNode<number>;
      const direction: MosaicDirection = parent
        ? getOtherDirection(parent.direction)
        : "row";

      let first: MosaicNode<number>;
      let second: MosaicNode<number>;
      if (direction === "row") {
        first = destination;
        second = newWindow;
      } else {
        first = newWindow;
        second = destination;
      }

      newRootNode = updateTree(this.state.mosaicRootNode, [
        {
          path,
          spec: {
            $set: {
              direction,
              first,
              second
            }
          }
        }
      ]);
    } else {
      newRootNode = 1;
    }

    const windowTypeMap = this.state.windowTypeMap;
    windowTypeMap[newWindow] = windowName;

    this.setState(
      { mosaicRootNode: newRootNode, windowTypeMap: windowTypeMap },
      () => {
        saveMosaicLayout(this.state.condensedView, this.state.mosaicRootNode);
        saveWindowTypeMap(this.state.windowTypeMap);
      }
    );
  }

  private onMosaicChange = (currentNode: MosaicNode<number> | null) => {
    saveMosaicLayout(this.state.condensedView, currentNode);
    saveWindowTypeMap(this.state.windowTypeMap);
    this.setState({ mosaicRootNode: currentNode });
  };

  private onMosaicRelease = (currentNode: MosaicNode<number> | null) => {
    // do nothing
  };

  updateWindowDimensions() {
    if (inCondensedMode() && this.state.condensedView === false) {
      this.setState({
        mosaicRootNode: this.getCondensedMosaicLayout().rootNode,
        condensedView: true
      });
    } else if (!inCondensedMode() && this.state.condensedView === true) {
      this.setState({
        mosaicRootNode: this.getExpandedMosaicLayout().rootNode,
        condensedView: false
      });
    }
  }

  componentDidMount() {
    // schedule periodic updating of locations
    this.periodicProcessLocalSatData();
    // register event handler to deal with responsivity
    window.addEventListener("resize", this.updateWindowDimensions);
    // Get satellite data if it's not locally cached
    if (getSavedSatellites().length === 0) {
      getDefaultSatellites().then(() => this.processLocalSatData());
    }
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.updateWindowDimensions);
  }

  render() {
    // const ELEMENT_MAP: { [key: string]: JSX.Element } = ;

    const TITLE_MAP: { [key: string]: string } = {
      controls: "Controls",
      radar: "Radar",
      passTable: "Pass Table",
      map: "World Map",
      selector: "Satellite Selector"
    };

    const windowElements = this.generateWindowElementMap(
      this.state.windowTypeMap
    );

    return (
      <React.Fragment>
        <MenuBar
          addWindowCallback={this.addWindowCallback}
          resetDataCallback={clearLocalData}
        />
        <div className="trackerWindow">
          <Mosaic
            renderTile={(id, path) => (
              <MosaicWindow<number>
                path={path}
                title={TITLE_MAP[this.state.windowTypeMap[id.toString()]]}
              >
                {windowElements[id]}
              </MosaicWindow>
            )}
            value={this.state.mosaicRootNode}
            onChange={this.onMosaicChange}
            onRelease={this.onMosaicRelease}
          />
        </div>
      </React.Fragment>
    );
  }
}

export default TrackerContainer;
