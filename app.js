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
  const geoKeys = await tif.geoKeys;
  let fileDir = await image.getFileDirectory();
  let stripOffsets = await image.stripOffsets;
  let stripByteCounts = await fileDir.stripByteCounts;
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
  const ModelTransformation = await fileDir.ModelTransformation;
  const GDAL_METADATA = await fileDir.GDAL_METADATA;
  const Software = await fileDir.software;
  const ProjectedCSTypeGeoKey = await image.geoKeys.ProjectedCSTypeGeoKey;

  // console.log(ModelTransformation);

  // console.log(tif);
  // console.log(image);
  // console.dir('geoKeyDirectory: ' + GeoKeyDirectory);
  // console.log(GeoAsciiParams);

  const sweref_tm = 3006;

  // const metadata = {
  //   height: imageHeight,
  //   width: imageWidth,
  //   StripOffsets: stripOffsets,
  //   StripByteCounts: stripByteCounts,
  //   XResolution: XResolution,
  //   YResolution: YResolution,
  //   ModelPixelScale: ModelPixelScale,
  //   ModelTiepoint: ModelTiepoint,
  //   GeoKeyDirectory: GeoKeyDirectory,
  //   BitsPerSample: BitsPerSample,
  //   GeoAsciiParams: GeoAsciiParams,
  //   PlanarConfiguration: PlanarConfiguration,
  //   PhotometricInterpretation: 1,
  //   Compression: Compression,
  //   SamplesPerPixel: SamplesPerPixel,
  //   Orientation: Orientation,
  //   ProjectedCSTypeGeoKey: ProjectedCSTypeGeoKey,
  //   DateTime: '',
  //   //ProjectedCSTypeGeoKey: 3006,
  //   //ProjLinearUnitsGeoKey: 9001

  // }

  // const metadata = {};
  // await Object.assign(metadata, image.fileDirectory);

  // if(metadata.ColorMap){
  //   delete metadata.ColorMap;
  // }
  // console.log(metadata);


  const metadata ={
    ImageWidth: 500,
    ImageLength: 500,
    BitsPerSample: BitsPerSample,
    Compression: 1,
    PhotometricInterpretation: 3,
    StripOffsets: await image.fileDirectory.StripOffsets,
    SamplesPerPixel: 1,
    RowsPerStrip: 16,
    StripByteCounts: await image.fileDirectory.StripByteCounts,
    PlanarConfiguration: 1,
    ResolutionUnit: 2,
    Software: await image.fileDirectory.Software,
    SampleFormat: [ 1 ],
    ModelPixelScale: [ 10, 10, 0 ],
    ModelTiepoint: [ 0, 0, 0, 550000, 6455000, 0 ],
    GeoKeyDirectory: await image.fileDirectory.GeoKeyDirectory,
    GeoAsciiParams: GeoAsciiParams,
    ProjectedCSTypeGeoKey: 3006

  }

  console.log(fileDir);
  //const buffer = new Uint8Array(arrayBuffer);

  //

  const arrayBuffer = await writeArrayBuffer(raster, metadata);
  console.log(arrayBuffer);
  const buf = await Buffer.from(arrayBuffer);
  // await fs.writeFile('nmd_copy4.tif', buf, (err) => {
  //   if(err){
  //     console.log(err);
  //   }
    
  // })
  fs.createWriteStream('test4.tif').write(buf);
}
const resulthandler = err => {
  //console.timeEnd('Duration to execute everything');
  if(err)throw err;
  console.log("Done");
}
main().then(resulthandler).catch(resulthandler);


