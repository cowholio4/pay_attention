// GLOBALS
// MODE can be 
var colors =  MusicTheory.Synesthesia.map('Isaac Newton (1704)');
var START_MODE = 0;

var EXPLORE_MODE = 1;

var RECORD_MODE = 3;
var RECORD_PAUSE_MODE = 4;

var BEAT_BOX = 5;
var BEAT_BOX_WAIT = 1;
var BEAT_BOX_RECORD = 2;
var BEAT_BOX_STATUS = BEAT_BOX_WAIT; 

var PLAYBACK = 6;
var END_PLAYBACK = 7;

var MODE = START_MODE;
//MODE = BEAT_BOX;
//var MODE = EXPLORE_MODE;
var hand_is_registered = false;
window.onload = function () {
	MIDI.loadPlugin({
		soundfontUrl: "./vendor/MIDI.js/soundfont/",
		instrument: "acoustic_grand_piano",
		callback: function() { }
	});

  $("body").click( function(e) {
    if( MODE == EXPLORE_MODE || MODE == RECORD_MODE ) {
      play_for_x_y_z( ( e.clientX /  $(window).width() ) * 100 , ( e.clientY /  $(window).height() ) * 100, 500, true ); 
    }
  });
 /* $("#body").mousemove(function(event) {
   msg += event.pageX + ", " + event.pageY;
  });
  */
  
  if( MODE != START_MODE ) {
    $("#home").hide();
  }
  if( MODE == BEAT_BOX ) {
    // prefill notes
    for( var i = 0; i < 1000; i ++ ) {
      played_notes.push([  Math.random() * 100, Math.random() * 100, ( Math.random() * 1000 ) + 400 ]);
    }
    start_beat_box();
  }
  $("#home .swipe-left").click( start_record_mode );
  $("#home .swipe-right").click( start_explore_mode );
  $("#record_pause .swipe-left").click( start_record_mode );
  $("#record_pause .swipe-right").click( start_beat_box );
  $("#play_done .swipe-left").click(  start_beat_box );
  $("#play_done .swipe-right").click( go_home );
  

};

function go_home() {
  MODE = START_MODE; 
  $("body div").hide();
  $("#home").show();
  // delete all old notes 
}
function play_done() {
  MODE = END_PLAYBACK;
  $("body div").hide();

}

function start_beat_box() {
  MODE = BEAT_BOX; 
  $("body div").hide();

  $("#beat_box").show();
  if( hand_is_registered ) {
    $("#walk_back").show();
  }
  else {
    $("#register_hand").show();
  }

}

function start_record_mode() {
  $("body div").hide();
  MODE = RECORD_MODE;
  $("#music_sheet").show();
  $("#music_sheet div").show();
}
function pause_record_mode() {
  $("body div").hide();
  $("#record_pause").show();
  MODE = RECORD_PAUSE_MODE;
}

function start_explore_mode (){
  $("body div").hide();
  MODE = EXPLORE_MODE;

}

var last_note = null;
var last_position = null;
var played_notes = [];
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
beats = [];
first_beat = null;
function update_beat( z ) {
  if( BEAT_BOX_STATUS == BEAT_BOX_WAIT ) {
    if( z > 2000 ) {
      BEAT_BOX_STATUS = BEAT_BOX_RECORD;
      $("#walk_towards").show();
    }
    else {
      return;
    }
  }
  beats.push( z );
  if( first_beat == null ) {
    first_beat = new Date().getTime()
  }
  // let's get some measurements before we hit the threshold
  if( z <= 700 && beats.length > 5 ) {
    time_since_begin = ( new Date().getTime() ) - first_beat;
    var message =  beats.length + " - " + time_since_begin  ;
    var bpm = 65;
    if( time_since_begin < 200 ) {
      bpm = 200;
    }
    else if( time_since_begin > 5000 ) {
      bpm = 25;
    }
    else  {
      time_since_begin -= 200
      bpm = 175 - ( time_since_begin * ( 149/4800 ) );
    }
    first_beat = null;
    beats = [];

    $("#beat_box").append( "<h1>Your Beats Per Minute are:" + bpm  + "</h1>"  );
    $("#beat_box").append( "<h1>Your song will start playing in a second.</h1>"  );

    $("#beat_box").click( function() {
          play_song( 100 );
        });
    MODE = PLAYBACK;
    setTimeout( function() { play_song(bpm); }, 500 );
    
  }
}

