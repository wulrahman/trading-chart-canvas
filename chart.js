var data = "";
var canvas = document.getElementById("myCanvas");
const context = canvas.getContext('2d');

candel_size = 15;
candel_spacing = 5;

var zoom = 0;
zoom_in = true;
zoom_out = true;
move_left = true;
move_right = true;

candel_size = candel_size;
candel_spacing = candel_spacing;
border_offset = 10

scaler_offset = 1, 
zoomIntensity = 0.01
grid_horizontal = (candel_size+candel_size)*5,
grid_vertical = 50;

array_canvas = [];

max_value = 0;
min_value = 0;

initialise = function(data) {
    temp_array = [],
    candel_position = 0;
    grid();

    main_data = data;

    temp_array = main_data.slice(0, Math.floor(canvas.width/(candel_size+candel_spacing))+1);
    max_value = temp_array.reduce((max, p) => p.high > max ? p.high : max, temp_array[0].high)+border_offset;
    min_value = temp_array.reduce((min, p) => p.low < min ? p.low : min, temp_array[0].low)-border_offset;

    main_data.forEach(element => {
        array_canvas.push(new Candel(candel_position, element, candel_size));
        candel_position+=candel_spacing+candel_size;
    });

    draw();

    document.onkeydown = key_events;
    canvas.onwheel = wheel_event;
}

clear_canvas = function () {
    context.clearRect(0, 0, canvas.width, canvas.height);
}

grid = function() {
    grid_horizontal*=scaler_offset;
    grid_vertical*=scaler_offset;
    for(var i = 0; i < canvas.height; i += (grid_vertical)) {
        context.moveTo(0, i);
        context.lineTo( canvas.width, i);
    }

    for(var i = 0; i < canvas.width; i += (grid_horizontal)) {
        context.moveTo(i, 0);
        context.lineTo(i, canvas.height);
    }

    context.strokeStyle = '#e5e5e3';
    context.stroke();

}
update_position = function(position) {
    array_canvas.forEach((element, index) => {
        element.update_position(position);
    })
    inview();
}
inview = function() {
    inview_data = array_canvas.filter(object => object.inview);
    if (inview_data.length > 0) {
        max_value = inview_data.reduce((max, p) => p.high > max ? p.high : max, inview_data[0].high)+border_offset;
        min_value = inview_data.reduce((min, p) => p.low < min ? p.low : min, inview_data[0].low)-border_offset;
    }
}
draw = function() {
    array_canvas.forEach((element, index) => {
        element.draw();
    })
}
zoom = function() {
    array_canvas.forEach((element, index) => {
        element.zoom();
    })
}
key_events = function(event) {
    event = event || window.event;

    if (event.keyCode == '37' && move_left) {
        // left arrow
        clear_canvas();
        grid();

        update_position(-100);
        if (inview_data.length < 10) {
            move_left = false;
        }

        draw();
        move_right = true;

    }
    else if (event.keyCode == '39' && move_right) {
            
        clear_canvas();
        grid();

        update_position(100);
        if (inview_data.length < 10) {
            move_right = false;
        }

        draw();
        move_left = true;
    }
}

wheel_event = function(event) {
    // console.log(event);
    event.preventDefault(); 

    var scroll = event.deltaY < 0 ? 1 : -2; 

    if(zoom_in && scroll == 1 || zoom_out && scroll == -2) {

        clear_canvas();
        grid();

        scaler_offset = Math.exp(scroll * zoomIntensity); 

        zoom();
        inview();

        if(inview_data.length == main_data.length) {
            zoom_out = false;
            zoom_in = true;
        }
        else if (inview_data.length >= 30) {
            zoom_in = true;
            zoom_out = true;
        }
        else {
            zoom_in = false;
            zoom_out = true;
        }

        draw();

    }

}


function Candel(position, element, candel_size) {
    this.close = element.close,
    this.open = element.open,
    this.id = element.id,
    this.high = element.high,
    this.low = element.low,
    this.volume = element.volume,
    this.color = this.close > this.open?"green":"red",
    this.candel = canvas.getContext("2d");
    this.body_width = candel_size,
    this.body_x = position;

    this.inview = false;

    this.draw = function() {
        this.inview_check();
        // if(this.inview) {
            this.location_update();
            this.candel.beginPath();

            this.candel.fillStyle = "black";
            this.candel.fillRect(this.wik_x, this.wik_y, this.wik_width, this.wik_height);

            this.candel.fillStyle = this.color;
            this.candel.fillRect(this.body_x, this.body_y, this.body_width, this.body_height);

            this.candel.closePath();
        // }
    }
    this.inview_check = function() {
        if(this.body_x >= 0 && this.body_x <= canvas.width) {
            this.inview = true;
        }
        else {
            this.inview = false;
        }
    }
    this.update_position = function(position) {
        this.body_x+= position;
        this.inview_check();

    }
    this.zoom = function() {
        this.location_update();
        this.inview_check();

    }
    this.location_update = function (){
        this.body_width*=scaler_offset,
        this.body_x*=scaler_offset;

        this.wik_width = (this.body_width/10.0);
        this.wik_x = (this.body_x+(this.body_width/2.0 - this.wik_width/2.0))

        this.close_normalised = this.scaler(this.close, 0, canvas.height,  min_value, max_value),
        this.open_normalised =  this.scaler(this.open, 0, canvas.height, min_value, max_value),
        this.high_normalised = this.scaler(this.high, 0, canvas.height, min_value, max_value),
        this.low_normalised =  this.scaler(this.low, 0, canvas.height, min_value, max_value);

        this.wik_y = this.high_normalised
        this.wik_height = this.low_normalised - this.high_normalised;

        this.body_y = (this.close > this.open? (this.close_normalised):(this.open_normalised))
        this.body_height = (this.open_normalised - this.close_normalised);
    }
    this.scaler = function(unscaled, min_range, max_range, min, max) {
        return (((max_range - min_range) * (unscaled - min)) / (max - min)) + min_range;
    }

}
