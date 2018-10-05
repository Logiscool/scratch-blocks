/**
 * @license
 * Visual Blocks Editor (for Scoolcode)
 *
 * Copyright 2013 Logiscool Kft..
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview Angle input field with minutes as unit (aka Clock Input).
 * @author sagi.balazs@logiscool.com
 */
'use strict';

goog.provide('Blockly.FieldAngleMinutes');

goog.require('Blockly.DropDownDiv');
goog.require('Blockly.FieldAngle');
/*goog.require('goog.math');
goog.require('goog.userAgent');*/

function toRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

function toDegrees(radians) {
  return (radians * 180) / Math.PI;
}

/**
 * Class for an editable angle field with minutes as unit.
 * @param {(string|number)=} opt_value The initial content of the field. The
 *     value should cast to a number, and if it does not, '0' will be used.
 * @param {Function=} opt_validator An optional function that is called
 *     to validate any constraints on what the user entered.  Takes the new
 *     text as an argument and returns the accepted text or null to abort
 *     the change.
 * @extends {Blockly.FieldTextInput}
 * @constructor
 */
Blockly.FieldAngleMinutes = function(opt_value, opt_validator) {
  Blockly.FieldAngleMinutes.superClass_.constructor.call(
      this, opt_value, opt_validator);
};
goog.inherits(Blockly.FieldAngleMinutes, Blockly.FieldAngle);

Blockly.FieldAngleMinutes.ROUND = 1;
Blockly.FieldAngleMinutes.WRAP = 360;

Blockly.FieldAngleMinutes.prototype.showEditor_ = function() {
  var noFocus = false;
  // Mobile browsers have issues with in-line textareas (focus & keyboards).
  Blockly.FieldAngleMinutes.superClass_.showEditor_.call(this, noFocus);
  // If there is an existing drop-down someone else owns, hide it immediately and clear it.
  Blockly.DropDownDiv.hideWithoutAnimation();
  Blockly.DropDownDiv.clearContent();
  var div = Blockly.DropDownDiv.getContentDiv();
  // Build the SVG DOM.
  var svg = Blockly.utils.createSvgElement(
    'svg',
    {
      xmlns: 'http://www.w3.org/2000/svg',
      'xmlns:html': 'http://www.w3.org/1999/xhtml',
      'xmlns:xlink': 'http://www.w3.org/1999/xlink',
      version: '1.1',
      height: Blockly.FieldAngle.HALF * 2 + 'px',
      width: Blockly.FieldAngle.HALF * 2 + 'px'
    },
    div
  );
  Blockly.utils.createSvgElement(
    'circle',
    {
      cx: Blockly.FieldAngle.HALF,
      cy: Blockly.FieldAngle.HALF,
      r: Blockly.FieldAngle.RADIUS,
      class: 'blocklyAngleCircle'
    },
    svg
  );
  this.gauge_ = Blockly.utils.createSvgElement(
    'path',
    { class: 'blocklyAngleGauge' },
    svg
  );
  // The moving line, x2 and y2 are set in updateGraph_
  this.line_ = Blockly.utils.createSvgElement(
    'line',
    {
      x1: Blockly.FieldAngle.HALF,
      y1: Blockly.FieldAngle.HALF,
      class: 'blocklyAngleLine blocklyAngleLineClock'
    },
    svg
  );
  // Draw markers around the edge.
  for (var angle = -30; angle < 360; angle += 30) {
    Blockly.utils.createSvgElement(
      'line',
      {
        x1:
          Blockly.FieldAngle.HALF +
          Blockly.FieldAngle.RADIUS -
          15,
        y1: Blockly.FieldAngle.HALF,
        x2: Blockly.FieldAngle.HALF + Blockly.FieldAngle.RADIUS - 7,
        y2: Blockly.FieldAngle.HALF,
        class: 'blocklyAngleMarks',
        transform:
          'rotate(' +
          angle +
          ',' +
          Blockly.FieldAngle.HALF +
          ',' +
          Blockly.FieldAngle.HALF +
          ')'
      },
      svg
    );
  }
  // Center point
  Blockly.utils.createSvgElement(
    'circle',
    {
      cx: Blockly.FieldAngle.HALF,
      cy: Blockly.FieldAngle.HALF,
      r: 5,
      class: 'blocklyAngleCenterPoint'
    },
    svg
  );
  // Handle group: a circle and the arrow image
  this.handle_ = Blockly.utils.createSvgElement('g', {}, svg);
  Blockly.utils.createSvgElement(
    'circle',
    {
      cx: 0,
      cy: 0,
      r: Blockly.FieldAngle.HANDLE_RADIUS,
      class: 'blocklyAngleDragHandle'
    },
    this.handle_
  );
  this.arrowSvg_ = Blockly.utils.createSvgElement(
    'image',
    {
      width: Blockly.FieldAngle.ARROW_WIDTH,
      height: Blockly.FieldAngle.ARROW_WIDTH,
      x: -Blockly.FieldAngle.ARROW_WIDTH / 2,
      y: -Blockly.FieldAngle.ARROW_WIDTH / 2
    },
    this.handle_
  );
  this.arrowSvg_.setAttributeNS(
    'http://www.w3.org/1999/xlink',
    'xlink:href',
    Blockly.mainWorkspace.options.pathToMedia +
    Blockly.FieldAngle.ARROW_SVG_PATH
  );

  Blockly.DropDownDiv.setColour(
    this.sourceBlock_.parentBlock_.getColour(),
    this.sourceBlock_.getColourTertiary()
  );
  Blockly.DropDownDiv.setCategory(
    this.sourceBlock_.parentBlock_.getCategory()
  );
  Blockly.DropDownDiv.showPositionedByBlock(this, this.sourceBlock_);

  this.mouseDownWrapper_ = Blockly.bindEvent_(
    this.handle_,
    'mousedown',
    this,
    this.onMouseDown
  );

  this.updateGraph_();
};

