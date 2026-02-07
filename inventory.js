/**
 * A lot of the inventory code was borrowed from xyzyyxx's other project,
 * mainly because he did not want to write it again.
 * https://www.khanacademy.org/cs/i/5482258067734528
 * Stacking items is new though.
 */

// TODO: put comments on functions everywhere
// TODO: make models work

const { Inventory, ItemInstance, ItemPrototype } = (function() {
  const STACK_LIMIT = 64;
  const NUM_COLS = 9;
  const NUM_ROWS = 4; // hotbar + inventory
  const SLOT_SIZE = 50;
  const RAISE = 10;
  const IMG_PADDING = 5;
  const PADDING = 20;

  class ItemPrototype {
    /** Item prototype, basically a type of item (eg golden apple, dagger, etc)
     * attributes: object containing info about the item
     * useful attributes:
     ** stackable: Boolean, tells whether the item can be stacked (up to STACK_LIMIT)
     ** iconGetter: function, gets the texture in the hotbar
     ** modelGetter: function, gets the model used in the player's hand
     ** use: when clicked with item, what does it do? also returns boolean, telling if the item is consumed
     * 
     * @constructor
     * @param {String} name 
     * @param {Object} attributes 
     */
    constructor(name, attributes) {
      this.name = name;
      this.attributes = attributes;
    }
  }
  class ItemInstance {
    constructor(prototype) {
      this.proto = prototype;
      this.name = prototype.name;
      this.attributes = prototype.attributes;
    }

    get icon() {
      return this.attributes.iconGetter.call(this);
    }

    get model() {
      return this.attributes.modelGetter.call(this);
    }

    use() {
      return this.attributes.use.call(this);
    }
  }

  class Slot {
    constructor(x1, y1, x2, y2) {
      this.x1 = x1;
      this.y1 = y1;
      this.x2 = x2;
      this.y2 = y2;
      this.content = null;
      this.amount = 0;
    }
    
    isHovered() {
      return mouseX > this.x1 &&
        mouseY > this.y1 &&
        mouseX < this.x2 &&
        mouseY < this.y2;
    }
  }

  /** Inventory, contains all items.
   * 
   * @class Inventory
   * @typedef {Inventory}
   */
  class Inventory {
    /** Constructor
     * 
     * @constructor
     */
    constructor() {
      this.selected = 0;
      this.slots = [[]];
      this.opened = false;
      this.itemDraggedContent = null;
      this.itemDraggedAmount = 0;

      // Initial x, y to begin drawing hotbar and inventory
      const ix = (overlay.width - NUM_COLS * SLOT_SIZE) / 2;
      const iyHotbar = overlay.height - RAISE - SLOT_SIZE;
      const iyInventory = (overlay.height - (NUM_ROWS - 1) * SLOT_SIZE) / 2;
      
      // Hotbar
      for (let column = 0; column < NUM_COLS; column ++) {
        const rectX = ix + SLOT_SIZE * column;
        const rectY = iyHotbar;
        this.slots[0].push(new Slot(
          rectX, rectY,
          rectX + SLOT_SIZE, rectY + SLOT_SIZE
        ));
      }

      // Inventory
      for (let row = 1; row < NUM_ROWS; row ++) {
        this.slots.push([]);
        for (let column = 0; column < NUM_COLS; column ++) {
          const rectX = ix + SLOT_SIZE * column
          // row - 1 because row starts at 1
          const rectY = iyInventory + SLOT_SIZE * (row - 1);
          this.slots[row].push(new Slot(
            rectX, rectY,
            rectX + SLOT_SIZE, rectY + SLOT_SIZE
          ));
        }
      }

      this.ix = ix;
      this.iyHotbar = iyHotbar;
      this.iyInventory = iyInventory;
    }

    // Get hovered slot
    getHoveredSlot() {
      // Go through all slots
      for (const rowI in this.slots) {
        for (const columnI in this.slots[rowI]) {
          const slot = this.slots[rowI][columnI];
          // If hovered, return
          if (slot.isHovered()) {
            return slot;
          }
        }
      }
      // Else return nothing
      return null;
    }
    
    // Display item
    displayItem(icon, amount, x, y) {
      ctx2D.drawImage(
        icon,
        x + IMG_PADDING, y + IMG_PADDING,
        SLOT_SIZE - 2 * IMG_PADDING, SLOT_SIZE - 2 * IMG_PADDING
      );
      if (amount != 1) {
        ctx2D.fillStyle = "#ffffff";
        ctx2D.textAlign = "center";
        ctx2D.textBaseline = "middle";
        ctx2D.font = "20px Arial";
        ctx2D.fillText(amount, x + SLOT_SIZE - IMG_PADDING * 2, y + SLOT_SIZE - IMG_PADDING * 2);
      }
    }

    // Display and update
    dispUpd() {
      // Initial formatting
      ctx2D.strokeStyle = "#acacac";
      ctx2D.lineWidth = 4;
      ctx2D.fillStyle = "#0000007f";
      ctx2D.imageSmoothingEnabled = false;
      // Draw hotbar
      for (const slot of this.slots[0]) {
        ctx2D.beginPath();
        ctx2D.rect(slot.x1, slot.y1, SLOT_SIZE, SLOT_SIZE);
        ctx2D.fill();
        ctx2D.stroke();
      }
      
      // Select the selected item
      ctx2D.strokeStyle = "#e1e1e1";
      ctx2D.lineWidth = 6;
      const seldSlot = this.slots[0][this.selected];
      ctx2D.beginPath();
      ctx2D.rect(seldSlot.x1, seldSlot.y1, SLOT_SIZE, SLOT_SIZE);
      ctx2D.stroke();
      
      for (const slot of this.slots[0]) {
        // If there is an item
        if (slot.content) {
          this.displayItem(slot.content.icon, slot.amount, slot.x1, slot.y1);
        }
      }

      // Draw rest of inventory (if opened)
      // Also move stuff around if opened
      if (this.opened) {
        // Initial x, y to draw inventory
        const ix = this.ix;
        const iyInventory = this.iyInventory;
        // Draw background thing
        const txtSz = 20;
        ctx2D.fillStyle = "#e1e1e1";
        ctx2D.strokeStyle = "#acacac";
        ctx2D.lineWidth = 4;
        ctx2D.beginPath();
        ctx2D.roundRect(
          ix - PADDING,
          iyInventory - 2 * PADDING - txtSz,
          NUM_COLS * SLOT_SIZE + PADDING * 2,
          (NUM_ROWS - 1) * SLOT_SIZE + 3 * PADDING + txtSz,
          PADDING
        );
        ctx2D.fill();
        ctx2D.stroke();
        ctx2D.font = `${txtSz}px Arial`;
        ctx2D.textAlign = "left";
        ctx2D.textBaseline = "alphabetic";
        ctx2D.fillStyle = "#000000";
        ctx2D.fillText("Inventory", ix, iyInventory - PADDING);
        
        // Draw inventory
        for (let rowI = 1; rowI < NUM_ROWS; rowI ++) {
          for (const slot of this.slots[rowI]) {
            ctx2D.fillStyle = "#7f7f7f";
            ctx2D.beginPath();
            ctx2D.rect(
              slot.x1, slot.y1,
              SLOT_SIZE, SLOT_SIZE
            );
            ctx2D.fill();
            ctx2D.stroke();
            // If there is an item
            if (slot.content) {
              // Display it
              this.displayItem(slot.content.icon, slot.amount, slot.x1, slot.y1);
            }
          }
        }
        
        // Display item if being dragged
        if (this.itemDraggedContent) {
          this.displayItem(
            this.itemDraggedContent.icon, this.itemDraggedAmount,
            mouseX - SLOT_SIZE / 2 + IMG_PADDING, mouseY - SLOT_SIZE / 2 + IMG_PADDING
          );
        }
        
        // Get hovered slot
        const hoveredSlot = this.getHoveredSlot();
        
        if (hoveredSlot) {
          // Left click
          if (events.MouseLeft && !eventsPrev.MouseLeft) {
            const {content, amount} = hoveredSlot;
            // If the item is stackable and they are the same type
            if (content?.proto == this.itemDraggedContent?.proto && content?.attributes?.stackable) {
              // Stack 'em onto each other (until the stack limit)
              const sumAmount = hoveredSlot.amount + this.itemDraggedAmount;
              if (sumAmount > STACK_LIMIT) {
                hoveredSlot.amount = STACK_LIMIT;
                this.itemDraggedAmount = sumAmount - STACK_LIMIT;
              } else {
                hoveredSlot.amount = sumAmount;
                this.itemDraggedContent = null;
                this.itemDraggedAmount = 0;
              }
            } else {
              // Otherwise just swap them
              hoveredSlot.content = this.itemDraggedContent;
              hoveredSlot.amount = this.itemDraggedAmount;
              this.itemDraggedContent = content;
              this.itemDraggedAmount = amount;
            }
          }
          // Right click
          if (events.MouseRight && !eventsPrev.MouseRight) {
            const {content, amount} = hoveredSlot;
            // If the items are stackable, drop them in
            if ((content?.proto == this.itemDraggedContent?.proto && content?.attributes?.stackable) || content == null) {
              if (hoveredSlot.amount < STACK_LIMIT) {
                hoveredSlot.amount ++;
                hoveredSlot.content = this.itemDraggedContent;
                this.itemDraggedAmount --;
                if (this.itemDraggedAmount == 0) {
                  this.itemDraggedContent = null;
                }
              }
            } else {
              // Just swap them otherwise
              hoveredSlot.content = this.itemDraggedContent;
              hoveredSlot.amount = this.itemDraggedAmount;
              this.itemDraggedContent = content;
              this.itemDraggedAmount = amount;
            }
          }
        }
      }
    }

    // Toggle opened
    toggleOpened() {
      this.opened = !this.opened;
      togglePointer();
    }
  }

  return { Inventory, ItemInstance, ItemPrototype };
})()