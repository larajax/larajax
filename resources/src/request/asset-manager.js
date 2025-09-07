export class AssetManager
{
    static load(collection, callback) {
        return (new AssetManager()).loadCollection(collection, callback);
    }

    loadCollection(collection, callback) {
        var self = this,
            jsList = (collection.js) ? collection.js : [],
            cssList = (collection.css) ? collection.css : [],
            imgList = (collection.img) ? collection.img : [];

        jsList = assGrep(jsList, function(item) {
            return !document.querySelector('head script[src="'+item+'"]');
        })

        cssList = assGrep(cssList, function(item) {
            return !document.querySelector('head link[href="'+item+'"]');
        })

        var cssCounter = 0,
            jsLoaded = false,
            imgLoaded = false;

        if (jsList.length === 0 && cssList.length === 0 && imgList.length === 0) {
            callback && callback();
            return;
        }

        this.loadJavaScript(jsList, function() {
            jsLoaded = true;
            checkLoaded();
        });

        cssList.forEach(function(source) {
            self.loadStyleSheet(source, function() {
                cssCounter++;
                checkLoaded();
            });
        });

        this.loadImage(imgList, function() {
            imgLoaded = true;
            checkLoaded();
        });

        function checkLoaded() {
            if (!imgLoaded) {
                return false
            }

            if (!jsLoaded) {
                return false
            }

            if (cssCounter < cssList.length) {
                return false
            }

            callback && callback();
        }
    }

    // Loads StyleSheet files
    loadStyleSheet(source, callback) {
        var cssElement = document.createElement('link');
        cssElement.setAttribute('rel', 'stylesheet');
        cssElement.setAttribute('type', 'text/css');
        cssElement.setAttribute('href', source);
        cssElement.addEventListener('load', callback, false);

        if (typeof cssElement != 'undefined') {
            document.getElementsByTagName('head')[0].appendChild(cssElement);
        }

        return cssElement;
    }

    // Loads JavaScript files in sequence
    loadJavaScript(sources, callback) {
        if (sources.length <= 0) {
            return callback();
        }

        var self = this,
            source = sources.shift(),
            jsElement = document.createElement('script');

        jsElement.setAttribute('type', 'text/javascript');
        jsElement.setAttribute('src', source);
        jsElement.addEventListener('load', function() {
            self.loadJavaScript(sources, callback);
        }, false);

        if (typeof jsElement != 'undefined') {
            document.getElementsByTagName('head')[0].appendChild(jsElement);
        }
    }

    // Loads Image files
    loadImage(sources, callback) {
        if (sources.length <= 0) {
            return callback();
        }

        var loaded = 0;
        sources.forEach(function(source) {
            var img = new Image()
            img.onload = function() {
                if (++loaded == sources.length && callback) {
                    callback();
                }
            }
            img.src = source;
        });
    }
}

function assGrep(items, callback) {
    var filtered = [],
        len = items.length,
        i = 0;

    for (i; i < len; i++) {
        if (callback(items[i])) {
            filtered.push(items[i]);
        }
    }

    return filtered;
}
