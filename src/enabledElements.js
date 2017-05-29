const enabledElements = [];

export function getEnabledElement (element) {
  if (element === undefined) {
    throw new Error('getEnabledElement: parameter element must not be undefined');
  }
  for (let i = 0; i < enabledElements.length; i++) {
    if (enabledElements[i].element === element) {
      return enabledElements[i];
    }
  }

  throw new Error('element not enabled');
}

export function addEnabledElement (enabledElement) {
  if (enabledElement === undefined) {
    throw new Error('getEnabledElement: enabledElement element must not be undefined');
  }

  enabledElements.push(enabledElement);
}

export function getEnabledElementsByImageId (imageId) {
  const ees = [];

  enabledElements.forEach(function (enabledElement) {
    if (enabledElement.image && enabledElement.image.imageId === imageId) {
      ees.push(enabledElement);
    }
  });

  return ees;
}

export function getEnabledElements () {
  return enabledElements;
}
