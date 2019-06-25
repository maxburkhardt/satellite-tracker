import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import request from "request-promise";
import { Response } from "request";

const app = admin.initializeApp();

export type SatelliteTle = {
  name: string;
  line1: string;
  line2: string;
};

function spaceTrackLogin() {
  const LOGIN_URL = "https://www.space-track.org/ajaxauth/login";
  return request({
    uri: LOGIN_URL,
    method: "POST",
    formData: {
      identity: functions.config().spacetrack.identity,
      password: functions.config().spacetrack.password
    },
    resolveWithFullResponse: true
  });
}

export const refreshTle = functions.https.onRequest(
  (incomingRequest, outgoingResponse) => {
    const SPACETRACK_AMATEUR_CURATED_URL =
      "https://www.space-track.org/basicspacedata/query/class/tle_latest/ORDINAL/1/EPOCH/%3Enow-30/orderby/NORAD_CAT_ID/format/3le/favorites/Amateur";
    const parsed: Array<SatelliteTle> = [];
    // Placeholder until we write to cloud storage
    let appName = app.name;
    appName = appName;
    // End placeholder
    spaceTrackLogin()
      .then(function(loginResponse: Response) {
        console.log(
          `LOGIN STATUS: ${loginResponse.statusCode}, ${loginResponse.statusMessage}`
        );
        console.log(`HEADERS: ${JSON.stringify(loginResponse.headers)}`);
        return "placeholder";
      })
      .then(function() {
        request({
          uri: SPACETRACK_AMATEUR_CURATED_URL,
          resolveWithFullResponse: true
        }).then(function(response: Response) {
          console.log(
            `RESPONSE STATUS: ${response.statusCode} ${response.statusMessage} BODY: ${response.body}`
          );
          let data: string[] = response.body.split("\n");
          for (let i = 0; i < data.length; i += 3) {
            parsed.push({
              name: data[i],
              line1: data[i + 1],
              line2: data[i + 2]
            });
          }
          outgoingResponse.send(JSON.stringify(parsed));
        });
      });
  }
);
