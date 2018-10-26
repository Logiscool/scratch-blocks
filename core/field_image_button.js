/**
 * @license
 * Visual Blocks Editor (for Scoolcode)
 *
 * Copyright 2018 Logiscool Kft.
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
 * @fileoverview Image Button field.  Used for clickable icons.
 * @author ajuhos@logiscool.com (Adam Juhos)
 */
'use strict';

goog.provide('Blockly.FieldImageButton');

goog.require('Blockly.FieldImage');
goog.require('goog.math.Size');

/**
 * Class for a clickable image on a block.
 * @param {string} src The URL of the image.
 * @param {number} width Width of the image.
 * @param {number} height Height of the image.
 * @param {string=} opt_alt Optional alt text for when block is collapsed.
 * @param {boolean} flip_rtl Whether to flip the icon in RTL
 * @extends {Blockly.Field}
 * @constructor
 */
Blockly.FieldImageButton = function(src, width, height, opt_alt, flip_rtl, opt_onClick) {
  this.sourceBlock_ = null;

  // Ensure height and width are numbers.  Strings are bad at math.
  this.height_ = Number(height);
  this.width_ = Number(width);
  this.size_ = new goog.math.Size(this.width_, this.height_);
  this.text_ = opt_alt || '';
  this.flipRTL_ = flip_rtl;
  this.setValue(src);

  if (typeof opt_onClick == 'function') {
    this.clickHandler_ = opt_onClick;
  }
};
goog.inherits(Blockly.FieldImageButton, Blockly.FieldImage);

/**
 * Construct a FieldImageButton from a JSON arg object,
 * dereferencing any string table references.
 * @param {!Object} options A JSON object with options (src, width, height, alt,
 *     and flipRtl/flip_rtl).
 * @returns {!Blockly.FieldImage} The new field instance.
 * @package
 * @nocollapse
 */
Blockly.FieldImageButton.fromJson = function(options) {
  var src = Blockly.utils.replaceMessageReferences(options['src']);
  var width = Number(Blockly.utils.replaceMessageReferences(options['width']));
  var height =
      Number(Blockly.utils.replaceMessageReferences(options['height']));
  var alt = Blockly.utils.replaceMessageReferences(options['alt']);
  var flip_rtl = !!options['flip_rtl'] || !!options['flipRtl'];
  return new Blockly.FieldImageButton(src, width, height, alt, flip_rtl);
};

/**
 * Editable fields are saved by the XML renderer, non-editable fields are not.
 */
Blockly.FieldImageButton.prototype.EDITABLE = false;

/**
 * Install this image on a block.
 */
Blockly.FieldImageButton.prototype.init = function() {
  if (this.fieldGroup_) {
    // Image has already been initialized once.
    return;
  }
  // Build the DOM.
  /** @type {SVGElement} */
  this.fieldGroup_ = Blockly.utils.createSvgElement('g', {}, null);
  if (!this.visible_) {
    this.fieldGroup_.style.display = 'none';
  }
  /** @type {SVGElement} */
  this.imageElement_ = Blockly.utils.createSvgElement(
      'image',
      {
        'height': this.height_ + 'px',
        'width': this.width_ + 'px',
        'class': 'scratchImageButton'
      },
      this.fieldGroup_);

  this.setValue(this.src_);
  this.sourceBlock_.getSvgRoot().appendChild(this.fieldGroup_);

  // Configure the field to be transparent with respect to tooltips.
  this.setTooltip(this.sourceBlock_);
  Blockly.Tooltip.bindMouseEvents(this.imageElement_);

  this.maybeAddClickHandler_();
};

Blockly.Field.register('field_image_button', Blockly.FieldImageButton);
