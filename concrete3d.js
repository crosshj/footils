(function() {
    var Concrete = {},
        idCounter = 0;
  
    Concrete.pixelRatio = (function() {
      // client browsers
      if (window && window.navigator && window.navigator.userAgent && !/PhantomJS/.test(window.navigator.userAgent)) {
        return 2;
      }
      // headless browsers
      else {
        return 1;
      }
    })();
  
    Concrete.viewports = [];
  
    ////////////////////////////////////////////////////////////// VIEWPORT //////////////////////////////////////////////////////////////
    
    /**
     * Concrete Viewport constructor
     * @param {Object} config
     * @param {Integer} config.width - viewport width in pixels
     * @param {Integer} config.height - viewport height in pixels
     */
    Concrete.Viewport = function(config) {
      if (!config) {
        config = {};
      }
  
      this.container = config.container;
      this.layers = []; 
      this.id = idCounter++;
      this.scene = new Concrete.Scene();
    
      this.setSize(config.width || 0, config.height || 0);
      
  
      // clear container
      config.container.innerHTML = '';
      config.container.appendChild(this.scene.canvas);
  
      Concrete.viewports.push(this);
    };
  
    Concrete.Viewport.prototype = {
      /**
       * add layer
       * @param {Concrete.Layer} layer
       * @returns {Concrete.Viewport}
       */
      add: function(layer) {
        this.layers.push(layer);
        layer.setSize(layer.width || this.width, layer.height || this.height);
        layer.viewport = this;
        return this;
      },
      /**
       * set viewport size
       * @param {Integer} width - viewport width in pixels
       * @param {Integer} height - viewport height in pixels
       * @returns {Concrete.Viewport}
       */
      setSize: function(width, height) {
        this.width = width;
        this.height = height;
        this.scene.setSize(width, height);
        return this;
      },
      /**
       * get key associated to coordinate.  This can be used for mouse interactivity.
       * @param {Number} x
       * @param {Number} y
       * @returns {String|null} key
       */
      getIntersection: function(x, y) {
        var layers = this.layers,
            len = layers.length,
            n, layer, key;
  
        for (n=len-1; n>=0; n--) {
          layer = layers[n];
          key = layer.hit.getIntersection(x, y);
          if (key !== null) {
            return key;
          }
        }
  
        return null;
      },
      /** 
       * get viewport index from all Concrete viewports
       * @returns {Integer}
       */
      getIndex: function() {
        var viewports = Concrete.viewports,
            len = viewports.length,
            n = 0,
            viewport;
  
        for (n=0; n<len; n++) {
          viewport = viewports[n];
          if (this.id === viewport.id) {
            return n;
          }
        }
  
        return null;
      },
      /**
       * destroy viewport
       */
      destroy: function() {
        // destroy layers
        this.layers.forEach(function(layer) {
          layer.destroy();
        });
  
        // clear dom
        this.container.innerHTML = '';
        
        // remove self from viewports array
        Concrete.viewports.splice(this.getIndex(), 1);
      },
      /**
       * composite all layers onto visible canvas
       */
      render: function() {
        var scene = this.scene;
  
        scene.clear();
  
        this.layers.forEach(function(layer) {
          if (layer.visible) {
            scene.context.globalCompositeOperation = layer.blendMode || 'normal';
            scene.context.drawImage(layer.scene.canvas, 0, 0, layer.width, layer.height);
          }
        });
      }
    };
  
    ////////////////////////////////////////////////////////////// LAYER //////////////////////////////////////////////////////////////
  
    /**
     * Concrete Layer constructor
     * @param {Object} config
     * @param {Integer} [config.x]
     * @param {Integer} [config.y]
     * @param {Integer} [config.width] - viewport width in pixels
     * @param {Integer} [config.height] - viewport height in pixels
     */
    Concrete.Layer = function(config) {
      if (!config) {
        config = {};
      }
      const type = config.type;
      const blendMode = config.blendMode;

      this.x = 0;
      this.y = 0;
      this.width = 0;
      this.height = 0;
      this.visible = true;
      this.id = idCounter++;
      this.hit = new Concrete.Hit();
      this.scene = new Concrete.Scene({ type, blendMode });
  
      if (config.x && config.y) {
        this.setPosition(config.x, config.y);
      }
      if (config.width && config.height) {
        this.setSize(config.width, config.height);
      }
    };
  
    Concrete.Layer.prototype = {
      /**
       * set layer position
       * @param {Number} x
       * @param {Number} y
       * @returns {Concrete.Layer}
       */
      setPosition: function(x, y) {
        this.x = x;
        this.y = y;
        return this;
      },
      /**
       * set layer size
       * @param {Number} width
       * @param {Number} height
       * @returns {Concrete.Layer}
       */
      setSize: function(width, height) {
        this.width = width;
        this.height = height;
        this.scene.setSize(width, height);
        this.hit.setSize(width, height);
        return this;
      },
      /** 
       * move up
       * @returns {Concrete.Layer}
       */
      moveUp: function() {
        var index = this.getIndex(),
            viewport = this.viewport,
            layers = viewport.layers;
  
        if (index < layers.length - 1) {
          // swap
          layers[index] = layers[index+1];
          layers[index+1] = this;
        }
  
        return this;
      },
      /** 
       * move down
       * @returns {Concrete.Layer}
       */
      moveDown: function() {
        var index = this.getIndex(),
            viewport = this.viewport,
            layers = viewport.layers;
  
        if (index > 0) {
          // swap
          layers[index] = layers[index-1];
          layers[index-1] = this;
        }
  
        return this;
      },
      /** 
       * move to top
       * @returns {Concrete.Layer}
       */
      moveToTop: function() {
        var index = this.getIndex(),
            viewport = this.viewport,
            layers = viewport.layers;
  
        layers.splice(index, 1);
        layers.push(this);
      },
      /** 
       * move to bottom
       * @returns {Concrete.Layer}
       */
      moveToBottom: function() {
        var index = this.getIndex(),
            viewport = this.viewport,
            layers = viewport.layers;
  
        layers.splice(index, 1);
        layers.unshift(this);
  
        return this;
      },
      /** 
       * get layer index from viewport layers
       * @returns {Number|null}
       */
      getIndex: function() {
        var layers = this.viewport.layers,
            len = layers.length,
            n = 0,
            layer;
  
        for (n=0; n<len; n++) {
          layer = layers[n];
          if (this.id === layer.id) {
            return n;
          }
        }
  
        return null;
      },
      /**
       * destroy
       */
      destroy: function() {
        // remove self from layers array
        this.viewport.layers.splice(this.getIndex(), 1);
      }
    };
  
    ////////////////////////////////////////////////////////////// SCENE //////////////////////////////////////////////////////////////
    
    /**
     * Concrete Scene constructor
     * @param {Object} config
     * @param {Integer} [config.width] - canvas width in pixels
     * @param {Integer} [config.height] - canvas height in pixels
     * @param {Number} [config.pixelRatio] - typically 1 or 2
     */
    Concrete.Scene = function(config) {
      if (!config) {
        config = {};
      }
  
      this.width = 0;
      this.height = 0;
      this.pixelRatio = config.pixelRatio || Concrete.pixelRatio;
  
      this.id = idCounter++;
      this.canvas = document.createElement('canvas');
      this.canvas.className = 'concrete-scene-canvas';
      this.canvas.style.display = 'inline-block';

      var contextOptions = {};
      if(config.type && config.type === 'webgl'){
        contextOptions.premultipliedAlpha = true;
      }
      this.context = this.canvas.getContext(config.type || '2d', contextOptions);
  
      if (config.width && config.height) {
        this.setSize(config.width, config.height);
      }
    };
  
    Concrete.Scene.prototype = {
      /**
       * set scene size
       * @param {Number} width
       * @param {Number} height
       * @returns {Concrete.Scene}
       */
      setSize: function(width, height) {
        this.width = width;
        this.height = height;
  
        this.id = idCounter++;
        this.canvas.width = width * this.pixelRatio;
        this.canvas.style.width = width + 'px';
        this.canvas.height = height * this.pixelRatio;
        this.canvas.style.height = height + 'px'; 
  
        if (this.pixelRatio !== 1 && this.context.scale) {
          this.context.scale(this.pixelRatio, this.pixelRatio);
        }
  
        return this;
      },
      /** 
       * clear scene
       * @returns {Concrete.Scene}
       */
      clear: function() {
        this.context.clearRect(0, 0, this.width * this.pixelRatio, this.height * this.pixelRatio);
        return this;
      },
      /** 
       * convert scene into an image
       * @param {Function} callback
       */
      toImage: function(callback) {
        var that = this,
            imageObj = new Image(),
            dataURL = this.canvas.toDataURL('image/png');
  
        imageObj.onload = function() {
          imageObj.width = that.width;
          imageObj.height = that.height;
          callback(imageObj);
        };
        imageObj.src = dataURL;
      },
      /** 
       * download scene as an image
       * @param {Object} config
       * @param {String} config.fileName
       */
      download: function(config) {
        this.canvas.toBlob(function(blob) {
          var anchor = document.createElement('a'),
              dataUrl  = URL.createObjectURL(blob),
              fileName = config.fileName || 'canvas.png';
  
          // set a attributes
          anchor.setAttribute('href', dataUrl);
          anchor.setAttribute('target', '_blank');
          anchor.setAttribute('download', fileName);
  
          // simulate click
          if (document.createEvent) {
            evtObj = document.createEvent('MouseEvents');
            evtObj.initEvent('click', true, true);
            anchor.dispatchEvent(evtObj);
          }
          else if (anchor.click) {
            anchor.click();
          }
        });
      }
    };
  
    ////////////////////////////////////////////////////////////// HIT //////////////////////////////////////////////////////////////
    
    /**
     * Concrete Hit constructor
     * @param {Object} config
     * @param {Integer} [config.width] - canvas width in pixels
     * @param {Integer} [config.height] - canvas height in pixels
     * @param {Number} [config.pixelRatio] - typically 1 or 2
     */
    Concrete.Hit = function(config) {
      if (!config) {
        config = {};
      }
  
      this.width = 0;
      this.height = 0;
  
      this.canvas = document.createElement('canvas');
      this.canvas.className = 'concrete-hit-canvas';
      this.canvas.style.display = 'none';
      this.canvas.style.position = 'relative';
      this.context = this.canvas.getContext('2d');
  
      this.hitColorIndex = 0;
      this.keyToColor = {};
      this.colorToKey = {};
  
      if (config.width && config.height) {
        this.setSize(config.width, config.height);
      }
    };
  
    Concrete.Hit.prototype = {
      /**
       * set hit size
       * @param {Number} width
       * @param {Number} height
       * @returns {Concrete.Hit}
       */
      setSize: function(width, height) {
        this.width = width;
        this.height = height;
        this.canvas.width = width;
        this.canvas.style.width = width + 'px';
        this.canvas.height = height;
        this.canvas.style.height = height + 'px';
        return this;
      },
      /** 
       * clear hit
       * @returns {Concrete.Hit}
       */
      clear: function() {
        this.context.clearRect(0, 0, this.width, this.height);
        return this;
      },
      /**
       * get key associated to coordinate.  This can be used for mouse interactivity.
       * @param {Number} x
       * @param {Number} y
       * @returns {String|null} key
       */
      getIntersection: function(x, y) {
        var data, red, blue, green, alpha, colorIndex, key;
  
        data = this.context.getImageData(Math.round(x), Math.round(y), 1, 1).data;
        red = data[0]; 
        green = data[1]; 
        blue = data[2]; 
        alpha = data[3];
  
        colorIndex = this.rgbToInt(red, green, blue);
        key = this.colorToKey[colorIndex];
  
        return key !== undefined  && alpha === 255 ? key : null;
      },
      /**
       * register key for hit detection
       * @returns {Concrete.Hit)
       */
      registerKey: function(key) {
        var color;
       
        if (!this.keyToColor[key]) {
          color = this.hitColorIndex++;
          this.colorToKey[color] = key;
          this.keyToColor[key] = color;
        }
  
        return this;
      },
      /**
       * convert rgb components into integer 
       * @returns {Integer}
       */
      rgbToInt: function(r, g, b) {
        return (r << 16) + (g << 8) + b;
      },
      /** 
       * get color integer from key.  This is needed in order to draw things onto the hit canvas 
       * for hit detection
       * @param {String} key
       * @returns {Integer}
       */
      getColorFromKey: function(key) {
        var color;
  
        this.registerKey(key);
  
        color = this.keyToColor[key].toString(16);
        // pad with zeros
        while (color.length < 6) {
          color = '0' + color;
        }
        return '#' + color;
      }
    };
  
    // export
    window.Concrete = Concrete;
  })();