import fetch from "node-fetch";

export default async function handler(req, res) {
  const { z, x, y } = req.query;

  const n = Math.pow(2, z);
  const lon1 = (x / n) * 360 - 180;
  const lon2 = ((+x + 1) / n) * 360 - 180;
  const lat1 = (Math.atan(Math.sinh(Math.PI * (1 - 2 * (+y + 1) / n))) * 180) / Math.PI;
  const lat2 = (Math.atan(Math.sinh(Math.PI * (1 - 2 * y / n))) * 180) / Math.PI;

  const bbox = `${lon1},${lat2},${lon2},${lat1}`;
  const wmsUrl = `https://gdi.berlin.de/services/wms/berlin1900?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&LAYERS=berlin1900&SRS=EPSG:4326&BBOX=${bbox}&WIDTH=256&HEIGHT=256&FORMAT=image/png`;

  const response = await fetch(wmsUrl);
  const buffer = await response.arrayBuffer();

  res.setHeader("Content-Type", "image/png");
  res.send(Buffer.from(buffer));
}
