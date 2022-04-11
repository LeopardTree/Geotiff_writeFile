import fs from 'fs';
import GeoTIFF, { writeArrayBuffer, fromFile, fromArrayBuffer } from 'geotiff';

import gdal from 'gdal';

const retrieveGDAL_NODATA = async (GDAL_NODATA) => {
  if (GDAL_NODATA) {
      try {
          return parseInt(GDAL_NODATA);
      }
      catch (err) {
          console.log(err);
      }
      try {
          return number(GDAL_NODATA);
      }
      catch (err) {
          console.log(err);
      }
  }
  return GDAL_NODATA;
}
const main = async () => {

  const tif = await fromFile('pine.tif');
  //console.log(tif);
  const image = await tif.getImage();
  console.log(image);
  const layer = await image.readRasters();
  console.log(layer.length);
  const raster = layer[0];
  console.log(raster);

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
  const bandCount = layer.length;
  const areaOrPoint = await image.geoKeys.GTRasterTypeGeoKey;
  let GDAL_NODATA = await fileDir.GDAL_NODATA;
  console.log(GDAL_NODATA);

  GDAL_NODATA = await retrieveGDAL_NODATA(GDAL_NODATA);

  //https://stackoverflow.com/questions/58280379/how-to-find-the-type-of-a-typedarray
  const checkTypedArrayType = async (someTypedArray) => {
    return someTypedArray && 
      someTypedArray.constructor && 
      someTypedArray.constructor.name || 
      null;
  }
  const arrtype = await checkTypedArrayType(raster);
  console.log(arrtype);


  const driver = gdal.drivers.get('GTiff');
  //create destination dataset. create(destination_name, x_size, y_size, band_count, data_type)
  let dst_ds = driver.create('pine_copy.tif', imageWidth, imageHeight, bandCount, gdal.GDT_Float32);
  //console.log(dst_ds);

  //add data
  
  const band1 = dst_ds.bands.get(1);
  if(GDAL_NODATA != null){
    band1.noDataValue = GDAL_NODATA;
  }
  
  band1.pixels.write(0, 0, imageWidth, imageHeight, raster);

  console.log(ProjectedCSTypeGeoKey);
  //create coordinatesystem object with spatial reference
  const epsg = ProjectedCSTypeGeoKey;
  if(epsg === null){
    // if no projection geokey. set to sweref TM
    epsg = 3006;
  }
  const crs = new gdal.SpatialReference.fromEPSG(epsg);
  
  // const wkt = await crs.toWKT();
  //set transformation 
  const bbox = image.getBoundingBox();
  const xmin = bbox[0];
  const ymax = bbox[3];
  // transformation array. 0 means north is up in relation to the axle
  // trf = [xmin, pixelwidth_vector, Xnorth_scalar, ymax, Ynorth_scalar, pixelheight_vector]
  const trf = [xmin, ModelPixelScale[0], 0, ymax, 0, -ModelPixelScale[1]];

  //set spatial reference and geotransform
  dst_ds.srs = crs;
  dst_ds.geoTransform = trf;
  const newPixX = 10;
  const newPixY = 10;
  const totalWidth = ModelPixelScale[0] * imageWidth;
  const totalHeight = ModelPixelScale[1] * imageHeight;
  const newImageWidth = totalWidth / newPixX;
  const newImageHeight = totalHeight / newPixY;
  const prj_ds = driver.create('pine_prj2.tif', newImageWidth, newImageHeight, bandCount, gdal.GDT_Float32);
  prj_ds.srs = crs;
  let newXmin = xmin;
  let newYmax = ymax;
  if(areaOrPoint === 2){
    newXmin = xmin - ModelPixelScale[0]/2;
    newYmax = ymax + ModelPixelScale[1]/2;  
  }
  prj_ds.geoTransform = [550020, newPixX, 0, 6454980, 0, -newPixY];
  const band1prj = prj_ds.bands.get(1);
  if(GDAL_NODATA != null){
    band1prj.noDataValue = GDAL_NODATA;
  }
 
  // warp
  gdal.reprojectImage({
    src: dst_ds,
    dst: prj_ds,
    s_srs: dst_ds.srs,
    t_srs: prj_ds.srs,
    resampling: gdal.GRA_Bilinear
  });
  // write to file
  prj_ds.flush();

  //close dataset
  dst_ds.close();
  prj_ds.close();

}
const resulthandler = err => {
  //console.timeEnd('Duration to execute everything');
  if(err)throw err;
  console.log("Done");
}
main().then(resulthandler).catch(resulthandler);



// info about tif from https://www.itu.int/itudoc/itu-t/com16/tiff-fx/docs/tiff6.pdf