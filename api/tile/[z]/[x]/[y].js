import fetch from "node-fetch";

/**
 * Vercel Serverless Function für Berlin1900-Tiles (b_berlin1900_flaechen)
 * Tile-Koordinaten {z}/{x}/{y} werden in EPSG:3857-BBOX umgerechnet.
 */

export default async function handler(req, res) {
  const { z, x, y } = req.query;

  if ([z, x, y].some(v => v === undefined)) {
    res.status(400).send("Missing z, x or y");
    return;
  }

  const tileSize = 256;
  const zInt = parseInt(z);
  const xInt = parseInt(x);
  const yInt = parseInt(y);

  // WebMercator Grenzen
  const initialResolution = 2 * Math.PI * 6378137 / tileSize; // 156543.03392804062
  const originShift = 2 * Math.PI * 6378137 / 2.0; // 20037508.342789244

  // Tile in EPSG:3857 BBOX umrechnen
  const resolution = initialResolution / Math.pow(2, zInt);
  const minx = xInt * tileSize * resolution - originShift;
  const maxx = (xInt + 1) * tileSize * resolution - originShift;
  const miny = originShift - (yInt + 1) * tileSize * resolution;
  const maxy = originShift - yInt * tileSize * resolution;

  const bbox = `${minx},${miny},${maxx},${maxy}`;

  // WMS URL
  const wmsUrl = `https://gdi.berlin.de/services/wms/berlin1900?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&LAYERS=b_berlin1900_flaechen&SRS=EPSG:3857&BBOX=${bbox}&WIDTH=256&HEIGHT=256&FORMAT=image/png`;

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
