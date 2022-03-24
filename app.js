import fs from 'fs';
import GeoTIFF, { writeArrayBuffer, fromFile, fromArrayBuffer } from 'geotiff';



const main = async () => {

  const tif = await fromFile('birch.tif');
  //console.log(tif);
  const image = await tif.getImage();
  console.log(image);
  const layer = await image.readRasters();
  const raster = layer[0];

  //console.log(image);
  const values = raster;
  for(let i = 0; i < values.length; i++){
    values[i] = values[i]*100;
  }
  console.log(values);
  const imageHeight = await layer.height;
  const imageWidth = await layer.width;
  const geoKeys = await tif.geoKeys;
  let fileDir = await image.getFileDirectory();
  const stripOffsets = await image.fileDirectory.StripOffsets;
  const stripByteCounts = await image.fileDirectory.StripByteCounts;
  let XResolution = await fileDir.XResolution;
  let YResolution = await fileDir.YResolution;
  const AxeResolution = async (XResolution, YResolution) => {
    const array = [];
    if(!XResolution){
      array.push([1, 1]);
    }
    else{
      array.push(XResolution);
    }
    if(!YResolution){
      array.push([1, 1]);
    }
    else{
      array.push(YResolution);
    }
    return array;
  }
  [XResolution, YResolution] = await AxeResolution(XResolution, YResolution);

  
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
    PhotometricInterpretation: PhotometricInterpretation,
    Compression: Compression,
    SamplesPerPixel: SamplesPerPixel,
    ProjectedCSTypeGeoKey: ProjectedCSTypeGeoKey,
    DateTime: '',
    Orientation: Orientation

  }

  // half functioning, not working with resolutionUnit, rowsPerStrip, bitsPerSample, ColorMap and many more. so tif can only be read in qgis. not in ordinary photo program
  const arrayBuffer = await writeArrayBuffer(raster, metadata);
  const tif2 = await fromArrayBuffer(arrayBuffer);
  console.log(tif2);
  const image2 = await tif2.getImage();
  console.log(image2);
  
  const buffer = Buffer.from(arrayBuffer);

  let writeStream = fs.createWriteStream('birch_copyX5.tif');

  // write some data with encoding
  writeStream.write(buffer, 'utf8');

  // the finish event is emitted when all data has been flushed from the stream
  writeStream.on('finish', () => {
    console.log('wrote all data to file');
  });

  // close the stream
  writeStream.end();

}
const resulthandler = err => {
  //console.timeEnd('Duration to execute everything');
  if(err)throw err;
  console.log("Done");
}
main().then(resulthandler).catch(resulthandler);



// info about tif from https://www.itu.int/itudoc/itu-t/com16/tiff-fx/docs/tiff6.pdf