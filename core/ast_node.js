/**
 * @license
 * Visual Blocks Editor
 *
 * Copyright 2019 Google Inc.
 * https://developers.google.com/blockly/
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
 * @fileoverview The class representing an ast node.
 * Used to traverse the blockly ast.
 */
'use strict';

goog.provide('Blockly.ASTNode');

/**
 * Class for an ASTNode.
 * @constructor
 * @param{String} type This is the type of what is being passed in. Either
 * block, field, nextConnection...
 * @param{Blockly.Block}
 * @param{String} The name of the connection or field.
 */
Blockly.ASTNode = function(type, location, params) {

  /*
   * The type of the location.
   * @type String
   * @private
   */
  this.type_ = type;

  /*
   * @private
   */
  this.location_ = location;

  // this.processParams(params);

};

/**
 * Object holding different types for a cursor.
 */
Blockly.ASTNode.types = {
  FIELD: 'field',
  BLOCK: 'block',
  INPUT: 'input',
  OUTPUT: 'output',
  NEXT: 'next',
  PREVIOUS: 'previous',
  STACK: 'stack',
  WORKSPACE: 'workspace'
};

Blockly.ASTNode.wsMove = 10;

// Blockly.ASTNode.prototype.processParams = function(params){
//   if (!params) {return;}
//   if (params['position']) {
//     this.position_ = params['position'];
//   }

//   if (params['block']) {
//     this.block_ = params['block'];
//   }

//   if (params['name']) {
//     this.name_ = params['name'];
//   }
// };

/**
 * Gets the current location of the cursor.
 * @return {Blockly.Field|Blockly.Connection|Blockly.Block} The current field,
 * connection, or block the cursor is on.
 */
Blockly.ASTNode.prototype.getLocation = function() {
  return this.location_;
};

/**
 * The type of the current location.
 * @return {String} The type of the location.
 */
Blockly.ASTNode.prototype.getLocationType = function() {
  return this.type_;
};

/**
 * Get the parent input of the current location of the cursor.
 * @return {Blockly.Input} The input that the connection belongs to.
 * @private
 */
Blockly.ASTNode.prototype.findParentInput_ = function() {
  var parentInput = null;
  var location = this.getLocation();

  if (location instanceof Blockly.Field
    || location instanceof Blockly.Connection) {
    parentInput = location.getParentInput();
  }
  return parentInput;
};

/**
 * Get either the next editable field, or the first field for the given input.
 * @param {!Blockly.Field} location The current location of the cursor.
 * @param {!Blockly.Input} parentInput The parentInput of the field.
 * @param {?Boolean} opt_first If true find the first editable field otherwise get
 * the next field.
 * @return {Blockly.Field} The next field or null if no next field exists.
 * @private
 */
Blockly.ASTNode.prototype.findNextEditableField_ = function(location,
    parentInput, opt_first) {
  var fieldRow = parentInput.fieldRow;
  var fieldIdx = fieldRow.indexOf(location);
  var startIdx = opt_first ? 0 : fieldIdx + 1;
  var astNode;
  for (var i = startIdx; i < fieldRow.length; i++) {
    var field = fieldRow[i];
    if (field.isCurrentlyEditable()) {
      astNode = new Blockly.ASTNode(Blockly.ASTNode.types.FIELD, field);
      break;
    }
  }
  return astNode;
};

/**
 * Get either the previous editable field, or get the first field for the given
 * input.
 * @param {!Blockly.Field} location The current location of the cursor.
 * @param {!Blockly.Input} parentInput The parentInput of the field.
 * @param {?Boolean} opt_last If true find the last editable field otherwise get
 * the previous field.
 * @return {Blockly.Field} The previous or last field or null if no next field
 * exists.
 * @private
 */
Blockly.ASTNode.prototype.findPreviousEditableField_ = function(location,
    parentInput, opt_last) {
  var fieldRow = parentInput.fieldRow;
  var fieldIdx = fieldRow.indexOf(location);
  var previousField = null;
  var startIdx = opt_last ? fieldRow.length - 1 : fieldIdx - 1;
  for (var i = startIdx; i >= 0; i--) {
    var field = fieldRow[i];
    if (field.isCurrentlyEditable()) {
      previousField = field;
      break;
    }
  }
  return new Blockly.ASTNode(Blockly.ASTNode.types.FIELD, previousField);
};


