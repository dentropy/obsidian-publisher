import { checkTwoListsMatchingItems } from '../lib/checkTwoListsMatchingItems.js';
export function groups_verification_function(parsed_yaml, group_name_list){
  if( Object.keys(parsed_yaml).includes("groups") ){
    if (typeof(parsed_yaml.groups) == typeof( [] ) ) {
      if ( checkTwoListsMatchingItems(parsed_yaml.groups, group_name_list) ){
        return true
      }
    }
  }
  // REMOVE THIS ELSE STATEMENT TO NOT HAVE SHARED DOCUMENTS SHARED
  else {
    if( Object.keys(parsed_yaml).includes("share") ){
      if (parsed_yaml["share"] == true ){
        return true
      }
    }
  }
  return false
}
