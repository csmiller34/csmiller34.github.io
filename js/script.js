document.addEventListener("DOMContentLoaded", function() {
   var timer1 = setTimeout(function() {
      document.querySelectorAll('section').forEach(function(el) {
         el.style.opacity = 1.0;
      })
   }, 500);
  checkMenu();
})

window.addEventListener('resize', function() {
  checkMenu();
})

function checkMenu() {
   if (document.body.offsetWidth > 899)  {
      document.querySelector('nav ul').style.display = "block";
   } else {
      document.querySelector('nav ul').style.display = "none";
   }
}

document.getElementsByTagName('body')[0].onscroll = function() {
   var scroller = document.documentElement.scrollTop;
   if (scroller > 100) {
      document.querySelector('.go-to-top').classList.remove('go-to-top-hidden');
      document.querySelector('.go-to-top-arrow').classList.remove('go-to-top-arrow-hidden');
   } else {
      document.querySelector('.go-to-top').classList.add('go-to-top-hidden');
      document.querySelector('.go-to-top-arrow').classList.add('go-to-top-before-hidden');
   }
}

var myposition;
var timer;
document.querySelector('.go-to-top').addEventListener('click', scroller);

function scroller() {
   myposition = document.documentElement.scrollTop;
   myposition -= 200;
   if ( myposition > 0 ) {
   document.documentElement.scrollTop = myposition
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
  if (whichDirection === "show") {
      root.querySelector(whichArrow).style.display = "block";
      root.querySelector(whichArrow).classList.remove('hide-element');
  } else { 
    root.querySelector(whichArrow).classList.add('hide-element');
    var timer = setTimeout(function() {
      root.querySelector(whichArrow).style.display = "none";
    }, 250);
  }
}

document.querySelectorAll('.siema').forEach( function(elem, index) {
   var whichSiema = "#siema" + index;
   var mySiema = new Siema({ selector: whichSiema, onChange: updateArrows  });
   elem.parentElement.querySelector('.prev').addEventListener('click', () => mySiema.prev()); 
   elem.parentElement.querySelector('.next').addEventListener('click', () => mySiema.next());

//   elem.parentElement.querySelectorAll('.siema-btn').forEach(function(e) {
//      e.style.marginTop = "-" + parseInt(elem.parentElement.clientHeight / 2) + "px";
//      e.parentElement.querySelector('.siema-btn.next').style.left = parseInt(elem.parentElement.clientWidth + 20) + "px";
//   })
})

function updateArrows() {
   var this_next = this.selector.parentElement.querySelector('.next');
   var this_prev  = this.selector.parentElement.querySelector('.prev');
   if (this.currentSlide < (this.selector.parentElement.querySelector('.siema > div').childElementCount)-1) {
      this_next.classList.add('siema-active');
   } else {
      this_next.classList.remove('siema-active');
   }
   if (this.currentSlide > 0) {
      this_prev.classList.add('siema-active');
   } else {
      this_prev.classList.remove('siema-active');
   }
   this.selector.parentElement.querySelector('.current-page').innerHTML = this.currentSlide + 1;
}

document.querySelectorAll('.lightbox').forEach( function(elem) { new Luminous(elem); });
var galleryOpts = { arrowNavigation: true, closeWithEscape: true };

new LuminousGallery(document.querySelectorAll('.lightbox-gallery'), galleryOpts, { 
   caption: function (trigger) { return trigger.querySelector('img').getAttribute('alt');  } 
});

document.querySelector('.mobile-menu').addEventListener('click', showHideMenu);
document.querySelector('.mobile-menu').addEventListener('blur', showHideMenu);

function showHideMenu() {
   console.log("test")
   var showHide = document.querySelector('nav ul');
   if ((showHide.style.display === 'none') || (showHide.style.display === '')) {
      showHide.style.display = "block";
   } else {
      showHide.style.display = "none";
   }
}
