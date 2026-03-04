import fetch from "node-fetch";

export default async function handler(req, res) {
  const { layer, z, x, y } = req.query;

  if ([layer, z, x, y].some(v => v === undefined)) {
    res.status(400).send("Missing layer, z, x or y");
    return;
  }

  const zInt = parseInt(z);
  const xInt = parseInt(x);
  const yInt = parseInt(y);

  // WebMercator → EPSG:4326 Umrechnung
  const n = Math.pow(2, zInt);

  const lonMin = (xInt / n) * 360 - 180;
  const lonMax = ((xInt + 1) / n) * 360 - 180;

  const latMax = (Math.atan(Math.sinh(Math.PI * (1 - 2 * yInt / n))) * 180) / Math.PI;
  const latMin = (Math.atan(Math.sinh(Math.PI * (1 - 2 * (yInt + 1) / n))) * 180) / Math.PI;

  let wmsUrl;

  switch (layer) {
    /**
     * Berlin 1900 (bestehend)
     * WMS 1.1.1 – Achsenreihenfolge lon,lat,lon,lat
     */
    case "berlin1900":
      const bboxBerlin = `${lonMin},${latMin},${lonMax},${latMax}`;
      wmsUrl =
        `https://gdi.berlin.de/services/wms/berlin1900` +
        `?SERVICE=WMS` +
        `&VERSION=1.1.1` +
        `&REQUEST=GetMap` +
        `&LAYERS=b_berlin1900_flaechen` +
        `&STYLES=` +
        `&SRS=EPSG:4326` +
        `&BBOX=${bboxBerlin}` +
        `&WIDTH=256&HEIGHT=256` +
        `&FORMAT=image/png`;
      break;

    /**
     * Liebenow 1867 (NEU)
     * WMS 1.3.0 – Achsenreihenfolge lat,lon,lat,lon
     */
    case "liebenow1867":
      const bboxLiebenow = `${latMin},${lonMin},${latMax},${lonMax}`;
      wmsUrl =
        `https://histomapberlin.de:8443/geoserver/liebenow_1867/ows` +
        `?SERVICE=WMS` +
        `&VERSION=1.3.0` +
        `&REQUEST=GetMap` +
        `&LAYERS=liebenow_1867,liebenow_1867` +
        `&STYLES=` +
        `&CRS=EPSG:4326` +
        `&BBOX=${bboxLiebenow}` +
        `&WIDTH=256&HEIGHT=256` +
        `&FORMAT=image/png` +
        `&TRANSPARENT=TRUE`;
      break;

    default:
      res.status(404).send(`Unknown layer: ${layer}`);
      return;
  }

  try {
    const response = await fetch(wmsUrl);
    if (!response.ok) {
      res.status(500).send(`WMS request failed: ${response.status}`);
      return;
    }

    const buffer = await response.arrayBuffer();
    res.setHeader("Content-Type", "image/png");
    res.send(Buffer.from(buffer));
  } catch (err) {
    res.status(500).send(`Error fetching WMS tile: ${err}`);
  }
}
