import fs from 'fs';
import GeoTIFF, { writeArrayBuffer, fromFile, fromArrayBuffer } from 'geotiff';
import gdal from 'gdal';
const main = async () => {

  const tif = await fromFile('nmd.tif');
  //console.log(tif);
  const image = await tif.getImage();
  const layer = await image.readRasters();
  const raster = layer[0];

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
  //https://stackoverflow.com/questions/58280379/how-to-find-the-type-of-a-typedarray
  function checkTypedArrayType(someTypedArray) {
    return someTypedArray && 
      someTypedArray.constructor && 
      someTypedArray.constructor.name || 
      null;
  }
  const arrtype = checkTypedArrayType(raster);

  let dataset = gdal.open('nmd.tif');
  
  console.log(dataset);
  // const dst_ds = driver.create('nmd_copy.tif', imageWidth, imageHeight, numBands, gdal.GDT_Byte);
  // console.log(dst_ds); 
  // create geotiff driver
  const driver = gdal.drivers.get('GTiff');
  //create destination dataset
  let dst_ds = driver.create('nmd_copy_gdal.tif', 500, 500, 1, arrtype);
  //console.log(dst_ds);

  //create coordinatesystem object
  const crs = new gdal.SpatialReference.fromEPSG(3006);
  const epsg = 3006;
  //set spatialreference
  const wkt = crs.toWKT();
  //set transformation 
  const bbox = image.getBoundingBox();
  const xmin = bbox[0];
  const ymax = bbox[3];
  // transformation array. 0 means north is up in relation to the axle
  // trf = [xmin, pixelwidth, Xnorth_scalar, ymax, Ynorth_scalar, pixelheight]
  const trf = [xmin, ModelPixelScale[0], 0, ymax, 0, -ModelPixelScale[1]];

  //set projection and geotranform
  dst_ds.geoTransform = trf;
  dst_ds.srs = crs;
  console.log(dst_ds);
  //add data
  
  const band1 = dst_ds.bands.get(1);
  //band1.colorInterpretation = "GCI_PaletteIndex";
  band1.pixels.write(0, 0, 500, 500, raster);
  
  
  
  dst_ds.flush();
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