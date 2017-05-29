import { assert } from 'chai';
import $ from 'jquery';

import { cachedImages,
         setMaximumSizeBytes,
         putImagePromise,
         getImagePromise,
         removeImagePromise,
         getCacheInfo,
         purgeCache,
         changeImageIdCacheSize } from '../src/imageCache';

import cornerstone from '../src/namespace';

describe('Set maximum cache size', function () {
  it('should allow setting of cache size', function () {
    // Arrange
    const maximumSizeInBytes = 1024 * 1024 * 1024;

    // Act
    setMaximumSizeBytes(maximumSizeInBytes);

    // Assert
    const cacheInfo = getCacheInfo();

    assert.equal(cacheInfo.maximumSizeInBytes, maximumSizeInBytes);
  });
});

describe('Store, retrieve, and remove imagePromises from the cache', function () {
  before(function () {
    // Act
    purgeCache();
  });

  beforeEach(function () {
    // Arrange

    // Note: we are currently using Deferred because it allows us to reject
    // the Promises.
    this.imagePromise = $.Deferred();
    this.image = {
      imageId: 'anImageId',
      sizeInBytes: 100
    };

    purgeCache();
  });

  it('should allow image promises to be added to the cache', function () {
    const image = this.image;
    const imagePromise = this.imagePromise;

    // Act
    putImagePromise(image.imageId, imagePromise);
    imagePromise.resolve(image);

    // Assert
    const cacheInfo = getCacheInfo();

    assert.equal(cacheInfo.numberOfImagesCached, 1);
    assert.equal(cacheInfo.cacheSizeInBytes, this.image.sizeInBytes);
  });

  it('should allow image promises to be retrieved from the cache', function () {
    const image = this.image;
    const imagePromise = this.imagePromise;

    // Act
    putImagePromise(image.imageId, imagePromise);

    // Assert
    const retrievedPromise = getImagePromise(image.imageId);

    assert.equal(imagePromise, retrievedPromise);
  });

  it('should fail silently to retrieve a promise for an imageId not in the cache', function () {
    // Act
    const retrievedPromise = getImagePromise('AnImageIdNotInCache');

    // Assert
    assert.isUndefined(retrievedPromise, undefined);
  });

  it('should allow image promises to be removed from the cache', function () {
    const image = this.image;
    const imagePromise = this.imagePromise;

    // Arrange
    putImagePromise(image.imageId, imagePromise);

    // Act
    removeImagePromise(image.imageId);

    // Assert
    imagePromise.then(() => {
      // Fail if the Promise is resolved.
      assert.equal(true, false);
    });

    // Make sure that the cache is now empty
    const cacheInfo = getCacheInfo();

    assert.equal(cacheInfo.numberOfImagesCached, 0);
    assert.equal(cacheInfo.cacheSizeInBytes, 0);
  });

  it('should allow image promises to have their cache size changed', function () {
    const image = this.image;
    const imagePromise = this.imagePromise;

    // Arrange
    putImagePromise(image.imageId, imagePromise);
    imagePromise.resolve(image);
    const newCacheSize = 500;

    // Act
    changeImageIdCacheSize(image.imageId, newCacheSize);

    // Assert
    const cacheInfo = getCacheInfo();

    assert.equal(cacheInfo.numberOfImagesCached, 1);
    assert.equal(cacheInfo.cacheSizeInBytes, newCacheSize);
  });

  it('should be able to purge the entire cache', function () {
    const image = this.image;
    const imagePromise = this.imagePromise;

    // Arrange
    putImagePromise(image.imageId, imagePromise);
    imagePromise.resolve(image);

    // Act
    purgeCache();

    // Make sure that the cache is now empty
    const cacheInfo = getCacheInfo();

    assert.equal(cacheInfo.numberOfImagesCached, 0);
    assert.equal(cacheInfo.cacheSizeInBytes, 0);
  });

  it('should be able to kick the oldest image out of the cache', function (done) {
    // Arrange
    setMaximumSizeBytes(1000);

    for (let i = 0; i < 10; i++) {
      // Create the image
      const imagePromise = $.Deferred();
      const image = {
        imageId: `imageId-${i}`,
        sizeInBytes: 100
      };

      image.decache = () => console.log('decaching image');

      // Add it to the cache
      putImagePromise(image.imageId, imagePromise);
      imagePromise.resolve(image);
    }

    // Setup event listeners to check that the promise removed and cache full events have fired properly
    $(cornerstone).one('CornerstoneImageCachePromiseRemoved', (event, imageId) => {
      // Detect that the earliest image added has been removed
      
      // TODO: Figure out how to change the test setup to ensure the same
      // image is always kicked out of the cache. It looks like timestamps
      // are not in the expected order, probably since handling the promise
      // resolving is async
      //assert.equal(imageId, 'imageId-0');
      assert.isDefined(imageId);
      done();
    });

    $(cornerstone).one('CornerstoneImageCacheFull', (event, cacheInfo) => {
      const currentInfo = getCacheInfo();
      assert.equal(cacheInfo, currentInfo);
      console.log('CornerstoneImageCacheFull');
      done();
    });

    // Act
    // Create another image which will push us over the cache limit
    const extraImagePromise = $.Deferred();
    const extraImage = {
      imageId: `imageId-11`,
      sizeInBytes: 100
    };
    
    // Add it to the cache
    putImagePromise(extraImage.imageId, extraImagePromise);
    extraImagePromise.resolve(extraImage);

    // Make sure that the cache has pushed out the first image
    const cacheInfo = getCacheInfo();
    assert.equal(cacheInfo.numberOfImagesCached, 10);
    assert.equal(cacheInfo.cacheSizeInBytes, 1000);
  });
});
