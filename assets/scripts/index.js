var outseq = "";

function researchMidi (midi) {
    var tempo = Math.round(midi["header"]["tempos"][0]["bpm"]);
    var trackscount = midi["tracks"].length;
    var channelcount = _.last(midi["tracks"])["channel"]+1;
    return [tempo, trackscount, channelcount];
}

function convertMidiToSequence (midi) {
    outseq += "!speed@" + midi["header"]["tempos"][0]["bpm"] + "|";
}

window.onload = function() {
    var midifilein = document.getElementById("midifile");
    midifilein.addEventListener('change', function(e) {
        var midifilein1 = midifilein.files[0];
        var reader = new FileReader();
        reader.onload = function(e) {
            const midi = new Midi(e.target.result);
            console.log(researchMidi(midi));
        }
        reader.readAsArrayBuffer(midifilein1);
    });
}