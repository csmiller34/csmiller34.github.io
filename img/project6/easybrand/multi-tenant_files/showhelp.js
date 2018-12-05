//******************************************************************
//
//   This script contains a single function called showHelp() which
//   can be called by an application along with the location of the index file
//   and object ID for the topic.
//
//   After being called, the script opens a new window that displays 
//   the HTML help frameset along  with the HTML for the associated 
//   topic.
//
//  Syntax:
//         showHelp(pname, objID)
//
//  Where:
//          - pname is the relative or URL to the help file
//          - objID is the object ID making up the filename for the topic page
//
//  Example:
//          <a href="#" onclick="showHelp('/help/index.html', 12345)">Help</a>
//
//   2008 - C. Miller
//
// ******************************************************************

 
function showHelp(helpfile, contextID) {
   fname=helpfile + "?" + contextID;
   var win = window.open(fname,"Help","menubar=no,width=950,height=700,toolbar=no,status=no,location=no,resizable=yes,scrollbars=no,titlebar=no,personalbar=no,directories=no");
}
