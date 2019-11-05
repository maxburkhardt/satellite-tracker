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
  parseTleData,
  getPassDetails
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
  saveWindowTypeMap,
  getUseDarkTheme,
  saveUseDarkTheme
} from "../data/LocalStorage";
import { inCondensedMode } from "../util/DisplayUtil";
import moment, { Moment } from "moment";
import PassDetails from "../components/PassDetails";

export type Props = {};

export type State = {
  userLocation: LatLong;
  satPositions: Array<SatellitePosition>;
  satProperties: Array<Satellite>;
  satPasses: { [key: string]: Array<SatellitePass> };
  requestedPassTableSelection: string;
  mosaicRootNode: MosaicNode<number> | null;
  windowIdentityMap: WindowIdentityMap;
  condensedView: boolean;
  useDarkTheme: boolean;
};

export type WindowType =
  | "controls"
  | "radar"
  | "passTable"
  | "passDetails"
  | "map"
  | "selector";
export type WindowIdentity = { type: WindowType; props?: any }; // eslint-disable-line @typescript-eslint/no-explicit-any
export type WindowIdentityMap = { [key: string]: WindowIdentity };
export type WindowElementMap = { [key: string]: JSX.Element };

class TrackerContainer extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    let rootNode: MosaicNode<number>, windowMap: WindowIdentityMap;
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
      windowIdentityMap: windowMap,
      condensedView: inCondensedMode(),
      useDarkTheme: getUseDarkTheme()
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
    this.viewPassDetailsCallback = this.viewPassDetailsCallback.bind(this);
    this.toggleTheme = this.toggleTheme.bind(this);
  }

  updateUserLocation(location: LatLong): void {
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
    windowMap: WindowIdentityMap;
  } {
    let initialRootNode: MosaicNode<number> | null = getMosaicLayout(false);
    let initialWindowTypeMap: {
      [key: string]: WindowIdentity;
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
        "1": { type: "controls" },
        "2": { type: "radar" },
        "3": { type: "passTable" },
        "4": { type: "map" },
        "5": { type: "selector" }
      };
    }
    return { rootNode: initialRootNode, windowMap: initialWindowTypeMap };
  }

  getCondensedMosaicLayout(): {
    rootNode: MosaicNode<number>;
    windowMap: WindowIdentityMap;
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

  processLocalSatData(): void {
    const calculated: Array<SatellitePosition> = [];
    let needsRefresh = false;
    this.setState({ satProperties: getSavedSatellites() }, () => {
      for (const sat of getSavedSatellites()) {
        try {
          if (sat.enabled) {
            calculated.push(
              calculateSatellitePosition(
                sat,
                this.state.userLocation,
                new Date()
              )
            );
            if (!needsRefresh && !sat.manuallyModified) {
              const updatedMoment = moment(sat.dataUpdatedAt);
              const now = moment();
              if (updatedMoment.add(moment.duration(2, "days")).isBefore(now)) {
                needsRefresh = true;
              }
            }
          }
        } catch {
          console.log(`Skipping calculation for ${sat.name} due to an error.`);
        }
      }
      this.setState({ satPositions: calculated });
      if (needsRefresh) {
        console.log(
          "Refreshing default satellite TLEs (current set is > 2 days old)."
        );
        getDefaultSatellites();
      }
    });
  }

  periodicProcessLocalSatData(): void {
    this.processLocalSatData();
    setTimeout(this.periodicProcessLocalSatData, 1000 * 15);
  }

  updateSatPassesCallback(satellite: string): void {
    const sat = getSavedSatellite(satellite);
    if (sat) {
      const satSpecificPasses = getFuturePasses(sat, this.state.userLocation);
      const passes = { ...this.state.satPasses };
      passes[satellite] = satSpecificPasses;
      this.setState({ satPasses: passes });
    }
  }

  viewPassDetailsCallback(satellite: string, startTime: Moment): void {
    const satelliteTle = getSavedSatellite(satellite);
    if (satelliteTle) {
      const details = getPassDetails(
        satelliteTle,
        this.state.userLocation,
        startTime
      );
      this.addWindowCallback("passDetails", {
        passData: details,
        userLocation: this.state.userLocation
      });
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
    parseTleData(name, line1, line2, true);
    this.processLocalSatData();
  }

  deleteSatCallback(name: string): void {
    deleteSavedSatellite(name);
    this.processLocalSatData();
  }

  requestPassTableSelectionCallback(satellite: string): void {
    this.setState({ requestedPassTableSelection: satellite });
  }

  generateWindowElementMap(identities: WindowIdentityMap): WindowElementMap {
    const elementMap: WindowElementMap = {};
    for (const i of Object.keys(identities)) {
      elementMap[i] = this.createNewWindow(identities[i]);
    }
    return elementMap;
  }

  createNewWindow(identity: WindowIdentity): JSX.Element {
    if (identity.type === "controls") {
      return (
        <Controls
          userLocation={this.state.userLocation}
          updateLocationCallback={this.updateUserLocation}
        />
      );
    } else if (identity.type === "radar") {
      return (
        <Radar
          userLocation={this.state.userLocation}
          satData={this.state.satPositions}
          requestPassTableSelectionCallback={
            this.requestPassTableSelectionCallback
          }
        />
      );
    } else if (identity.type === "passTable") {
      return (
        <PassTable
          satData={this.state.satPositions}
          satPasses={this.state.satPasses}
          requestedSelection={this.state.requestedPassTableSelection}
          updateSatPassesCallback={this.updateSatPassesCallback}
          viewPassDetailsCallback={this.viewPassDetailsCallback}
        />
      );
    } else if (identity.type === "selector") {
      return (
        <SatSelector
          updateSatEnabledCallback={this.updateSatEnabledCallback}
          bulkSetEnabledCallback={this.bulkSetEnabledCallback}
          addNewTleCallback={this.addNewTleCallback}
          deleteSatCallback={this.deleteSatCallback}
          satData={this.state.satProperties}
        />
      );
    } else if (identity.type === "passDetails") {
      return <PassDetails {...identity.props} />;
    } else {
      return (
        <SatMap
          userLocation={this.state.userLocation}
          satData={this.state.satPositions}
          requestPassTableSelectionCallback={
            this.requestPassTableSelectionCallback
          }
          useDarkTheme={this.state.useDarkTheme}
        />
      );
    }
  }

  //eslint-disable-next-line @typescript-eslint/no-explicit-any
  addWindowCallback(windowName: WindowType, additionalProps?: any): void {
    let newRootNode: MosaicNode<number>;
    const newWindow = Object.keys(this.state.windowIdentityMap).length + 1;
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
      newRootNode = newWindow;
    }

    const windowIdentityMap = this.state.windowIdentityMap;
    windowIdentityMap[newWindow] = { type: windowName, props: additionalProps };

    this.setState(
      { mosaicRootNode: newRootNode, windowIdentityMap: windowIdentityMap },
      () => {
        saveMosaicLayout(this.state.condensedView, this.state.mosaicRootNode);
        saveWindowTypeMap(this.state.windowIdentityMap);
      }
    );
  }

  private onMosaicChange = (currentNode: MosaicNode<number> | null): void => {
    saveMosaicLayout(this.state.condensedView, currentNode);
    saveWindowTypeMap(this.state.windowIdentityMap);
    this.setState({ mosaicRootNode: currentNode });
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private onMosaicRelease = (currentNode: MosaicNode<number> | null): void => {
    // do nothing
  };

  updateWindowDimensions(): void {
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

  toggleTheme(): void {
    if (this.state.useDarkTheme) {
      this.setState({ useDarkTheme: false });
      saveUseDarkTheme(false);
    } else {
      this.setState({ useDarkTheme: true });
      saveUseDarkTheme(true);
    }
  }

  componentDidMount(): void {
    // schedule periodic updating of locations
    this.periodicProcessLocalSatData();
    // register event handler to deal with responsivity
    window.addEventListener("resize", this.updateWindowDimensions);
    // Get satellite data if it's not locally cached
    if (getSavedSatellites().length === 0) {
      getDefaultSatellites().then(() => this.processLocalSatData());
    }
  }

  componentWillUnmount(): void {
    window.removeEventListener("resize", this.updateWindowDimensions);
  }

  render(): React.ReactNode {
    // const ELEMENT_MAP: { [key: string]: JSX.Element } = ;

    const TITLE_MAP: { [key: string]: string } = {
      controls: "Controls",
      radar: "Radar",
      passTable: "Pass Table",
      passDetails: "Pass Details",
      map: "World Map",
      selector: "Satellite Selector"
    };

    const windowElements = this.generateWindowElementMap(
      this.state.windowIdentityMap
    );

    return (
      <React.Fragment>
        <MenuBar
          addWindowCallback={this.addWindowCallback}
          resetDataCallback={clearLocalData}
          useDarkTheme={this.state.useDarkTheme}
          themeToggleCallback={this.toggleTheme}
        />
        <div className="trackerWindow">
          <Mosaic
            className={
              this.state.useDarkTheme
                ? "mosaic-blueprint-theme bp3-dark"
                : "mosaic-blueprint-theme"
            }
            renderTile={(id, path): JSX.Element => (
              <MosaicWindow<number>
                path={path}
                title={
                  TITLE_MAP[this.state.windowIdentityMap[id.toString()].type]
                }
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