function show_hand( x, y ) {
  $("#hand").show().css({ "left":( ( x / 100 ) * $(window).width() ) - 50  , "top": ( ( y/ 100 ) *  $(window).height() ) - 50 });
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

  //console.log("velocity:", velocity );

  //console.log( "midi_note " +  midi_note );
  //console.log( x, y, z );
  note_color = get_color_for_note_and_octave( note, octave );

  circle_diameter = (velocity / 8.5) + 50;
  if( ! play ) {
    $("#hand_note").show().css({ "left":( ( x / 100 ) * $(window).width() ) - 50  , "top": ( ( y/ 100 ) *  $(window).height() ) - 50, background: note_color  });
    $("#hand_note").css({ "width" : circle_diameter, "height" : circle_diameter, "border-radius" : circle_diameter/ 2 } );
  }
  if( MODE == EXPLORE_MODE ) {
    $("#current_note").show().css({ "left":( ( x / 100 ) * $(window).width() ) - 50  , "top": ( ( y/ 100 ) *  $(window).height() ) - 50, background: note_color  });
    $("#current_note").css({ "width" : circle_diameter, "height" : circle_diameter, "border-radius" : circle_diameter/ 2 } );
  }


  if( play ) {  
	  // play the note
    if( MODE != PLAYBACK ) {
      var note_number = played_notes.push( [ x, y, z] );
    }
    // not sharps 
    if( note.indexOf("#") == -1 ) {
      played_note = $("<div>").addClass("square").css({ "left":( ( x / 100 ) * $(window).width() ) - 50  , "top": ( ( y/ 100 ) *  $(window).height() ) - 50,  background: note_color  });
      played_note.css({ "width" : circle_diameter, "height" : circle_diameter } );
    }
    else {
      played_note = $("<div>");
      border_width = Math.floor(Math.sqrt( ( (circle_diameter/2) * (circle_diameter/2) ) + ( (circle_diameter/2) * (circle_diameter/2) ) ));
      diamond_top = $("<div>").addClass("diamond-top").css({ "border" : border_width+ "px solid transparent", "left":( ( x / 100 ) * $(window).width() ) - 50  , "top": ( ( y/ 100 ) *  $(window).height() ) - 50 - border_width , "border-bottom-color" : note_color });
      //diamond_top.css("border" , (circle_diameter/2)+ "px solid transparent");

      diamond_bottom = $("<div>").addClass("diamond-bottom").css({ "border": border_width+ "px solid transparent", "left":( ( x / 100 ) * $(window).width() ) - 50  , "top": ( ( y/ 100 ) *  $(window).height() ) - 50 + border_width - 1, "border-top-color" : note_color}); 
      //diamond_bottom.css("border" , (circle_diameter/2) + "px solid transparent");

      played_note.append( diamond_top ).append( diamond_bottom );
    }
    
    $("#music_sheet").append( played_note );


	  MIDI.setVolume(0, 55 );
	  MIDI.noteOn(0, midi_note, velocity, delay);
	  MIDI.noteOff(0, midi_note, delay + 0.75);
  }


}

var beat_timeout = null;
function play_song( bpm ) { 
  $("body div").hide();
  $("#music_sheet").html('').show();
  MODE = PLAYBACK;
  var bps = bpm / 60;
  var beat_interval =  Math.floor( (1/bps) * 1000 );
  console.log( "beat interval", beat_interval);
  beat_timeout = setInterval( function() { 
       var n = played_notes.shift(); 
       if( n == null ) {
          clearInterval( beat_timeout );
          return;
       }
       play_for_x_y_z( n[0], n[1], n[2], true );
    }, beat_interval ); 
}

/* Kinect Hooks */
var unregister_timeout = null;  
DepthJS = {
      onKinectInit: function() {
        //$("#status").text("DepthJS + Kinect detected+!@");
        //$("#registration").text("Hand not in view");
      },
      onRegister: function(x, y, z, data) {
        console.log( "onRegister" );
        hand_is_registered = true;
        clearTimeout( unregister_timeout );
        if( MODE == BEAT_BOX ) {
          $("#beat_box div").hide();
          $("#walk_back").show();
        }
        //$("#registration").text("Hand in view" + (data == null ? "" : ": " + data));
      },
      onUnregister: function() {
        $("#hand").hide();
        console.log( "onUnregister" );
        unregister_timeout = setTimeout( function() { 
          hand_is_registered = false;
          //$("#registration").text("Hand not in view");
          if( MODE == RECORD_MODE ) {
            pause_record_mode();
          }
          else if( MODE == EXPLORE_MODE ) {
            go_home();
          }
          else if( MODE == BEAT_BOX ) {
           //$("#walk_back").show();
            BEAT_BOX_STATUS = BEAT_BOX_WAIT;
            beats = [];
            $("#beat_box div").hide();
            $("#register_hand").show();

          }
        }, 2000 );
      },
      onMove: function(x, y, z) {
        //console.log( x, y, z);
        last_position = { x : x, y : y, z : z };
        if( MODE == EXPLORE_MODE ) {
          play_for_x_y_z( x, y, z, true );  
        }
        else if( MODE == RECORD_MODE ) {
          play_for_x_y_z( x, y, z, false );  
        } 
        else if( MODE == BEAT_BOX ) {
          update_beat( z ); 
        }
        else if( MODE == PLAYBACK ) {
          
        }
        else {
          show_hand( x, y );
        }
      },
      onSwipeLeft: function() {
        if( MODE == START_MODE || MODE == RECORD_PAUSE_MODE ) {
          start_record_mode();
        }
      },
      onSwipeRight: function() {
        if( MODE == START_MODE ) {
        //  start_explore_mode();
        }
        else if ( MODE == RECORD_PAUSE_MODE ) {
         // start_beat_box();
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

        if( MODE == RECORD_MODE ) {
          play_for_x_y_z( last_position.x, last_position.y, last_position.z, true );
        } 
        else if ( MODE == START_MODE || MODE == RECORD_PAUSE_MODE || MODE == END_PLAYBACK ) {
          //  "left":( ( x / 100 ) * $(window).width() ) - 50  , "top": ( ( y/ 100 ) *  $(window).height() )
          var x = ( last_position.x / 100 ) *  $(window).width();
          var y =  ( last_position.y / 100 ) * $(window).height()
          console.log( x, y);
          $("#hand").hide();
          console.log( $(document.elementFromPoint(x,y) ) );
          $(document.elementFromPoint(x,y) ).click();
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
  //console.log( "getMidiNumberForNoteAndOctave: " + note + " - " + octave );
  var base = notes[note];

  //a0 == 33
  return  base + ( (octave + 2 )  * 12 );
}
