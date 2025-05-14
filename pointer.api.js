
/**
 * Web Browser Based Multi-Touch Test (Refactored using Pointer Events API)
 *
 * by naqtn (https://github.com/naqtn)
 * Refactored for Pointer Events by Gemini
 */

// using WebModule pattern:
// https://github.com/uupaa/WebModule
// http://qiita.com/kaiinui/items/22a75d2adc56a40da7b7
(function(global) {
    "use strict;"

    // Function ------------------------------------------------

    // Make bridging function to use "this" instance from system callback.
    // original "this" will placed as 1st argument for callbackMethod
    function methodAdapter(thisForCallback, callbackMethod) {
        var _thisForCallback = thisForCallback;
        var _callbackMethod = callbackMethod;
        return function() {
            var args = [this];
            for (var i = 0; i < arguments.length; ++i) {
                args[i + 1] = arguments[i];
            }
            _callbackMethod.apply(_thisForCallback, args);
        }
    };

    // Optimize (or limit) frequent function call.
    function debounce(func, wait) {
        var timeout;
        var orgThis;
        var args;
        function later() {
            timeout = 0;
            func.apply(orgThis, args);
        };
        return function() {
            orgThis = this;
            args = arguments;
            if (timeout != 0) {
                clearTimeout(timeout);
            }
            timeout = setTimeout(later, wait);
        };
    };

    // Exports ----------------------------------------------
    if ("process" in global) {
        module["exports"] = {
            methodAdapter: methodAdapter,
            debounce: debounce
        };
    }
    global["methodAdapter"] = methodAdapter;
    global["debounce"] = debounce;

})((this || 0).self || global);


(function(global) {
    "use strict;"

    // Class ------------------------------------------------
    function Divlog(id, startImmediate) {
        this.elementId = id || "Divlog_div";
        if ((startImmediate == undefined) || (startImmediate == true)) {
            this.start();
        }
    };

    // Header -----------------------------------------------
    Divlog["prototype"]["printHTML"] = Divlog_printHTML; // Divlog#printHTML(s:String):void
    Divlog["prototype"]["consoleLog"] = Divlog_consoleLog; // Divlog#consoleLog(s:String):void
    Divlog["prototype"]["log"] = Divlog_log; // Divlog#log(s:String):void
    Divlog["prototype"]["start"] = Divlog_start; // Divlog#start():void
    Divlog["prototype"]["stop"] = Divlog_stop; // Divlog#stop():void
    // property:
    // elementId
    // _consoleObjOrig
    // _consoleLogOrig

    // Implementation ---------------------------------------
    function Divlog_printHTML(s) {
        var element = document.getElementById(this.elementId);
        if (element == null) {
            element = document.createElement("div");
            document.body.insertBefore(element, document.body.firstChild);
            element.id = this.elementId;
            element.style.cssText = "position: fixed; top: 0; left: 0; width: 100%; height: 100px; background-color: rgba(255, 255, 255, 0.8); overflow-y: scroll; z-index: 1000;";
        }
        element.insertAdjacentHTML("beforeend", s);
        // Auto-scroll to bottom
        element.scrollTop = element.scrollHeight;
    }

    function Divlog_consoleLog(s) {
        if (this._consoleObjOrig && this._consoleLogOrig) {
            this._consoleLogOrig.call(this._consoleObjOrig, s);
        }
    }

    var escapeHtml_replacementTbl = {
            '&': '&',
            '<': '<',
            '>': '>'
    };

    function escapeHtml_replacementFunc(match) {
        return escapeHtml_replacementTbl[match] || match;
    }

    function escapeHtml(s) {
        return s.replace(/[&<>]/g, escapeHtml_replacementFunc);
    }

    function Divlog_log(s) {
        this.consoleLog(s);
        this.printHTML("<p style='margin: 0; padding: 2px;'>" + escapeHtml(s) + "</p>");
    }

    function Divlog_start() {
        if (console) {
             this._consoleObjOrig = console;
             this._consoleLogOrig = console.log;
        } else {
            this._consoleObjOrig = undefined;
            this._consoleLogOrig = undefined;
        }

        var self = this;
        console.log = function(s) {
            self.log(s);
        };
    }

    function Divlog_stop() {
        if (this._consoleObjOrig && this._consoleLogOrig) {
            console.log = this._consoleLogOrig;
        }
    }

    // Exports ----------------------------------------------
    if ("process" in global) {
        module["exports"] = Divlog;
    }
    global["Divlog"] = Divlog;

})((this || 0).self || global);


