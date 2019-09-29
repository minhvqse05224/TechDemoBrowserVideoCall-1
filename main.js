const socket = io('https://rtcletspeakdem.herokuapp.com');
$("#div-chat").hide();
$("#localStream").hide();
$("#remoteStream").hide();
//init
const peer = new Peer();
let currentStream;

peer.on('open', id => {
    $('#my-peer').append(id)
    $('#btnSignUp').click(() => {
        const username = $('#txtUserName').val();
        socket.emit("User_Registered", { username: username, peerId: id })
    });
});
socket.on('Failed_Register', () => {
    alert('Username alr exist');
});

//common functions
function openStream() {
    const config = { audio: true, video: true };
    return navigator.mediaDevices.getUserMedia(config);
}
function playStream(idVideoTag, stream) {
    const video = document.getElementById(idVideoTag);
    video.srcObject = stream;
    video.play().catch(function () {
        console.log("error at vid play");
    });
}
function offCam(stream) {
    stream.getTracks().forEach(function (track) {
        track.stop();
    });
}

function setOnOffButtons() {
    var offVideo = $('<input id="offVideo" type="button" value="Turn off your camera"/>');
    var offMic = $('<input id="offMic" type="button" value="Turn off your mic"/>');
    
    $('#div-chat').append(offVideo);
    $('#div-chat').append(offMic);

    console.log("setting func for cam vid")
    $('#offVideo').on('click', function () {
        currentStream.getVideoTracks()[0].enabled =
         !(currentStream.getVideoTracks()[0].enabled);        
        //dataConnection.send({ type: 'closeVid' });
        //dataConnection.close();
    });
    $('#offMic').on('click', function () {
        console.log("got off mic")
        currentStream.getAudioTracks()[0].enabled =
        !(currentStream.getAudioTracks()[0].enabled);
        //dataConnection.close();
    });
}

function endCam() {
    $("#localStream").hide();
    $("#remoteStream").hide();
    $('#endBtn').remove();
    $('#offMic').remove();
    $('#offVideo').remove();
    offCam(currentStream);
}
socket.on('Users_Online', arrUserInfo => {
    $("#div-chat").show();
    $("#div-register").hide();
    //display ol list
    arrUserInfo.forEach(element => {
        const { username, peerId } = element;
        $('#ulUser').append("<li id=" + peerId + ">" + username + "</li>");
        $("#" + peerId + "").css({ 'cursor': 'pointer' });
    });
    //new user register
    socket.on('New_User', user => {
        console.log("a new user found");
        const { username, peerId } = user;
        $('#ulUser').append("<li id=" + peerId + ">" + username + "</li>");
        $("#" + peerId + "").css({ 'cursor': 'pointer' });
    });
    //user leave
    socket.on('User_Disconnected', peerId => {
        console.log("dc event by peerId");
        $("#" + peerId).remove();
    });
    //error call
    socket.on('User_Unavailable', () => {
        alert("user not available");
    });
    //callee receiving call
    peer.on('connection', dataConnection => {
        var name;
        dataConnection.on('open', function () {
            console.log("connection open");
            dataConnection.on('data', function (data) {
                //data init handler
                if (data.type == 'name') {
                    name = data.caller
                    console.log("got data tpye");
                }
                //close cam sender handler
                if (data.type == 'closeCam') {
                    endCam();
                }
            });

            //receiver connect
            peer.on('call', call => {
                console.log("call received");
                $('#div-chat').append("<p id='callInfo'>" + name + " is calling you </p>");
                var accBtn = $('<input id="acceptBtn" type="button" value="accept call"/>');
                var decBtn = $('<input id="decBtn" type="button" value="decline call"/>');
                $('#div-chat').append(accBtn);
                $('#div-chat').append(decBtn);
                //accept call
                $("#acceptBtn").click(function () {
                    $('#acceptBtn').remove();
                    $('#decBtn').remove();
                    $('#callInfo').remove();
                    $("#localStream").show();
                    $("#remoteStream").show();
                    openStream().then(stream => {
                        setOnOffButtons();
                        currentStream = stream;
                        call.answer(stream);
                        playStream('localStream', stream);
                        call.on('stream', remoteStream => playStream('remoteStream', remoteStream));
                        var endBtn = $('<input id="endBtn" type="button" value="end call"/>');
                        $('#div-chat').append(endBtn);
                        $('#endBtn').on('click', function () {
                            endCam();
                            dataConnection.send({ type: 'closeCam' });
                            call.close();
                            //dataConnection.close();
                        });
                    })
                });
                $("#decBtn").click(function () {
                    endCam();
                    dataConnection.send({ type: 'closeCam' });
                    call.close();
                    //dataConnection.close();
                });
            });
        });
    });
});
$('#ulUser').on('click', 'li', function () {
    console.log($(this).attr('id'));
    const id = $(this).attr('id');
    const nameCallee = $(this).text();
    $(this).text(nameCallee + " :calling ...");
    //username from register, hidden prop
    const username = $('#txtUserName').val();
    $("#localStream").show();
    $("#remoteStream").show();
    var dataConnection = peer.connect(id);
    dataConnection.on('open', function () {
        console.log("connection opened");
        dataConnection.on('data', function (data) {
            //receiver close cam handler
            console.log("got data closecam");
            if (data.type == 'closeCam') {
               endCam();
            }
        });
        dataConnection.send({ type: 'name', caller: username });
        openStream().then(stream => {
            setOnOffButtons();
            console.log("calling" + id);
            playStream('localStream', stream);
            const call = peer.call(id, stream);
            call.on('stream', remoteStream => playStream('remoteStream', remoteStream))
            currentStream = stream;
            var endBtn = $('<input id="endBtn" type="button" value="end call"/>');
            $('#div-chat').append(endBtn);
            $('#endBtn').on('click', function () {
                $("#localStream").hide();
                $("#remoteStream").hide();
                $('#endBtn').remove();
                dataConnection.send({ type: 'closeCam' });
                call.close();
                offCam(stream);
                //dataConnection.close();
            })
        });

    });
    // socket.emit("User_Issue_Call", { caller: username, calleeId: id })
});
