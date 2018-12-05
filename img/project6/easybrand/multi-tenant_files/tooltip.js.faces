
if(!window.Richfaces){window.Richfaces={};}
Richfaces.ToolTip={};ToolTip=Class.create();ToolTip.prototype={showEvent:null,hideEvent:null,delay:0,hideDelay:0,ajaxFunction:null,onhide:null,onshow:null,disabled:false,direction:"bottom-right",followMouse:false,horizontalOffset:10,verticalOffset:10,initialize:function(id,parentId,options){this["rich:destructor"]="destroy";this.id=id;this.parentId=parentId;this.parent=$(this.parentId);Object.extend(this,options);this.clientAjaxParams={};this.toolTip=$(id);this.toolTip.component=this;this.toolTipContent=$(id+'content');this.toolTipDefaultContent=$(id+'defaultContent');this.toolTip.style.visibility='hidden';this.toolTip.style.display='block';this.toolTipOffsetW=this.toolTip.offsetWidth;this.toolTipOffsetH=this.toolTip.offsetHeight;this.toolTipW=this.toolTip.getWidth();this.toolTipH=this.toolTip.getHeight();this.toolTipBorderHeight=(this.toolTipOffsetH-this.toolTipH)/2;this.toolTipBorderWidth=(this.toolTipOffsetW-this.toolTipW)/2;this.toolTip.style.visibility='visible';this.toolTip.style.display="none";this.parentAttached=false;this.hintParentElement=null;this.isMouseOvered=false;if(Richfaces.browser.isIE6){var toolTipZindex=parseInt(this.toolTip.style.zIndex);new Insertion.Before(this.toolTip,"<iframe src=\"javascript:''\" frameborder=\"0\" scrolling=\"no\" id=\""+this.id+"iframe\""+"style=\"position: absolute; width: "+this.toolTipOffsetW+"px; height: "+this.toolTipOffsetH+"px; display: none;background-color:black; z-index: "+
(toolTipZindex-1)+";\">"+"</iframe>");this.iframe=$(this.id+'iframe');}
this.attachOnLoadEventsListner=this.attachOnLoadEvents.bindAsEventListener(this);this.setToolTipPositionListner=this.setToolTipPosition.bindAsEventListener(this);this.leaveToolTipListner=this.leaveToolTip.bindAsEventListener(this);if(!this.disabled)Event.observe(document,"mousemove",this.attachOnLoadEventsListner,true);},destroy:function()
{if(!this.parentAttached&&!this.disabled){Event.stopObserving(document,"mousemove",this.attachOnLoadEventsListner,true);}
if(this.toolTip){this.toolTip.component=null;}
this.doDisable();this.hintParentElement=null;this.parent=null;this.toolTip=null;this.toolTipContent=null;this.toolTipDefaultContent=null;this.iframe=null;this.eventCopy=null;this.showEvent=null;this.hideEvent=null;},attachOnLoadEvents:function(){if(!this.parentAttached){if(!this.parent){this.parent=$(this.parentId);}
if(this.parent!=null&&!this.disabled){this.attachParentEvents();this.parentAttached=true;}
Event.stopObserving(document,"mousemove",this.attachOnLoadEventsListner,true);}},attachParentEvents:function(){if(this.followMouse){Event.observe(this.parent,'mousemove',this.setToolTipPositionListner,false);}
this.doShowListner=this.doShow.bindAsEventListener(this);this.doHideListner=this.doHide.bindAsEventListener(this);Event.observe(this.parent,this.showEvent,this.doShowListner,false);if(this.showEvent!="focus"){if(this.hideEvent!=null){Event.observe(this.parent,this.hideEvent,this.doHideListner,false);Event.observe(this.toolTip,this.hideEvent,this.leaveToolTipListner,false);}else{Event.observe(this.parent,"mouseout",this.doHideListner,false);Event.observe(this.toolTip,"mouseout",this.leaveToolTipListner,false);}}else{if(this.hideEvent!=null){Event.observe(this.parent,this.hideEvent,this.doHideListner,false);}else{Event.observe(this.parent,"blur",this.doHideListner,false);}}},detectAncestorNode:function(leaf,element){var node=leaf;while(node!=null&&node!=element)
{node=node.parentNode;}
return(node!=null);},ffcheck:function(relTarg)
{var parentTagName=this.parent.tagName.toLowerCase();if((parentTagName=="input"||parentTagName=="textarea")&&relTarg){var className;try{className=relTarg.className;if(className=="anonymous-div")return true;}catch(e)
{return true;}
if(relTarg==this.parent)return true;}else{while(relTarg){if(relTarg==this.parent){return true;}
relTarg=relTarg.parentNode;}}
return false;},leaveToolTip:function(e){var hintNotLeft=false;var relTarg=e.relatedTarget||e.toElement;var className;if(relTarg)
{try{className=relTarg.className;if(className!="anonymous-div");hintNotLeft=this.detectAncestorNode(relTarg,this.hintParentElement);}catch(e){;}}
if(!hintNotLeft){this.doHide(e);this.isMouseOvered=false;}},doShow:function(e){if(this.disabled){return;}
if(this.activationTimerHandle)return;var obj;if(!e)var e=window.event;var relTarg=e.relatedTarget||e.fromElement;if(this.ffcheck(relTarg))return;var className;if(relTarg)
{try{className=relTarg.className;if(className!="anonymous-div");if(this.detectAncestorNode(relTarg,this.toolTip))return;}catch(e){;}}
this.isMouseOvered=true;if(e.target)
this.hintParentElement=e.target;if(e.srcElement)
this.hintParentElement=e.srcElement;if(this.hidingTimerHandle)
{window.clearTimeout(this.hidingTimerHandle);this.hidingTimerHandle=undefined;}
if(this.ajaxFunction){if(this.toolTipDefaultContent){this.toolTipContent.innerHTML=this.toolTipDefaultContent.innerHTML;this.toolTip.style.visibility="hidden";this.toolTip.style.display='block';this.setToolTipPosition(e);}
var event=A4J.AJAX.CloneObject(e,false);if(e.clientX){this.clientAjaxParams['clientX']=e.clientX;this.clientAjaxParams['clientY']=e.clientY;}else{this.clientAjaxParams['event.pageX']=e.pageX;this.clientAjaxParams['event.pageY']=e.pageY;}
if(this.delay>0)
{this.setToolTipPosition(e);this.activationTimerHandle=window.setTimeout(function()
{if(this.toolTipDefaultContent)
{this.setToolTipVisible();}
this.ajaxFunction(event);}.bind(this),this.delay);}
else
{if(this.toolTipDefaultContent)
{this.setToolTipVisible();}
this.ajaxFunction(event);}}else{this.setToolTipPosition(e);if(this.delay>0)
{this.activationTimerHandle=window.setTimeout(function()
{this.displayDiv();}.bind(this),this.delay);}
else this.displayDiv();}},hideDiv:function(e)
{this.isMouseOvered=false;this.toolTip.style.visibility="hidden";this.toolTip.style.display="none";if(this.iframe){this.iframe.style.display="none";}
this.hintParentElement=null;this.isMouseOvered=false;if(this.onhide!=null){this.onhide(e);}},doHide:function(e){if(this.hidingTimerHandle){return;}
this.eventCopy=null;if(!e){var e=window.event;}
var relTarg=null;if(e.type=='mouseout'||e.type=='mouseover'){relTarg=e.relatedTarget||e.toElement;}
if(this.ffcheck(relTarg)){return;}
var className;if(relTarg){try{className=relTarg.className;if(className!="anonymous-div");if(this.detectAncestorNode(relTarg,this.toolTip)){return;}}catch(e){;}}
if(this.activationTimerHandle){window.clearTimeout(this.activationTimerHandle);this.activationTimerHandle=undefined;}
if(this.hideDelay>0){var event=A4J.AJAX.CloneObject(e,false);this.hidingTimerHandle=window.setTimeout(function(){this.hideDiv(event);if(this.hidingTimerHandle){window.clearTimeout(this.hidingTimerHandle);this.hidingTimerHandle=undefined;}}.bindAsEventListener(this),this.hideDelay);}else{this.hideDiv();}},doEnable:function(){if(!this.parentAttached){Event.observe(document,"mousemove",this.attachOnLoadEventsListner,true);}
this.disabled=false;},doDisable:function(){if(!this.parentAttached){if(!this.disabled){Event.stopObserving(document,"mousemove",this.attachOnLoadEventsListner,true);}}else{if(this.followMouse){Event.stopObserving(this.parent,'mousemove',this.setToolTipPositionListner,false);}
Event.stopObserving(this.parent,this.event,this.doShowListner,false);if(this.showEvent!="focus"){if(this.hideEvent!=null){Event.stopObserving(this.parent,this.hideEvent,this.doHideListner,false);Event.stopObserving(this.toolTip,this.hideEvent,this.leaveToolTipListner,false);}else{Event.stopObserving(this.parent,"mouseout",this.doHideListner,false);Event.stopObserving(this.toolTip,"mouseout",this.leaveToolTipListner,false);}}else{if(this.hideEvent!=null){Event.stopObserving(this.parent,this.hideEvent,this.doHideListner,false);}else{Event.stopObserving(this.parent,"blur",this.doHideListner,false);}}
this.parentAttached=false;}
this.disabled=true;},show:function(e){this.doShow(e);},hide:function(e){this.doHide(e);},enable:function(e){this.doEnable(e);},disable:function(e){this.doDisable(e);},PX_REGEX:/px$/,parseToPx:function(value){if(value){var v=value.strip();if(this.PX_REGEX.test(v)){try{return parseInt(v.replace(this.PX_REGEX,""),10);}catch(e){}}}
return NaN;},setToolTipPosition:function(e){var elementDim=Richfaces.Position.getOffsetDimensions(this.toolTip);var tooltipStyle=this.toolTip.style;var _display=tooltipStyle.display;var _visibility=tooltipStyle.visibility;tooltipStyle.visibility="hidden";tooltipStyle.display="block";var oldLeft=this.parseToPx(tooltipStyle.left);if(isNaN(oldLeft)){oldLeft=0;tooltipStyle.left='0px';}
var oldTop=this.parseToPx(tooltipStyle.top);if(isNaN(oldTop)){oldTop=0;tooltipStyle.top='0px';}
var event=jQuery.event.fix(e);var offsetWidth=this.toolTip.offsetWidth;var offsetHeight=this.toolTip.offsetHeight;var regExpression=/^(top|bottom)-(left|right)$/;var match=this.direction.match(regExpression);var horizontalDirection=match[2];var verticalDirection=match[1];var clientX=isNaN(e.clientX)?Element.cumulativeOffset(this.parent).left+this.horizontalOffset:e.clientX;var clientY=isNaN(e.clientY)?Element.cumulativeOffset(this.parent).top+this.verticalOffset:e.clientY;var coords=this.fitToolTip(clientX,clientY,elementDim,horizontalDirection,verticalDirection,{'x':this.horizontalOffset,'y':this.verticalOffset});var offsets=jQuery(this.toolTip).offset();var x;var y;if(isNaN(event.clientX)){x=coords.x-offsets.left+oldLeft+this.horizontalOffset;y=coords.y-offsets.top+oldTop+this.verticalOffset;}else{x=coords.x-offsets.left+(event.pageX-event.clientX)+oldLeft;y=coords.y-offsets.top+(event.pageY-event.clientY)+oldTop;}
Element.setStyle(this.toolTip,{"left":x+"px","top":y+"px"});if(this.iframe)
{this.iframe.style.top=(y-this.toolTipBorderHeight)+'px';this.iframe.style.left=(x-this.toolTipBorderWidth)+'px';this.iframe.style.width=offsetWidth+'px';this.iframe.style.height=offsetHeight+'px';}
tooltipStyle.visibility=_visibility;tooltipStyle.display=_display;this.eventCopy=A4J.AJAX.CloneObject(e,false);},prePosition:function(x,y,elementDim,horizontalDirection,verticalDirection,offset){var returnX,returnY;returnX=horizontalDirection=='left'?x-elementDim.width-offset.x:x+offset.x;returnY=verticalDirection=='top'?y-elementDim.height-offset.y:y+offset.y;return{'x':returnX,'y':returnY};},fitToolTip:function(clientX,clientY,elementDim,horizontalDirection,verticalDirection,offset){var winDim=Richfaces.Position.getWindowDimensions();var deltaLeft=clientX-offset.x-elementDim.width;var deltaRight=winDim.width-(clientX+offset.x+elementDim.width);var deltaTop=clientY-offset.y-elementDim.height;var deltaBottom=winDim.height-(clientY+offset.y+elementDim.height);if(deltaLeft<0){var newDeltaRight=winDim.width-(clientX+offset.x+elementDim.width);if(newDeltaRight>0){horizontalDirection='right';}else{if(newDeltaRight>deltaLeft){horizontalDirection='right';}}}else if(deltaRight<0){var newDeltaLeft=clientX-offset.x-elementDim.width;if(newDeltaLeft>0){horizontalDirection='left';}else{if(newDeltaLeft>deltaRight){horizontalDirection='left';}}}
if(deltaTop<0){var newDeltaBottom=winDim.height-(clientY+offset.y+elementDim.height);if(newDeltaBottom>0){verticalDirection='bottom';}else{if(newDeltaBottom>deltaTop){verticalDirection='bottom';}}}else if(deltaBottom<0){var newDeltaTop=clientY-offset.y-elementDim.height;if(newDeltaTop>0){verticalDirection='top';}else{if(newDeltaTop>deltaBottom){verticalDirection='top';}}}
var coords=this.prePosition(clientX,clientY,elementDim,horizontalDirection,verticalDirection,offset);return coords;},displayDiv:function(){if(this.isMouseOvered){if(this.ajaxFunction){this.toolTip.style.display='none';if(this.clientAjaxParams){var xVarName;if(this.clientAjaxParams.clientX){xVarName='clientX';}else{xVarName='pageX';}
var yVarName;if(this.clientAjaxParams.clientY){yVarName='clientY';}else{yVarName='pageY';}
var obj={};obj[xVarName]=this.clientAjaxParams[xVarName];obj[yVarName]=this.clientAjaxParams[yVarName];this.toolTip.style.visibility="hidden";this.toolTip.style.display='block';this.setToolTipPosition((this.eventCopy?this.eventCopy:obj));}}
if(this.onshow!=null)
{this.onshow(this.eventCopy);}
this.setToolTipVisible();}},setToolTipVisible:function(){this.activationTimerHandle=undefined;this.toolTip.style.display="block";this.toolTip.style.visibility="visible";if(this.iframe)
{this.iframe.style.display="block";}}}