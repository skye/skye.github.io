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
function playSong(vid, replay_start, replay_length, next_card) {
  yt_player = makeYTPlayer(vid);
  yt_player.addEventListener("onReady", event => {
    console.log("recorder start");
    recorder.start();
  });
  yt_player.addEventListener("onStateChange", event => {
    console.log(event.data);
    if (event.data == YT.PlayerState.ENDED) {
      // Sometimes fires twice
      if (recorder.state == "inactive") return;
      console.log("recorder end");
      recorder.stop();
      recorder.onstop = event => {
        console.log(av_data);
        var blob = new Blob(av_data, {type: "video/webm"});
        av_data = []
        var url = URL.createObjectURL(blob);
        song_urls.push(url);
        replay_vids.forEach(rp => {
          rp.src = url;
        });
        var intro_ms = 1000;
        wait(2200)
            .then(() => {
              replay_intro.className = "instant-replay-color1";
              replay.className = "";
              return wait(intro_ms)
            })
            .then(() => {
              replay_intro.className = "instant-replay-color2";
              return wait(intro_ms);
            })
            .then(() => {
              replay_intro.className = "instant-replay-color3";
              return wait(1500);
            })
            .then(() => {
              replay_vids[0].onended = event => {
                console.log("ended");
                cueCurtain(
                    () => {
                      replay.className = "hide";
                      stage.classList.add("hide");
                      next_card.classList.remove("hide");
                    },
                    () => {});
              };
              replay_intro.className = "hide";
              replay_vids.forEach(rp => {
                rp.play();
              });
            });
        webcam.onended = event => {
          cueCurtain(
              () => {
                webcam.muted = true;
                stage.classList.add("hide");
                webcam.src = null;
                webcam.srcObject = av_stream;
                next_card.classList.remove("hide");
              },
              () => {});
        };
      };
    }
  });
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

function level_click(vid, level_card, next_card) {
  cueCurtain(
      () => {
        level_card.remove();
        stage.classList.remove("hide");
        playSong(vid, 1000, 2000, next_card);
      },
      () => {
        yt_player.playVideo();
      });
}

start.onclick = function () {
  welcome.remove();
  level1.classList.remove("hide");
};

start_level1.onclick = function () {
  level_click("_Lbsz3WIlbU", level1, level2);
  // level_click("tw9TtZy_Mt8", level1, level2);
};

start_level2.onclick = function () {
  level_click("_Lbsz3WIlbU", level2, level3);
  // playSong("_Lbsz3WIlbU", 26000, 7000);
};

start_level3.onclick = function () {
  level_click("_Lbsz3WIlbU", level3, bday);
  // level_click("sjsP1wFNcC8", level3, bday);
};
