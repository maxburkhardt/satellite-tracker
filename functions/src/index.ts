import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import request, {
  RequestPromise,
  RequestPromiseOptions
} from "request-promise";
import { RequestAPI, RequiredUriUrl } from "request";

const app = admin.initializeApp({
  storageBucket: functions.config().storage.bucket
});

export type SatelliteTle = {
  name: string;
  line1: string;
  line2: string;
};

async function spaceTrackLogin(
  requestApi: RequestAPI<RequestPromise, RequestPromiseOptions, RequiredUriUrl>
) {
  const LOGIN_URL = "https://www.space-track.org/ajaxauth/login";
  const response = await requestApi({
    uri: LOGIN_URL,
    method: "POST",
    formData: {
      identity: functions.config().spacetrack.identity,
      password: functions.config().spacetrack.password
    },
    resolveWithFullResponse: true
  });
  console.log(
    `Space-Track login status: ${response.statusCode} ${response.statusMessage}`
  );
  return response;
}

async function downloadTle(
  requestApi: RequestAPI<RequestPromise, RequestPromiseOptions, RequiredUriUrl>
) {
  const SPACETRACK_AMATEUR_CURATED_URL =
    "https://www.space-track.org/basicspacedata/query/class/tle_latest/ORDINAL/1/EPOCH/%3Enow-30/orderby/NORAD_CAT_ID/format/3le/favorites/Amateur";
  const response = await requestApi({
    uri: SPACETRACK_AMATEUR_CURATED_URL,
    resolveWithFullResponse: true
  });
  console.log(
    `TLE fetch status: ${response.statusCode} ${response.statusMessage}`
  );
  const data: string[] = response.body
    .replace(/\r/g, "")
    .split("\n")
    .filter((line: string) => !(line.trim() === ""));
  const parsed: Array<SatelliteTle> = [];
  for (let i = 0; i < data.length; i += 3) {
    parsed.push({
      name: data[i],
      line1: data[i + 1],
      line2: data[i + 2]
    });
  }
  return parsed;
}

export const refreshTle = functions.https.onRequest(
  async (_incomingRequest, outgoingResponse) => {
    // Placeholder until we write to cloud storage
    let appName = app.name;
    appName = appName;
    // End placeholder
    const cookieJar = request.jar();
    const customRequest = request.defaults({ jar: cookieJar });
    await spaceTrackLogin(customRequest);
    const parsed = await downloadTle(customRequest);
    return outgoingResponse.send(JSON.stringify(parsed));
  }
);
