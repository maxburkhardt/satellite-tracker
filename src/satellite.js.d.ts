/* eslint-disable @typescript-eslint/class-name-casing */
declare module "satellite.js" {
    interface satrec {
        error: number;
        satnum: string;
        epochyr: number;
        epochdays: number;
        ndot: number;
        nddot: number;
        bstar: number;
        inclo: number;
        nodeo: number;
        ecco: number;
        argpo: number;
        mo: number;
        no: number;
        a: number;
        alta: number;
        altp: number;
        jdsatepoch: number;
        isimp: number;
        method: string;
        aycof: number;
        con41: number;
        cc1: number;
        cc4: number;
        cc5: number;
        d2: number;
        d3: number;
        d4: number;
        delmo: number;
        eta: number;
        argpdot: number;
        omgcof: number;
        sinmao: number;
        t: number;
        t2cof: number;
        t3cof: number;
        t4cof: number;
        t5cof: number;
        x1mth2: number;
        x7thm1: number;
        mdot: number;
        nodedot: number;
        xlcof: number;
        xmcof: number;
        nodecf: number;
        irez: number;
        d2201: number;
        d2211: number;
        d3210: number;
        d3222: number;
        d4410: number;
        d4422: number;
        d5220: number;
        d5232: number;
        d5421: number;
        d5433: number;
        dedt: number;
        del1: number;
        del2: number;
        del3: number;
        didt: number;
        dmdt: number;
        dnodt: number;
        domdt: number;
        e3: number;
        ee2: number;
        peo: number;
        pgho: number;
        pho: number;
        pinco: number;
        plo: number;
        se2: number;
        se3: number;
        sgh2: number;
        sgh3: number;
        sgh4: number;
        sh2: number;
        sh3: number;
        si2: number;
        si3: number;
        sl2: number;
        sl3: number;
        sl4: number;
        gsto: number;
        xfact: number;
        xgh2: number;
        xgh3: number;
        xgh4: number;
        xh2: number;
        xh3: number;
        xi2: number;
        xi3: number;
        xl2: number;
        xl3: number;
        xl4: number;
        xlamo: number;
        zmol: number;
        zmos: number;
        atime: number;
        xli: number;
        xni: number;
        operationmode: string;
        init: string;
    };

    interface coordinates {
        x: number;
        y: number;
        z: number;
    }

    interface geodeticCoordinates {
        latitude: number;
        longitude: number;
        height: number;
    }

    interface positionAndVelocity {
        position: coordinates;
        velocity: coordinates;
    }

    interface lookAngles {
        azimuth: number;
        elevation: number;
        rangeSat: number;
    }

    function twoline2satrec(tleLine1: string, tleLine2: string): satrec;

    function propagate(satrec: satrec, date: Date): positionAndVelocity;

    function sgp4(satrec: satrec, timeSinceTleEpochMinutes: number): positionAndVelocity;

    function degreesToRadians(degrees: number): number;

    function gstime(date: Date): number;

    function eciToEcf(position: coordinates, gstime: number): coordinates;

    function eciToGeodetic(position: coordinates, gstime: number): geodeticCoordinates;

    function ecfToLookAngles(observer: geodeticCoordinates, ecf: coordinates): lookAngles;

    function geodeticToEcf(position: geodeticCoordinates): coordinates;

    function dopplerFactor(observerEcf: coordinates, positionEcf: coordinates, velocityEcf: coordinates): number;

    function degreesLong(radians: number): number;

    function degreesLat(radians: number): number;
}