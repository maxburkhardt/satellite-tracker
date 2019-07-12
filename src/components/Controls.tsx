import React from "react";
import { Button, FormGroup, InputGroup } from "@blueprintjs/core";
import {
  LatLong,
  GeolocationOutput,
  GeolocationError
} from "../util/SharedTypes";

export type Props = {
  userLocation: LatLong;
  updateLocationCallback: (newPosition: LatLong) => void;
};

export type State = {
  latitudeInput: string;
  longitudeInput: string;
};

class Controls extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      latitudeInput: this.props.userLocation.latitude.toString(),
      longitudeInput: this.props.userLocation.longitude.toString()
    };
    this.geolocateClick = this.geolocateClick.bind(this);
    this.getGeoSuccess = this.getGeoSuccess.bind(this);
    this.getGeoError = this.getGeoError.bind(this);
    this.handleLatitudeInput = this.handleLatitudeInput.bind(this);
    this.handleLongitudeInput = this.handleLongitudeInput.bind(this);
    this.validateInput = this.validateInput.bind(this);
    this.updateLocation = this.updateLocation.bind(this);
  }

  getGeoSuccess(position: GeolocationOutput) {
    this.setState({
      latitudeInput: position.coords.latitude.toString(),
      longitudeInput: position.coords.longitude.toString()
    });
    const newPosition = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude
    };
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

  validateInput(): LatLong | null {
    const latNum: number = parseFloat(this.state.latitudeInput);
    const longNum: number = parseFloat(this.state.longitudeInput);
    if (!isNaN(latNum) && !isNaN(longNum)) {
      return { latitude: latNum, longitude: longNum };
    } else {
      return null;
    }
  }

  updateLocation(): void {
    const validated = this.validateInput();
    if (validated) {
      this.props.updateLocationCallback(validated);
    } else {
      // inform user of error
    }
  }

  handleLatitudeInput(event: React.SyntheticEvent) {
    const target = event.target as HTMLInputElement;
    this.setState({ latitudeInput: target.value });
  }

  handleLongitudeInput(event: React.SyntheticEvent) {
    const target = event.target as HTMLInputElement;
    this.setState({ longitudeInput: target.value });
  }

  componentDidMount() {
    this.setState({
      latitudeInput: this.props.userLocation.latitude.toString(),
      longitudeInput: this.props.userLocation.longitude.toString()
    });
  }

  render() {
    return (
      <div className="scroll-container">
        <FormGroup label="Ground station location">
          <InputGroup
            id="latitudeInput"
            placeholder="Latitude"
            value={this.state.latitudeInput}
            onChange={this.handleLatitudeInput}
          />
          <InputGroup
            id="longitudeInput"
            placeholder="Longitude"
            value={this.state.longitudeInput}
            onChange={this.handleLongitudeInput}
          />
          <Button onClick={this.updateLocation}>Set Location</Button>
          <Button onClick={this.geolocateClick}>Geolocate me!</Button>
        </FormGroup>
      </div>
    );
  }
}

export default Controls;
