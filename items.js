function createContext(width, height) {
    const texture = document.createElement("canvas");
    texture.width = width;
    texture.height = height;
    const context = texture.getContext("2d");
    return context;
}

const texture1 = createContext(16, 16);
texture1.fillStyle = "#ff0000";
texture1.fillRect(0, 0, 8, 8);

const texture2 = createContext(16, 16);
texture2.fillStyle = "#0000ff";
texture2.fillRect(0, 0, 8, 8);

const proto1 = new ItemPrototype(
    "1",
    {
        stackable: false,
        iconGetter: function() {
            return texture1.canvas;
        },
        modelGetter: function() {
            throw "AAA";
        },
        use: function() {},
    }
);

const p_apple = new ItemPrototype(
    "Apple",
    {
        stackable: true,
        iconGetter: function() {
            return texture2.canvas;
        },
        modelGetter: function() {
            throw "AAA";
        },
        use: function() {
            plat.player.health += 15;
            plat.player.health = Math.min(plat.player.health, plat.player.maxHealth);
            return true;
        },
    }
);