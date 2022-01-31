(async () => {
var outseq = "";

function researchMidi (midi) {
    var tempo = Math.round(midi["header"]["tempos"][0]["bpm"]);
    var trackscount = midi["tracks"].length;
    var channelcount = _.last(midi["tracks"])["channel"]+1;
    return [tempo, trackscount, channelcount];
}

function convertMidiToSequence (midi, singulartrack, track) {
    outseq += "!speed@" + midi["header"]["tempos"][0]["bpm"] + "|";
    notescheatsheet = {
        "C": 0,
        "D": 1,
        "E": 2,
        "F": 3,
        "G": 4,
        "A": 5,
        "B": 6,
    }
    if (singulartrack) {
        let channel = midi["tracks"][track]["channel"];
        let chinst = getChannelInst(channel);
        for (let i = 0; i < midi["tracks"][track]["notes"].length; i++) {
            let note = midi["tracks"][track]["notes"][i]["name"];
            //pitch
            let pitch = notescheatsheet[note[0]];
            //octave
            let octave = Number(note.substring(1));
            if (octave > 5) {
                pitch += 12*(octave-5);
            } else if (octave < 5) {
                pitch -= 12*(5-octave);
            }
            //duration
            //in miliseconds
            let duration = Math.round(midi["tracks"][track]["notes"][i]["duration"]*1000);
            //in beats
            duration = Math.round(duration/midi["header"]["tempos"][0]["bpm"]);
            //velocity
            let velocity = Math.round(midi["tracks"][track]["notes"][i]["velocity"]*100);

            outseq += "!volume@"+velocity+"|!"+chinst+"@"+pitch+"|!stop@"+duration+"|";
        }
    }
}

function getChannelInst (channel) {
    return document.getElementById("chinst"+channel.toString()).value();
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
  console.log(soundlist);
  for (let i = 0; i < soundlist.length; i++) {
    soundnames.push(soundlist[i]["name"]);
  }
}

var soundopts = "";
for (let i = 0; i < soundnames.length; i++) {
    soundopts += "<option value='"+soundnames[i]+"'>"+soundnames[i]+"</option>";
}

var midifilein = document.getElementById("midifile");
midifilein.addEventListener('change', function(e) {
    var midifilein1 = midifilein.files[0];
    var reader = new FileReader();
    reader.onload = function(e) {
        const midi = new Midi(e.target.result);
        //console.log(researchMidi(midi));

        //put channel # instrument choices in the page
        var chinsts = document.getElementById("chinsts");
        for (let i = 0; i < midi.tracks.length; i++) {
            chinsts.innerHTML += `<label for="ch1inst" class="form-label">Channel `+(midi["tracks"][i]["channel"]+1).toString()+` instrument</label>
            <select class="form-select form-select-lg mb-3" aria-label=".form-select-lg example" id=\"chinst`+(midi["tracks"][i]["channel"]+1).toString()+`\">`+soundopts+`</select>`;
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
    var trackmodechoice = document.getElementById("trackmodechoice");
    if (trackmodechoice.trackmode.value == "2") {
        let track = document.getElementById("trackchoice").value;
        convertMidiToSequence(midi, true, track);
    }
});
})();