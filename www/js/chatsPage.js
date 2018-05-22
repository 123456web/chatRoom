//require("../scss/chatsPage.scss");
console.log("test");
// 时间格式化
function dateForm(date){
	var year=new Date(date).getFullYear();
	var month=new Date(date).getMonth();
	month=month<10?"0"+month:month;
	var day=new Date(date).getDate();
	var hours=new Date(date).getHours();
	var minutes= new Date(date).getMinutes();
	var seconds=new Date(date).getSeconds();
	return year+"-"+month+"-"+day+" "+hours+":"+minutes+":"+seconds;
}
//添加内容对话信息
function sendMsgFun(userName,msg,className,color){
	var div=document.createElement("div");
	var date=new Date();
	div.innerHTML='<img src="imgs/chatsIcon.png"/>'+
           '<div class="chatRight">'+
            '<p>'+userName+'<span>'+dateForm(date)+'</span></p>'+
            '<div class="text" style="color:'+color+'">'+showEmoji(msg)+'</div>'+
           '</div>';
    div.className="chatlist "+className;
    chatContainer.appendChild(div);
    //statusOnline.innerHTML=userCount;
}
// 添加图片信息
function sendImgFun(userName,imgData,className){
	var div=document.createElement("div");
	var date=new Date();
	div.innerHTML='<img src="imgs/chatsIcon.png"/>'+
           '<div class="chatRight">'+
            '<p>'+userName+'<span>'+dateForm(date)+'</span></p>'+
            '<div class="text"><a href="'+imgData+'" target="_blank"><img src="'+imgData+'"/></a></div>'+
           '</div>';
    div.className="chatlist "+className;
    chatContainer.appendChild(div);
}
// 显示表情包信息
function showEmoji(msg){
	var reg=/\[emojs:\d+\]/g;	
	var imgTitle;
	var match;
	var result=msg;
	var totalEmojNum=document.getElementsByClassName("emoticonWrapper")[0].children.length;
	while(match=reg.exec(msg)){
		imgTitle=match[0].slice(7,-1);
		if(match>totalEmojNum || match<1){
			result=result.replace(match[0],"[X]");
		} else {
			result= result.replace(match[0],'<img src="./imgs/emoji/'+imgTitle+'.gif">');
		}
	}
	return result;
}
var userName;
var loginBtn=document.getElementById("loginBtn");
var sendMyMsg=document.getElementById("sendMyMsg");
var chatContainer=document.getElementsByClassName("chatContainer")[0];
var statusOnline=document.getElementsByClassName("statusOnline")[0];
var msgTxt=document.getElementById("msgTxt");
var colorBtn=document.getElementById("colorBtn");
// 服务器建立链接
var socket=io.connect();
// 登录
loginBtn.addEventListener("click",function(){
	userName= document.getElementById('userName').value;
	if(userName){
		socket.emit("login",userName);
	}
});
socket.on('nickExisted', function() {
	document.getElementsByClassName("loginTxt")[0].innerHTML= '该用户已经存在！';
});
socket.on("loginSuccess", function(){
	sessionStorage.setItem("userName",userName);
	document.getElementsByClassName("login")[0].style.display="none";
	document.title=userName+ " 在线";
});
document.getElementById('userName').addEventListener("keyup", function(e){
	userName= document.getElementById('userName').value;
	if(e.keyCode==13 && userName){
		socket.emit("login",userName);
	}
});
// 用户自己发送消息
sendMyMsg.addEventListener("click",function(){
	var data={
		txt:msgTxt.value,
		date: new Date(),
		color: colorBtn.value
	}
	if(data.txt){
		socket.emit("sendMyMsg",data);
		sendMsgFun("me",data.txt,"self",data.color);
		msgTxt.value="";
	}
});
msgTxt.addEventListener("keyup", function(e){
	var data={
		txt:msgTxt.value,
		date: new Date(),
		color: colorBtn.value
	}
	if(e.keyCode==13 && data.txt){
		socket.emit("sendMyMsg",data);
		sendMsgFun("me",data.txt,"self",data.color);
		msgTxt.value="";
	}	
});
// 接受系统信息
socket.on("system",function(userName,userCount,msg){
	sendMsgFun("system",userName+"  "+msg,"system","red");
    statusOnline.innerHTML=userCount;
});
var userOnline=document.getElementsByClassName("userOnline")[0];
socket.on("systemUsers", function(users){
	var html="";
	users.forEach(function(item,index){
		html+='<p><img src="imgs/chatsIcon.png"/><span>'+users[index]+'</span></p>';
	});
	userOnline.innerHTML=html;
});
// 接受其他用户消息
socket.on("newMsg", function(userName,data){
	sendMsgFun(userName,data.txt,"otherChat",data.color);
});
// 用户发送图片
document.getElementById("sendImgBtn").addEventListener("click",function(){
	document.getElementById("sendImg").click();
});
document.getElementById("sendImg").addEventListener("change", function(){
	if(this.files.length!=0){
		var file=this.files[0];
		var reader=new FileReader();
		if(!reader){
			sendMsgFun("system","您的浏览器不支持FileReader","system","red");
			this.value="";
			return false;
		}
		reader.onload=function(e){
			this.value="";
			socket.emit("sendImg",e.target.result);
			sendImgFun("me",e.target.result,"self");
		}
		reader.readAsDataURL(file);
	}
});
// 用户接受其他用户图片
socket.on("newImg",function(userName,imgData){
	sendImgFun(userName,imgData,"otherChat");
});
// 用户发送表情包
//生成包情包图像列表
var emoticonWrapper=document.getElementsByClassName("emoticonWrapper");
var emoticonBtn=document.getElementById("emoticonBtn");
function emoticonWrapperSet(){
	var html="";
	for(var i=1;i<=69;i++){
		html+='<img src="./imgs/emoji/'+i+'.gif" title="'+i+'">';
	} 
	emoticonWrapper[0].innerHTML=html;
	emoticonWrapper[1].innerHTML=html;
}
emoticonWrapperSet();
emoticonBtn.addEventListener("click",function(){
	var display=emoticonWrapper[0].style.display;
	if(display=="block"|| display==""){
		emoticonWrapper[0].style.display="none";
	}
	if(display=="none"){
		emoticonWrapper[0].style.display="block";
	}
});
emoticonWrapper[0].addEventListener("click",function(e){
	var target=e.target;
	if(target.nodeName.toLowerCase()=="img"){
		msgTxt.focus();
		msgTxt.value=msgTxt.value + '[emojs:'+target.title+']';
	}
});
//点对点用户通信+++++++++++++++++++++++++++++++
var toOneEmoticonBtn=document.getElementById("toOneEmoticonBtn");
var toOneMsgTxt=document.getElementById("toOneMsgTxt");
var toOneSendMyMsg=document.getElementById("toOneSendMyMsg");
var toOneColorBtn=document.getElementById("toOneColorBtn");
document.body.addEventListener("click", function(e){
	if(e.target!=emoticonWrapper[0] && e.target!=emoticonWrapper[1] && e.target!=emoticonBtn&& e.target !=toOneEmoticonBtn){
		emoticonWrapper[0].style.display="none";
		emoticonWrapper[1].style.display="none";
	}
});
toOneEmoticonBtn.addEventListener("click",function(){
	var display=emoticonWrapper[1].style.display;
	if(display=="block"|| display==""){
		emoticonWrapper[1].style.display="none";
	}
	if(display=="none"){
		emoticonWrapper[1].style.display="block";
	}
});
emoticonWrapper[1].addEventListener("click",function(e){
	var target=e.target;
	if(target.nodeName.toLowerCase()=="img"){
		toOneMsgTxt.focus();
		toOneMsgTxt.value=toOneMsgTxt.value + '[emojs:'+target.title+']';
	}
});
document.getElementsByClassName("userOnline")[0].addEventListener("click", function(e){
	if(e.target.nodeName.toLowerCase()=="span"){
		if(e.target.innerHTML !=userName){
			document.getElementsByClassName("touser")[0].innerHTML=e.target.innerHTML;
		}
	}
});
toOneSendMyMsg.addEventListener("click",function(){
	//sessionStorage.getItem("userName");
	var data={
		from: userName,
		to:document.getElementsByClassName("touser")[0].innerHTML,
		txt:toOneMsgTxt.value,
		date: new Date(),
		color: toOneColorBtn.value
	}
	if(data.to==userName || !data.to){
		oneToOneSendMsgFun("system","没有选择对话对象，自己和自己不能对话","system","red");
		return false;
	}
	if(data.txt){
		socket.emit("oneToOneMsg",data);
		oneToOneSendMsgFun("me To "+data.to,data.txt,"self",data.color);
		toOneMsgTxt.value="";
	}
});
//一对一信息添加页面中函数
var oneToOnechatContainer=document.getElementsByClassName("chatContainer")[1];
function oneToOneSendMsgFun(userName,msg,className,color){
	var div=document.createElement("div");
	var date=new Date();
	div.innerHTML='<img src="imgs/chatsIcon.png"/>'+
           '<div class="chatRight">'+
            '<p>'+userName+'<span>'+dateForm(date)+'</span></p>'+
            '<div class="text" style="color:'+color+'">'+showEmoji(msg)+'</div>'+
           '</div>';
    div.className="chatlist "+className;
    oneToOnechatContainer.appendChild(div);
}
//接受一对一对方信息
socket.on("getOneToOneMsg", function(data){
	document.getElementsByClassName("touser")[0].innerHTML=data.from;
	oneToOneSendMsgFun(data.from+"  To me",data.txt,"otherChat",data.color);
});
//一对一传输图片文件
document.getElementById("toOneSendImgBtn").addEventListener("click",function(){
	document.getElementById("toOneSendImg").click();
});
function oneToOnesendImgFun(userName,imgData,className){
	var div=document.createElement("div");
	var date=new Date();
	div.innerHTML='<img src="imgs/chatsIcon.png"/>'+
           '<div class="chatRight">'+
            '<p>'+userName+'<span>'+dateForm(date)+'</span></p>'+
            '<div class="text"><a href="'+imgData+'" target="_blank"><img src="'+imgData+'"/></a></div>'+
           '</div>';
    div.className="chatlist "+className;
    oneToOnechatContainer.appendChild(div);
}
document.getElementById("toOneSendImg").addEventListener("change", function(){
	if(this.files.length!=0){
		var file=this.files[0];
		var reader=new FileReader();
		if(!reader){
			oneToOneSendMsgFun("system","您的浏览器不支持FileReader","system","red");
			this.value="";
			return false;
		}
		reader.onload=function(e){
			this.value="";
			var data={
				from: userName,
				to: document.getElementsByClassName("touser")[0].innerHTML,
				data:e.target.result
			}
			socket.emit("oneToOneSendImg",data);
			oneToOnesendImgFun("me To "+data.to,data.data,"self");
		}
		reader.readAsDataURL(file);
	}	
});
socket.on("oneToOneNewImg",function(data){
	oneToOnesendImgFun(data.from+" To me",data.data,"otherChat");
});