export function shared_verification_function(parsed_yaml){
  if( Object.keys(parsed_yaml).includes("share") ){
    if (parsed_yaml["share"] == true ){
      return true
    }
  }
  return false
}
