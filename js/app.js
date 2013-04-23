// GLOBALS
// MODE can be 
var START_MODE = 0;
var EXPLORE_MODE = 1;
var RECORD_MODE = 2;
var MODE = START_MODE;
//var MODE = RECORD_MODE;
//var MODE = EXPLORE_MODE;

window.onload = function () {
	MIDI.loadPlugin({
		soundfontUrl: "./vendor/MIDI.js/soundfont/",
		instrument: "acoustic_grand_piano",
		callback: function() { }
	});

  $("body").click( function(e) {
    if( MODE == EXPLORE_MODE ) {
      play_for_x_y_z( ( e.clientX /  $(window).width() ) * 100 , ( e.clientY /  $(window).height() ) * 100, 500, true ); 
    }
  });

};

var last_note = null;
var last_position = null;
var colors =  MusicTheory.Synesthesia.map('Isaac Newton (1704)');
var note_colors = {
    "A" : [ 356, 89, 71, 1],
    "A#": [ 64, 38, 54, 1 ],
    "B" : [ 159, 92, 63, 1 ],
    "C" : [ 198, 73.7288, 46.2745, 1 ],
    "C#": [ 30, 96.4497, 66.8627, 1 ],
    "D" : [ 337, 93.1035, 60.1961, 1 ],
    "D#": [ 66, 86.0697, 60.5882, 1 ],
    "E" : [ 171, 59.3361, 47.2549, 1],
    "F" : [ 16, 95.0981, 60, 1 ],
    "F#": [ 296, 93.2961, 64.9020, 1 ],
    "G" : [ 225, 19.4805, 54.7059, 1 ],
    "G#": [ 153, 61.5385, 64.3137, 1 ]
};
function get_color_for_note_and_octave ( note, octave ) {
  var cp = note_colors[ note ];
  var lightness = ( octave * ( 60/7 ) ) + 30;
  var color = "hsla(" + cp[0] + "," + cp[1] + "%," + lightness  + "%," + cp[3] + ")";
  return color;
}

// x and y are on a 0-100 scale
function play_for_x_y_z( x, y, z, play ) {

  var note = getNoteForX( x );
  var octave = getOctaveForY( y );
  var midi_note = getMidiNumberForNoteAndOctave( note, octave );
  if( midi_note == last_note && MODE == EXPLORE_MODE ) { return }
  last_note = midi_note;
	var delay = 0; // play one note every quarter second
	var velocity =  ( ( 2000 - z ) / 1.9 ); // how hard the note hits
  if( velocity <= 0 ) {
    velocity = 0;
  }

  console.log("velocity:", velocity );

  console.log( "midi_note " +  midi_note );
  console.log( x, y, z );
  note_color = get_color_for_note_and_octave( note, octave );

  circle_diameter = (velocity / 8.5) + 50;
  $("#current_note").show().css({ "left":( ( x / 100 ) * $(window).width() ) - 50  , "top": ( ( y/ 100 ) *  $(window).height() ) - 50, background: note_color  });
  $("#current_note").css({ "width" : circle_diameter, "height" : circle_diameter, "border-radius" : circle_diameter/ 2 } );


  if( play ) {  
	  // play the note
	  MIDI.setVolume(0, 55 );
	  MIDI.noteOn(0, midi_note, velocity, delay);
	  MIDI.noteOff(0, midi_note, delay + 0.75);
  }


}


/* Kinect Hooks */
DepthJS = {
      onKinectInit: function() {
        //$("#status").text("DepthJS + Kinect detected+!@");
        //$("#registration").text("Hand not in view");
      },
      onRegister: function(x, y, z, data) {
        console.log( "onRegister" );
        //$("#registration").text("Hand in view" + (data == null ? "" : ": " + data));
      },
      onUnregister: function() {
        console.log( "onUnregister" );
        //$("#registration").text("Hand not in view");
      },
      onMove: function(x, y, z) {
        //console.log( x, y, z);
        if( MODE == EXPLORE_MODE ) {
          play_for_x_y_z( x, y, z, true );  
        }
        else if( MODE == RECORD_MODE ) {
          play_for_x_y_z( x, y, z, false );  
          last_position = { x : x, y : y, z : z };
        } 

        //alert( "DepthJS + Kinect detected+!@");
        //$("#x").text("x: " + x);
        //$("#y").text("y: " + y);
        //$("#z").text("z: " + z);
      },
      onSwipeLeft: function() {
        alert("onSwipeLeft");
        if( MODE == START_MODE ) {
          MODE = RECORD_MODE;
        }
      },
      onSwipeRight: function() {
        alert("onSwipeRight");
        if( MODE == START_MODE ) {
          MODE = EXPLORE_MODE;
        }
      },
      onSwipeDown: function() {
                    // alert("onSwipeDown");
      },
      onSwipeUp: function() {
                   //alert("onSwipeUp");
      },
      onPush: function() {
         //       alert("onPush");
        console.log( "PUSH" );
        if( MODE == RECORD_MODE ) {
          console.log( "RECORD PUSH");
          play_for_x_y_z( last_position.x, last_position.y, last_position.z, true );
        } 
      },
      onPull: function() {
               // alert("onPull");
      }
    };

function getNoteForX ( x ) {
  var page_width = $(window).width();
  // 12 notes including sharps
  var note_width = page_width / 12;
  note_width = 100/12;
  var notes = [ "A", "A#", "B", "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#" ];
  return notes[ Math.floor( x / note_width ) ];
}

function getOctaveForY ( y ) {
  var octave_height = 100/8;
  return 7 - Math.floor( y / octave_height);
}

var notes = {
    "A" : 9,
    "A#": 10,
    "B" : 11,
    "C" : 0,
    "C#": 1,
    "D" : 2,
    "D#": 3,
    "E" : 4,
    "F" : 5,
    "F#": 6,
    "G" : 7,
    "G#": 8,
    };
function getMidiNumberForNoteAndOctave ( note, octave ) {
  console.log( "getMidiNumberForNoteAndOctave: " + note + " - " + octave );
  var base = notes[note];

  //a0 == 33
  return  base + ( (octave + 2 )  * 12 );
}