/**
 * Get the first field or connection that is either editable or has connection
 * value of not null.
 * @param {!Blockly.Connection} location Current place of cursor.
 * @param {!Blockly.Input} parentInput The parent input of the field or connection.
 * @return {Blockly.Connection|Blockly.Field} The next field or connection.
 * @private
 */
Blockly.ASTNode.prototype.findNextForInput_ = function(location, parentInput){
  var inputs = location.sourceBlock_.inputList;
  var curIdx = inputs.indexOf(parentInput);
  if (curIdx <= -1) {return;}
  var nxtIdx = curIdx + 1;
  var nextLocation = null;

  for (var i = nxtIdx; i < inputs.length; i++) {
    var newInput = inputs[i];
    var field = this.findNextEditableField_(location, newInput, true);
    if (field) {
      nextLocation = new Blockly.ASTNode(Blockly.ASTNode.types.FIELD, field);
      break;
    } else if (newInput.connection) {
      var connection = newInput.connection;
      nextLocation = new Blockly.ASTNode(Blockly.ASTNode.types.INPUT,
          connection);
      break;
    }
  }
  return nextLocation;
};

/**
 * Find the next input or field given a field location.
 * @param {!Blockly.Field} location The current location of the cursor.
 * @param {!Blockly.Input} parentInput The parent input of the field.
 * @return {Blockly.Field|Blockly.Connection} The next location.
 * @private
 */
Blockly.ASTNode.prototype.findNextForField_ = function(location, parentInput) {
  var nextLocation = this.findNextEditableField_(location, parentInput);

  if (!nextLocation) {
    nextLocation = parentInput.connection;
    nextLocation = new Blockly.ASTNode(Blockly.ASTNode.types.INPUT, parentInput.connection);
  }
  return nextLocation;
};


/**
 * Given the current selected field or connection find the previous connection
 * or field.
 * @param {!Blockly.Connection} location The current location of
 * the cursor.
 * @param {!Blockly.Input} parentInput Parent input of the connection or field.
 * @return {Array<Blockly.Field|Blockly.Connection, Blockly.Input>} The first
 * value is the next field or connection and the second value is the parent input.
 * @private
 */
Blockly.ASTNode.prototype.findPrevForInput_ = function(location, parentInput){
  var block = location.sourceBlock_;
  var inputs = block.inputList;
  var curIdx = inputs.indexOf(parentInput);
  var prevLocation = null;

  for (var i = curIdx; i >= 0; i--) {
    var newInput = inputs[i];
    var field = this.findPreviousEditableField_(location, newInput, true);
    if (newInput.connection && newInput.connection !== parentInput.connection) {
      prevLocation = new Blockly.ASTNode(Blockly.ASTNode.types.INPUT, newInput.connection);
      break;
    } else if (field && field !== location) {
      prevLocation = new Blockly.ASTNode(Blockly.ASTNode.types.FIELD, field.getLocation());
      break;
    }
  }
  return prevLocation;
};

/**
 * Find the previous input or field given a field location.
 * @param {!Blockly.Field} location The current location of the cursor.
 * @param {!Blockly.Input} parentInput The parent input of the field.
 * @return {Blockly.Field|Blockly.Connection} The previous location.
 * @private
 */
Blockly.ASTNode.prototype.findPrevForField_ = function(location, parentInput) {
  var block = location.sourceBlock_;
  var inputs = block.inputList;
  var curIdx = inputs.indexOf(parentInput);
  var prevLocation = this.findPreviousEditableField_(location, parentInput);
  var astNode;

  if (!prevLocation && curIdx - 1 >= 0) {
    prevLocation = inputs[curIdx - 1].connection;
    astNode = new Blockly.ASTNode(Blockly.ASTNode.types.INPUT, prevLocation);
  }
  return astNode;
};

