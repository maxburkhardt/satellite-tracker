import React from "react";

import L from "leaflet";
import { Map, Marker, Popup, TileLayer } from "react-leaflet";
import { LatLong, SatellitePosition } from "../util/SharedTypes";

export type Props = {
  userLocation: LatLong;
  satData: Array<SatellitePosition>;
};

export type State = {
  zoom: number;
};

class SatMap extends React.Component<Props, State> {
  private satIcon = new L.Icon({
    iconUrl: require("../assets/sat_marker.svg"),
    iconRetinaUrl: require("../assets/sat_marker.svg"),
    iconAnchor: [15, 15],
    iconSize: [30, 30],
    popupAnchor: [0, -15]
  });

  constructor(props: Props) {
    super(props);
    this.state = {
      zoom: 5
    };

    this.generateMarker = this.generateMarker.bind(this);
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
      >
        <Popup>
          <strong>{sat.name}</strong>
          <br />
          Longitude: {sat.longitude}
          <br />
          Latitude: {sat.latitude}
          <br />
          Distance: {sat.rangeSat}
        </Popup>
      </Marker>
    );
  }

  latLongToLeafletCoords(position: LatLong): [number, number] {
    return [position.latitude, position.longitude];
  }

  render() {
    const satMarkers: JSX.Element[] = this.props.satData.map(
      this.generateMarker
    );
    return (
      <Map
        center={this.latLongToLeafletCoords(this.props.userLocation)}
        zoom={this.state.zoom}
      >
        <TileLayer
          // want dark mode?
          // url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png"
        />
        {satMarkers}
      </Map>
    );
  }
}

export default SatMap;
