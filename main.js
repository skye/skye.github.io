function get(id) {
  return document.getElementById(id)
}

var welcome = get("welcome");
var enable_msg = get("enable-msg")
var start = get("start-button");
var level1 = get("level1");
var start_level1 = get("start-level1");
var level2 = get("level2");
var start_level2 = get("start-level2");
var level3 = get("level3");
var start_level3 = get("start-level3");
var bday = get("bday");
var stage = get("stage");
var webcam = get("webcam");
var player = get("player");
var replay_intro = get("instant-replay-intro");
var replay = get("instant-replay");
var replay_vids = Array.from(document.getElementsByClassName("instant-replay-video"));
var dl0 = get("dl0");
var dl1 = get("dl1");
var dl2 = get("dl2");

// Init youtube
var tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
var yt_ready = false;
function onYouTubeIframeAPIReady() {
  yt_ready = true;
}
function waitForYT(cb) {
  if (yt_ready) {
    return cb();
  } else {
    return setTimeout(waitForYt(), 100);
  }
}

// Init AV + recorder
var av_stream;
var recorder;
var av_data = []
navigator.mediaDevices.getUserMedia({ audio: true, video: true }).then(
    function (stream) {
      av_stream = stream;
      webcam.srcObject = av_stream;
      recorder = new MediaRecorder(av_stream, {mimeType: "video/webm"});
      recorder.ondataavailable = event => {
        if (event.data.size > 0) {
          av_data.push(event.data);
        }
      };
      enable_msg.classList.add("hide");
      waitForYT(() => start.classList.remove("hide"));
    });

function wait(delayInMS) {
  return new Promise(resolve => setTimeout(resolve, delayInMS));
}

var yt_player;
var song_urls = [];
function setupSong(vid, replay_start, replay_length, next_card) {
  yt_player = makeYTPlayer(vid);
  yt_player.addEventListener("onStateChange", event => {
    console.log(event.data);
    if (event.data == YT.PlayerState.ENDED) {
      // Sometimes fires twice
      if (recorder.state == "inactive") return;
      endSong(replay_start, replay_length, next_card);
    }
  });
}

function endSong(replay_start, replay_length, next_card) {
  console.log("recorder end");
  recorder.stop();
  recorder.onstop = event => {
    console.log(av_data);
    var blob = new Blob(av_data, {type: "video/webm"});
    av_data = []
    var url = URL.createObjectURL(blob);
    song_urls.push(url);
    console.log("loading rp");
    replay_vids.forEach(rp => {
      rp.src = url;
      rp.currentTime = replay_start;
      console.log(rp.currentTime);
    });
    // download(url);
    var intro_ms = 1000;
    wait(2200)
        .then(() => {
          replay_intro.className = "instant-replay-color1";
          stage.classList.add("hide");
          return wait(intro_ms)
        })
        .then(() => {
          replay_intro.className = "instant-replay-color2";
          return wait(intro_ms);
        })
        .then(() => {
          replay.className = "";
          replay_intro.className = "instant-replay-color3";
          return wait(1500);
        })
        .then(() => {
          console.log("playing rp");
          replay_vids.forEach(rp => {
            if (rp.currentTime == replay_start) {
              rp.play();
            }
            rp.currentTime = replay_start;
            console.log(rp.currentTime);
          });
          replay_intro.className = "hide";
          console.log("done");
          console.log(replay_length);
          return wait(replay_length * 1000);
        }).then(() => {
          console.log("ended");
            replay_vids.forEach(rp => {
              rp.pause();
            });
          cueCurtain(
              () => {
                replay.className = "hide";
                next_card.classList.remove("hide");
              },
              () => {});
        });
  };
}

function download(url, name) {
  // var blob = new Blob(av_data, {
  //   type: "video/webm"
  // });
  // var url = URL.createObjectURL(blob);
  var a = document.createElement("a");
  document.body.appendChild(a);
  a.style = "display: none";
  a.href = url;
  a.download = name + ".webm";
  a.click();
  window.URL.revokeObjectURL(url);
}

function makeYTPlayer(vid) {
  var div = document.createElement("div");
  div.id = "ytplayer";
  player.children[0].replaceWith(div);
  return new YT.Player('ytplayer', {
    height: '100%',
    // width: '640',
    videoId: vid,
    // playerVars: {
    //   autoplay: 1,
    //   controls: 1,
    // },
    // events: {
    //   'onReady': onready,
    //   'onStateChange': onchange,
    // },
  });
}

function cueCurtain(behind, after) {
  curtain.addEventListener("transitionend", function listener() {
    curtain.removeEventListener("transitionend", listener);
    behind();
    curtain.addEventListener("transitionend", function listener2 () {
      curtain.removeEventListener("transitionend", listener2);
      after();
    }, false);
    wait(500).then(() => curtain.className = "curtain-up");
  }, false);
  curtain.className = "curtain-down";
}

function level_click(vid, level_card, next_card, replay_start, replay_length,
                     song_start, song_end) {
  cueCurtain(
      () => {
        level_card.remove();
        stage.classList.remove("hide");
        setupSong(vid, replay_start, replay_length, next_card);
      },
      () => {
        console.log("song_start", song_start);
        if (song_start) {
          yt_player.seekTo(song_start);
        }
        yt_player.playVideo();
        if (song_end) {
          wait((song_end - song_start) * 1000).then(() => {
            waitForTime(song_end, replay_start, replay_length, next_card);
          });
        }
        console.log("recorder start");
        recorder.start();
      });
}

function waitForTime(time, replay_start, replay_length, next_card) {
  if (yt_player.getPlayerState() != 1) {
    return;
  }
  if (yt_player.getCurrentTime() >= time) {
    yt_player.stopVideo();
    endSong(replay_start, replay_length, next_card);
  } else {
    window.setTimeout(() => waitForTime(time, replay_start, replay_length, next_card), 200);
  }
}

var debugging = false;

start.onclick = function () {
  welcome.remove();
  level1.classList.remove("hide");
};

start_level1.onclick = function () {
  if (debugging) {
    level_click("_Lbsz3WIlbU", level1, level2, 5, 5, 6);
  } else {
    replay_start = 100;
    replay_end = 124;
    level_click("tw9TtZy_Mt8", level1, level2,
                replay_start,
                replay_end - replay_start);
  }
};

start_level2.onclick = function () {
  if (debugging) {
    level_click("_Lbsz3WIlbU", level2, level3, 2000, 3000, 6, 12);
  } else {
    song_start = 6;
    replay_start = 20 - song_start;
    replay_end = 44 - song_start;
    level_click("_Lbsz3WIlbU", level2, level3,
                replay_start, replay_end - replay_start,
                song_start);
  }
};

start_level3.onclick = function () {
  if (debugging) {
    level_click("_Lbsz3WIlbU", level3, bday);
  } else {
    song_start = 10;
    replay_start = 153 - song_start;
    replay_end = 176 - song_start;
    level_click("sjsP1wFNcC8", level3, bday,
                replay_start,
                replay_end - replay_start,
                song_start, 236);
  }
};

dl0.onclick = function () {
  download(song_urls[0], "song1");
}

dl1.onclick = function () {
  download(song_urls[1], "song2");
}

dl2.onclick = function () {
  download(song_urls[2], "song3");
}
