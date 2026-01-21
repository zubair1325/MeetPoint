import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import { Badge, IconButton, TextField } from "@mui/material";
import { Button } from "@mui/material";
import VideocamIcon from "@mui/icons-material/Videocam";
import VideocamOffIcon from "@mui/icons-material/VideocamOff";
import CallEndIcon from "@mui/icons-material/CallEnd";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import ScreenShareIcon from "@mui/icons-material/ScreenShare";
import StopScreenShareIcon from "@mui/icons-material/StopScreenShare";
import ChatIcon from "@mui/icons-material/Chat";

import server from "../environment.js";
import "../styles/VideoMeet.css";

const server_url = server;
let connections = {};
const peerConfigConnections = {
  iceServer: [{ url: "stun:stun.l.google.com:19302" }],
};
export default function VideoMeet() {
  var socketRef = useRef();
  let socketIdRef = useRef();

  let localVideoRef = useRef();
  let [videoAvailable, setVideoAvailable] = useState(true);
  let [audioAvailable, setAudioAvailable] = useState(true);

  let [video, setVideo] = useState([]);
  let [audio, setAudio] = useState();

  let [screen, setScreen] = useState();
  let [showMode, setModel] = useState();

  let [messages, setMessages] = useState([]);
  let [message, setMessage] = useState("");
  let [newMessages, setNewMessages] = useState(0);
  let [askForUsername, setAskForUsername] = useState(true);
  let [username, setUsername] = useState("");

  const videoRef = useRef([]);
  let [videos, setVideos] = useState([]);

  let [screenAvailable, setScreenAvailable] = useState();

  const getPermissions = async () => {
    try {
      const videoPermission = await navigator.mediaDevices.getUserMedia({
        video: true,
      });

      if (videoPermission) {
        console.log("accessing video now");
        setVideoAvailable(true);
      } else {
        setVideoAvailable(false);
      }

      const audioPermission = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      if (audioPermission) {
        console.log("accessing audio now");
        setAudioAvailable(true);
      } else {
        setAudioAvailable(false);
      }
      if (navigator.mediaDevices.getDisplayMedia) {
        console.log("have display access");
        setScreenAvailable(true);
      } else {
        setScreenAvailable(false);
      }

      if (videoAvailable || audioAvailable) {
        const userMediaStream = await navigator.mediaDevices.getUserMedia({
          video: videoAvailable,
          audio: audioAvailable,
        });
        if (userMediaStream) {
          console.log("final stage");
          window.localStream = userMediaStream;
          localVideoRef.current.srcObject = userMediaStream;
        }
      }
    } catch (e) {
      console.log(e);
    }
  };

  let getUserMediaSuccess = (stream) => {
    try {
      window.localStream.getTracks().forEach((track) => track.stop());
    } catch (e) {
      console.log(e);
    }

    window.localStream = stream;
    localVideoRef.current.srcObject = stream;

    for (let id in connections) {
      if (id === socketIdRef.current) continue;

      connections[id].addStream(window.localStream);

      connections[id].createOffer().then((description) => {
        console.log(description);
        connections[id]
          .setLocalDescription(description)
          .then(() => {
            socketRef.current.emit(
              "signal",
              id,
              JSON.stringify({ sdp: connections[id].localDescription }),
            );
          })
          .catch((e) => console.log(e));
      });
    }

    stream.getTracks().forEach(
      (track) =>
        (track.onended = () => {
          setVideo(false);
          setAudio(false);

          try {
            let tracks = localVideoRef.current.srcObject.getTracks();
            tracks.forEach((track) => track.stop());
          } catch (e) {
            console.log(e);
          }

          let blackSilence = (...args) =>
            new MediaStream([black(...args), silence()]);
          window.localStream = blackSilence();
          localVideoRef.current.srcObject = window.localStream;

          for (let id in connections) {
            connections[id].addStream(window.localStream);

            connections[id].createOffer().then((description) => {
              connections[id]
                .setLocalDescription(description)
                .then(() => {
                  socketRef.current.emit(
                    "signal",
                    id,
                    JSON.stringify({ sdp: connections[id].localDescription }),
                  );
                })
                .catch((e) => console.log(e));
            });
          }
        }),
    );
  };

  let silence = () => {
    let ctx = new AudioContext();
    let oscillator = ctx.createOscillator();
    let dst = oscillator.connect(ctx.createMediaStreamDestination());
    oscillator.start();
    ctx.resume();
    return Object.assign(dst.stream.getAudioTracks()[0], { enabled: false });
  };
  let black = ({ width = 640, height = 480 } = {}) => {
    let canvas = Object.assign(document.createElement("canvas"), {
      width,
      height,
    });
    canvas.getContext("2d").fillRect(0, 0, width, height);
    let stream = canvas.captureStream();
    return Object.assign(stream.getVideoTrack()[0], { enabled: false });
  };
  let getUserMedia = () => {
    if ((video && videoAvailable) || (audio && audioAvailable)) {
      navigator.mediaDevices
        .getUserMedia({ video: video, audio: audio })
        .then(getUserMediaSuccess)
        .then(() => {})
        .catch((e) => console.log(e));
    } else {
      try {
        let tracks = localVideoRef.current.srcObject.getTracks();
        tracks.forEach((track) => track.stop());
      } catch (error) {
        console.log(error);
      }
    }
  };

  useEffect(() => {
    getPermissions();
  });

  

  useEffect(() => {
    if (video !== undefined && audio !== undefined) {
      getUserMedia();
    }
  });

  let gotMessageFromServer = (fromId, message) => {
    var signal = JSON.parse(message);
    if (fromId != socketIdRef.current) {
      if (signal.sdp) {
        connections[fromId]
          .setRemoteDescription(new RTCSessionDescription(signal.sdp))
          .then(() => {
            if (signal.sdp.type === "offer") {
              connections[fromId]
                .createAnswer()
                .then((description) => {
                  connections[fromId]
                    .setLocalDescription(description)
                    .then(() => {
                      socketIdRef.current.emit(
                        "signal",
                        fromId,
                        JSON.stringify({
                          sdp: connections[fromId].localDescription,
                        }),
                      );
                    })
                    .catch((e) => console.log(e));
                })
                .catch((e) => console.log(e));
            }
          })
          .catch((e) => console.log(e));
      }
      if (signal.ice) {
        connections[fromId]
          .addIceCandidate(new RTCIceCandidate(signal.ice))
          .catch((e) => console.log(e));
      }
    }
  };
  let addMessage = () => {};

  // let connectToSocketServer = () => {
  //   socketRef.current = io.connect(server_url, { secure: false });
  //   socketRef.current.on("signal", gotMessageFromServer);
  //   socketRef.current.on("connect", () => {
  //     socketRef.current.emit("join-call", window.location.href);
  //     socketRef.current = socketRef.current.id;
  //     socketIdRef.current.on("chat-message", addMessage);
  //     socketRef.current.on("user-left", (id) => {
  //       setVideo((videos) => videos.filter((video) => video.socketId !== id));
  //     });

  //     socketRef.current.on("user-joined", (id, clients) => {
  //       clients.forEach((socketListId) => {
  //         connections[socketListId] = new RTCPeerConnection(
  //           peerConfigConnections,
  //         );
  //         connections[socketListId].onicecandidate = (event) => {
  //           if (event.candidate != null) {
  //             socketRef.current.emit(
  //               "signal",
  //               socketListId,
  //               JSON.stringify({ ice: event.candidate }),
  //             );
  //           }
  //         };
  //         connections[socketListId].onaddstream = (event) => {
  //           let videoExists = videoRef.current.find((video) => {
  //             video.sockId === socketListId;
  //           });
  //           if (videoExists) {
  //             setVideo((videos) => {
  //               const updatedVideos = videos.map((video) => {
  //                 video.socketId === socketListId
  //                   ? { ...video, stream: event.stream }
  //                   : video;
  //               });
  //               videoRef.current = updatedVideos;
  //               return updatedVideos;
  //             });
  //           } else {
  //             let newVideo = {
  //               socketId: socketListId,
  //               stream: event.stream,
  //               autoPlay: true,
  //               playsinline: true,
  //             };
  //             setVideos((videos) => {
  //               const updateVideos = [...videos, newVideo];
  //               videoRef.current = updateVideos;
  //               return updateVideos;
  //             });
  //           }
  //         };
  //         if (window.localStream !== undefined && window.localStream !== null) {
  //           connections[socketListId].addStream(window.localStream);
  //         } else {
  //           let blackSilence = (...args) => {
  //             new MediaStream([black(...args), silence]);
  //           };

  //           window.localStream = blackSilence();
  //           connections[socketListId].addStream(window.localStream);
  //         }
  //       });
  //       if (id === socketIdRef.current) {
  //         for (let id2 in connections) {
  //           if (id2 === socketIdRef.current) continue;

  //           try {
  //             connections[id2].addStream(window.localStream);
  //           } catch (error) {
  //             console.log(error);
  //           }
  //           connections[id2]
  //             .createOffer()
  //             .then((description) => {
  //               connections[id2].setLocalDescription(description);
  //             })
  //             .then(() => {
  //               socketRef.current.emit(
  //                 "signal",
  //                 id2,
  //                 JSON.stringify({ sdp: connections[id2].localDescription }),
  //               );
  //             })
  //             .catch((e) => console.log(e));
  //         }
  //       }
  //     });
  //   });
  // };

  let connectToSocketServer = () => {
    socketRef.current = io.connect(server_url, { secure: false });

    socketRef.current.on("signal", gotMessageFromServer);

    socketRef.current.on("connect", () => {
      socketRef.current.emit("join-call", window.location.href);
      socketIdRef.current = socketRef.current.id;

      socketRef.current.on("chat-message", addMessage);

      socketRef.current.on("user-left", (id) => {
        setVideos((videos) => videos.filter((video) => video.socketId !== id));
      });

      socketRef.current.on("user-joined", (id, clients) => {
        clients.forEach((socketListId) => {
          connections[socketListId] = new RTCPeerConnection(
            peerConfigConnections,
          );
          // Wait for their ice candidate
          connections[socketListId].onicecandidate = function (event) {
            if (event.candidate != null) {
              socketRef.current.emit(
                "signal",
                socketListId,
                JSON.stringify({ ice: event.candidate }),
              );
            }
          };

          // Wait for their video stream
          connections[socketListId].onaddstream = (event) => {
            console.log("BEFORE:", videoRef.current);
            console.log("FINDING ID: ", socketListId);

            let videoExists = videoRef.current.find(
              (video) => video.socketId === socketListId,
            );

            if (videoExists) {
              console.log("FOUND EXISTING");

              // Update the stream of the existing video
              setVideos((videos) => {
                const updatedVideos = videos.map((video) =>
                  video.socketId === socketListId
                    ? { ...video, stream: event.stream }
                    : video,
                );
                videoRef.current = updatedVideos;
                return updatedVideos;
              });
            } else {
              // Create a new video
              console.log("CREATING NEW");
              let newVideo = {
                socketId: socketListId,
                stream: event.stream,
                autoplay: true,
                playsinline: true,
              };

              setVideos((videos) => {
                const updatedVideos = [...videos, newVideo];
                videoRef.current = updatedVideos;
                return updatedVideos;
              });
            }
          };

          // Add the local video stream
          if (window.localStream !== undefined && window.localStream !== null) {
            connections[socketListId].addStream(window.localStream);
          } else {
            let blackSilence = (...args) =>
              new MediaStream([black(...args), silence()]);
            window.localStream = blackSilence();
            connections[socketListId].addStream(window.localStream);
          }
        });

        if (id === socketIdRef.current) {
          for (let id2 in connections) {
            if (id2 === socketIdRef.current) continue;

            try {
              connections[id2].addStream(window.localStream);
            } catch (e) {
              console.log(e);
            }

            connections[id2].createOffer().then((description) => {
              connections[id2]
                .setLocalDescription(description)
                .then(() => {
                  socketRef.current.emit(
                    "signal",
                    id2,
                    JSON.stringify({ sdp: connections[id2].localDescription }),
                  );
                })
                .catch((e) => console.log(e));
            });
          }
        }
      });
    });
  };

  let getMedia = () => {
    setVideo(videoAvailable);
    setAudio(audioAvailable);
    connectToSocketServer();
  };
  let connect = () => {
    setAskForUsername(false);
    getMedia();
  };
  return (
    <div>
      {askForUsername === true ? (
        <div>
          <h2>Enter into Lobby</h2>
          <TextField
            id="standard-basic"
            label="Standard"
            variant="standard"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <Button variant="contained" onClick={connect}>
            Connect
          </Button>

          <div>
            <video ref={localVideoRef} autoPlay muted></video>
          </div>
        </div>
      ) : (
        <>
          <video ref={localVideoRef} autoPlay muted></video>
          {videos.map((video) => {
            <div key={video.socketId}>
              <h1>{video.socketId}</h1>
              data-socket = {video.socketId}
              ref ={" "}
              {(ref) => {
                if (ref && video.stream) {
                  ref.srcObject = video.stream;
                }
              }}
              autoPlay
            </div>;
          })}
        </>
      )}
    </div>
  );
}
