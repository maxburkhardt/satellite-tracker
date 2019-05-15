import React from "react";

import OlMap from "ol/Map";
import OlView from "ol/View";
import OlFill from "ol/style/Fill";
import OlText from "ol/style/Text";
import OlFeature from "ol/Feature";
import OlPoint from "ol/geom/Point";
import OlStyle from "ol/style/Style";
import OlStroke from "ol/style/Stroke";
import OlCircle from "ol/style/Circle";
import OlVectorSource from "ol/source/Vector";
import OlVectorLayer from "ol/layer/Vector";
import OlLayerTile from "ol/layer/Tile";
import OlSourceOsm from "ol/source/OSM";
import { fromLonLat } from "ol/proj";
import { LatLong, SatellitePosition } from "../util/SharedTypes";
import { StyleFunction } from "openlayers";

export type Props = {
  userLocation: LatLong;
  satData: Array<SatellitePosition>;
};

export type State = {
  mapDivId: string;
  map: OlMap;
  groundStationLocation: LatLong;
};

class SatMap extends React.Component<Props, State> {
  private satelliteLayer?: OlVectorLayer;
  constructor(props: Props) {
    super(props);
    const layerTileOptions = {
      name: "OSM",
      source: new OlSourceOsm({
        // want dark mode?
        // url: 'https://{a-c}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png'
        url: "https://{a-c}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png"
      })
    };
    this.state = {
      mapDivId: "satMapDiv",
      map: new OlMap({
        layers: [new OlLayerTile(layerTileOptions)],
        view: new OlView({
          // default view in Houston, because mission control.
          center: fromLonLat([-95.36327, 29.76328]),
          zoom: 4
        })
      }),
      groundStationLocation: { longitude: 0, latitude: 0 }
    };

    this.generateMarkers = this.generateMarkers.bind(this);
    this.generateSatMapLayer = this.generateSatMapLayer.bind(this);
  }

  satMapMarkerStyle(feature: OlFeature, zoomLevel: number) {
    return [
      new OlStyle({
        image: new OlCircle({
          radius: 4,
          fill: new OlFill({
            color: "rgba(255,0,0,1)"
          }),
          stroke: new OlStroke({
            color: "rgba(255,0,0,1)",
            width: 1
          })
        }),
        text: new OlText({
          fill: new OlFill({ color: "#000" }),
          stroke: new OlStroke({
            color: "#fff",
            width: 2
          }),
          offsetX: 10,
          textAlign: "left",
          text: feature.get("name")
        })
      })
    ];
  }

  generateMarkers(sat: SatellitePosition) {
    const mapFeature = new OlFeature({
      geometry: new OlPoint(fromLonLat([sat.longitude, sat.latitude])),
      name: sat.name
    });
    mapFeature.setStyle(this.satMapMarkerStyle as StyleFunction);
    return mapFeature;
  }

  generateSatMapLayer() {
    const markers = this.props.satData.map(this.generateMarkers);
    const vectorSource = new OlVectorSource({
      features: markers
    });
    return new OlVectorLayer({
      source: vectorSource
    });
  }

  componentDidMount() {
    this.state.map.setTarget(this.state.mapDivId);
  }

  componentDidUpdate() {
    // check to see if we should update ground station location
    if (
      this.props.userLocation.latitude !==
        this.state.groundStationLocation.latitude ||
      this.props.userLocation.longitude !==
        this.state.groundStationLocation.longitude
    ) {
      this.state.map.getView().animate(
        { zoom: 4 },
        {
          center: fromLonLat([
            this.props.userLocation.longitude,
            this.props.userLocation.latitude
          ])
        }
      );
      this.setState({ groundStationLocation: this.props.userLocation });
    }

    const newSatelliteLayer = this.generateSatMapLayer();
    if (this.satelliteLayer) {
      this.state.map.removeLayer(this.satelliteLayer);
    }
    this.state.map.addLayer(newSatelliteLayer);
    this.satelliteLayer = newSatelliteLayer;
  }

  render() {
    return (
      <div>
        <div id={this.state.mapDivId} className="map" />
      </div>
    );
  }
}

export default SatMap;
