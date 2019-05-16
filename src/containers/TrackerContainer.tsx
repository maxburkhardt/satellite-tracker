import React from "react";
import { Mosaic, MosaicWindow } from "react-mosaic-component";
import Controls from "../components/Controls";
import Radar from "../components/Radar";
import PassTable from "../components/PassTable";
import SatMap from "../components/SatMap";
import "react-mosaic-component/react-mosaic-component.css";
import '@blueprintjs/core/lib/css/blueprint.css';
import '@blueprintjs/icons/lib/css/blueprint-icons.css';
import {
  LatLong,
  SatellitePass,
  SatellitePosition,
  Satellite
} from "../util/SharedTypes";
import {
  getDefaultSatellites,
  calculateSatellitePosition,
  getFuturePasses
} from "../data/Space";

export type Props = {};

export type State = {
  userLocation: LatLong;
  satData: Array<SatellitePosition>;
  satPasses: { [key: string]: Array<SatellitePass> };
};

export type ViewId = 'controls' | 'radar' | 'passTable' | 'map' | 'new';

class TrackerContainer extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      userLocation: { latitude: 0, longitude: 0 },
      satData: [],
      satPasses: {}
    };
    this.updateUserLocation = this.updateUserLocation.bind(this);
    this.updateSatDataCallback = this.updateSatDataCallback.bind(this);
    this.updateSatPassesCallback = this.updateSatPassesCallback.bind(this);
    this.processLocalSatData = this.processLocalSatData.bind(this);
    this.periodicProcessLocalSatData = this.periodicProcessLocalSatData.bind(this);
  }

  updateUserLocation(location: LatLong) {
    // re-process local data since changing observer changes satellite position
    this.setState({ userLocation: location }, () => this.processLocalSatData());
    // save state for future usage, but don't save 0,0
    if (location.latitude !== 0 && location.longitude !== 0) {
      localStorage.setItem("userLocation", JSON.stringify(location));
    }
  }

  processLocalSatData() {
    const calculated: Array<SatellitePosition> = [];
    for (let i = 0; i < localStorage.length; i++) {
      const satKey = localStorage.key(i);
      if (satKey && satKey.startsWith("SAT:")) {
        const satJson = localStorage.getItem(satKey);
        if (satJson) {
          const sat = JSON.parse(satJson) as Satellite;
          calculated.push(calculateSatellitePosition(sat, this.state.userLocation, new Date()));
        }
      }
    }
    this.setState({ satData: calculated });
  }

  periodicProcessLocalSatData() {
    console.log("Updating sat data periodicially");
    this.processLocalSatData();
    setTimeout(this.periodicProcessLocalSatData, 1000 * 15);
  }

  updateSatDataCallback() {
    getDefaultSatellites().then(() => this.processLocalSatData());
  }

  updateSatPassesCallback(satellite: string) {
    const lookup = localStorage.getItem(`SAT:${satellite}`);
    if (lookup) {
      const sat = JSON.parse(lookup) as Satellite;
      const satSpecificPasses = getFuturePasses(sat, this.state.userLocation);
      const passes = { ...this.state.satPasses };
      passes[satellite] = satSpecificPasses;
      this.setState({ satPasses: passes });
    }
  }

  componentDidMount() {
    const savedLocation = localStorage.getItem("userLocation");
    if (savedLocation) {
      this.updateUserLocation(JSON.parse(savedLocation) as LatLong)
    }
    // schedule periodic updating of locations
    this.periodicProcessLocalSatData();
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
          updateSatPassesCallback={this.updateSatPassesCallback}
        />
      ),
      map: (
        <SatMap
          userLocation={this.state.userLocation}
          satData={this.state.satData}
        />
      )
    };
    const TITLE_MAP: { [key:string]: string } = {
      controls: 'Controls',
      radar: 'Radar',
      passTable: 'Pass Table',
      map: 'World Map',
      new: 'New'
    };
    return (
      <div className="trackerWindow">
        <Mosaic
          renderTile={(id, path) => (
            <MosaicWindow<ViewId> path={path} createNode={() => 'new'} title={TITLE_MAP[id]}>
              {ELEMENT_MAP[id]}
            </MosaicWindow>
          )}
          initialValue={{
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
          }}
        />
      </div>
    );
  }
}

export default TrackerContainer;