/**
 * Walk from the given block back up through the stack of blocks to find the top
 * block. If we are nested in a statement input only find the top most nested
 * block. Do not go all the way to the top of the stack.
 * @param {!Blockly.Block} sourceBlock A block in the stack.
 * @return {Blockly.Block} The top block in a stack
 * @private
 */
Blockly.ASTNode.prototype.findTop_ = function(sourceBlock) {
  var topBlock = sourceBlock;
  var targetConnection = sourceBlock.previousConnection.targetConnection;
  //while the target is not an input and it is connected to another block
  while (targetConnection && !targetConnection.getParentInput() && topBlock
    && topBlock.previousConnection
    && topBlock.previousConnection.targetBlock()) {
    topBlock = topBlock.previousConnection.targetBlock();
    targetConnection = topBlock.previousConnection.targetConnection;
  }
  return topBlock;
};

/**
 * Navigate between stacks of blocks on the workspace.
 * @param {?Boolean} forward True to go forward. False to go backwards.
 * @return {Blockly.BlockSvg} The first block of the next stack.
 * @private
 */
Blockly.ASTNode.prototype.navigateBetweenStacks_ = function(forward) {
  var curLocation = this.getLocation();
  if (!(curLocation instanceof Blockly.Block)) {
    curLocation = curLocation.sourceBlock_;
  }
  if (!curLocation) {
    return null;
  }
  var curRoot = curLocation.getRootBlock();
  var topBlocks = curRoot.workspace.getTopBlocks();
  for (var i = 0; i < topBlocks.length; i++) {
    var topBlock = topBlocks[i];
    if (curRoot.id == topBlock.id) {
      var offset = forward ? 1 : -1;
      var resultIndex = i + offset;
      if (resultIndex == -1) {
        resultIndex = topBlocks.length - 1;
      } else if (resultIndex == topBlocks.length) {
        resultIndex = 0;
      }
      return topBlocks[resultIndex];
    }
  }
  throw Error('Couldn\'t find ' + (forward ? 'next' : 'previous') +
      ' stack?!?!?!');
};

/**
 * Find the first connection on a given block.
 * We are defining first connection as the highest connection point on a given
 * block. Therefore previous connection comes before output connection.
 * @param {!Blockly.Field|Blockly.Block|Blockly.Connection} location The location
 * of the cursor.
 * @return {Blockly.Connection} The first connection.
 * @private
 */
Blockly.ASTNode.prototype.findTopConnection_ = function(location) {
  var previousConnection = location.previousConnection;
  var outputConnection = location.outputConnection;
  return previousConnection ? previousConnection : outputConnection;
};

Blockly.ASTNode.prototype.findTopASTConnection = function(block) {
  var previousConnection = block.previousConnection;
  var outputConnection = block.outputConnection;
  var astNode;
  if (previousConnection) {
    astNode = new Blockly.ASTNode(Blockly.ASTNode.types.PREVIOUS, previousConnection);
  } else if (outputConnection) {
    astNode = new Blockly.ASTNode(Blockly.ASTNode.types.OUTPUT, outputConnection);
  }
  return astNode;
};


/**
 * Given a location in a stack of blocks find the next out connection. If the
 * location is nested the next out location should be the connected input.
 * @param {!Blockly.Block} location The source block for the current location.
 * @return {Blockly.Connection|Blockly.Block} The next out connection or block.
 * @private
 */
Blockly.ASTNode.prototype.findOutLocationForStack_ = function(location) {
  var newLocation;
  var topBlock = this.findTop_(location.sourceBlock_ || location);
  var astNode;
  newLocation = topBlock.previousConnection.targetConnection;
  astNode = new Blockly.ASTNode(Blockly.ASTNode.types.NEXT, newLocation);
  if (!newLocation) {
    newLocation = topBlock.previousConnection;
    astNode = new Blockly.ASTNode(Blockly.ASTNode.types.STACK, newLocation);
  }
  return astNode;
};

/**
 * Find the next connection, field, or block.
 * @return {Blockly.Field|Blockly.Block|Blockly.Connection} The next element.
 */
