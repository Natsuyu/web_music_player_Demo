function $(name){
	return document.querySelectorAll(name);
}

var lis = $("ul li"),
	volume = $("#volume"),
	pro = $("#process")[0],
	title = $("#title")[0],
	canvas = $("#canvas")[0],
	btn = $("#box span"),
	stop = $("#stopplay")[0],
	preS = $("#pre")[0],
	nextS = $("#next")[0],
	way = $("#way")[0];

var box = canvas.offsetParent;
var ctx = canvas.getContext("2d");
var shape = "column";
var ballPos = [], tar = null,flag = false,plway = 0;
var playWay = ["&#xe6f2;","&#xe6f3;","&#xe6be;"];

var xhr = new XMLHttpRequest();//貌似不可以在函数里面创建这个对象？
var ac = new (window.AudioContext || window.webkitAudioContext)();
var gainNode = ac[ac.createGain?"createGain":"createGainNode"]();
gainNode.connect(ac.destination);
var analyserNode = ac.createAnalyser();
analyserNode.fftSize = 128;
var num = analyserNode.frequencyBinCount;
analyserNode.connect(gainNode);//连接的是下级元素
var source = null;
var count = 0,pre = 0, duration = 0;
var animationFrame = window.requestAnimationFrame || 
					 window.webkitRequestAnimationFrame || 
					 window.msRequestAnimationFrame ||
					 window.mozRequestAnimationFrame;
var line = null,buff = null;


for(var i=0;i<lis.length;i++)
{
	lis[i].onclick = function(){
		for(var j=0;j<lis.length;j++) lis[j].className = "unselected";
		this.className = "selected";
		loadMusic("/music/"+this.title);
		tar = this;
	}
}
for(var i=0;i<btn.length;i++)
{
	btn[i].onclick = function(){
		for(var j=0;j<btn.length;j++) btn[j].className = "unselected";
		this.className = "selected"; 
		shape = this.id;
	}
}



