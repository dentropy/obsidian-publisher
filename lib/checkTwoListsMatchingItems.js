export function checkTwoListsMatchingItems(list1, list2) {
  for (const item of list1) {
    if (list2.includes(item)) {
      return true; // Matching item found
    }
  }
  return false; // No matching item found
}