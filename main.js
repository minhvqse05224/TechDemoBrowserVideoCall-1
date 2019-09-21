const socket = io('https://rtcletspeakdem.herokuapp.com/');
$("#div-chat").hide();

socket.on('Users_Online',arrUserInfo =>{
    $("#div-chat").show();
    $("#div-register").hide();

    console.log("getting users online");
    arrUserInfo.forEach(element => {
        const{ username, peerId} = element;
        $('#ulUser').append("<li id="+peerId+">" +username+ "</li>");
        $("#"+peerId+"").css({'cursor': 'pointer'});
    });
    socket.on('New_User',user =>{
        console.log("a new user found");
        const{ username, peerId} = user;
        $('#ulUser').append("<li id="+peerId+">" +username+ "</li>");
        $("#"+peerId+"").css({'cursor': 'pointer'});
    });
    socket.on('User_Disconnected',peerId =>{
        console.log("dc event by peerId");
        $("#"+peerId).remove();
    });
    });
    socket.on('Failed_Register',() =>{
        alert('Username alr exist');
    });


function openStream(){
    const config = {audio: false, video: true};
    return navigator.mediaDevices.getUserMedia(config); 
}
//openStream().then(stream => playStream('localStream',stream));

function playStream(idVideoTag, stream){
    const video = document.getElementById(idVideoTag);
    video.srcObject = stream;
    video.play();
}  

const  peer = new Peer({secure:true,port:443}); 
peer.on('open', id => {
    $('#my-peer').append(id)
    $('#btnSignUp').click(() => {
        const username = $('#txtUserName').val();
        socket.emit("User_Registered",{username: username, peerId:id})
    });
});

//caller
$('#btnCall').click(() => {
    const id = $('#remoteId').val();
    openStream().then(stream => {
        playStream('localStream',stream);
        const call = peer.call(id, stream);
        call.on('stream', remoteStream => playStream('remoteStream', remoteStream))
    });
});

//receiver
peer.on('call',call => {
    openStream().then(stream =>{
        call.answer(stream);
        playStream('localStream',stream);
        call.on('stream', remoteStream => playStream('remoteStream', remoteStream)) 
    });
});

$('#ulUser').on('click', 'li', function(){
    console.log($(this).attr('id'));
    const id = $(this).attr('id');
    openStream().then(stream => {
        playStream('localStream',stream);
        const call = peer.call(id, stream);
        call.on('stream', remoteStream => playStream('remoteStream', remoteStream))
    });
});