function random(x,y){
	return Math.round(Math.random()*(y-x)+x);
}
function genBall(){
	for(var i=0;i<num;i++)
	{
		ballPos[i] = {};
		ballPos[i].x = Math.random();
		ballPos[i].y = Math.random();
		ballPos[i].color = "rgba("+random(0,255)+","+random(0,255)+","+random(0,255)+","+"0)";
		ballPos[i].capH = 0;
		ballPos[i].v = Math.random()*0.001;
	}
}
function changeValume(value)
{
	gainNode.gain.value = value;
}
volume[0].onmousemove= function(){
	changeValume(this.value/this.max);
}
pro.onchange = function(){
	tt = this.value/100*buff.duration;
	source && source[source.stop?"stop":"noteOff"]();
	createBufferSource(tt);
}
way.onclick = function(){
	plway = parseInt(this.title);
	plway=(plway+1)%3;
	this.innerHTML = playWay[plway];
	this.title = plway;
}
var tmp = 0,tt=0;
function analyser(){
	
	if(flag == true)
	{
		tt+=ac.currentTime - tmp;
		pro.value = tt*100/buff.duration;
	// console.log(ac.currentTime - tmp,tt);
	}
	if(buff&&tt>=buff.duration){
		console.log("end!!");
		flag = false;
		nextSong();
	}
	tmp=ac.currentTime;
	var arr = new Uint8Array(analyserNode.frequencyBinCount); 
	analyserNode.getByteFrequencyData(arr);
	width = box.offsetWidth-1,
	height = box.offsetHeight-2;
	canvas.width = width;
	canvas.height = height;
	var step = width/num;
	var cap = step*0.7;
	line = ctx.createLinearGradient(0,0,0,height);//制作渐变效果
	line.addColorStop(0,"rgb(255,216,0)");
	line.addColorStop(0.5,"rgb(255,0,0)");
	// line.addColorStop(0);
	line.addColorStop(1,"#000");
	
	ctx.clearRect(0,0,width,height);
	
	if(shape == "column")
	{
		ctx.fillStyle=line;
		for(var i=0;i<arr.length;i++)
		{
			var h = arr[i]/256*height;
			var o = ballPos[i];
			ctx.fillRect(i*step,height-h,cap,h);
			ctx.fillRect(i*step,height-o.capH-cap,cap,cap);//如果o.capH是表示方块和高度的间距的话是不可以的，因为高度是随意变的，所以间距就是不可判定的了，所以要把方块当做方块来看，这样方块是方块的高度，柱子是柱子的高度，就可以算了

			o.capH--;

			if(o.capH<0) o.capH=0;
			if(h>0&&o.capH < h+40) o.capH=h+40 > height-cap ? height-cap : h+40;	
		}
	}
	else
	{
		for(var i=0;i<arr.length;i++)
		{
			ctx.beginPath();
			var r = arr[i]/num*25 < 5?5:arr[i]/num*25;
			ballPos[i].x += ballPos[i].v;
			if(ballPos[i].x>1) ballPos[i].x=0;
			var linet = ctx.createRadialGradient(ballPos[i].x*width,ballPos[i].y*height,0,ballPos[i].x*width,ballPos[i].y*height,r);
			linet.addColorStop(0,"#fff");
			linet.addColorStop(1,ballPos[i].color);
			ctx.fillStyle = linet;
			ctx.arc(ballPos[i].x*width,ballPos[i].y*height,r,0,2*Math.PI);
			ctx.fill();
			ctx.closePath();
		}
	}
	// animationFrame(analyser);
	setTimeout(analyser,10);
}
stop.onclick = function(){
	if(!buff) return; 
	if(flag == true)
	{
		source && source[source.stop?"stop":"noteOff"]();
		console.log(source);
		// duration += ac.currentTime - pre;
		// this.title = "stop";
		flag = false;
		this.innerHTML = "&#xe667;"
	}else{
		// pre = ac.currentTime;
		createBufferSource(tt);
		// this.title = "start";
		flag = true;
		
		this.innerHTML = "&#xe632;";

	}
}
preS.onclick = function(){
	console.log("pre Song!");
	tt=0;
	tar = tar.previousElementSibling;
	flag = false;
	if(!tar) tar = lis[lis.length-1];

	loadMusic("/music/"+tar.title);
}
nextS.onclick = nextSong;
function createBufferSource(time){
	var bufferSource = ac.createBufferSource();
	bufferSource.buffer = buff;
	bufferSource.connect(analyserNode);
	changeValume(volume[0].value/volume[0].max);
	bufferSource[bufferSource.start?"start":"noteOn"](0,time); //0是开始时间
	flag = true;
	source = bufferSource;
	stop.innerHTML = "&#xe632;";
	title.innerHTML = tar.title;
}
function nextSong(){
	console.log("next!");
	tt = 0;
	flag = false;stop.innerHTML = "&#xe667;"
	tar = (plway == 1)?tar:tar.nextElementSibling;
	if(tar) loadMusic("/music/"+tar.title);
	else if(plway == 0) {
		tar = lis[0];
		loadMusic("/music/"+tar.title);
	}
}
function loadMusic(url){
	var n = ++count;
	try
	{
		source && source[source.stop?"stop":"noteOff"]();
	}catch(e){
		console.log("error:"+e);
	}
	
	xhr.abort();
	
	xhr.open('GET', url);
	xhr.responseType = 'arraybuffer';
	xhr.onload = function(){
		if(n != count) return;
		ac.decodeAudioData(xhr.response,function(buffer){
			if(n != count) return;
			buff = buffer;
			createBufferSource(0);
			pro.value = 0;

			duration = 0;tt=0;pre=ac.currentTime;
			genBall();
		},function(err){
			console.log(err);
		});
	}
	xhr.send();
}

genBall();
analyser();



