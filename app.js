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
  let dst_ds = driver.create('pine_spruce.tif', imageWidth, imageHeight, 2, gdal.GDT_Float32);
  //console.log(dst_ds);

  //add data
  
  const band1 = dst_ds.bands.get(1);
  if(GDAL_NODATA != null){
    band1.noDataValue = GDAL_NODATA;
  }
  
  band1.pixels.write(0, 0, imageWidth, imageHeight, raster);

  const layer2 = gdal.open('spruce.tif', 'r');
  const layer2_band = layer2.bands.get(1);
  const raster2 = layer2_band.pixels.read(0, 0, imageWidth, imageHeight);
  console.log(raster2);
  const band2 = dst_ds.bands.get(2);
  if(GDAL_NODATA != null){
    band2.noDataValue = GDAL_NODATA;
  }
  
  band2.pixels.write(0, 0, imageWidth, imageHeight, raster2);

  console.log(ProjectedCSTypeGeoKey);
  // create coordinatesystem object with spatial reference
  const epsg = ProjectedCSTypeGeoKey;
  if(epsg === null){
    // if no projection geokey. set to sweref TM
    epsg = 3006;
  }
  const crs = new gdal.SpatialReference.fromEPSG(epsg);
  
  // const wkt = await crs.toWKT();
  // set transformation 
  const bbox = image.getBoundingBox();
  let xmin = bbox[0];
  let xmax = bbox[1];
  let ymin = bbox[2];
  let ymax = bbox[3];
  // transformation array. 0 means north is up in relation to the axle
  // trf = [xmin, pixelwidth_vector, Xnorth_scalar, ymax, Ynorth_scalar, pixelheight_vector]
  if(areaOrPoint === 2){
    xmin -= ModelPixelScale[0]/2;
    xmax -= ModelPixelScale[0]/2;
    ymin += ModelPixelScale[1]/2;
    ymax += ModelPixelScale[1]/2;  
  }
  // source geotransform
  const gt = [xmin, ModelPixelScale[0], 0, ymax, 0, -ModelPixelScale[1]];
  console.log(gt);
  // set spatial reference and geotransform of source
  dst_ds.srs = crs;
  dst_ds.geoTransform = gt;
  let newXmin = xmin;
  let newXmax = xmax;
  let newYmin = ymin;
  let newYmax = ymax;
  
  // https://github.com/yocontra/node-gdal-next/blob/master/test/api_warp.test.js#L135

  // target resolution
  const tr = {x: 10, y: 10};
  //set target reference system
  const t_srs = crs;
  const tx = new gdal.CoordinateTransformation(dst_ds.srs, t_srs);
  // compute output geotransform / dimensions
  const ul = tx.transformPoint(gt[0], gt[3]);
  const ur = tx.transformPoint(gt[0] + gt[1] * imageWidth, gt[3]);
  const lr = tx.transformPoint(gt[0] + gt[1] * imageWidth, gt[3] + gt[5] * imageHeight);
  const ll = tx.transformPoint(gt[0], gt[3] + gt[5] * imageHeight);

  let extent = new gdal.Polygon();
  const ring = new gdal.LinearRing();
  ring.points.add([ul, ur, lr, ll, ul]);
  extent.rings.add(ring);
  extent = extent.getEnvelope();

  const newImageWidth = Math.ceil(Math.max(extent.maxX - extent.minX) / tr.x);
  const newImageHeight = Math.ceil(Math.max(extent.maxY - extent.minY) / tr.y);
  

  // const prj_ds = driver.create('pine_prj_to_nmd.tif', newImageWidth , newImageHeight, bandCount, gdal.GDT_Float32);
  const prj_ds = driver.create('pine_spruce_to_10x10.tif', newImageWidth , newImageHeight, 2, gdal.GDT_Float32);
  prj_ds.srs = t_srs;
  prj_ds.geoTransform = [ extent.minX, tr.x, gt[2], extent.maxY, gt[4], -tr.y ];
  console.log(prj_ds.geoTransform);

  //const target_transform = gdal.open('nmd.tif', 'r');
  
  //prj_ds.geoTransform = target_transform.geoTransform;

  const band1prj = prj_ds.bands.get(1);
  const band2prj = prj_ds.bands.get(2);
  if(GDAL_NODATA != null){
    band1prj.noDataValue = GDAL_NODATA;
    band2prj.noDataValue = GDAL_NODATA;
  }

  // warp
  gdal.reprojectImage({
    src: dst_ds,
    dst: prj_ds,
    s_srs: dst_ds.srs,
    t_srs: prj_ds.srs,
    resampling: gdal.GRA_NearestNeighbor
  });
  // write to file
  prj_ds.flush();
  //dst_ds.flush();

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