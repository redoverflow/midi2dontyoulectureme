(async () => {
var outseq = "";

function researchMidi (midi) {
    var tempo = Math.round(midi["header"]["tempos"][0]["bpm"]);
    var trackscount = midi["tracks"].length;
    var channelcount = _.last(midi["tracks"])["channel"]+1;
    return [tempo, trackscount, channelcount];
}

function getChannelInstruments () {

}
function convertMidiToSequence (midi) {
    outseq += "!speed@" + midi["header"]["tempos"][0]["bpm"] + "|";
    channelsinst = getChannelInstruments();
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
            chinsts.innerHTML += `<label for="ch1inst" class="form-label">Channel `+(i+1).toString()+` instrument</label>
            <select class="form-select form-select-lg mb-3" aria-label=".form-select-lg example">`+soundopts+`</select>`;
        }
    }
    reader.readAsArrayBuffer(midifilein1);
});
})();