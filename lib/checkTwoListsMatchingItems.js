/*

#TODO this function is so simple we don't need it in a separate file

*/

export function checkTwoListsMatchingItems(list1, list2) {
  for (const item of list1) {
    if (list2.includes(item)) {
      return true; // Matching item found
    }
  }
  return false; // No matching item found
}