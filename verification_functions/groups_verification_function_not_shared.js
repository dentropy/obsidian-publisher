import { checkTwoListsMatchingItems } from '../lib/checkTwoListsMatchingItems.js';
export function groups_verification_function_not_shared(parsed_yaml, group_name_list){
  if( Object.keys(parsed_yaml).includes("groups") ){
    if (typeof(parsed_yaml.groups) == typeof( [] ) ) {
      if ( checkTwoListsMatchingItems(parsed_yaml.groups, group_name_list) ){
        return true
      }
    }
  }
  return false
}
