import React from "react";
import { Mosaic, MosaicWindow, MosaicNode } from "react-mosaic-component";
import Controls from "../components/Controls";
import Radar from "../components/Radar";
import PassTable from "../components/PassTable";
import SatMap from "../components/SatMap";
import "react-mosaic-component/react-mosaic-component.css";
import "@blueprintjs/core/lib/css/blueprint.css";
import "@blueprintjs/icons/lib/css/blueprint-icons.css";
import { LatLong, SatellitePass, SatellitePosition } from "../util/SharedTypes";
import {
  getDefaultSatellites,
  calculateSatellitePosition,
  getFuturePasses
} from "../data/Space";
import {
  getSavedSatellites,
  getSavedUserLocation,
  saveUserLocation,
  getSavedSatellite,
  saveMosaicLayout,
  getMosaicLayout
} from "../data/LocalStorage";

export type Props = {};

export type State = {
  userLocation: LatLong;
  satData: Array<SatellitePosition>;
  satPasses: { [key: string]: Array<SatellitePass> };
  requestedPassTableSelection: string;
  mosaicRootNode: MosaicNode<ViewId> | null;
  condensedView: boolean;
};

export type ViewId = "controls" | "radar" | "passTable" | "map" | "new";

class TrackerContainer extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      userLocation: { latitude: 0, longitude: 0 },
      satData: [],
      satPasses: {},
      requestedPassTableSelection: "",
      mosaicRootNode: window.innerWidth <= 850 ? this.getCondensedMosaicLayout() : this.getExpandedMosaicLayout(),
      condensedView: window.innerWidth <= 850
    };
    this.updateUserLocation = this.updateUserLocation.bind(this);
    this.updateSatDataCallback = this.updateSatDataCallback.bind(this);
    this.updateSatPassesCallback = this.updateSatPassesCallback.bind(this);
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
      };
    }
    return initialRootNode;
  }

  getCondensedMosaicLayout(): MosaicNode<ViewId> {
    return this.condenseLayoutVertical(this.getExpandedMosaicLayout());
  }

  condenseLayoutVertical(node: MosaicNode<ViewId>): MosaicNode<ViewId> {
    if (typeof(node) !== "object") {
      // This is just a ViewId
      return node;
    }
    // We should recurse
    return {
      direction: "column",
      first: this.condenseLayoutVertical(node.first),
      second: this.condenseLayoutVertical(node.second)
    }
  }

  processLocalSatData() {
    const calculated: Array<SatellitePosition> = [];
    for (let sat of getSavedSatellites()) {
      try {
        calculated.push(
          calculateSatellitePosition(sat, this.state.userLocation, new Date())
        );
      } catch {
        console.log(`Skipping calculation for ${sat.name} due to an error.`);
      }
    }
    this.setState({ satData: calculated });
  }

  periodicProcessLocalSatData() {
    this.processLocalSatData();
    setTimeout(this.periodicProcessLocalSatData, 1000 * 15);
  }

  updateSatDataCallback() {
    getDefaultSatellites().then(() => this.processLocalSatData());
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
      this.setState({mosaicRootNode: this.getCondensedMosaicLayout(), condensedView: true});
    } else if (window.innerWidth > 850 && this.state.condensedView === true) {
      this.setState({mosaicRootNode: this.getExpandedMosaicLayout(), condensedView: false});
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
          updateSatDataCallback={this.updateSatDataCallback}
        />
      ),
      radar: (
        <Radar
          userLocation={this.state.userLocation}
          satData={this.state.satData}
        />
      ),
      passTable: (
        <PassTable
          satData={this.state.satData}
          satPasses={this.state.satPasses}
          requestedSelection={this.state.requestedPassTableSelection}
          updateSatPassesCallback={this.updateSatPassesCallback}
        />
      ),
      map: (
        <SatMap
          userLocation={this.state.userLocation}
          satData={this.state.satData}
          requestPassTableSelectionCallback={
            this.requestPassTableSelectionCallback
          }
        />
      )
    };

    const TITLE_MAP: { [key: string]: string } = {
      controls: "Controls",
      radar: "Radar",
      passTable: "Pass Table",
      map: "World Map",
      new: "New"
    };

    return (
      <div className="trackerWindow">
        <Mosaic
          renderTile={(id, path) => (
            <MosaicWindow<ViewId>
              path={path}
              title={TITLE_MAP[id]}
            >
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