(function(global) {
    "use strict;"

    var IN_BROWSER = "document" in global;
    var PC_DEBUG = false; // Keep for potential future desktop click simulation

    // Class ------------------------------------------------
    function Wbbmtt() { // constructor
        this.query = decodeQueryString();

        var markSizeScale = Number(queryValue(this.query, "markSizeScale", 1.0));
        this.markRadius1 = 22 * markSizeScale;
        this.markRadius2 = 14 * markSizeScale;
        this.mark2Width = 6 * markSizeScale;

        this.gridSpan = Number(queryValue(this.query, "gridSpan", -1));
        this.backGroundColor = queryValue(this.query, "backGroundColor", "black");
        // With Pointer Events and touch-action: none, preventDefault is handled differently.
        // We might keep this query param for other non-pointer event types if needed.
        this.preventDefaultNonPointer = !queryValueCheckbox(this.query, "noPreventDefault", false);

        this.manualClearMode = queryValueCheckbox(this.query, "shakeClearMode", false);
        this.useShakeOperation = this.manualClearMode; // Shake operation is for clearing

        this.showTouchProperties = !queryValueCheckbox(this.query, "hideTouchProperties", false);
        this.showTouchRadius = queryValueCheckbox(this.query, "showTouchRadius", false);
        this.showPointerType = queryValueCheckbox(this.query, "showPointerType", false); // New option

        this.idleMessage = "Touch Screen Tester (WBBMTT)";
        this.displayCanvasId = "touchDisplayCanvas";
        this.touchListenElementId = this.displayCanvasId;
        this._activePointers = new Map(); // Use Map for tracking pointers by pointerId

        if (PC_DEBUG) {
            this.keyFuncMap = {};
        }

        // Log maxTouchPoints for debugging
        if (IN_BROWSER && navigator.maxTouchPoints !== undefined) {
             console.log("Browser maxTouchPoints:", navigator.maxTouchPoints);
        }
    };

    // Header -----------------------------------------------
    Wbbmtt["prototype"]["startAfterLoad"] = Wbbmtt_startAfterLoad;
    Wbbmtt["prototype"]["start"] = Wbbmtt_start;
    // private
    Wbbmtt["prototype"]["_pointerHandler"] = Wbbmtt__pointerHandler; // Use pointerHandler
    Wbbmtt["prototype"]["_drawTouches"] = Wbbmtt__drawTouches;
    Wbbmtt["prototype"]["_drawTouchPoint"] = Wbbmtt__drawTouchPoint;
    Wbbmtt["prototype"]["_devicemotionHandler"] = Wbbmtt__devicemotionHandler;
    Wbbmtt["prototype"]["_resizeCanvasHandler"] = Wbbmtt__resizeCanvasHandler;
    Wbbmtt["prototype"]["_resizeCanvas"] = Wbbmtt__resizeCanvas;
    Wbbmtt["prototype"]["_clearTouches"] = Wbbmtt__clearTouches; // Added clear method
    if (PC_DEBUG) {
        Wbbmtt["prototype"]["_clickHandler"] = Wbbmtt__clickHandler;
        Wbbmtt["prototype"]["_keydownHandler"] = Wbbmtt__keydownHandler;
    }

    // Implementation ---------------------------------------
    function decodeQueryString() {
        var obj = {};
        if (IN_BROWSER && window.location.search) {
            var keyvals = window.location.search.substring(1).split('&');
            for (var i = 0; i < keyvals.length; ++i) {
                var kv = keyvals[i].split('=');
                if (kv.length > 1) {
                    obj[kv[0]] = decodeURIComponent(kv[1]);
                } else {
                     obj[kv[0]] = true; // Handle boolean query parameters like ?shakeClearMode
                }
            }
        }
        return obj;
    }

    function queryValueCheckbox(obj, key, defaultVal) {
         // Check if key exists and its value is not explicitly "false" or "0"
        return (key in obj && obj[key] !== "false" && obj[key] !== "0") || defaultVal;
    }

    function queryValue(obj, key, defaultVal) {
        return (key in obj && obj[key] !== undefined && obj[key] !== null) ? obj[key] : defaultVal;
    }

    // Modified to store pointer data directly in the Map
    function storePointer(map, pointerEvent) {
        map.set(pointerEvent.pointerId, {
            identifier: pointerEvent.pointerId, // Use pointerId as identifier
            radiusX: pointerEvent.width ? pointerEvent.width / 2 : undefined, // Estimate radius from width/height
            radiusY: pointerEvent.height ? pointerEvent.height / 2 : undefined,
            pageX: pointerEvent.pageX,
            pageY: pointerEvent.pageY,
            screenX: pointerEvent.screenX,
            screenY: pointerEvent.screenY,
            pointerType: pointerEvent.pointerType // Store pointer type
        });
    }

    // findTouch is no longer needed with Map

    // copyTouch is no longer needed with direct object creation

    function ordinalStr(ordinal) {
        switch (ordinal) {
            case 0 :
                return "1st";
            case 1 :
                return "2nd";
            case 2 :
                return "3rd";
            default :
                return (ordinal + 1) + "th";
        }
    }

    function numberToPadedFixed(number, width, precision) {
        if (number === undefined) return " N/A".padStart(width + precision + 1);
        var s = number.toFixed(precision);
        while (s.length < width + precision + 1) { // Adjust padding based on precision
            s = " " + s;
        }
        return s;
    }

    // Updated formatTouch to include pointerType
    function formatTouch(pointerInfo, ordinal, showRadius, showPointerType) {
        var s = ordinalStr(ordinal) + " X:" //
                + numberToPadedFixed(pointerInfo.pageX, 7, 2) + " Y:" //
                + numberToPadedFixed(pointerInfo.pageY, 7, 2);
        //+ " ID:" + pointerInfo.identifier.toString(); // Use pointerId
        if (showRadius) {
             s += " rX:" + numberToPadedFixed(pointerInfo.radiusX, 3, pointerInfo.radiusX !== undefined ? 1 : 0);
             s += " rY:" + numberToPadedFixed(pointerInfo.radiusY, 3, pointerInfo.radiusY !== undefined ? 1 : 0);
        }
        if (showPointerType && pointerInfo.pointerType) {
            s += " Type:" + pointerInfo.pointerType;
        }
        return s;
    }

    var COLORS = ["red", "lime", "orange", "aqua", "fuchsia", "yellow", "purple", "white"]; // Added more colors
    function touchColor(i) {
        return COLORS[i % COLORS.length];
    }

    function drawGrid(ctx, span) {
        ctx.strokeStyle = 'gray';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (var x = 0; x < ctx.canvas.width; x += span) {
            ctx.moveTo(x, 0);
            ctx.lineTo(x, ctx.canvas.height);
        }
        for (var y = 0; y < ctx.canvas.height; y += span) {
            ctx.moveTo(0, y);
            ctx.lineTo(ctx.canvas.width, y);
        }
        ctx.stroke();
    }

    function Wbbmtt__drawTouchPoint(ctx, pointerInfo, color) {
        var px = pointerInfo.pageX;
        var py = pointerInfo.pageY;

        // draw x-y lines
        ctx.beginPath();
        ctx.moveTo(px, 0);
        ctx.lineTo(px, ctx.canvas.height);
        ctx.moveTo(0, py);
        ctx.lineTo(ctx.canvas.width, py);
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.stroke();

        // draw mark (circles)
        ctx.beginPath();
        ctx.arc(px, py, this.markRadius1, 0, Math.PI * 2, true);
        ctx.fillStyle = color;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(px, py, this.markRadius2, 0, Math.PI * 2, true);
        ctx.lineWidth = this.mark2Width;
        ctx.strokeStyle = 'rgb(0,0,0)'; // Black stroke for inner circle
        ctx.stroke();

         // Draw pointerId or ordinal inside the circle
         ctx.font = "bold 12px Arial";
         ctx.fillStyle = 'black'; // Black text
         ctx.textAlign = 'center';
         ctx.textBaseline = 'middle';
         // Display the index (0-based) within the circle
         let ordinal = 0;
         for (const id of this._activePointers.keys()) {
             if (id === pointerInfo.identifier) break;
             ordinal++;
         }
         ctx.fillText(ordinal + 1, px, py);
    }

    // Updated drawTouchString to use pointerInfo
    function drawTouchString(ctx, pointerInfo, color, ordinal, showRadius, showPointerType) {
        ctx.font = "16px monospace";
        ctx.fillStyle = color;
        ctx.fillText(formatTouch(pointerInfo, ordinal, showRadius, showPointerType), 10, 18 * ordinal + 30); // Adjusted position
    }

    function drawIdleMessage(ctx, message, color) {
        ctx.font = "18px monospace";
        ctx.fillStyle = color;
        var metrix = ctx.measureText(message);
        ctx.fillText(message, (ctx.canvas.width - metrix.width) / 2, ctx.canvas.height / 2);
    }

    var RESIZE_DELAY = 300;
    function Wbbmtt__resizeCanvasHandler(orgThis) {
        // Use debounce from the utility module
        this._resizeCanvasHandler2 = this._resizeCanvasHandler2
                || debounce(methodAdapter(this, this._resizeCanvas), RESIZE_DELAY);
        this._resizeCanvasHandler2();
    }

    function Wbbmtt__resizeCanvas() {
        var canvas = document.getElementById(this.displayCanvasId);
        if (!canvas) {
            console.error("Canvas element #" + this.displayCanvasId + " not found for resizing.");
            return;
        }
        if ((canvas.width != window.innerWidth) || (canvas.height != window.innerHeight)) {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;

            this._drawTouches(); // Redraw after resize
        }
    }

    function Wbbmtt__drawTouches() {
        var canvas = document.getElementById(this.displayCanvasId);
        if (!canvas || !canvas.getContext) {
            // fallback for canvas-unsupported browser or if canvas not found
            return;
        }

        var ctx = canvas.getContext('2d');

        if (this.backGroundColor) {
            ctx.fillStyle = this.backGroundColor;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        } else {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }

        if (0 < this.gridSpan) {
            drawGrid(ctx, this.gridSpan);
        }

        let i = 0;
        // Iterate over the values (pointer info objects) in the Map
        for (const pointerInfo of this._activePointers.values()) {
             this._drawTouchPoint(ctx, pointerInfo, touchColor(i));
             i++;
        }

        let entryExists = false;
        i = 0;
        // Iterate over the values (pointer info objects) in the Map again for text
        for (const pointerInfo of this._activePointers.values()) {
            if (this.showTouchProperties) {
                 drawTouchString(ctx, pointerInfo, touchColor(i), i, this.showTouchRadius, this.showPointerType);
            }
            entryExists = true;
            i++;
        }

        if (!entryExists) {
            drawIdleMessage(ctx, this.idleMessage, touchColor(2));
        }
    }

    // New Pointer Event handler
    function Wbbmtt__pointerHandler(orgThis, event) {
        // Filter to only process 'touch' pointer types if desired, or handle other types
        // Based on the refactoring goal, we primarily care about 'touch'.
        // The original code was only for touch events, so we'll continue that focus
        // unless query parameters suggest otherwise (not implemented yet).
        if (event.pointerType !== 'touch') {
            // Optionally log or handle other pointer types if needed
            // console.log("Ignoring pointerType:", event.pointerType);
            return;
        }

        this.currentEvent = event; // for extensibility

        // With touch-action: none set on the canvas, default gestures are prevented.
        // We might still need preventDefault for other reasons depending on interaction.
        // For now, let's keep it if the query param is set, although touch-action is primary.
        if (this.preventDefaultNonPointer) {
             // event.preventDefault(); // touch-action handles this for gestures originating on the element
        }


        switch (event.type) {
            case "pointerdown":
                // Add the new pointer to the map
                storePointer(this._activePointers, event);
                break;
            case "pointermove":
                // Update the position of the existing pointer in the map
                if (this._activePointers.has(event.pointerId)) {
                    storePointer(this._activePointers, event); // Overwrite with updated info
                }
                break;
            case "pointerup": // fall through
            case "pointercancel":
                 // Remove the pointer from the map
                 if (this._activePointers.has(event.pointerId)) {
                     if (this.manualClearMode) {
                         // In manual clear mode, don't remove immediately, just mark or handle differently if needed.
                         // For simplicity in this refactor, manualClearMode affects the shake handler primarily.
                         // If manualClearMode should prevent clearing on pointerup/cancel, we'd add logic here.
                         // For now, clearing happens via shake.
                          this._activePointers.delete(event.pointerId); // Still remove on up/cancel for accuracy unless specific manual clear logic is added.
                     } else {
                          this._activePointers.delete(event.pointerId);
                     }
                 }
                break;
            default :
                // Should not happen for the event types we are listening to
                console.warn("Unknown pointer event type:", event.type);
                break;
        }

        this._drawTouches();

        this.currentEvent = null;
        // No return value needed for event handlers
    }

    // //////////////////
    // for debug
    // Adapt click handler for PC_DEBUG to simulate pointer events if needed,
    // or keep as is if it simulates touch events for testing.
    // Keeping the original simulation of touch events for now.
    function TouchEventSym(type) {
        this.preventDefault = function() {}; // Provide a dummy preventDefault
        this.type = type;
         this.changedTouches = []; // Simulate changedTouches property
         this.touches = []; // Simulate touches property
    }

    function Wbbmtt__clickHandler(orgThis, event) {
         if (!PC_DEBUG) return; // Only active in debug mode

        // Simulate a touchstart event with one pointer
        var touch = {
            "identifier" : Date.now(), // Use a unique identifier
            "pageX" : event.pageX,
            "pageY" : event.pageY,
            "screenX" : event.screenX,
            "screenY" : event.screenY,
            "radiusX": 10, // Simulate some radius data
            "radiusY": 10,
             "pointerType": "mouse" // Indicate simulated mouse input
        };

         // Create a simulated PointerEvent
         var pointerEvent = {
             "pointerId": touch.identifier,
             "pageX": touch.pageX,
             "pageY": touch.pageY,
             "screenX": touch.screenX,
             "screenY": touch.screenY,
             "width": touch.radiusX * 2, // Simulate width/height
             "height": touch.radiusY * 2,
             "pointerType": touch.pointerType,
             "type": "pointerdown",
              "preventDefault": function() {} // Dummy function
         };


         // Directly call the pointer handler with the simulated event
         this._pointerHandler(this, pointerEvent);

         // Simulate a pointerup after a short delay
         var self = this;
         setTimeout(function() {
              var pointerUpEvent = {
                  "pointerId": touch.identifier,
                  "type": "pointerup",
                   "preventDefault": function() {} // Dummy function
              };
              self._pointerHandler(self, pointerUpEvent);
         }, 50); // Simulate a quick tap
    }

     function Wbbmtt__keydownHandler(orgThis, event) {
        if (!PC_DEBUG) return; // Only active in debug mode
        var func = this.keyFuncMap[event.key];
        if (func) {
            func.apply(this, [event]); // Pass the event object
        }
    }
    // end for debug
    // //////////////////

    var ACCEL_SQ_THRESHOLD = 300; // Keep the same threshold
    function Wbbmtt__devicemotionHandler(orgThis, event) {
        if (!event.acceleration) {
            // Acceleration data not available
            return;
        }
        var x = event.acceleration.x;
        var y = event.acceleration.y;
        var z = event.acceleration.z;

        var sq = x * x + y * y + z * z;

        if (this.useShakeOperation && (ACCEL_SQ_THRESHOLD < sq)) {
            // Use debounce from the utility module
            this._devicemotionHandler2 = this._devicemotionHandler2
                    || debounce(methodAdapter(this, this._clearTouches), 1000); // Increased debounce for shake
            this._devicemotionHandler2();
        }
    }

    function Wbbmtt__clearTouches() {
        this._activePointers.clear(); // Clear the Map
        this._drawTouches();
        console.log("Touches cleared by shake.");
    }

    function Wbbmtt_start() {
        var listenElement;
        if (this.touchListenElementId) {
            listenElement = document.getElementById(this.touchListenElementId);
            if (!listenElement) {
                console.error("Listen element not found. id='" + this.touchListenElementId + "'");
                return; // Exit if listen element not found
            }
        } else {
             listenElement = document.body; // Default to body if no specific element
        }

        // Apply touch-action: none to the listen element to disable default gestures
         if (listenElement.style) {
              listenElement.style.touchAction = "none"; // Disable default touch actions [5, 8, 18]
         } else {
              console.warn("Listen element does not have a style property to set touch-action.");
         }


        // Use methodAdapter for all event listeners
        this._pointerHandlerFunc = this._pointerHandlerFunc || methodAdapter(this, this._pointerHandler);

        // Add Pointer Event listeners
        listenElement.addEventListener("pointerdown", this._pointerHandlerFunc, false);
        listenElement.addEventListener("pointermove", this._pointerHandlerFunc, false);
        listenElement.addEventListener("pointerup", this._pointerHandlerFunc, false);
        listenElement.addEventListener("pointercancel", this._pointerHandlerFunc, false);
        // pointerenter, pointerleave, pointerover, pointerout could be added if needed

        if (this.useShakeOperation) {
            this._devicemotionHandlerFunc = this._devicemotionHandlerFunc
                    || methodAdapter(this, this._devicemotionHandler);
            // Check if devicemotion is supported
            if (window.DeviceMotionEvent) {
                 window.addEventListener("devicemotion", this._devicemotionHandlerFunc);
            } else {
                 console.warn("DeviceMotionEvent is not supported on this device.");
                 this.useShakeOperation = false; // Disable shake if not supported
            }
        }

        this._resizeCanvasHandlerFunc = this._resizeCanvasHandlerFunc
                || methodAdapter(this, this._resizeCanvasHandler);
        window.addEventListener("resize", this._resizeCanvasHandlerFunc);

        // Initial canvas resize and draw
        this._resizeCanvas();

        if (this.backGroundColor) {
            // overwrite body background dynamically for smooth transition when device orientation
            // is changed
            document.body.style.background = this.backGroundColor;
        }

        if (PC_DEBUG) {
            this._clickHandlerFunc = this._clickHandlerFunc
                    || methodAdapter(this, this._clickHandler);
            document.addEventListener("click", this._clickHandlerFunc, false);
            this._keydownHandlerFunc = this._keydownHandlerFunc
                    || methodAdapter(this, this._keydownHandler);
            document.addEventListener("keydown", this._keydownHandlerFunc, false);

            // Add debug key functions
             this.keyFuncMap['c'] = this._clearTouches; // 'c' key to clear touches
        }

        console.log("WBBMTT started. Listening for pointer events on #" + listenElement.id + ".");
        if (this.manualClearMode) {
             console.log("Manual clear mode (shake) is enabled.");
        }
    }

    function Wbbmtt_startAfterLoad() {
        var self = this;
        if (IN_BROWSER) {
            window.addEventListener("load", function() {
                self.start();
            }, false);
        }
    }

    // Exports ----------------------------------------------
    if ("process" in global) {
        module["exports"] = Wbbmtt;
    }
    global["Wbbmtt"] = Wbbmtt;

})((this || 0).self || global);

// Optional: Auto-start the application if included as a script
(function() {
    "use strict";
    if (typeof Wbbmtt !== 'undefined') {
        var app = new Wbbmtt();
        app.startAfterLoad();
         // Initialize Divlog if not already done and if console logging is desired
         if (typeof Divlog !== 'undefined' && typeof console !== 'undefined') {
             // Check if console.log has been overridden by Divlog already
             if (console.log && console.log.toString().indexOf("self.log(s)") === -1) {
                  new Divlog("Divlog_div", true);
             }
         }
    } else {
         console.error("Wbbmtt class not found.");
    }
})();
