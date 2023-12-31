/*

#TODO Check if this code can be remobed without effecting functionality

*/


export function createRecursiveObject(obj, keys, uuid) {
  if (keys.length === 0) {
    obj.uuid = uuid
    return obj; // Return the final object
  }
  const currentKey = keys[0];
  if (!obj.hasOwnProperty(currentKey) || typeof obj[currentKey] !== 'object') {
    obj[currentKey] = {}; // Create the property if it doesn't exist or is not an object
  }

  return createRecursiveObject(obj[currentKey], keys.slice(1), uuid);
}