Blockly.ASTNode.prototype.next = function() {
  if (!location) {return null;}
  var newAstNode = null;

  switch (this.type_) {
    case Blockly.ASTNode.types.WORKSPACE:
      var newX = this.location_.x + Blockly.ASTNode.wsMove;
      var newLocation = new goog.math.Coordinate(newX, this.location_.y);
      newAstNode = new Blockly.ASTNode(Blockly.ASTNode.types.WORKSPACE,
          newLocation);
      break;
    case Blockly.ASTNode.types.STACK:
      var nextTopBlock = this.navigateBetweenStacks_(true);
      newAstNode = this.findTopASTConnection(nextTopBlock);
      newAstNode.type_ = Blockly.ASTNode.types.STACK;
      break;

    case Blockly.ASTNode.types.OUTPUT:
      newAstNode = new Blockly.ASTNode(Blockly.ASTNode.types.BLOCK,
          this.location_.sourceBlock_);
      break;

    case Blockly.ASTNode.types.FIELD:
      var parentInput = this.findParentInput_();
      newAstNode = this.findNextForField_(this.location_, parentInput);
      break;

    case Blockly.ASTNode.types.INPUT:
      var parentInput = this.findParentInput_();
      newAstNode = this.findNextForInput_(this.location_, parentInput);
      break;

    case Blockly.ASTNode.types.BLOCK:
      newAstNode = new Blockly.ASTNode(Blockly.ASTNode.types.NEXT,
          this.location_.nextConnection);
      break;

    case Blockly.ASTNode.types.PREVIOUS:
      var output = this.location_.outputConnection;
      if (output) {
        newAstNode = new Blockly.ASTNode(Blockly.ASTNode.types.OUTPUT,
            output);
      } else {
        newAstNode = new Blockly.ASTNode(Blockly.ASTNode.types.BLOCK,
            this.location_.sourceBlock_);
      }
      break;

    case Blockly.ASTNode.types.NEXT:
      if (this.location_.targetBlock()) {
        newAstNode = this.findTopASTConnection(this.location_.targetBlock());
      }
      break;
  }

  return newAstNode;
};

/**
 * Find the next in connection or field.
 * @return {Blockly.Field|Blockly.Block|Blockly.Connection} The next element.
 */
Blockly.ASTNode.prototype.in = function() {
  if (!this.location_) {return null;}
  var newAstNode = null;

  switch (this.type_) {
    case Blockly.ASTNode.types.WORKSPACE:
      //TODO: How would this work for multiple workspaces?
      var firstBlock = Blockly.getMainWorkspace().getTopBlocks();
      newAstNode = this.findTopASTConnection(firstBlock);
      newAstNode.type_ = Blockly.ASTNode.types.STACK;
      break;
    case Blockly.ASTNode.types.STACK:
      newAstNode = this.findTopASTConnection(this.location_.sourceBlock_);
      break;
    case Blockly.ASTNode.types.BLOCK:
      var inputs = this.location_.inputList;
      if (inputs && inputs.length > 0) {
        var newParentInput = inputs[0];
        var fieldNode =
            this.findNextEditableField_(this.location_, newParentInput, true);
        if (fieldNode) {
          newAstNode = fieldNode;
        } else {
          newAstNode = newParentInput.connection;
        }
      }
      break;
    case Blockly.ASTNode.types.INPUT:
      if (this.location_.targetBlock()) {
        newAstNode = this.findTopASTConnection(this.location_.targetBlock());
      }
      break;
  }

  return newAstNode;
};

/**
 * Find the previous connection, field, or block.
 * @return {Blockly.Field|Blockly.Block|Blockly.Connection} The next element.
 */