Blockly.FieldAngleMinutes.prototype.updateGraph_ = function() {
  if (!this.gauge_) {
    return;
  }
  var angleDegrees =
    (Number(this.getText() * 6) % 360) + Blockly.FieldAngle.OFFSET;
  var angleRadians = toRadians(angleDegrees);
  var path = [
    'M ',
    Blockly.FieldAngle.HALF,
    ',',
    Blockly.FieldAngle.HALF
  ];
  var x2 = Blockly.FieldAngle.HALF;
  var y2 = Blockly.FieldAngle.HALF;
  if (!isNaN(angleRadians)) {
    var angle1 = toRadians(Blockly.FieldAngle.OFFSET);
    var x1 = Math.cos(angle1) * Blockly.FieldAngle.RADIUS;
    var y1 = Math.sin(angle1) * -Blockly.FieldAngle.RADIUS;
    if (Blockly.FieldAngle.CLOCKWISE) {
      angleRadians = 2 * angle1 - angleRadians;
    }
    x2 += Math.cos(angleRadians) * Blockly.FieldAngle.RADIUS;
    y2 -= Math.sin(angleRadians) * Blockly.FieldAngle.RADIUS;
    // Use large arc only if input value is greater than wrap
    var largeFlag =
      Math.abs(angleDegrees - Blockly.FieldAngle.OFFSET) > 180
        ? 1
        : 0;
    var sweepFlag = Number(Blockly.FieldAngle.CLOCKWISE);
    if (angleDegrees < Blockly.FieldAngle.OFFSET) {
      sweepFlag = 1 - sweepFlag; // Sweep opposite direction if less than the offset
    }
    path.push(
      ' l ',
      x1,
      ',',
      y1,
      ' A ',
      Blockly.FieldAngle.RADIUS,
      ',',
      Blockly.FieldAngle.RADIUS,
      ' 0 ',
      largeFlag,
      ' ',
      sweepFlag,
      ' ',
      x2,
      ',',
      y2,
      ' z'
    );

    // Image rotation needs to be set in degrees
    let imageRotation;
    if (Blockly.FieldAngle.CLOCKWISE) {
      imageRotation = angleDegrees + 2 * Blockly.FieldAngle.OFFSET;
    } else {
      imageRotation = -angleDegrees;
    }
    this.arrowSvg_.setAttribute(
      'transform',
      'rotate(' + imageRotation + ')'
    );
  }
  this.gauge_.setAttribute('d', path.join(''));
  this.line_.setAttribute('x2', x2);
  this.line_.setAttribute('y2', y2);
  this.handle_.setAttribute(
    'transform',
    'translate(' + x2 + ',' + y2 + ')'
  );
};

Blockly.FieldAngleMinutes.prototype.onMouseMove = function(e) {
  e.preventDefault();
  var bBox = this.gauge_.ownerSVGElement.getBoundingClientRect();
  var dx = e.clientX - bBox.left - Blockly.FieldAngle.HALF;
  var dy = e.clientY - bBox.top - Blockly.FieldAngle.HALF;
  var angle = Math.atan(-dy / dx);
  if (isNaN(angle)) {
    // This shouldn't happen, but let's not let this error propagate further.
    return;
  }
  angle = toDegrees(angle);
  // 0: East, 90: North, 180: West, 270: South.
  if (dx < 0) {
    angle += 180;
  } else if (dy > 0) {
    angle += 360;
  }
  if (Blockly.FieldAngle.CLOCKWISE) {
    angle = Blockly.FieldAngle.OFFSET + 360 - angle;
  } else {
    angle -= Blockly.FieldAngle.OFFSET;
  }
  angle = angle / 6;
  if (Blockly.FieldAngleMinutes.ROUND) {
    angle =
      Math.round(angle / Blockly.FieldAngleMinutes.ROUND) *
      Blockly.FieldAngleMinutes.ROUND;
  }
  angle = this.callValidator(angle);
  Blockly.FieldTextInput.htmlInput_.value = angle;
  this.setValue(angle);
  this.validate_();
  this.resizeEditor_();
};

Blockly.FieldAngleMinutes.prototype.classValidator = function(text) {
  if (text === null) {
    return null;
  }
  var n = parseFloat(text || 0);
  if (isNaN(n)) {
    return null;
  }
  n = n % 60;
  if (n < 0) {
    n += 60;
  }
  if (n > Blockly.FieldAngleMinutes.WRAP) {
    n -= 60;
  }
  return String(n);
};

/**
 * Construct a FieldAngleMinutes from a JSON arg object.
 * @param {!Object} options A JSON object with options (angle).
 * @returns {!Blockly.FieldAngle} The new field instance.
 * @package
 * @nocollapse
 */
Blockly.FieldAngleMinutes.fromJson = function(options) {
  return new Blockly.FieldAngleMinutes(options['angle']);
};

Blockly.Field.register('field_angle_minutes', Blockly.FieldAngleMinutes);
