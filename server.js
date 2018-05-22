// require("socket.io");
var http=require("http");
var express=require("express");
var app=express();
var server=http.createServer(app);
var io=require("socket.io").listen(server);
var users=[];//var users=["aa","bb","cc"];
var usersHash=[];
app.use("/",express.static(__dirname+'/www/'));
// server=http.createServer(function(req,res){
// 	res.writeHead(200,{
// 		'Content-Type': 'text/plain'
// 	});
// 	res.write("hello me");
// 	res.end();
// });
server.listen(8080);
console.log("server started");
io.on("connection", function(socket){
	socket.on("login", function(userName){
		if(users.indexOf(userName)>-1){
			socket.emit("nickExisted");
		} else {
            socket.userIndex = users.length;
            socket.userName = userName;
            users.push(userName);
            usersHash.push({name:userName,id:socket.id});
            socket.emit('loginSuccess');
            io.sockets.emit('system', userName,users.length,"login"); 
            io.sockets.emit("systemUsers",users);
		}
	});
	socket.on("disconnect",function(){
		users.splice(socket.userIndex,1);
		socket.broadcast.emit("system",socket.userName,users.length,"logout");
		socket.broadcast.emit("systemUsers",users);
	});
	// 后端接受用户信息
	socket.on("sendMyMsg",function(data){
		// 后端将用户信息发布给其他用户
		socket.broadcast.emit('newMsg', socket.userName, data);
	});
	// 后端接受用户发送图片信息
	socket.on("sendImg",function(imgData){
		// 后端将用户图片发布给其他用户
		socket.broadcast.emit("newImg",socket.userName,imgData);
	});	
	//一对一用户聊天
	socket.on("oneToOneMsg", function(data){
		var socketid;
		usersHash.forEach(function(item,index){
			if(item.name==data.to){
				socketid=item.id;
			}
		});
		// console.log(socketid,data,usersHash);
		io.to(socketid).emit('getOneToOneMsg', data);
		// io.sockets.socket(socketid).emit('getOneToOneMsg', data);
	});
	//一对一 用户发送图片文件
	socket.on("oneToOneSendImg",function(data){
		var socketid;
		usersHash.forEach(function(item,index){
			if(item.name==data.to){
				socketid=item.id;
			}	
		});
		io.to(socketid).emit("oneToOneNewImg",data);
	});
});