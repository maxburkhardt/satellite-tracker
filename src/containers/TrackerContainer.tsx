import React from 'react';
import { Mosaic } from 'react-mosaic-component';
import Controls from '../components/Controls';
import Radar from '../components/Radar';
import PassTable from '../components/PassTable';
import SatMap from '../components/SatMap';
import 'react-mosaic-component/react-mosaic-component.css';
import { LatLong, SatellitePass, SatellitePosition } from '../util/SharedTypes';

export type Props = { };

export type State = {
  userLocation: LatLong;
  satData: Array<SatellitePosition>;
  satPasses: {[key: string]: Array<SatellitePass>};
};

class TrackerContainer extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      userLocation: { latitude: 0, longitude: 0 },
      satData: [],
      satPasses: {}
    };
    this.updateUserLocation = this.updateUserLocation.bind(this);
    this.updateSatDataCallback = this.updateSatDataCallback.bind(this);
    this.updateSatPassesCallback = this.updateSatPassesCallback.bind(this);
  }
  
  updateUserLocation(location: LatLong) {
    this.setState({userLocation: location});
  }
  
  updateSatDataCallback() {
    fetch('/getSatelliteData?latitude=' + this.state.userLocation.latitude + '&longitude=' + this.state.userLocation.longitude).then(resp => {
      return resp.json()
    }).then(json => {
      this.setState({satData: json})
    });
  }
  
  updateSatPassesCallback(satellite: string) {
    fetch('/futurePassData?latitude=' + this.state.userLocation.latitude + '&longitude=' + this.state.userLocation.longitude + '&id=' + satellite).then(resp => {
      return resp.json()
    }).then(json => {
      const passes = {...this.state.satPasses};
      passes[satellite] = json;
      this.setState({satPasses: passes})
    });
  }
  
  render() {
    const ELEMENT_MAP: {[key:string]: JSX.Element} = {
      controls: <Controls 
                  updateLocationCallback={this.updateUserLocation}
                  updateSatDataCallback={this.updateSatDataCallback}
                />,
      radar: <Radar
               userLocation={this.state.userLocation}
               satData={this.state.satData}
             />,
      passTable: <PassTable
                   satData={this.state.satData}
                   satPasses={this.state.satPasses}
                   updateSatPassesCallback={this.updateSatPassesCallback}
                 />,
      map: <SatMap
             userLocation={this.state.userLocation}
             satData={this.state.satData}
           />
    };
    return(
      <div className="trackerWindow">
        <h1>Satellite Tracker</h1>
          <Mosaic
            renderTile={(id) => ELEMENT_MAP[id]}
            initialValue={{
              direction: 'row',
              first: {
                direction: 'column',
                first: 'controls',
                second: 'radar'
              },
              second: {
                direction: 'column',
                first: 'passTable',
                second: 'map',
              },
              splitPercentage: 30,
            }}
          />
      </div>
    );
  }
}

export default TrackerContainer;