Blockly.ASTNode.prototype.prev = function() {
  if (!this.location_) {return null;}
  var newAstNode;

  switch (this.type_) {
    case Blockly.ASTNode.types.WORKSPACE:
      var newX = this.location_.x - Blockly.ASTNode.wsMove;
      var newLocation = new goog.math.Coordinate(newX, this.location_.y);
      newAstNode = new Blockly.ASTNode(Blockly.ASTNode.types.WORKSPACE,
          newLocation);
      break;
    case Blockly.ASTNode.types.STACK:
      var nextTopBlock = this.navigateBetweenStacks_(true);
      newAstNode = this.findTopASTConnection(nextTopBlock);
      newAstNode.type_ = Blockly.ASTNode.types.STACK;
      break;

    case Blockly.ASTNode.types.OUTPUT:
      var sourceBlock = this.location_.sourceBlock_;
      if (sourceBlock && sourceBlock.previousConnection) {
        newAstNode = new Blockly.ASTNode(Blockly.ASTNode.types.PREVIOUS,
            sourceBlock.previousConnection);
      }
      break;

    case Blockly.ASTNode.types.FIELD:
      var parentInput = this.findParentInput_();
      newAstNode = this.findPrevForField_(this.location_, parentInput);
      break;

    case Blockly.ASTNode.types.INPUT:
      var parentInput = this.findParentInput_();
      newAstNode = this.findPrevForInput_(this.location_, parentInput);
      break;

    case Blockly.ASTNode.types.BLOCK:
      var output = this.location_.outputConnection;
      if (output) {
        newAstNode = new Blockly.ASTNode(Blockly.ASTNode.types.OUTPUT,
            output);
      } else {
        newAstNode = new Blockly.ASTNode(Blockly.ASTNode.types.PREVIOUS,
            this.location_.previousConnection);
      }
      break;

    case Blockly.ASTNode.types.PREVIOUS:
      var prevBlock = this.location_.targetBlock();
      if (prevBlock) {
        newAstNode = new Blockly.ASTNode(Blockly.ASTNode.types.NEXT,
            prevBlock.nextConnection);
      }
      break;

    case Blockly.ASTNode.types.NEXT:
      newAstNode = new Blockly.ASTNode(Blockly.ASTNode.types.BLOCK,
          this.location_.sourceBlock_);
      break;
  }

  return newAstNode;
};

/**
 * Find the next out connection, field, or block.
 * @return {Blockly.Field|Blockly.Block|Blockly.Connection} The next element.
 */
Blockly.ASTNode.prototype.out = function() {
  if (!this.location_) {return null;}
  var newAstNode;

  switch (this.type_) {
    case Blockly.ASTNode.types.STACK:
      break;

    case Blockly.ASTNode.types.OUTPUT:
      newAstNode = new Blockly.ASTNode(Blockly.ASTNode.types.INPUT,
          this.location_.targetConnection);
      if (!newAstNode) {
        newAstNode.type_ = Blockly.ASTNode.types.STACK;
      }
      break;

    case Blockly.ASTNode.types.FIELD:
      newAstNode = new Blockly.ASTNode(Blockly.ASTNode.types.BLOCK,
          this.location_.sourceBlock_);
      break;

    case Blockly.ASTNode.types.INPUT:
      newAstNode = new Blockly.ASTNode(Blockly.ASTNode.types.BLOCK,
          this.location_.sourceBlock_);
      break;

    case Blockly.ASTNode.types.BLOCK:
      var outputConnection = this.location_.outputConnection;
      if (outputConnection && outputConnection.targetConnection) {
        newAstNode = new Blockly.ASTNode(Blockly.ASTNode.types.OUTPUT,
            outputConnection.targetConnection);
      } else if (outputConnection) {
        newAstNode = new Blockly.ASTNode(Blockly.ASTNode.types.OUTPUT,
            outputConnection);
      } else {
        //This is the case where we are on a block that is nested inside a
        //statement input and we need to get the input that connects to the
        //top block
        newAstNode = this.findOutLocationForStack_(this.location_);
      }
      break;

    case Blockly.ASTNode.types.PREVIOUS:
      newAstNode = this.findOutLocationForStack_(this.location_.sourceBlock_);
      break;

    case Blockly.ASTNode.types.NEXT:
      newAstNode = this.findOutLocationForStack_(this.location_.sourceBlock_);
      break;
  }

  return newAstNode;
};
