var app = angular.module("chatRoom",[]);
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
// 定义一个控制器，用来控制整个流程
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

