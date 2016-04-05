var express = require("express");
var app = require("express");
var http = require("http").createServer(app);
var io = require("socket")(http);
app.use(express.static(__dirname + '/public'));
app.get('/',function(req,res) {
	res.sendfile('index.html');
});
var createdSocket = {};   //私信的时候需要用到一个socket实例
var allUsers = [{name:"",color:"#000"}];//初始化是没有用户的
io.on('connection',function(data){    //只要客户端发送一个东西出来，服务端就会开始http连接
	//socket的on方法监听客户端发来额addUser事件
	//socket.emit("addUser",{name:$scope.name,color:$scope.color});
	socket.on("addUser",function(data){
		if (createdSocket[data.name]) {  //判断昵称是否已经被使用
			socket.emit("userAddResult",{result:false}) //昵称占用，则发送一个result为false给客户端
		}else{
			socket.emit("userAddResult",{result:true}) //昵称没被占用，也要发给客户端
			// 开始创建socket实例,保存在createdSocket对象里面,
			socket.nickname = data.name;
			createdSocket[scope.name] = socket;
			allUsers.push(data);      // 把传过来的用户信息保存在allUsers里面
			scope.broadcast.emit("userAdded",data) //向客户端发出userAdded,把发送来的信息发过去,broadcast是g广播消息，除用户本身看不到
		    socket.emit("allUsers",allUsers)       //把所有在线的用户传到客户端
		}
	});
    //发送信息，监听客户端发送来的addMessage,
    //data: msg = {text:$scope.words,type:"normal",color:$scope.color,from:$scope.nickname,to:$scope.receiver};
    socket.on("addMessage",function(data){
    	//发送私信，看发送 进来的to是否有接收者
    	if (data.to) {
    		// 私发给特定的sockt实例
    		createdSocket[data.to].emit("messageAdded",data);
    	}
    })





})