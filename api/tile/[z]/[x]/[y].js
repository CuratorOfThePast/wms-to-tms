import fetch from "node-fetch";

/**
 * WMS → TMS Proxy (Berlin 1900 Flächen)
 * Wandelt TMS Tile-Koordinaten {z}/{x}/{y} in WMS BBOX (EPSG:4326) um
 */
export default async function handler(req, res) {
  const { z, x, y } = req.query;

  if ([z, x, y].some(v => v === undefined)) {
    res.status(400).send("Missing z, x or y");
    return;
  }

  const zInt = parseInt(z);
  const xInt = parseInt(x);
  const yInt = parseInt(y);

  // WebMercator → EPSG:4326-Umrechnung
  const n = Math.pow(2, zInt);
  const lon1 = (xInt / n) * 360 - 180;
  const lon2 = ((xInt + 1) / n) * 360 - 180;
  const lat1 = (Math.atan(Math.sinh(Math.PI * (1 - 2 * yInt / n))) * 180) / Math.PI;
  const lat2 = (Math.atan(Math.sinh(Math.PI * (1 - 2 * (yInt + 1) / n))) * 180) / Math.PI;
  const bbox = `${lon1},${lat2},${lon2},${lat1}`;
  
 //URL
  const wmsUrl = `https://gdi.berlin.de/services/wms/berlin1900?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&LAYERS=b_berlin1900_flaechen&STYLES=&SRS=EPSG:4326&BBOX=${bbox}&WIDTH=256&HEIGHT=256&FORMAT=image/png`;

  try {
    const response = await fetch(wmsUrl, { headers: { "Accept": "image/png" } });

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
