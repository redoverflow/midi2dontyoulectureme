(async () => {

function download(filename, text) {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);
  
    element.style.display = 'none';
    document.body.appendChild(element);
      
    element.click();
  
    document.body.removeChild(element);
}

function roundNumber(number, digits) {
    var multiple = Math.pow(10, digits);
    var rndedNum = Math.round(number * multiple) / multiple;
    return rndedNum;
}

function researchMidi (midi) {
    var tempo = Math.round(midi["header"]["tempos"][0]["bpm"]);
    var trackscount = midi["tracks"].length;
    var channelcount = _.last(midi["tracks"])["channel"]+1;
    return [tempo, trackscount, channelcount];
}

function convertMidiToSequence (midi, params, track, custrootoct, tempomularg) {
    var outseq = "";
    let tempomul = 10;
    if (params[2]) {
        tempomul = tempomularg;
    }
    outseq += "!speed@" + researchMidi(midi)[0]*tempomul+ "|";
    notescheatsheet = {
        "C": 0,
        "C#": 1,
        "D": 2,
        "D#": 3,
        "E": 4,
        "F": 5,
        "F#": 6,
        "G": 7,
        "G#": 8,
        "A": 9,
        "A#": 10,
        "B": 11
    }

    let octave;
    if (params[1]) {
        octave = custrootoct;
    } else {
        octave = 5;
    }
    //console.log(octave);
    if (params[0]) {
        //console.log(track, midi["tracks"][track-1]);
        let channel = midi["tracks"][track-1]["channel"];
        let chinst = getChannelInst(channel);
        for (let i = 0; i < midi["tracks"][track-1]["notes"].length; i++) {
            let note = midi["tracks"][track-1]["notes"][i]["name"];
            //pitch
            let pitch = notescheatsheet[note[0]];
            //octave
            let noteoctave = Number(note.replace("#", "").substring(1));
            if (noteoctave == octave) {
                //no pitching needed
            } else if (noteoctave > 5) {
                pitch += 12*(noteoctave-octave);
            } else if (noteoctave < 5) {
                pitch -= 12*(octave-noteoctave);
            }
            //duration
            //in miliseconds
            let duration = Math.round(midi["tracks"][track-1]["notes"][i]["duration"]*1000);
            //in beats
            duration = duration/researchMidi(midi)[0];
            //distance between notes
            let distance = duration;
            let notestart = midi["tracks"][track-1]["notes"][i]["time"]*1000;
            let noteend = notestart + duration;
            let nextnotestart;
            if (midi["tracks"][track-1]["notes"][i+1] == undefined) {
                nextnotestart = noteend;
            } else {
                nextnotestart = midi["tracks"][track-1]["notes"][i+1]["time"]*1000;
            }
            distance = nextnotestart - noteend;
            //convert distance to beats
            distance = distance/researchMidi(midi)[0];
            //console.log(Math.round(distance).toString().length);
            distance = roundNumber(distance, Math.round(distance).toString().length);

            //velocity check!!!
            if (!params[3]) {
            let velocity = Math.round(midi["tracks"][track-1]["notes"][i]["velocity"]*100);

            outseq += "!volume@"+velocity+"|"+chinst+"@"+pitch+"|!stop@"+distance+"|";
            //console.log("!volume@"+velocity+"|"+chinst+"@"+pitch+"|!stop@"+distance+"|", note, octave);
            } else {
                outseq += chinst+"@"+pitch+"|!stop@"+distance+"|";
                //console.log(chinst+"@"+pitch+"|!stop@"+distance+"|");
            }
        }
    }
    return outseq.substring(0, outseq.length-1);
}

function getChannelInst (channel) {
    return document.getElementById("chinst"+(channel+1).toString()).value;
}

//getting all of the sound names
let data;
let ok = true;
var soundlist;
var soundnames = [];
try {
  await fetch("https://gdcolon.com/server/soundlist")
  .then(response => response.json())
  .then(d => {data = d})
} catch(e) {
  console.log(e)
  ok = false
} 

if (ok) {
  soundlist = data;
  //console.log(soundlist);
  for (let i = 0; i < soundlist.length; i++) {
    soundnames.push(soundlist[i]["name"]);
  }
}

var soundopts = "";
for (let i = 0; i < soundnames.length; i++) {
    soundopts += "<option value='"+soundnames[i]+"'>"+soundnames[i]+"</option>";
}

var midifilein = document.getElementById("midifile");
var midi;
midifilein.addEventListener('change', function(e) {
    var midifilein1 = midifilein.files[0];
    var reader = new FileReader();
    reader.onload = function(e) {
        midi = new Midi(e.target.result);
        //console.log(researchMidi(midi));

        //put channel # instrument choices in the page
        var chinsts = document.getElementById("chinsts");
        chinsts.innerHTML = "";
        let channels = [];
        for (let i = 0; i < midi.tracks.length; i++) {
            channels.push(midi.tracks[i]["channel"]);
        }
        channels = _.uniq(channels);
        for (let i = 0; i < channels.length; i++) {
            chinsts.innerHTML += `<label for="chinst`+(channels[i]+1).toString()+`" class="form-label">Channel `+(channels[i]+1).toString()+` instrument</label>
            <select class="form-select form-select-lg mb-3" aria-label=".form-select-lg example" id=\"chinst`+(channels[i]+1).toString()+`\">`+soundopts+`</select>`;
        }
        //add midi info to the page
        document.getElementById("midiinfo").innerHTML = `<p>Tempo: `+researchMidi(midi)[0]+`</p>
        <p>Tracks: `+researchMidi(midi)[1]+`</p>
        <p>Channels: `+researchMidi(midi)[2]+`</p>`;
    }
    reader.readAsArrayBuffer(midifilein1);
});
//check if button has been pressed
var convertbutton = document.getElementById("convert");
convertbutton.addEventListener('click', function(e) {
    let radios = document.getElementsByName("trackmode");
    let radiochecked = 0;
    let custrootoctsw = document.getElementById("customrootoctavechk").checked;
    let custrootoct;
    let tempomulchk = document.getElementById("tempomulchk").checked;
    let tempomul;
    let disablevel = document.getElementById("disablevel").checked;
    if (custrootoctsw) {
        custrootoct = document.getElementById("customrootoctave").value;
    }
    if (tempomulchk) {
        tempomul = document.getElementById("tempomul").value;
    }
    //console.log(custrootoct, document.getElementById("customrootoctavechk").checked);
    for (var i = 0, length = radios.length; i < length; i++) {
        if (radios[i].checked) {
          radiochecked = radios[i].value;
          break;
        }
      }
    if (radiochecked == "2") {
        let track = document.getElementById("trackchoice").value;
        var outseq = convertMidiToSequence(midi, [true, custrootoctsw, tempomulchk, disablevel], track, custrootoct, tempomul);
        download("sequence.🗿", outseq);
    }
});
})();