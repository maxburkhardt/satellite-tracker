import React from "react";

import L from "leaflet";
import { Map, Marker, Popup, TileLayer } from "react-leaflet";
import { LatLong, SatellitePosition } from "../util/SharedTypes";
import { radiansToDegrees } from "../util/DisplayUtil";

export type Props = {
  userLocation: LatLong;
  satData: Array<SatellitePosition>;
  requestPassTableSelectionCallback: (sat: string) => void;
  useDarkTheme: boolean;
};

export type State = {
  zoom: number;
};

class SatMap extends React.Component<Props, State> {
  private satMarkerSvg = require("../assets/sat_marker.svg");
  private satIcon = new L.Icon({
    iconUrl: this.satMarkerSvg,
    iconRetinaUrl: this.satMarkerSvg,
    iconAnchor: [15, 15],
    iconSize: [30, 30],
    popupAnchor: [0, -15]
  });

  constructor(props: Props) {
    super(props);
    this.state = {
      zoom: 5
    };

    this.handleSatClick = this.handleSatClick.bind(this);
    this.generateMarker = this.generateMarker.bind(this);
  }

  handleSatClick(satName: string) {
    this.props.requestPassTableSelectionCallback(satName);
  }

  generateMarker(sat: SatellitePosition): JSX.Element {
    if (!sat.latitude || !sat.longitude) {
      return <span key={sat.name} />;
    }
    return (
      <Marker
        position={[sat.latitude, sat.longitude]}
        key={sat.name}
        icon={this.satIcon}
        onClick={() => this.handleSatClick(sat.name)}
      >
        <Popup>
          <strong>{sat.name}</strong>
          <br />
          Longitude: {sat.longitude.toFixed(4)}
          <br />
          Latitude: {sat.latitude.toFixed(4)}
          <br />
          Distance: {sat.rangeSat.toFixed(2)} km
          <br />
          Height: {sat.height.toFixed(2)} km
          <br />
          Azimuth: {radiansToDegrees(sat.azimuth)}
          <br />
          Elevation: {radiansToDegrees(sat.elevation)}
        </Popup>
      </Marker>
    );
  }

  latLongToLeafletCoords(position: LatLong): [number, number] {
    return [position.latitude, position.longitude];
  }

  render() {
    const groundStationSvg = this.props.useDarkTheme
      ? require("../assets/ground_station_light.svg")
      : require("../assets/ground_station.svg");
    const groundStationIcon = new L.Icon({
      iconUrl: groundStationSvg,
      iconRetinaUrl: groundStationSvg,
      iconAnchor: [15, 15],
      iconSize: [30, 30],
      popupAnchor: [0, -15]
    });

    const satMarkers: JSX.Element[] = this.props.satData.map(
      this.generateMarker
    );
    return (
      <Map
        center={this.latLongToLeafletCoords(this.props.userLocation)}
        zoom={this.state.zoom}
      >
        <TileLayer
          url={
            this.props.useDarkTheme
              ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png"
              : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png"
          }
        />
        <Marker
          position={this.latLongToLeafletCoords(this.props.userLocation)}
          icon={groundStationIcon}
        >
          <Popup>Your Location</Popup>
        </Marker>
        {satMarkers}
      </Map>
    );
  }
}

export default SatMap;
