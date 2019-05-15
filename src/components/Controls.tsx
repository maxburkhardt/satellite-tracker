import React from "react";
import {
  LatLong,
  GeolocationOutput,
  GeolocationError
} from "../util/SharedTypes";

export type Props = {
  userLocation: LatLong;
  updateLocationCallback: (newPosition: LatLong) => void;
  updateSatDataCallback: () => void;
};

class Controls extends React.Component<Props, LatLong> {
  constructor(props: Props) {
    super(props);
    this.state = { latitude: 0, longitude: 0 };
    this.geolocateClick = this.geolocateClick.bind(this);
    this.getGeoSuccess = this.getGeoSuccess.bind(this);
    this.getGeoError = this.getGeoError.bind(this);
    this.aboveMeClick = this.aboveMeClick.bind(this);
    this.handleLatitudeInput = this.handleLatitudeInput.bind(this);
    this.handleLongitudeInput = this.handleLongitudeInput.bind(this);
  }

  getGeoSuccess(position: GeolocationOutput) {
    const newPosition = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude
    };
    this.setState(newPosition);
    this.props.updateLocationCallback(newPosition);
  }

  getGeoError(positionError: GeolocationError) {
    alert(`Geo error ${positionError.code}: ${positionError.message}`);
  }

  geolocateClick(event: React.SyntheticEvent) {
    event.preventDefault();
    const nav = window.navigator;
    if ("geolocation" in nav) {
      nav.geolocation.getCurrentPosition(this.getGeoSuccess, this.getGeoError, {
        timeout: 5000
      });
    } else {
      alert("Sorry, geolocation isn't available in your browser.");
    }
  }

  aboveMeClick(event: React.SyntheticEvent) {
    event.preventDefault();
    this.props.updateLocationCallback(this.state);
    this.props.updateSatDataCallback();
  }

  handleLatitudeInput(event: React.SyntheticEvent) {
    const target = event.target as HTMLInputElement;
    this.setState({ latitude: parseFloat(target.value) });
  }

  handleLongitudeInput(event: React.SyntheticEvent) {
    const target = event.target as HTMLInputElement;
    this.setState({ longitude: parseFloat(target.value) });
  }

  componentDidMount() {
    this.setState({ latitude: this.props.userLocation.latitude, longitude: this.props.userLocation.longitude })
  }

  render() {
    return (
      <div>
        <form>
          <strong>Your location:</strong>
          <div>
            <div>
              Latitude:{" "}
              <input
                type="text"
                value={this.state.latitude}
                onChange={this.handleLatitudeInput}
              />
            </div>
            <div>
              Longitude:{" "}
              <input
                type="text"
                value={this.state.longitude}
                onChange={this.handleLongitudeInput}
              />
            </div>
            <button onClick={this.geolocateClick}>Geolocate me!</button>
            <button onClick={this.aboveMeClick}>Load latest data</button>
          </div>
        </form>
      </div>
    );
  }
}

export default Controls;
