import * as mm from "@magenta/music";

// Convert recorded notes [{ pitch, time, duration }] into Magenta NoteSequence
export function toNoteSequence(recordedNotes, qpm = 120) {
  const ns = mm.sequences.createQuantizedNoteSequence(4); // 4/4 time
  ns.ticksPerQuarter = 220;
  ns.tempos = [{ qpm }];
  ns.notes = recordedNotes.map((n) => ({
    pitch: midiFromNoteName(n.pitch), // convert "C4" -> MIDI number
    quantizedStartStep: Math.round(((n.time * qpm) / 60) * 4),
    quantizedEndStep: Math.round((((n.time + n.duration) * qpm) / 60) * 4),
  }));
  ns.totalQuantizedSteps = Math.max(
    ...ns.notes.map((n) => n.quantizedEndStep),
    1
  );
  return ns;
}

// Convert note name (e.g. "C4") → MIDI number
function midiFromNoteName(note) {
  const noteMap = {
    C: 0,
    "C#": 1,
    D: 2,
    "D#": 3,
    E: 4,
    F: 5,
    "F#": 6,
    G: 7,
    "G#": 8,
    A: 9,
    "A#": 10,
    B: 11,
  };
  const match = note.match(/^([A-G]#?)(\d)$/);
  if (!match) throw new Error("Invalid note: " + note);
  const [, pitch, octave] = match;
  return (parseInt(octave) + 1) * 12 + noteMap[pitch];
}
