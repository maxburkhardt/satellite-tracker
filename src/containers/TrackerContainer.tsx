import React from "react";
import { Mosaic, MosaicWindow, MosaicNode } from "react-mosaic-component";
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
  saveSatellite
} from "../data/LocalStorage";

export type Props = {};

export type State = {
  userLocation: LatLong;
  satPositions: Array<SatellitePosition>;
  satProperties: Array<Satellite>;
  satPasses: { [key: string]: Array<SatellitePass> };
  requestedPassTableSelection: string;
  mosaicRootNode: MosaicNode<ViewId> | null;
  condensedView: boolean;
};

export type ViewId = "controls" | "radar" | "passTable" | "map" | "selector";

class TrackerContainer extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      // Default is the Johnson Space Center
      userLocation: { latitude: 29.559406, longitude: -95.089692 },
      satPositions: [],
      satProperties: [],
      satPasses: {},
      requestedPassTableSelection: "",
      mosaicRootNode:
        window.innerWidth <= 850
          ? this.getCondensedMosaicLayout()
          : this.getExpandedMosaicLayout(),
      condensedView: window.innerWidth <= 850
    };
    this.addNewTleCallback = this.addNewTleCallback.bind(this);
    this.updateUserLocation = this.updateUserLocation.bind(this);
    this.updateSatPassesCallback = this.updateSatPassesCallback.bind(this);
    this.updateSatEnabledCallback = this.updateSatEnabledCallback.bind(this);
    this.bulkSetEnabledCallback = this.bulkSetEnabledCallback.bind(this);
    this.deleteSatCallback = this.deleteSatCallback.bind(this);
    this.processLocalSatData = this.processLocalSatData.bind(this);
    this.periodicProcessLocalSatData = this.periodicProcessLocalSatData.bind(
      this
    );
    this.requestPassTableSelectionCallback = this.requestPassTableSelectionCallback.bind(
      this
    );
    this.onMosaicChange = this.onMosaicChange.bind(this);
    this.onMosaicRelease = this.onMosaicRelease.bind(this);
    this.updateWindowDimensions = this.updateWindowDimensions.bind(this);
  }

  updateUserLocation(location: LatLong) {
    // re-process local data since changing observer changes satellite position
    this.setState({ userLocation: location }, () => this.processLocalSatData());
    saveUserLocation(location);
  }

  getExpandedMosaicLayout(): MosaicNode<ViewId> {
    let initialRootNode: MosaicNode<ViewId> | null = getMosaicLayout(false);
    if (initialRootNode === null) {
      initialRootNode = {
        direction: "row",
        first: {
          direction: "row",
          first: {
            direction: "column",
            first: "controls",
            second: "radar"
          },
          second: {
            direction: "column",
            first: "passTable",
            second: "map"
          },
          splitPercentage: 30
        },
        second: "selector",
        splitPercentage: 80
      };
    }
    return initialRootNode;
  }

  getCondensedMosaicLayout(): MosaicNode<ViewId> {
    return this.condenseLayoutVertical(this.getExpandedMosaicLayout());
  }

  condenseLayoutVertical(node: MosaicNode<ViewId>): MosaicNode<ViewId> {
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

  private onMosaicChange = (currentNode: MosaicNode<ViewId> | null) => {
    saveMosaicLayout(this.state.condensedView, currentNode);
    this.setState({ mosaicRootNode: currentNode });
  };

  private onMosaicRelease = (currentNode: MosaicNode<ViewId> | null) => {
    // do nothing
  };

  updateWindowDimensions() {
    if (window.innerWidth <= 850 && this.state.condensedView === false) {
      this.setState({
        mosaicRootNode: this.getCondensedMosaicLayout(),
        condensedView: true
      });
    } else if (window.innerWidth > 850 && this.state.condensedView === true) {
      this.setState({
        mosaicRootNode: this.getExpandedMosaicLayout(),
        condensedView: false
      });
    }
  }

  componentDidMount() {
    const savedLocation = getSavedUserLocation();
    if (savedLocation) {
      this.updateUserLocation(savedLocation);
    }
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
    const ELEMENT_MAP: { [key: string]: JSX.Element } = {
      controls: (
        <Controls
          userLocation={this.state.userLocation}
          updateLocationCallback={this.updateUserLocation}
        />
      ),
      radar: (
        <Radar
          userLocation={this.state.userLocation}
          satData={this.state.satPositions}
        />
      ),
      passTable: (
        <PassTable
          satData={this.state.satPositions}
          satPasses={this.state.satPasses}
          requestedSelection={this.state.requestedPassTableSelection}
          updateSatPassesCallback={this.updateSatPassesCallback}
        />
      ),
      map: (
        <SatMap
          userLocation={this.state.userLocation}
          satData={this.state.satPositions}
          requestPassTableSelectionCallback={
            this.requestPassTableSelectionCallback
          }
        />
      ),
      selector: (
        <SatSelector
          updateSatEnabledCallback={this.updateSatEnabledCallback}
          bulkSetEnabledCallback={this.bulkSetEnabledCallback}
          addNewTleCallback={this.addNewTleCallback}
          deleteSatCallback={this.deleteSatCallback}
          satData={this.state.satProperties}
        />
      )
    };

    const TITLE_MAP: { [key: string]: string } = {
      controls: "Controls",
      radar: "Radar",
      passTable: "Pass Table",
      map: "World Map",
      selector: "Satellite Selector"
    };

    return (
      <div className="trackerWindow">
        <Mosaic
          renderTile={(id, path) => (
            <MosaicWindow<ViewId> path={path} title={TITLE_MAP[id]}>
              {ELEMENT_MAP[id]}
            </MosaicWindow>
          )}
          value={this.state.mosaicRootNode}
          onChange={this.onMosaicChange}
          onRelease={this.onMosaicRelease}
        />
      </div>
    );
  }
}

export default TrackerContainer;
