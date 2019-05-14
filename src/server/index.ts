// server.js
// where your node app starts

// init project
import express from 'express';
import { parseTleData, calculateSatellitePosition, getFuturePasses } from './space';
import { Satellite} from '../util/SharedTypes';
const app = express(); 

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));

// http://expressjs.com/en/starter/basic-routing.html
app.get('/', function(request, response) {
  response.sendFile(__dirname + '/app/index.html');
});

app.get('/getSatelliteData', function(request, response) {
  const forceCacheRefresh = request.query.forceCacheRefresh || false;
  parseTleData(forceCacheRefresh).then(function (satData: Array<Satellite>) {
    const calculated = [];
    const observer = {
      longitude: request.query.longitude,
      latitude: request.query.latitude
    }
    for (const sat of satData) {
      try {
        calculated.push(calculateSatellitePosition(sat, observer, new Date()));
      } catch(error) {
        console.log(`Error calculating data for satellite ${sat.name}`);
        continue;
      }
    }
    response.json(calculated);
  });
});

app.get('/futurePassData', function(request, response) {
  const requestedSatellite = request.query.id;
  const observer = {
      longitude: request.query.longitude,
      latitude: request.query.latitude
    }
  response.json(getFuturePasses(requestedSatellite, observer));
});

const listener = app.listen(process.env.PORT, function() {
  console.log("App is listening!");
});