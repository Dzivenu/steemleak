// Counters
var count_vote, count_transaction = 0;
var lastblocknum = 0;
var user_count = 0;
var objcontent = [];
var server = 'wss://this.piston.rocks';
var steemiturl = 'https://steemit.com/';
// Websocket setup
var WebSocketWrapper;WebSocketWrapper = function () {var ws = WebSocketWrapper.prototype;function WebSocketWrapper(server) {this.server = server;this.connection = {};this.callbacks = [];}ws.connect = function () {var _this = this;return new Promise(function (resolve, reject) { if ('WebSocket' in window) {_this.connection = new WebSocket(_this.server);_this.connection.onopen = function () {resolve(_this.connection);};_this.connection.onerror = function (error) {reject(Error('Cannot connect to piston server, try reloading' + error));};_this.connection.onmessage = function (data) {var sdata = JSON.parse(data['data']);_this.callbacks[sdata['id']](sdata['result']);};} else {reject(Error('Your browser lacks the websocket support needed for steemleak - time to update!'));}});};ws.send = function (data, callback) {this.callbacks[data['id']] = callback;var json = JSON.stringify(data);this.connection.send(json);};return WebSocketWrapper;}();
var SteemWrapper;SteemWrapper = function () {var steem=SteemWrapper.prototype;function SteemWrapper(ws) {this.ws = ws;this.id = 0;}steem.send=function(method, params, callback) {++this.id;var data={"id": this.id, "method": method, "params": params};this.ws.send(data, callback);};return SteemWrapper;}();
// Spawn and sort new event objects
function addEvent(content) {
// What sort of content are we posting ?
switch(content.posttype) {
case 'post':$('#posts').append(' '+content.title+' '+content.subtitle+' ');break;
case 'vote':$("#votes").append(' '+content.title+' '+content.subtitle+' ');break;
//case 'newuser':$('#newusers').append(' '+content.title+' '+content.subtitle+' ');break;
case 'market':$("#marketdiv").append(' '+content.title+' '+content.subtitle+' ');break;
case 'account':$("#accounts").append(' '+content.title+' '+content.subtitle+' ');break;
//case 'pow':$("#pow").append(' '+content.title+' '+content.subtitle+' ');break;
case 'comment':$("#comment").append(' '+content.title+' '+content.subtitle+' ');break;
// Unknown post content type, log and skip
default:console.log(' '+content.posttype+' skipped');break;}}
// Process up to 200 objects per block
function handleObjects() {if(objcontent.length > 0) {addEvent(objcontent[0]);objcontent.splice(0,1);} else {objcontent = [];}setTimeout(handleObjects, 200);}
handleObjects();
// LOOP START :: Main websocket
if (window.WebSocket){var ws = new WebSocketWrapper(server);ws.connect().then(function(response) {var steem = new SteemWrapper(ws);console.log("Connected to backend server "+server+" ");var wsocket = function() {

//    Get global properties , use it to update block count
steem.send('get_dynamic_global_properties',[], function(response2) {var block_number = response2["last_irreversible_block_num"];$('#blockcount').html(' '+block_number+' ');
//    New blocks yet ? Grab 'em, or wait a bit
if(lastblocknum != block_number) {lastblocknum = block_number;steem.send("get_block", [block_number], function(block) {for(var i = 0; i < block.transactions.length; i++) {
//    Put all transactions from this block into an array
var actionobj = block.transactions[i].operations[0];

switch (actionobj[0]) {
//    LOOP START :: Examining transactions in latest block
//        Vote goes in, vote  goes out - never a miscommunication
case 'vote': if (actionobj[1].weight > '1') {var voteDirection = ' <strong class="upvote"> &#x1f44d; </strong> ';} else {var voteDirection = ' <strong class="downvote"> &#x1f44e; </strong> ';} topost = {title: '<a href="'+steemiturl+'@'+actionobj[1].voter+'" target="_blank" class="user">'+actionobj[1].voter+'</a> '+voteDirection+' <a href="'+steemiturl+''+actionobj[1].category+'/@'+actionobj[1].author+'/'+actionobj[1].permlink+'" target="_blank">'+actionobj[1].author+'</a>',subtitle: '',posttype: 'vote'}; break;
//        Comments and posts
case 'comment': if(actionobj[1].title != '') {topost = {title: '&#128214; <a href="'+steemiturl+'@'+actionobj[1].author+'" target="_blank">'+actionobj[1].author+'</a>',subtitle: '<a href=\"'+steemiturl+''+actionobj[1].category+'/@'+actionobj[1].author+'/'+actionobj[1].permlink+'">'+actionobj[1].title+'</a>', posttype: 'post'}}  else {topost = {title: '&#128172; <a href="'+steemiturl+'@'+actionobj[1].author+'" target="_blank" class="user">'+actionobj[1].author+'</a>',subtitle: '',posttype: 'comment'}}break;
//        STEEM/SBD Transfers
case 'transfer': topost = {title: '&#128184; Transfer of '+actionobj[1].amount+' from <a href="'+steemiturl+'@'+actionobj[1].from+'" target="_blank" class="user">'+actionobj[1].from+'</a> to <a href="'+steemiturl+'@'+actionobj[1].to+'" target="_blank" class="user">'+actionobj[1].to+'</a>',subtitle: 'Memo: '+actionobj[1].memo,posttype: 'market'}
//        New Account registrations
//case 'account_create': topost = {title: '&#128587; <a href="'+steemiturl+'@'+actionobj[1].new_account_name+'" target="_blank" class="user">'+actionobj[1].new_account_name+'</a>',subtitle: '',posttype: 'newuser'}; user_count++; $('#usercount').html(' '+user_count+' '); console.log('new account '+user_count+''); break;
//        New market limit order created
//case 'limit_order_create':topost = {title: '&#128181; '+actionobj[1].amount_to_sell+' for '+actionobj[1].min_to_receive +' by <a href="'+steemiturl+'@'+actionobj[1].owner+'" target="_blank" class="user">'+actionobj[1].owner+'</a>',subtitle: ' '+actionobj[1].orderid+' ',posttype: 'market'}; console.log(actionobj[1]); break;
//        Account update / key change
//case 'account_update': topost = {title: '<div class="useredit">&#128259; <a href="'+steemiturl+'@'+actionobj[1].account+'" target="_blank" target="_blank" class="user">'+actionobj[1].account+'</a></div>',subtitle: '',posttype: 'account'}; break;
//        market limit order cancelled
//case 'limit_order_cancel':topost = {title: '<div class="cancel">&#10060; <a href="'+steemiturl+'@'+actionobj[1].owner+'" target="_blank" target="_blank" class="user">'+actionobj[1].owner+'</a> cancelled</div>',subtitle: ' '+actionobj[1].orderid+' ',posttype: 'market'}; break;
//        new pow block found
//case 'pow': topost = { title: '<div class="newblock">&#128119; <a href="'+steemiturl+'@'+actionobj[1].worker_account+'" target="_blank" target="_blank" class="user">'+actionobj[1].worker_account+'</a></div>', subtitle: '', posttype: 'pow'}; break;
//        Nothing found to link
default: topost = false;}
//        Did we make a post ? Puuuuush!
if(topost) {topost['class'] = actionobj[0];objcontent.push(topost);}
//    LOOP END :: Examining transactions in latest block
}
// LOOP END :: Main websocket
});
}
setTimeout(wsocket,1000);
});
// LOOP END :: Main websocket
};
// Connect websocket
wsocket();
});
// Couldn't connect websocket
} else {alert('Unfortunately - your browser does not support websocket and therefore not this realtime view of the Steem blockchain... ');};
