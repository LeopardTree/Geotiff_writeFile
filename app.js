import fs from 'fs';
import GeoTIFF, { writeArrayBuffer, fromFile, fromArrayBuffer } from 'geotiff';
import gdal from 'gdal';
const main = async () => {

  const tif = await fromFile('pine.tif');
  //console.log(tif);
  const image = await tif.getImage();
  console.log(image);
  const layer = await image.readRasters();
  const raster = layer[0];

  //console.log(image);
  const values = raster;
  const imageHeight = await layer.height;
  const imageWidth = await layer.width;
  const geoKeys = await tif.geoKeys;
  let fileDir = await image.getFileDirectory();
  const stripOffsets = await image.fileDirectory.StripOffsets;
  const stripByteCounts = await image.fileDirectory.StripByteCounts;
  let XResolution = await fileDir.XResolution;
  let YResolution = await fileDir.YResolution;
  if(!XResolution){
    XResolution = [1, 1];
  }
  if(!YResolution){
    YResolution = [1, 1];
  }
  const ModelPixelScale = await fileDir.ModelPixelScale;
  const ModelTiepoint = await fileDir.ModelTiepoint; 
  const GeoKeyDirectory = await image.fileDirectory.GeoKeyDirectory;
  const BitsPerSample = await fileDir.BitsPerSample;
  const GeoAsciiParams = await fileDir.GeoAsciiParams;

  //If SamplesPerPixel is 1, PlanarConfiguration is irrelevant, and need not be included. https://www.itu.int/itudoc/itu-t/com16/tiff-fx/docs/tiff6.pdf page 38
  const PlanarConfiguration = await fileDir.PlanarConfiguration;
  const ColorMap = await image.fileDirectory.ColorMap;
  const PhotometricInterpretation = await fileDir.PhotometricInterpretation;
  const Compression = await fileDir.Compression;
  const SamplesPerPixel = await fileDir.SamplesPerPixel;
  const Orientation = 1;
  const ModelTransformation = await fileDir.ModelTransformation;
  const GDAL_METADATA = await fileDir.GDAL_METADATA;
  const Software = await fileDir.software;
  const ProjectedCSTypeGeoKey = await image.geoKeys.ProjectedCSTypeGeoKey;
  const RowsPerStrip = await fileDir.RowsPerStrip;
  const ResolutionUnit = await fileDir.ResolutionUnit;
  const SubfileType = 1;
  const SampleFormat = await fileDir.SampleFormat;


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
    GeoAsciiParams: GeoAsciiParams,
    PhotometricInterpretation: 3,
    Compression: Compression,
    SamplesPerPixel: SamplesPerPixel,
    ProjectedCSTypeGeoKey: ProjectedCSTypeGeoKey,
    DateTime: '',
    Orientation: Orientation,

  }

  let dataset = gdal.open('nmd.tif');
  console.log(dataset);

  const numBands = 1;
  const driver = gdal.Driver;
  const dst_ds = driver.create('nmd_copy.tif', imageWidth, imageHeight, numBands, gdal.GDT_Byte);
  console.log(dst_ds); 



  // let writeStream = fs.createWriteStream('pine_copy3.tif');

  // // write some data with encoding
  // writeStream.write(buffer, 'utf8');

  // // the finish event is emitted when all data has been flushed from the stream
  // writeStream.on('finish', () => {
  //   console.log('wrote all data to file');
  // });

  // // close the stream
  // writeStream.end();

}
const resulthandler = err => {
  //console.timeEnd('Duration to execute everything');
  if(err)throw err;
  console.log("Done");
}
main().then(resulthandler).catch(resulthandler);



// info about tif from https://www.itu.int/itudoc/itu-t/com16/tiff-fx/docs/tiff6.pdf