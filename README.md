##前言 

   最近一直在学AngularJs,感觉官方的例子写完了，感觉还是掌握的不够，于是我就想做一个应用来巩固一下AngularJs。同行的都说在线聊天不错。于是考虑了一系列的原因。自己决定做一个在线聊天室。用到的知识有AngularJs,NodeJs,socket.io。其实后说的这两种，其实我也刚学不久，于是就一起巩固吧，在线聊天室很多也是参考别人的思想来做的。
### 链接 
[详情可以链接到我的博客-叮当猫-前端爱好者](http://www.shuliqiyzs.com)<br /> 
##步骤

### 一.环境配置
   由于我们的应用是在node.Js环境下搭建的，所以如果没有装node.js的要自行安装node.js。只需要去官方https://nodejs.org/下载node.js装上即可。其次我们需要用到express.js的http模块和socket.io框架。所以需要把这两个安装进来。在线聊天室的根目录（chat）打开命令窗口（shift + t）菜单就 会有“在此处打开命令窗口”。点击即可打开命令窗口。然后在命令窗口打出如下的命令：
```javascript
npm -g express
npm -g socket.io
```
此时环境和相应的模块搭建好了

###二.HTML文件
   html我们有3个文件.index.html,user.html,message.html

####1.index.html
在html的head部分开始引入相应的js文件
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>叮当猫</title>
    <link rel="stylesheet" href="./assets/style/app.css"/>
    <script src="http://libs.baidu.com/jquery/2.0.0/jquery.min.js"></script>
    <script src="/socket.io/socket.io.js"></script>
    <script src="//cdn.bootcss.com/angular.js/1.4.3/angular.min.js"></script>
    <script src="./assets/js/app.js"></script>
</head>
```
   在body的部分开始引入Angular.js。只需要在body部分写ng-app即可，再加入angular.js的controller的ng-controller,如下：
```html
<body ng-app="chatRoom" ng-controller="chatCtrl">
```
  在body里面我们主要有两大部分，第一部分：用户登录界面。第二部分：聊天室的部分。这两个部分我们使用AngularJs的ng-show根据hasLogined来控制显示和隐藏。
```html
<div class="chatRoom" ng-show="hasLogined">
<div ng-show="!hasLogined" id="loginbox">
```
#####登录部分的html如下：
```html
 <div ng-show="!hasLogined" id="loginbox">
        <form novalidate name="userform" ng-submit="login()" class="login">
            <div>
                <h2>叮当猫登录</h2>
                 <input type="text" class="form-control" placeholder="输入你的昵称" ng-model="name" id="username" required/>
                <button class="sub" type="submit" value="提交" ng-disabled="userform.$invalid">LOG IN</button>
                <p>叮当猫：请加入我们一起畅谈吧</p>
            </div>
        </form>
    </div>
```
  在里面我们用到的是Angular.js的视图。ng-model="name",这个值在index.js里面会时时获取到这个值。当用户点击LOG IN的时候会执行ng-submit="login()"事件
#####聊天室部分的html如下：
```html
<div class="chatRoom" ng-show="hasLogined">
        <div class="chat">
            <div class="all">
                <h3>{{receiver?receiver:"叮当猫：群聊"}}</h3>
            </div>
            <div class="message">
                 <message self="nickname" scrolltothis="scrollToBottom()" info="message" ng-repeat="message in messages"></message>
            </div>
            <div class="form">
                <form novalidate name="postform" ng-submit="postMessage()">
                    <input type="text" class="form-control" ng-model="words" placeholder="叮当猫：唠唠吧" required>
                    <button type="submit" class="btn btn-success" ng-disabled="postform.$invalid">发送</button>
                </form>
            </div>
        </div>
        <div class="userNum">
            <div class="onlie">
                <h3>当前在线:</h3>
                <span>{{users.length-1}}</span>
            </div>
        <div class="user">
             <user iscurrentreceiver="receiver===user.name" info="user" ng-click="setReceiver(user.nickname)" ng-repeat="user in users"></user>
        </div>
        </div>
    </div>
```
 在这里面，我们主要用到Angular.js的两个自定义指令。user和message指令。
#####user.html
```html
<div class="user">
<span class="avatar"></span><span class="nickname">{{info.nickname?info.nickname:"群聊"}}</span>
    <span class="unread" ng-show="info.hasNewMessage&&!iscurrentreceiver">[未读]</span>
</div>
```
#####message.html
```html
<div ng-switch on="info.type">
    <!-- 欢迎消息 -->
    <div class="system-notification" ng-switch-when="welcome"><strong>系统:&nbsp;&nbsp;</strong><span>{{info.text}}</span>来啦~
    </div>
    <!-- 退出消息 -->
    <div class="system-notification" ng-switch-when="bye"><strong>系统:&nbsp;&nbsp;</strong>byebye,
        <span>{{info.text}}</span></div>
    <!-- 普通消息 -->
    <div class="normal-message" ng-class="{others:self!==info.from,self:self===info.from}" ng-switch-when="normal">
        <div class="name-wrapper"><span>{{info.from}} @ </span><span>{{time |  date: 'HH:mm:ss' }}</span></div>
        <div class="content-wrapper"><span class="content">{{info.text}}</span><span class="avatar"></span></div>
    </div>
</div>
```
####2.js

用户端的index.js
先把相应的模块加载进来，把public共享
```javascript
var express = require("express");
var app = require("express")();
var http = require("http").createServer(app);
var io = require("socket.io")(http);
app.use(express.static(__dirname + '/public'));
app.get('/',function(req,res) {
    res.sendfile('index.html');
});
```
 主要的逻辑层，注释的很清楚
```javascript 
ar createdSocket = {};   //私信的时候需要用到一个socket实例
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
    //data: msg = {text:$scope.words,type:"normal",color:$scope.color,from:$scope.name,to:$scope.receiver};
    socket.on("addMessage",function(data){
        //发送私信，看发送 进来的to是否有接收者
        if (data.to) {
            // 私发给特定的sockt实例
            createdSocket[data.to].emit("messageAdded",data);
        }else{   //群发的
            socket.broadcast.emit("messageAdded",data);
        }
    })
    // 用户退出网站 做两件大事，1.广播其他用户该用户下线  2.在createdSocket实例中删除该socket实例
    socket.on("disconnect",function(){
        socket.broadcast.emit("userRmove",{name:socket.name});
        for (var i = 0; i < allUsers.length; i++) {
            if (allUsers[i].name == socket.name) {
                allUsers.splice(i,1);    //在数组中把这个下标的用户删除；
            }
        }
        // 还需要把实例删除
        delete createdSocket[socket.name];
    })
})
```
#####最后设置本地的端口
```javascript
//设置监听端口
http.listen(3002,function(){
    console.log("监听的是3002端口");
});
```

####客户端的js
    我们先定义两个服务socket是对socket.io的封装，这里采用的是factory服务，一共有三种创建服务的方式,factory,service,privider。randomColor,用来给用户添加一个头像的颜色的。定义一个userService服务，主要是用来判断当前的用户名在当前在线下是否已经使用
```javascript
// 定义一个（依赖注入）服务,socket是对socket.io的封装，这里采用的是factory服务，一共有三种创建服务的方式,factory,service,privider
app.factory("socket",function($rootScope){//这是angular的根元素
    var socket = io();                    //默认连接部署网站的服务器
    return{                               //返回一个对象
            on:function(even,callback){
                socket.on(event,function(){
                    var arguments = arguments;
                    $rootScope.$apply(socket,arguments);
                });
            },
            emit:function(event,data,callback){
                socket.emit(event,data,function(){
                    var arguments = arguments;
                    $rootScope.$apply(function(){
                        if (callback) {
                            callback.apply(socket,arguments);
                        }
                    });
                });
            }
        };
});
//定义一个依赖注入（服务）randomColor,用来给用户添加一个头像的颜色的
app.factory("randomColor",function(){
    return{
        color:function(){
            return '#'+('00000'+(Math.random()*0x1000000<<0).toString(16)).slice(-6);
        }
    }；
})
// 定义一个userService服务，主要是用来判断当前的用户名在当前在线下是否已经使用
app.factory("userService",function(){
    return{
        getName:function(users,name){
            if (users instanceof Array) {
                for (var i = 0; i < users.length; i++) {
                     if (users[i].name ==== name ) {
                       return users[i];
                     }
                }
            }else{
                return null;
            }
 
        }
    }
})
})
// 定义一个userService服务，主要是用来判断当前的用户名在当前在线下是否已经使用
app.factory("userService",function(){
    return{
        getName:function(users,name){
            if (users instanceof Array) {
                for (var i = 0; i < users.length; i++) {
                     if (users[i].name ==== name ) {
                       return users[i];
                     }
                }
            }else{
                return null;
            }
        }  
```
然后我们会在Angular.js的控制器中做一系列的控制
```javascript
app.controller("chatCtrl",["$scope","socket","randomColor","userService"],function($scope,socket,randomColor,userService){
    $scope.logined = false;          //使用angular的show和hide，他们的判断会根据logined,false表示不显示该部分内容，true表示显示该内容
    $scope.receiver = "";            //因为有两种聊法。群聊和私聊。默认情况下是群聊
    $scope.publicMessages= []        //群聊的信息存放在这里
    $scope.privateMessages= []       //私聊的的信息存放在这里
    $scope.messages = $scope.publicMessages;          //默认显示的消息是群聊的信息
    $scope.users = [];                                //存放在线的用户信息
    $scope.color = randomColor.color();               //在线的用户的头像颜色
    $scope.login = function(){                        //用户触发这个事件
        socket.emit("addUser",{name:$scope.name,color:$scope.color});     //socket服务的emit发出一个userAdd事件给服务器  获取html的name值和在factory的color值
    }
    // 监听服务器传进来的用户昵称判断是否已经使用的结果
    socket.on("userAddResult",function(data){
        if (data.result) {
            $scope.userExisted = false;                //用户昵称没有被占用
            $scope.logined = true;                     //让登录部分隐藏
        }else{
            $scope.userExisted = true; 
        }
    });
    //html在写完信息点击发送之后 会执行这个事件 ，会获取ng-moduole的words值
    $scope.postmsg = function(){
        // 一条消息的信息
        var msg = {text:$scope.words,type:"normal",color:$scope.color,from:$scope.name,to:$scope.receiver};
        var rec = $scope.receiver;
        // 私聊的情况
        if (rec){
            if (!$scope.privateMessages[rec]) {
                $scope.privateMessages[rec] = [];
            }
            $scope.privateMessages[rec].push(msg);    //把群聊信息保存在privateMessages数组里
        }
        // 群聊的情况
        else{
            $scope.publicMessages[rec].push(msg);    //把群聊信息保存在publicMessages数组里
        }
       $scope.words = "";
        if (rec !== $scope.name) {                   // 排除给自己发的状况
            socket.emit("addMessage",msg);          //发出一个messagesAdd事件
        }
    } 
    $scope.setreceiver=function(receiver){
        $scope.receiver = receiver;
        // 私信部分
        if (receiver) {
            if (!$scope.privateMessages[receiver]) {
                $scope.privateMessages[receiver] = [];
            }
            $scope.messages = $scope.privateMessages[receiver];
        }
        // 群发的
        else{
            $scope.messages = $scope.publicMessages[receiver];
        }
        var user = userService.getName($scope.users,receiver)
        if (users) {
            users.logined = false;
        }
    }
 
    //监听用户发来的userAdded事件
    socket.on("userAdded",function(data){
        if (!$scope.logined) return ;
        $scope.publicMessages.push({text:data.name,type:"welcom"});
        $scope.users.push(data);
    })
    socket.on("allUser",function(){
        if (!$scope.logined) return ;
        $scope.users = data;
    })
    //消息发送之后，有私发和群发
    socket.on("mesaageAdded",function(data){
        if (!$scope.logined) return;
        // 判断是否是私发
        if (data.to) {
            if (!$scope.privateMessages[data.form]) {
                $scope.privateMessages[data.form] = [];
            }
            // 保存发送者的消息
            $scope.privateMessages[data.form].push(data);
        }else{//群发状态
            $scope.publicMessages.push(data);
        }
        // 定义一个发送者，通过定义的factory服务获取
        var fromUser = userService.get($scope.users,data.from);
        // 定义接受者
        var toUser = userService.get($scope.users,data.from);
        // 判断提示有多少未读信息 这个条件是不在私聊状态中
        if ($scope.receiver !== data.to) {
            if (fromUser && toUser.name) {
                fromUser.hasNewMessage = true;
            }else{
                fromUser.hasNewMessage = false;
            }
        }
    });
    // 用户退出聊天室
    socket.on('userRemoved', function(data) {
        if(!$scope.hasLogined) return;
        $scope.publicMessages.push({text:data.nickname,type:"bye"});
        for(var i=0;i<$scope.users.length;i++){
            if($scope.users[i].nickname==data.nickname){
                $scope.users.splice(i,1);
                return;
            }
        }
    });
}]);
```
   最后是定义的两个指令message和user
```javascript
//自定义两个指令,用来渲染uers和message页面
app.directive('message', ['$timeout',function($timeout) {
    return {
        restrict: 'E',
        templateUrl: 'message.html',
        scope:{
            info:"=",
            self:"=",
            scrolltothis:"&"
        },
        link:function(scope, elem, attrs){
                scope.time=new Date();
                $timeout(scope.scrolltothis);
                $timeout(function(){
                    elem.find('.avatar').css('background',scope.info.color);
                });
        }
    };
}])
.directive('user', ['$timeout',function($timeout) {
    return {
        restrict: 'E',
        templateUrl: 'user.html',
        scope:{
            info:"=",
            iscurrentreceiver:"=",
            setreceiver:"&"
        },
        link:function(scope, elem, attrs,chatCtrl){
            $timeout(function(){
                elem.find('.avatar').css('background',scope.info.color);
            });
        }
    };
}]);
```
谢谢阅读

