/**
 * This module generates a lut for an image
 */

(function (cornerstone) {

  "use strict";

  function generateLutNew(image, windowWidth, windowCenter, invert, modalityLUT, voiLUT)
  {
    if(image.cachedLut === undefined) {
      image.cachedLut = {};
      image.cachedLut.lutArray =  new Uint8ClampedArray(image.maxPixelValue - Math.min(image.minPixelValue,0)+1);
    }
    var lut = image.cachedLut.lutArray;
    var maxPixelValue = image.maxPixelValue;
    var minPixelValue = image.minPixelValue;

    var mlutfn = cornerstone.internal.getModalityLUT(image.slope, image.intercept, modalityLUT);
    var vlutfn = cornerstone.internal.getVOILUT(windowWidth, windowCenter, voiLUT);

    var offset = 0;
    if(minPixelValue < 0) {
      offset = minPixelValue;
    }
    var storedValue;
    var modalityLutValue;
    var voiLutValue;
    var clampedValue;

    for(storedValue = image.minPixelValue; storedValue <= maxPixelValue; storedValue++)
    {
      if(!invert) {
        lut[storedValue + (-offset)] = vlutfn(mlutfn(storedValue));
      } else {
        lut[storedValue + (-offset)] = 255 - vlutfn(mlutfn(storedValue));
      }
    }
    return lut;
  }



  /**
   * Creates a LUT used while rendering to convert stored pixel values to
   * display pixels
   *
   * @param image
   * @returns {Array}
   */
  function generateLut(image, windowWidth, windowCenter, invert, modalityLUT, voiLUT)
  {
    if(modalityLUT || voiLUT) {
      return generateLutNew(image, windowWidth, windowCenter, invert, modalityLUT, voiLUT);
    }

    if(image.cachedLut === undefined) {
      image.cachedLut = {};
      image.cachedLut.lutArray =  new Uint8ClampedArray(image.maxPixelValue - Math.min(image.minPixelValue,0)+1);
    }
    var lut = image.cachedLut.lutArray;

    var maxPixelValue = image.maxPixelValue;
    var minPixelValue = image.minPixelValue;
    var slope = image.slope;
    var intercept = image.intercept;
    var localWindowWidth = windowWidth;
    var localWindowCenter = windowCenter;
    var modalityLutValue;
    var voiLutValue;
    var clampedValue;
    var storedValue;

    // NOTE: As of Nov 2014, most javascript engines have lower performance when indexing negative indexes.
    // We improve performance by offsetting the pixel values for signed data to avoid negative indexes
    // when generating the lut and then undo it in storedPixelDataToCanvasImagedata.  Thanks to @jpambrun
    // for this contribution!

    var offset = 0;
    if(minPixelValue < 0) {
      offset = minPixelValue;
    }

    if(invert === true) {
      for(storedValue = image.minPixelValue; storedValue <= maxPixelValue; storedValue++)
      {
        modalityLutValue =  storedValue * slope + intercept;
        voiLutValue = (((modalityLutValue - (localWindowCenter)) / (localWindowWidth) + 0.5) * 255.0);
        lut[storedValue + (-offset)] = voiLutValue;
      }
    }
    else {
      for(storedValue = image.minPixelValue; storedValue <= maxPixelValue; storedValue++)
      {
        modalityLutValue = storedValue * slope + intercept;
        voiLutValue = (((modalityLutValue - (localWindowCenter)) / (localWindowWidth) + 0.5) * 255.0);
        lut[storedValue+ (-offset)] = voiLutValue;
      }
    }
  }


  // Module exports
  cornerstone.internal.generateLutNew = generateLutNew;
  cornerstone.internal.generateLut = generateLut;
  cornerstone.generateLutNew = generateLutNew;
  cornerstone.generateLut = generateLut;
}(cornerstone));
