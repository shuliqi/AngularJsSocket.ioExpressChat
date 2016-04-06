![mahua](mahua-logo.jpg)
##在线聊天室


最近一直在学AngularJs,感觉官方的例子写完了，感觉还是掌握的不够，于是我就想做一个应用来巩固一下AngularJs。同行的都说在线聊天不错。于是考虑了一系列的原因。自己决定做一个在线聊天室。用到的知识有AngularJs,NodeJs,socket.io。其实后说的这两种，其实我也刚学不久，于是就一起巩固吧，在线聊天室很多也是参考别人的思想来做的。


##在线聊天室有哪些功能？


* 聊天用户进来的时候广播其他的用户看到当前用户进入聊天室。
* 发送消息有`私聊 群聊`
* 用户退出也广播其他的用户
* 并且可以提示未读信息

##用到的知识点

* node.js 选择node是因为node可以实现高并发。
* socket.js socket把websocket的第三方库，使客户端和用户端更好的交互。
* angular.js 主要是实现mvc应用。

##应用截图
  

##实现的过程

###一.环境配置
    由于我们的应用是在node.Js环境下搭建的，所以如果没有装node.js的要自行安装node.js。只需要去官方https://nodejs.org/下载node.js装上即可。其次我们需要用到express.js的http模块和socket.io框架。所以需要把这两个安装进来。在线聊天室的根目录（chat）打开命令窗口（shift + t）菜单就 会有“在此处打开命令窗口”。点击即可打开命令窗口。然后在命令窗口打出如下的命令：
```javascript
npm -g express
npm -g socket.io``
此时环境和相应的模块搭建好了


```javascript
  var ihubo = {
    nickName  : "草依山",
    site : "http://jser.me"
  }
