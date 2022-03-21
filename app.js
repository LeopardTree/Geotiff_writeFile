import fs from 'fs';
import GeoTIFF, { writeArrayBuffer, fromFile } from 'geotiff';
import { fileURLToPath } from 'url';

const toBuffer = async (ab) => {
  const buf = Buffer.alloc(ab.byteLength);
  const view = new Uint8Array(ab);
  for (let i = 0; i < buf.length; ++i) {
      buf[i] = view[i];
  }
  return buf;
}

const main = async () => {
  // const values = [0, 1, 2, 3, 4, 5, 6, 7, 8];
  // const metadata = {
  //   height: 3,
  //   width: 3
  // };
  // const arrayBuffer = await writeArrayBuffer(values, metadata);

  // console.dir(arrayBuffer);
  const tif = await fromFile('nmd.tif');
  //console.log(tif);
  const image = await tif.getImage();
  const layer = await image.readRasters();
  const raster = layer[0];

  //console.log(image);
  const values = raster;
  const imageHeight = await layer.height;
  const imageWidth = await layer.width;
  console.log(imageWidth, imageHeight);
  const geoKeys = await image.getGeoKeys();
  const fileDir = await image.getFileDirectory();
  const stripOffsets = await fileDir.stripOffsets;
  const stripByteCounts = await fileDir.stripByteCounts;
  const XResolution = await fileDir.XResolution;
  const YResolution = await fileDir.YResolution;
  const ModelPixelScale = await fileDir.ModelPixelScale;
  const ModelTiepoint = await fileDir.ModelTiepoint; 
  const GeoKeyDirectory = await fileDir.GeoKeyDirectory;
  const BitsPerSample = await fileDir.BitsPerSample;
  const GeoAsciiParams = await fileDir.GeoAsciiParams;
  const PlanarConfiguration = await fileDir.PlanarConfiguration;
  const ColorMap = await fileDir.ColorMap;
  const PhotometricInterpretation = await fileDir.PhotometricInterpretation;
  const Compression = await fileDir.Compression;
  const SamplesPerPixel = await fileDir.SamplesPerPixel;
  const Orientation = 1;
  GeoKeyDirectory.forEach(element => {
    console.log(element);
  });
  const sweref_tm = 3006;

  const metadata = {
    height: imageHeight,
    width: imageWidth,
    StripOffsets: stripOffsets,
    StripByteCounts: stripByteCounts,
    XResolution: XResolution,
    YResolution: YResolution,
    ModelPixelScale: ModelPixelScale,
    ModelTiepoint: ModelTiepoint,
    GeoKeyDirectory: GeoKeyDirectory,
    BitsPerSample: BitsPerSample,
    GeoAsciiParams: GeoAsciiParams,
    PlanarConfiguration: PlanarConfiguration,
    PhotometricInterpretation: PhotometricInterpretation,
    Compression: Compression,
    SamplesPerPixel: SamplesPerPixel,
    Orientation: Orientation,
    ProjectedCSTypeGeoKey: sweref_tm

  }
  
  //const buffer = new Uint8Array(arrayBuffer);

  //fs.createWriteStream('test3.tif').write(buffer);

  const arrayBuffer = await writeArrayBuffer(raster, metadata);
  console.log(arrayBuffer);
  const buf = await Buffer.from(arrayBuffer);
  await fs.writeFile('test5.tif', buf, (err) => {
    if(err){
      console.log(err);
    }
    
  })
}
const resulthandler = err => {
  //console.timeEnd('Duration to execute everything');
  if(err)throw err;
  console.log("Done");
}
main().then(resulthandler).catch(resulthandler);


