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
   timer = setTimeout(scroller, 500);
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