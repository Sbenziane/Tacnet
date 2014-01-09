var oldColor = "";
var buttonStates = {
    '.green-pick': '',
    '.yellow-pick': '',
    '.blue-pick': '',
    '.red-pick': '',
    '.black-pick': '',
    '.eraser': '',
    '.toggleTrailing': '',
    '.user-color-pick': ''
};

$(document).ready(function () {
    function toggleState(button, buttonClass) {
        if (buttonStates[buttonClass]) { 
            buttonStates[buttonClass] = '';
            $(button).removeClass('active');
        }
        else {
            buttonStates[buttonClass] = 'active';
            $(button).addClass('active');
        }
    }
    // Hide popover
    function hidePopover(element) {
        if (element.next('div.popover:visible').length) {
            element.popover('toggle');
        }
    }

    $(window).keypress(function (e) {
        if (e.which == 26) {
            undo();
        }
        else if (e.which == 25) {
            redo();
        }
    });

    // Initialize popovers
    $('#chooseBrush').popover({
        html: true,
        placement: 'bottom',
        template: '<div class="popover largePopover"><div class="arrow"></div><div class="popover-inner"><h3 class="popover-title"></h3><div class="popover-content"><p></p></div></div></div>',
        content: function () {
            return $('#chooseBrush_content_wrapper').html();
        }
    });

    $('#clearMenu').popover({
        html: true,
        placement: 'bottom',
        template: '<div class="popover smallPopover"><div class="arrow"></div><div class="popover-inner"><h3 class="popover-title"></h3><div class="popover-content"><p></p></div></div></div>',
        content: function () {
            return $('#clearMenu_content_wrapper').html();
        }
    });

    $('#clearMenu').on('shown.bs.popover', function () {
        hidePopover($('#chooseBrush'));

        $('.clearCanvas').click(function() {
            clearCanvas(true);
            hidePopover($('#clearMenu'));
        });

        $('.resetFabric').click(function () {
            resetFabric(true);
            hidePopover($('#clearMenu'));
        });

        $('.resetBackground').click(function() {
            $("#gameslist").select2("val", "");
            $("#mapslist").select2("val", "");
            resetBackground(true);
            hidePopover($('#clearMenu'));
        });
    });

    $('#chooseBrush').on('shown.bs.popover', function () {
        for (var key in buttonStates) {
            if (buttonStates[key]) {
                $(key).addClass('active');
            }
        }
        hidePopover($('#clearMenu'));
        $('#brushSizeForm').append('<input type="text" class="slider" id="brushSize" style="width: 440px;" />');
        $('.slider').slider({
            min: 1,
            max: 50,
            step: 1,
            value: sketchContext.lineWidth
        }).on('slide', function (ev) {
            setSize(ev.value+2);
        }).on('slideStop', function (ev) {
            changeMouse();
        });

        // Button listeners

        //Color change functions
        $('.green-pick').click(function () {
            setColor('#00ff00');
            $('.brush').removeClass('active');
            toggleState(this, '.green-pick');
            changeMouse();
        });

        //Color change functions
        $('.yellow-pick').click(function () {
            setColor('#ff0');
            $('.brush').removeClass('active');
            toggleState(this, '.yellow-pick');
            changeMouse();
        });

        //Color change functions
        $('.red-pick').click(function () {
            setColor('#ff0000');
            $('.brush').removeClass('active');
            toggleState(this, '.red-pick');
            changeMouse();
        });

        //Color change functions
        $('.blue-pick').click(function () {
            setColor('#0000ff');
            $('.brush').removeClass('active');
            toggleState(this, '.blue-pick');
            changeMouse();
        });

        //Color change functions
        $('.black-pick').click(function () {
            setColor('#000');
            $('.brush').removeClass('active');
            toggleState(this, '.black-pick');
            changeMouse();
        });
        $('.eraser').click(function () {
            $('.brush').removeClass('active');
            toggleState(this);
            if (sketchContext.globalCompositeOperation != 'destination-out') {
                oldColor = sketchContext.strokeStyle;
                sketchContext.globalCompositeOperation = 'destination-out';
                sketchContext.strokeStyle = 'rgba(0,0,0,1)';
            }
            else {
                sketchContext.globalCompositeOperation = 'source-over';
                sketchContext.strokeStyle = oldColor;
            }
            changeMouse();
        });
         //User color
        $('.user-color-pick').click(function() {
            setColor(TogetherJS.require('peers').Self.color);
            $('.brush').removeClass('active');
            toggleState(this, '.user-color-pick');
            changeMouse();
        });

        $('.toggleTrailing').click(function() {
            toggleState(this, '.toggleTrailing');
            if (iconTrail) {
                iconTrail = false;
            }
            else {
                iconTrail = true;
            }
        });        
    });

    // Hide popover listeners
    $('#chooseBrush').on('hide.bs.popover', function () {
        $('.slider').remove();
    });

    // Close popovers when clicking on sketchCanvas
    $('.upper-canvas').click(function () {
        hidePopover($('#chooseBrush'));
        hidePopover($('#clearMenu'));
    });


    $('.undo').click(function() {
        undo();
    });

    $('.redo').click(function() {
        redo();
    });

    $('.addText').click(function() {
        addText('TEXT', sketchContext.strokeStyle, false, true);
    });

    $('.deleteIcon').click(function() {
        if (fabricCanvas.getActiveObject()) {
            deleteIcon(fabricCanvas.getActiveObject().hash, true);
        }
    });

    function changeMouse() {
        var cursorSize = sketchContext.lineWidth;
        if (cursorSize < 10){
            cursorSize = 10;
        }
        var cursorColor = sketchContext.strokeStyle;
        var cursorGenerator = document.createElement('canvas');
        cursorGenerator.width = cursorSize;
        cursorGenerator.height = cursorSize;
        var ctx = cursorGenerator.getContext('2d');

        var centerX = cursorGenerator.width/2;
        var centerY = cursorGenerator.height/2;

        ctx.beginPath();
        ctx.arc(centerX, centerY, (cursorSize/2)-4, 0, 2 * Math.PI, false);

        // If the user is erasing, set the fill of the cursor to white.
        if (sketchContext.globalCompositeOperation == 'destination-over') {
             ctx.fillStyle = 'white';
             ctx.fill();
        }

        ctx.lineWidth = 3;
        ctx.strokeStyle = cursorColor;
        ctx.stroke();
        fabricCanvas.defaultCursor = 'url(' + cursorGenerator.toDataURL('image/png') + ') ' + cursorSize/2 + ' ' + cursorSize/2 + ',crosshair';
    }
    // Init mouse
    changeMouse();

    // Save/Load  Cloud
    $('.cloudSave').click(function () {
        var tacName = $('.tacticName').val();
        if (!tacName) {
            // Maybe just save the tactic with the mapname as name? Or at least use something else than growl, the warning 
            // should come in the box itself, or close.
            $.bootstrapGrowl('Please enter a tactic name.', {
                type: 'warning', 
                width: 'auto'
            });
        }
        else if (!loggedIn) {
            show_bar();
            $.bootstrapGrowl('You need to be logged in to cloud save.', {
                type: 'warning',
                width: 'auto'
            });
        }
        else if (currentBackgroundID == '-') {
            $.bootstrapGrowl('Please select a map before attempting to save tactics.', {
                type: 'warning',
                width: 'auto'
            });
        }
        else {
            for (var key in icons) {
                icons[key].toObject = (function(toObject) {
                    return function() {
                        return fabric.util.object.extend(toObject.call(this), {
                            hash: this.hash
                        });
                    };
                })(icons[key].toObject);
            }
            $.ajax({
                type: "POST",
                url: "/tacsketch/save_tac",
                    xhrFields: {
                        withCredentials: true
                },
                data: { 
                    csrfmiddlewaretoken: csrf_token, 
                    name: tacName,
                    map: currentBackgroundID,
                    fabric: JSON.stringify(fabricCanvas),
                    lines: JSON.stringify(lines),
                }
            }).done(function (msg) {      
                if (msg == "True") {
                    $.bootstrapGrowl('Tactic successfully saved. ', {
                        type: 'success',
                        width: 'auto'
                    });
                }
                else {
                    $.bootstrapGrowl('Couldn\'t save tactic, please try again.', {
                        type: 'danger',
                        width: 'auto'
                    });
                }
            });
        }
    });


    $('.saveScreenshot').click(function() {
        var downloadCanvas = document.createElement('canvas');
        var downloadContext = downloadCanvas.getContext('2d');
        var bgImg = new Image();
        var drawings = new Image();
        var fabric = new Image();
        bgImg.src = bgCanvas.toDataURL('image/png');
        fabric.src = fabricCanvas.toDataURL('image/png');
        drawings.src = sketchCanvas.toDataURL('image/png');
        downloadCanvas.width = bgImg.width;
        downloadCanvas.height = bgImg.height;
        downloadContext.drawImage(bgImg, 0,0);
        downloadContext.drawImage(drawings, 0,0);
        downloadContext.drawImage(fabric, 0,0);
        var dlHref = downloadCanvas.toDataURL('image/png').replace("image/png", "image/octet-stream");
        $('.saveScreenshot').attr('href', dlHref).attr('download', currentBackground.slice(12,currentBackground.length-4)+'_screenshot.png');
        $.bootstrapGrowl('Saved screenshot.', {
            type: 'success',
            width: 'auto'
        });
    });

    $('.loadDrawings').click(function() {
        $('#input').click();
    });

    TogetherJS.on('ready', function () {
        spinner.stop();
        $('#loading_layer').hide();
    });


    $('#loadCloudTactic').on('shown.bs.modal', function (e) {

        $('.tac-table-content').html('<tr><td colspan="4">Loading...</td></tr>');
        $.get( "/tacsketch/get_tacs", {  } )
        .done(function( data ) {
            if (data != "False") {

                $('.tac-table-content').html('');
                jQuery.each(data, function() {

                    var fabricJSON = this.fabric;
                    var linesJSON = this.lines;

                    $('.tac-table-content').append('<tr class="tac-element-' + this.id + '"><td style="cursor:pointer;" class="tac-click" data-id="' + this.id + '">' + this.name + '</td><td>' + this.mapName + '</td><td>' + this.gameName + '</td><td><button type="button" class="btn btn-danger btn-xs confirmation" data-id="' + this.id + '"><span class="glyphicon glyphicon-remove-circle"></span> Delete</button></td></tr>');


                });

                $('.tac-click').click(function(){

                    var id = $(this).attr('data-id');
                    jQuery.each(data, function() {

                        if(this.id == id) {
                            lines = JSON.parse(this.lines);
                            initJSON = JSON.parse(this.fabric);
                            setBackground('/media/' + this.mapURI, this.mapID, false, true, true);
                            $('#loadCloudTactic').modal('hide');
                        }

                    });

                });



                $('.confirmation').click(function(){

                    if ($(this).hasClass('stage')) {

                        var dataID = $(this).attr('data-id');

                        $.ajax({
                            type: "POST",
                            url: "/tacsketch/delete_tac",
                                xhrFields: {
                                    withCredentials: true
                            },
                            data: {
                                csrfmiddlewaretoken: csrf_token,
                                id: dataID
                            }
                            }).done(function (msg) {
                                if (msg == "True") {
                                    $('.tac-element-' + dataID).hide();
                                }
                                else {
                                    $.bootstrapGrowl('Error: Can\'t delete tactic.', {
                                        type: 'danger',
                                        width: 'auto'
                                    });
                                }
                            });


                    }
                    else {
                        $(this).addClass('stage');
                        $(this).html('Are you sure?');
                    }

                });

            }
           else {
                $('.tac-table-content').html('<tr><td colspan="4">Please login!</td></tr>');
            }
        });


    });


}); 
