document.getElementsByTagName('body')[0].onscroll = function() {
   var scroller = document.documentElement.scrollTop;
   if (scroller > 100) {
      document.querySelector('.go-to-top').classList.remove('go-to-top-hidden');
   } else {
      document.querySelector('.go-to-top').classList.add('go-to-top-hidden');
   }
}

var myposition;
var timer;
document.querySelector('.go-to-top').onclick = function() { 
   scroller();
}

function scroller() {
   myposition = document.documentElement.scrollTop;
   myposition -= 200;
   if ( myposition > 0 ) {
   document.documentElement.scrollTop = myposition
   console.log(myposition);
   timer = setTimeout(scroller, 20);
   } else {
      document.documentElement.scrollTop = 0;
      clearTimeout(timer);
   }
}


/* Projects */

var currentIndent = {"scroller1" : 0, "scroller2" : 0, "scroller3" : 0, "persona-images" : 0, "visit-report" : 0};
var indentSize;
function leftArrow(that) {
  var root = that.nextElementSibling;
  indentSize = root.querySelector('img').clientWidth + 10;
  if (currentIndent[that.parentElement.getAttribute("id")] < 0 ) {
    currentIndent[that.parentElement.getAttribute("id")] += indentSize;
  }
  if (currentIndent[that.parentElement.getAttribute("id")] >= 0) {
    showHideArrows(root.parentElement, '.arrow-left', 'hide')
  }
  root.style.textIndent = currentIndent[that.parentElement.getAttribute("id")] + 'px';
  showHideArrows(root.parentElement, '.arrow-right', 'show')
}
function rightArrow(that) {
  var root = that.previousElementSibling;
console.log(root.querySelector('img').style);  
  indentSize = root.querySelector('img').clientWidth + 10;
  if (root.scrollWidth > root.clientWidth ) {
    currentIndent[that.parentElement.getAttribute("id")] -= indentSize;
    root.style.textIndent = currentIndent[that.parentElement.getAttribute("id")] + 'px';
  }
  if ((root.scrollWidth - root.clientWidth) < indentSize ) {
      showHideArrows(root.parentElement, '.arrow-right', 'hide')
  }
  showHideArrows(root.parentElement, '.arrow-left', 'show')
}
function showHideArrows(root, whichArrow, whichDirection) {
  if (whichDirection == "show") {
      root.querySelector(whichArrow).style.display = "block";
      root.querySelector(whichArrow).classList.remove('hide-element');
  } else { 
    root.querySelector(whichArrow).classList.add('hide-element');
    var timer = setTimeout(function() {
      root.querySelector(whichArrow).style.display = "none";
    }, 250);
  }
}

