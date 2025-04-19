/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/core/controller.js":
/*!********************************!*\
  !*** ./src/core/controller.js ***!
  \********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Controller": () => (/* binding */ Controller)
/* harmony export */ });
/* harmony import */ var _util_events__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../util/events */ "./src/util/events.js");
/* harmony import */ var _request_builder__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./request-builder */ "./src/core/request-builder.js");
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }



var Controller = /*#__PURE__*/function () {
  function Controller() {
    _classCallCheck(this, Controller);

    this.started = false;
    this.documentVisible = true;
  }

  _createClass(Controller, [{
    key: "start",
    value: function start() {
      var _this = this;

      if (!this.started) {
        // Track unload event for request lib
        window.onbeforeunload = this.documentOnBeforeUnload; // First page load

        addEventListener('DOMContentLoaded', function () {
          return _this.render();
        }); // Again, after new scripts load

        addEventListener('page:updated', function () {
          return _this.render();
        }); // Again after AJAX request

        addEventListener('ajax:update-complete', function () {
          return _this.render();
        }); // Watching document visibility

        addEventListener('visibilitychange', function () {
          return _this.documentOnVisibilityChange();
        }); // Submit form

        _util_events__WEBPACK_IMPORTED_MODULE_0__.Events.on(document, 'submit', '[data-request]', this.documentOnSubmit); // Track input

        _util_events__WEBPACK_IMPORTED_MODULE_0__.Events.on(document, 'input', 'input[data-request][data-track-input]', this.documentOnKeyup); // Change select, checkbox, radio, file input

        _util_events__WEBPACK_IMPORTED_MODULE_0__.Events.on(document, 'change', 'select[data-request], input[type=radio][data-request], input[type=checkbox][data-request], input[type=file][data-request]', this.documentOnChange); // Press enter on orphan input

        _util_events__WEBPACK_IMPORTED_MODULE_0__.Events.on(document, 'keydown', 'input[type=text][data-request], input[type=submit][data-request], input[type=password][data-request]', this.documentOnKeydown); // Click submit button or link

        _util_events__WEBPACK_IMPORTED_MODULE_0__.Events.on(document, 'click', 'a[data-request], button[data-request], input[type=button][data-request], input[type=submit][data-request]', this.documentOnClick);
        this.started = true;
      }
    }
  }, {
    key: "stop",
    value: function stop() {
      if (this.started) {
        this.started = false;
      }
    }
  }, {
    key: "render",
    value: function render(event) {
      // Pre render event, used to move nodes around
      _util_events__WEBPACK_IMPORTED_MODULE_0__.Events.dispatch('before-render'); // Render event, used to initialize controls

      _util_events__WEBPACK_IMPORTED_MODULE_0__.Events.dispatch('render'); // Resize event to adjust all measurements

      dispatchEvent(new Event('resize'));
      this.documentOnRender(event);
    }
  }, {
    key: "documentOnVisibilityChange",
    value: function documentOnVisibilityChange(event) {
      this.documentVisible = !document.hidden;

      if (this.documentVisible) {
        this.documentOnRender();
      }
    }
  }, {
    key: "documentOnRender",
    value: function documentOnRender(event) {
      if (!this.documentVisible) {
        return;
      }

      document.querySelectorAll('[data-auto-submit]').forEach(function (el) {
        var interval = el.dataset.autoSubmit || 0;
        el.removeAttribute('data-auto-submit');
        setTimeout(function () {
          _request_builder__WEBPACK_IMPORTED_MODULE_1__.RequestBuilder.fromElement(el);
        }, interval);
      });
    }
  }, {
    key: "documentOnSubmit",
    value: function documentOnSubmit(event) {
      event.preventDefault();
      _request_builder__WEBPACK_IMPORTED_MODULE_1__.RequestBuilder.fromElement(event.target);
    }
  }, {
    key: "documentOnClick",
    value: function documentOnClick(event) {
      event.preventDefault();
      _request_builder__WEBPACK_IMPORTED_MODULE_1__.RequestBuilder.fromElement(event.target);
    }
  }, {
    key: "documentOnChange",
    value: function documentOnChange(event) {
      _request_builder__WEBPACK_IMPORTED_MODULE_1__.RequestBuilder.fromElement(event.target);
    }
  }, {
    key: "documentOnKeyup",
    value: function documentOnKeyup(event) {
      var el = event.target,
          lastValue = el.dataset.ocLastValue;

      if (['email', 'number', 'password', 'search', 'text'].indexOf(el.type) === -1) {
        return;
      }

      if (lastValue !== undefined && lastValue == el.value) {
        return;
      }

      el.dataset.ocLastValue = el.value;

      if (this.dataTrackInputTimer !== undefined) {
        clearTimeout(this.dataTrackInputTimer);
      }

      var interval = el.getAttribute('data-track-input');

      if (!interval) {
        interval = 300;
      }

      var self = this;
      this.dataTrackInputTimer = setTimeout(function () {
        if (self.lastDataTrackInputRequest) {
          self.lastDataTrackInputRequest.abort();
        }

        self.lastDataTrackInputRequest = _request_builder__WEBPACK_IMPORTED_MODULE_1__.RequestBuilder.fromElement(el);
      }, interval);
    }
  }, {
    key: "documentOnKeydown",
    value: function documentOnKeydown(event) {
      if (event.key === 'Enter') {
        event.preventDefault();

        if (this.dataTrackInputTimer !== undefined) {
          clearTimeout(this.dataTrackInputTimer);
        }

        _request_builder__WEBPACK_IMPORTED_MODULE_1__.RequestBuilder.fromElement(event.target);
      }
    }
  }, {
    key: "documentOnBeforeUnload",
    value: function documentOnBeforeUnload(event) {
      window.ocUnloading = true;
    }
  }]);

  return Controller;
}();

/***/ }),

/***/ "./src/core/index.js":
/*!***************************!*\
  !*** ./src/core/index.js ***!
  \***************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _util_events__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../util/events */ "./src/util/events.js");
/* harmony import */ var _util_wait__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../util/wait */ "./src/util/wait.js");
/* harmony import */ var _namespace__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./namespace */ "./src/core/namespace.js");
function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }




/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (_namespace__WEBPACK_IMPORTED_MODULE_2__["default"]);

if (!window.oc) {
  window.oc = {};
}

if (!window.oc.AjaxFramework) {
  // Namespace
  window.oc.AjaxFramework = _namespace__WEBPACK_IMPORTED_MODULE_2__["default"]; // Request on element with builder

  window.oc.request = _namespace__WEBPACK_IMPORTED_MODULE_2__["default"].requestElement; // JSON parser

  window.oc.parseJSON = _namespace__WEBPACK_IMPORTED_MODULE_2__["default"].parseJSON; // Form serializer

  window.oc.serializeJSON = _namespace__WEBPACK_IMPORTED_MODULE_2__["default"].serializeJSON; // Selector events

  window.oc.Events = _util_events__WEBPACK_IMPORTED_MODULE_0__.Events; // Wait for a variable to exist

  window.oc.waitFor = _util_wait__WEBPACK_IMPORTED_MODULE_1__.waitFor; // Fallback for turbo

  window.oc.pageReady = _util_wait__WEBPACK_IMPORTED_MODULE_1__.domReady; // Fallback for turbo

  window.oc.visit = function (url) {
    return window.location.assign(url);
  }; // Boot controller


  if (!isAMD() && !isCommonJS()) {
    _namespace__WEBPACK_IMPORTED_MODULE_2__["default"].start();
  }
}

function isAMD() {
  return typeof define == "function" && __webpack_require__.amdO;
}

function isCommonJS() {
  return (typeof exports === "undefined" ? "undefined" : _typeof(exports)) == "object" && "object" != "undefined";
}

/***/ }),

/***/ "./src/core/migrate.js":
/*!*****************************!*\
  !*** ./src/core/migrate.js ***!
  \*****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Migrate": () => (/* binding */ Migrate)
/* harmony export */ });
/* harmony import */ var _core_request_builder__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../core/request-builder */ "./src/core/request-builder.js");
/* harmony import */ var _util_json_parser__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../util/json-parser */ "./src/util/json-parser.js");
function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }



var Migrate = /*#__PURE__*/function () {
  function Migrate() {
    _classCallCheck(this, Migrate);
  }

  _createClass(Migrate, [{
    key: "bind",
    value: function bind() {
      this.bindRequestFunc();
      this.bindRenderFunc();
      this.bindjQueryEvents();
    }
  }, {
    key: "bindRequestFunc",
    value: function bindRequestFunc() {
      var old = $.fn.request;

      $.fn.request = function (handler, option) {
        var options = _typeof(option) === 'object' ? option : {};
        return new _core_request_builder__WEBPACK_IMPORTED_MODULE_0__.RequestBuilder(this.get(0), handler, options);
      };

      $.fn.request.Constructor = _core_request_builder__WEBPACK_IMPORTED_MODULE_0__.RequestBuilder; // Basic function

      $.request = function (handler, option) {
        return $(document).request(handler, option);
      }; // No conflict


      $.fn.request.noConflict = function () {
        $.fn.request = old;
        return this;
      };
    }
  }, {
    key: "bindRenderFunc",
    value: function bindRenderFunc() {
      $.fn.render = function (callback) {
        $(document).on('render', callback);
      };
    }
  }, {
    key: "bindjQueryEvents",
    value: function bindjQueryEvents() {
      // Element
      this.migratejQueryEvent(document, 'ajax:setup', 'ajaxSetup', ['context']);
      this.migratejQueryEvent(document, 'ajax:promise', 'ajaxPromise', ['context']);
      this.migratejQueryEvent(document, 'ajax:fail', 'ajaxFail', ['context', 'data', 'responseCode', 'xhr']);
      this.migratejQueryEvent(document, 'ajax:done', 'ajaxDone', ['context', 'data', 'responseCode', 'xhr']);
      this.migratejQueryEvent(document, 'ajax:always', 'ajaxAlways', ['context', 'data', 'responseCode', 'xhr']);
      this.migratejQueryEvent(document, 'ajax:before-redirect', 'ajaxRedirect'); // Updated Element

      this.migratejQueryEvent(document, 'ajax:update', 'ajaxUpdate', ['context', 'data', 'responseCode', 'xhr']);
      this.migratejQueryEvent(document, 'ajax:before-replace', 'ajaxBeforeReplace'); // Trigger Element

      this.migratejQueryEvent(document, 'ajax:before-request', 'oc.beforeRequest', ['context']);
      this.migratejQueryEvent(document, 'ajax:before-update', 'ajaxBeforeUpdate', ['context', 'data', 'responseCode', 'xhr']);
      this.migratejQueryEvent(document, 'ajax:request-success', 'ajaxSuccess', ['context', 'data', 'responseCode', 'xhr']);
      this.migratejQueryEvent(document, 'ajax:request-complete', 'ajaxComplete', ['context', 'data', 'responseCode', 'xhr']);
      this.migratejQueryEvent(document, 'ajax:request-error', 'ajaxError', ['context', 'message', 'responseCode', 'xhr']);
      this.migratejQueryEvent(document, 'ajax:before-validate', 'ajaxValidation', ['context', 'message', 'fields']); // Window

      this.migratejQueryEvent(window, 'ajax:before-send', 'ajaxBeforeSend', ['context']);
      this.migratejQueryEvent(window, 'ajax:update-complete', 'ajaxUpdateComplete', ['context', 'data', 'responseCode', 'xhr']);
      this.migratejQueryEvent(window, 'ajax:invalid-field', 'ajaxInvalidField', ['element', 'fieldName', 'errorMsg', 'isFirst']);
      this.migratejQueryEvent(window, 'ajax:confirm-message', 'ajaxConfirmMessage', ['message', 'promise']);
      this.migratejQueryEvent(window, 'ajax:error-message', 'ajaxErrorMessage', ['message']); // Data adapter

      this.migratejQueryAttachData(document, 'ajax:setup', 'a[data-request], button[data-request], form[data-request], a[data-handler], button[data-handler]');
    } // Private

  }, {
    key: "migratejQueryEvent",
    value: function migratejQueryEvent(target, jsName, jqName) {
      var detailNames = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : [];
      var self = this;
      $(target).on(jsName, function (ev) {
        self.triggerjQueryEvent(ev.originalEvent, jqName, detailNames);
      });
    }
  }, {
    key: "triggerjQueryEvent",
    value: function triggerjQueryEvent(ev, eventName) {
      var detailNames = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [];
      var jQueryEvent = $.Event(eventName),
          args = this.buildDetailArgs(ev, detailNames);
      $(ev.target).trigger(jQueryEvent, args);

      if (jQueryEvent.isDefaultPrevented()) {
        ev.preventDefault();
      }
    }
  }, {
    key: "buildDetailArgs",
    value: function buildDetailArgs(ev, detailNames) {
      var args = [];
      detailNames.forEach(function (name) {
        args.push(ev.detail[name]);
      });
      return args;
    } // For instances where data() is populated in the jQ instance

  }, {
    key: "migratejQueryAttachData",
    value: function migratejQueryAttachData(target, eventName, selector) {
      $(target).on(eventName, selector, function (event) {
        var dataObj = $(this).data('request-data');

        if (!dataObj) {
          return;
        }

        var options = event.detail.context.options;

        if (dataObj.constructor === {}.constructor) {
          Object.assign(options.data, dataObj);
        } else if (typeof dataObj === 'string') {
          Object.assign(options.data, _util_json_parser__WEBPACK_IMPORTED_MODULE_1__.JsonParser.paramToObj('request-data', dataObj));
        }
      });
    }
  }]);

  return Migrate;
}();

/***/ }),

/***/ "./src/core/namespace.js":
/*!*******************************!*\
  !*** ./src/core/namespace.js ***!
  \*******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _controller__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./controller */ "./src/core/controller.js");
/* harmony import */ var _migrate__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./migrate */ "./src/core/migrate.js");
/* harmony import */ var _request_builder__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./request-builder */ "./src/core/request-builder.js");
/* harmony import */ var _util_json_parser__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../util/json-parser */ "./src/util/json-parser.js");
/* harmony import */ var _util_form_serializer__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../util/form-serializer */ "./src/util/form-serializer.js");





var controller = new _controller__WEBPACK_IMPORTED_MODULE_0__.Controller();
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({
  controller: controller,
  parseJSON: _util_json_parser__WEBPACK_IMPORTED_MODULE_3__.JsonParser.parseJSON,
  serializeJSON: _util_form_serializer__WEBPACK_IMPORTED_MODULE_4__.FormSerializer.serializeJSON,
  requestElement: _request_builder__WEBPACK_IMPORTED_MODULE_2__.RequestBuilder.fromElement,
  start: function start() {
    controller.start();

    if (window.jQuery) {
      new _migrate__WEBPACK_IMPORTED_MODULE_1__.Migrate().bind();
    }
  },
  stop: function stop() {
    controller.stop();
  }
});

/***/ }),

/***/ "./src/core/request-builder.js":
/*!*************************************!*\
  !*** ./src/core/request-builder.js ***!
  \*************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "RequestBuilder": () => (/* binding */ RequestBuilder)
/* harmony export */ });
/* harmony import */ var _request_namespace__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../request/namespace */ "./src/request/namespace.js");
/* harmony import */ var _util_json_parser__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../util/json-parser */ "./src/util/json-parser.js");
function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }



var RequestBuilder = /*#__PURE__*/function () {
  function RequestBuilder(element, handler, options) {
    _classCallCheck(this, RequestBuilder);

    this.options = options || {};
    this.ogElement = element;
    this.element = this.findElement(element);

    if (!this.element) {
      return _request_namespace__WEBPACK_IMPORTED_MODULE_0__["default"].send(handler, this.options);
    }

    this.assignAsEval('beforeUpdateFunc', 'requestBeforeUpdate');
    this.assignAsEval('afterUpdateFunc', 'requestAfterUpdate');
    this.assignAsEval('successFunc', 'requestSuccess');
    this.assignAsEval('errorFunc', 'requestError');
    this.assignAsEval('cancelFunc', 'requestCancel');
    this.assignAsEval('completeFunc', 'requestComplete');
    this.assignAsData('progressBar', 'requestProgressBar');
    this.assignAsData('message', 'requestMessage');
    this.assignAsData('confirm', 'requestConfirm');
    this.assignAsData('redirect', 'requestRedirect');
    this.assignAsData('loading', 'requestLoading');
    this.assignAsData('form', 'requestForm');
    this.assignAsData('url', 'requestUrl');
    this.assignAsData('bulk', 'requestBulk', {
      emptyAsTrue: true
    });
    this.assignAsData('files', 'requestFiles', {
      emptyAsTrue: true
    });
    this.assignAsData('flash', 'requestFlash', {
      emptyAsTrue: true
    });
    this.assignAsData('download', 'requestDownload', {
      emptyAsTrue: true
    });
    this.assignAsData('update', 'requestUpdate', {
      parseJson: true
    });
    this.assignAsData('query', 'requestQuery', {
      emptyAsTrue: true,
      parseJson: true
    });
    this.assignAsData('browserTarget', 'browserTarget');
    this.assignAsData('browserValidate', 'browserValidate', {
      emptyAsTrue: true
    });
    this.assignAsData('browserRedirectBack', 'browserRedirectBack', {
      emptyAsTrue: true
    });
    this.assignAsMetaData('update', 'ajaxRequestUpdate', {
      parseJson: true,
      mergeValue: true
    });
    this.assignRequestData();

    if (!handler) {
      handler = this.getHandlerName();
    }

    return _request_namespace__WEBPACK_IMPORTED_MODULE_0__["default"].sendElement(this.element, handler, this.options);
  }

  _createClass(RequestBuilder, [{
    key: "findElement",
    value: // Event target may some random node inside the data-request container
    // so it should bubble up but also capture the ogElement in case it is
    // a button that contains data-request-data.
    function findElement(element) {
      if (!element || element === document) {
        return null;
      }

      if (element.matches('[data-request]')) {
        return element;
      }

      var parentEl = element.closest('[data-request]');

      if (parentEl) {
        return parentEl;
      }

      return element;
    }
  }, {
    key: "getHandlerName",
    value: function getHandlerName() {
      if (this.element.dataset.dataRequest) {
        return this.element.dataset.dataRequest;
      }

      return this.element.getAttribute('data-request');
    }
  }, {
    key: "assignAsEval",
    value: function assignAsEval(optionName, name) {
      if (this.options[optionName] !== undefined) {
        return;
      }

      var attrVal;

      if (this.element.dataset[name]) {
        attrVal = this.element.dataset[name];
      } else {
        attrVal = this.element.getAttribute('data-' + normalizeDataKey(name));
      }

      if (!attrVal) {
        return;
      }

      this.options[optionName] = function (element, data) {
        return new Function('data', attrVal).apply(element, [data]);
      };
    }
  }, {
    key: "assignAsData",
    value: function assignAsData(optionName, name) {
      var _ref = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {},
          _ref$parseJson = _ref.parseJson,
          parseJson = _ref$parseJson === void 0 ? false : _ref$parseJson,
          _ref$emptyAsTrue = _ref.emptyAsTrue,
          emptyAsTrue = _ref$emptyAsTrue === void 0 ? false : _ref$emptyAsTrue;

      if (this.options[optionName] !== undefined) {
        return;
      }

      var attrVal;

      if (this.element.dataset[name]) {
        attrVal = this.element.dataset[name];
      } else {
        attrVal = this.element.getAttribute('data-' + normalizeDataKey(name));
      }

      if (attrVal === null) {
        return;
      }

      attrVal = this.castAttrToOption(attrVal, emptyAsTrue);

      if (parseJson && typeof attrVal === 'string') {
        attrVal = _util_json_parser__WEBPACK_IMPORTED_MODULE_1__.JsonParser.paramToObj('data-' + normalizeDataKey(name), attrVal);
      }

      this.options[optionName] = attrVal;
    }
  }, {
    key: "assignAsMetaData",
    value: function assignAsMetaData(optionName, name) {
      var _ref2 = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {},
          _ref2$mergeValue = _ref2.mergeValue,
          mergeValue = _ref2$mergeValue === void 0 ? true : _ref2$mergeValue,
          _ref2$parseJson = _ref2.parseJson,
          parseJson = _ref2$parseJson === void 0 ? false : _ref2$parseJson,
          _ref2$emptyAsTrue = _ref2.emptyAsTrue,
          emptyAsTrue = _ref2$emptyAsTrue === void 0 ? false : _ref2$emptyAsTrue;

      var meta = document.documentElement.querySelector('head meta[name="' + normalizeDataKey(name) + '"]');

      if (!meta) {
        return;
      }

      var attrVal = meta.getAttribute('content');

      if (parseJson) {
        attrVal = _util_json_parser__WEBPACK_IMPORTED_MODULE_1__.JsonParser.paramToObj(normalizeDataKey(name), attrVal);
      } else {
        attrVal = this.castAttrToOption(attrVal, emptyAsTrue);
      }

      if (mergeValue) {
        this.options[optionName] = _objectSpread(_objectSpread({}, this.options[optionName] || {}), attrVal);
      } else {
        this.options[optionName] = attrVal;
      }
    }
  }, {
    key: "castAttrToOption",
    value: function castAttrToOption(val, emptyAsTrue) {
      if (emptyAsTrue && val === '') {
        return true;
      }

      if (val === 'true' || val === '1') {
        return true;
      }

      if (val === 'false' || val === '0') {
        return false;
      }

      return val;
    }
  }, {
    key: "assignRequestData",
    value: function assignRequestData() {
      var data = {};

      if (this.options.data) {
        Object.assign(data, this.options.data);
      }

      var attr = this.ogElement.getAttribute('data-request-data');

      if (attr) {
        Object.assign(data, _util_json_parser__WEBPACK_IMPORTED_MODULE_1__.JsonParser.paramToObj('data-request-data', attr));
      }

      elementParents(this.ogElement, '[data-request-data]').reverse().forEach(function (el) {
        Object.assign(data, _util_json_parser__WEBPACK_IMPORTED_MODULE_1__.JsonParser.paramToObj('data-request-data', el.getAttribute('data-request-data')));
      });
      this.options.data = data;
    }
  }], [{
    key: "fromElement",
    value: function fromElement(element, handler, options) {
      if (typeof element === 'string') {
        element = document.querySelector(element);
      }

      return new RequestBuilder(element, handler, options);
    }
  }]);

  return RequestBuilder;
}();

function elementParents(element, selector) {
  var parents = [];

  if (!element.parentNode) {
    return parents;
  }

  var ancestor = element.parentNode.closest(selector);

  while (ancestor) {
    parents.push(ancestor);
    ancestor = ancestor.parentNode.closest(selector);
  }

  return parents;
}

function normalizeDataKey(key) {
  return key.replace(/[A-Z]/g, function (chr) {
    return "-".concat(chr.toLowerCase());
  });
}

/***/ }),

/***/ "./src/extras/progress-bar.js":
/*!************************************!*\
  !*** ./src/extras/progress-bar.js ***!
  \************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "ProgressBar": () => (/* binding */ ProgressBar)
/* harmony export */ });
/* harmony import */ var _util__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../util */ "./src/util/index.js");
var _templateObject;

function _taggedTemplateLiteral(strings, raw) { if (!raw) { raw = strings.slice(0); } return Object.freeze(Object.defineProperties(strings, { raw: { value: Object.freeze(raw) } })); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }


var ProgressBar = /*#__PURE__*/function () {
  function ProgressBar() {
    var _this = this;

    _classCallCheck(this, ProgressBar);

    this.stylesheetElement = this.createStylesheetElement();
    this.progressElement = this.createProgressElement();
    this.hiding = false;
    this.value = 0;
    this.visible = false;

    this.trickle = function () {
      _this.setValue(_this.value + Math.random() / 100);
    };
  }

  _createClass(ProgressBar, [{
    key: "show",
    value: function show() {
      var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      if (options.cssClass) {
        this.progressElement.classList.add(options.cssClass);
      }

      if (!this.visible) {
        this.visible = true;
        this.installStylesheetElement();
        this.installProgressElement();
        this.startTrickling();
      }
    }
  }, {
    key: "hide",
    value: function hide() {
      var _this2 = this;

      if (this.visible && !this.hiding) {
        this.hiding = true;
        this.fadeProgressElement(function () {
          _this2.uninstallProgressElement();

          _this2.stopTrickling();

          _this2.visible = false;
          _this2.hiding = false;
        });
      }
    }
  }, {
    key: "setValue",
    value: function setValue(value) {
      this.value = value;
      this.refresh();
    } // Private

  }, {
    key: "installStylesheetElement",
    value: function installStylesheetElement() {
      if (!ProgressBar.stylesheetReady) {
        document.head.insertBefore(this.stylesheetElement, document.head.firstChild);
        ProgressBar.stylesheetReady = true;
      }
    }
  }, {
    key: "installProgressElement",
    value: function installProgressElement() {
      this.progressElement.style.width = "0";
      this.progressElement.style.opacity = "1";
      document.documentElement.insertBefore(this.progressElement, document.body);
      this.refresh();
    }
  }, {
    key: "fadeProgressElement",
    value: function fadeProgressElement(callback) {
      this.progressElement.style.opacity = "0";
      setTimeout(callback, ProgressBar.animationDuration * 1.5);
    }
  }, {
    key: "uninstallProgressElement",
    value: function uninstallProgressElement() {
      if (this.progressElement.parentNode) {
        document.documentElement.removeChild(this.progressElement);
      }
    }
  }, {
    key: "startTrickling",
    value: function startTrickling() {
      if (!this.trickleInterval) {
        this.trickleInterval = setInterval(this.trickle, ProgressBar.animationDuration);
      }
    }
  }, {
    key: "stopTrickling",
    value: function stopTrickling() {
      clearInterval(this.trickleInterval);
      delete this.trickleInterval;
    }
  }, {
    key: "refresh",
    value: function refresh() {
      var _this3 = this;

      requestAnimationFrame(function () {
        _this3.progressElement.style.width = "".concat(10 + _this3.value * 90, "%");
      });
    }
  }, {
    key: "createStylesheetElement",
    value: function createStylesheetElement() {
      var element = document.createElement('style');
      element.textContent = ProgressBar.defaultCSS;
      return element;
    }
  }, {
    key: "createProgressElement",
    value: function createProgressElement() {
      var element = document.createElement('div');
      element.className = 'oc-progress-bar';
      return element;
    }
  }], [{
    key: "defaultCSS",
    get: function get() {
      return (0,_util__WEBPACK_IMPORTED_MODULE_0__.unindent)(_templateObject || (_templateObject = _taggedTemplateLiteral(["\n        .oc-progress-bar {\n            position: fixed;\n            display: block;\n            top: 0;\n            left: 0;\n            height: 3px;\n            background: #0076ff;\n            z-index: 9999;\n            transition:\n                width ", "ms ease-out,\n                opacity ", "ms ", "ms ease-in;\n            transform: translate3d(0, 0, 0);\n        }\n    "])), ProgressBar.animationDuration, ProgressBar.animationDuration / 2, ProgressBar.animationDuration / 2);
    }
  }, {
    key: "progressBar",
    get: function get() {
      return {
        show: function show() {
          var instance = getOrCreateInstance();
          instance.setValue(0);
          instance.show();
        },
        hide: function hide() {
          var instance = getOrCreateInstance();
          instance.setValue(100);
          instance.hide();
        }
      };
    }
  }]);

  return ProgressBar;
}();

_defineProperty(ProgressBar, "instance", null);

_defineProperty(ProgressBar, "stylesheetReady", false);

_defineProperty(ProgressBar, "animationDuration", 300);

function getOrCreateInstance() {
  if (!ProgressBar.instance) {
    ProgressBar.instance = new ProgressBar();
  }

  return ProgressBar.instance;
}

/***/ }),

/***/ "./src/request/actions.js":
/*!********************************!*\
  !*** ./src/request/actions.js ***!
  \********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Actions": () => (/* binding */ Actions),
/* harmony export */   "ActionsUpdateMode": () => (/* binding */ ActionsUpdateMode)
/* harmony export */ });
/* harmony import */ var _asset_manager__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./asset-manager */ "./src/request/asset-manager.js");
/* harmony import */ var _util_deferred__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../util/deferred */ "./src/util/deferred.js");
/* harmony import */ var _util_referrer__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../util/referrer */ "./src/util/referrer.js");
function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }




var ActionsUpdateMode = {
  replaceWith: 'replace',
  prepend: 'prepend',
  append: 'append',
  update: 'update'
};
var Actions = /*#__PURE__*/function () {
  function Actions(delegate, context, options) {
    _classCallCheck(this, Actions);

    this.el = delegate.el;
    this.delegate = delegate;
    this.context = context;
    this.options = options; // Allow override to call parent logic

    this.context.start = this.start.bind(this);
    this.context.success = this.success.bind(this);
    this.context.error = this.error.bind(this);
    this.context.complete = this.complete.bind(this);
    this.context.cancel = this.cancel.bind(this);
  } // Options can override all public methods in this class


  _createClass(Actions, [{
    key: "invoke",
    value: function invoke(method, args) {
      if (this.options[method]) {
        return this.options[method].apply(this.context, args);
      } // beforeUpdate and afterUpdate are not part of context
      // since they have no base logic and won't exist here


      if (this[method]) {
        return this[method].apply(this, _toConsumableArray(args));
      }
    } // Options can also specify a non-interference "func" method, typically
    // used by eval-based data attributes that takes minimal arguments

  }, {
    key: "invokeFunc",
    value: function invokeFunc(method, data) {
      if (this.options[method]) {
        return this.options[method](this.el, data);
      }
    } // Public

  }, {
    key: "start",
    value: function start(xhr) {
      this.invoke('markAsUpdating', [true]);

      if (this.delegate.options.message) {
        this.invoke('handleProgressMessage', [this.delegate.options.message, false]);
      }
    }
  }, {
    key: "success",
    value: function success(data, responseCode, xhr) {
      var _this = this;

      var updatePromise = new _util_deferred__WEBPACK_IMPORTED_MODULE_1__.Deferred(); // Halt here if beforeUpdate() or data-request-before-update returns false

      if (this.invoke('beforeUpdate', [data, responseCode, xhr]) === false) {
        return updatePromise;
      } // Halt here if the error function returns false


      if (this.invokeFunc('beforeUpdateFunc', data) === false) {
        return updatePromise;
      } // Trigger 'ajaxBeforeUpdate' on the form, halt if event.preventDefault() is called


      if (!this.delegate.applicationAllowsUpdate(data, responseCode, xhr)) {
        return updatePromise;
      } // Download file and continue with success response here since data is unusable


      if (this.delegate.options.download && data instanceof Blob) {
        this.invoke('handleFileDownload', [data, xhr]);
        this.delegate.notifyApplicationRequestSuccess(data, responseCode, xhr);
        this.invokeFunc('successFunc', data);
        return updatePromise;
      } // Dispatch flash messages


      if (this.delegate.options.flash && data['X_OCTOBER_FLASH_MESSAGES']) {
        for (var type in data['X_OCTOBER_FLASH_MESSAGES']) {
          this.invoke('handleFlashMessage', [data['X_OCTOBER_FLASH_MESSAGES'][type], type]);
        }
      } // Browser event has halted the process


      if (data['X_OCTOBER_DISPATCHES'] && this.invoke('handleBrowserEvents', [data['X_OCTOBER_DISPATCHES']])) {
        return updatePromise;
      } // Proceed with the update process


      updatePromise = this.invoke('handleUpdateResponse', [data, responseCode, xhr]);
      updatePromise.done(function () {
        _this.delegate.notifyApplicationRequestSuccess(data, responseCode, xhr);

        _this.invokeFunc('successFunc', data);
      });
      return updatePromise;
    }
  }, {
    key: "error",
    value: function error(data, responseCode, xhr) {
      var _this2 = this;

      var errorMsg,
          updatePromise = new _util_deferred__WEBPACK_IMPORTED_MODULE_1__.Deferred();

      if (window.ocUnloading !== undefined && window.ocUnloading) {
        return updatePromise;
      } // Disable redirects


      this.delegate.toggleRedirect(false); // Error 406 is a "smart error" that returns response object that is
      // processed in the same fashion as a successful response. The response
      // may also dispatch events which can halt the process

      if (responseCode == 406 && data) {
        if (data['X_OCTOBER_DISPATCHES'] && this.invoke('handleBrowserEvents', [data['X_OCTOBER_DISPATCHES']])) {
          return updatePromise;
        }

        errorMsg = data['X_OCTOBER_ERROR_MESSAGE'];
        updatePromise = this.invoke('handleUpdateResponse', [data, responseCode, xhr]);
      } // Standard error with standard response text
      else {
        errorMsg = data;
        updatePromise.resolve();
      }

      updatePromise.done(function () {
        // Capture the error message on the node
        if (_this2.el !== document) {
          _this2.el.setAttribute('data-error-message', errorMsg);
        } // Trigger 'ajaxError' on the form, halt if event.preventDefault() is called


        if (!_this2.delegate.applicationAllowsError(data, responseCode, xhr)) {
          return;
        } // Halt here if the error function returns false


        if (_this2.invokeFunc('errorFunc', data) === false) {
          return;
        }

        _this2.invoke('handleErrorMessage', [errorMsg]);
      });
      return updatePromise;
    }
  }, {
    key: "complete",
    value: function complete(data, responseCode, xhr) {
      this.delegate.notifyApplicationRequestComplete(data, responseCode, xhr);
      this.invokeFunc('completeFunc', data);
      this.invoke('markAsUpdating', [false]);

      if (this.delegate.options.message) {
        this.invoke('handleProgressMessage', [null, true]);
      }
    }
  }, {
    key: "cancel",
    value: function cancel() {
      this.invokeFunc('cancelFunc');
    } // Custom function, requests confirmation from the user

  }, {
    key: "handleConfirmMessage",
    value: function handleConfirmMessage(message) {
      var _this3 = this;

      var promise = new _util_deferred__WEBPACK_IMPORTED_MODULE_1__.Deferred();
      promise.done(function () {
        _this3.delegate.sendInternal();
      }).fail(function () {
        _this3.invoke('cancel', []);
      });
      var event = this.delegate.notifyApplicationConfirmMessage(message, promise);

      if (event.defaultPrevented) {
        return false;
      }

      if (message) {
        var result = confirm(message);

        if (!result) {
          this.invoke('cancel', []);
        }

        return result;
      }
    } // Custom function, display a progress message to the user

  }, {
    key: "handleProgressMessage",
    value: function handleProgressMessage(message, isDone) {} // Custom function, display a flash message to the user

  }, {
    key: "handleFlashMessage",
    value: function handleFlashMessage(message, type) {} // Custom function, display an error message to the user

  }, {
    key: "handleErrorMessage",
    value: function handleErrorMessage(message) {
      var event = this.delegate.notifyApplicationErrorMessage(message);

      if (event.defaultPrevented) {
        return;
      }

      if (message) {
        alert(message);
      }
    } // Custom function, focus fields with errors

  }, {
    key: "handleValidationMessage",
    value: function handleValidationMessage(message, fields) {
      this.delegate.notifyApplicationBeforeValidate(message, fields);

      if (!this.delegate.formEl) {
        return;
      }

      var isFirstInvalidField = true;

      for (var fieldName in fields) {
        var fieldCheck,
            fieldNameOptions = []; // field1[field2][field3]

        fieldCheck = fieldName.replace(/\.(\w+)/g, '[$1]');
        fieldNameOptions.push('[name="' + fieldCheck + '"]:not([disabled])');
        fieldNameOptions.push('[name="' + fieldCheck + '[]"]:not([disabled])'); // [field1][field2][field3]

        fieldCheck = ('.' + fieldName).replace(/\.(\w+)/g, '[$1]');
        fieldNameOptions.push('[name$="' + fieldCheck + '"]:not([disabled])');
        fieldNameOptions.push('[name$="' + fieldCheck + '[]"]:not([disabled])'); // field.0 → field[]

        var fieldEmpty = fieldName.replace(/\.[0-9]+$/g, '');

        if (fieldName !== fieldEmpty) {
          fieldCheck = fieldEmpty.replace(/\.(\w+)/g, '[$1]');
          fieldNameOptions.push('[name="' + fieldCheck + '[]"]:not([disabled])');
          fieldCheck = ('.' + fieldEmpty).replace(/\.(\w+)/g, '[$1]');
          fieldNameOptions.push('[name$="' + fieldCheck + '[]"]:not([disabled])');
        }

        var fieldElement = this.delegate.formEl.querySelector(fieldNameOptions.join(', '));

        if (fieldElement) {
          var event = this.delegate.notifyApplicationFieldInvalid(fieldElement, fieldName, fields[fieldName], isFirstInvalidField);

          if (isFirstInvalidField) {
            if (!event.defaultPrevented) {
              fieldElement.focus();
            }

            isFirstInvalidField = false;
          }
        }
      }
    } // Custom function, handle a browser event coming from the server

  }, {
    key: "handleBrowserEvents",
    value: function handleBrowserEvents(events) {
      var _this4 = this;

      if (!events || !events.length) {
        return false;
      }

      var defaultPrevented = false;
      events.forEach(function (dispatched) {
        var event = _this4.delegate.notifyApplicationCustomEvent(dispatched.event, _objectSpread(_objectSpread({}, dispatched.data || {}), {}, {
          context: _this4.context
        }));

        if (event.defaultPrevented) {
          defaultPrevented = true;
        }
      });
      return defaultPrevented;
    } // Custom function, redirect the browser to another location

  }, {
    key: "handleRedirectResponse",
    value: function handleRedirectResponse(href) {
      var event = this.delegate.notifyApplicationBeforeRedirect();

      if (event.defaultPrevented) {
        return;
      }

      if (this.options.browserRedirectBack) {
        href = (0,_util_referrer__WEBPACK_IMPORTED_MODULE_2__.getReferrerUrl)() || href;
      }

      if (oc.useTurbo && oc.useTurbo()) {
        oc.visit(href);
      } else {
        location.assign(href);
      }
    } // Mark known elements as being updated

  }, {
    key: "markAsUpdating",
    value: function markAsUpdating(isUpdating) {
      var updateOptions = this.options.update || {};

      for (var partial in updateOptions) {
        var selector = updateOptions[partial];
        var selectedEl = [];

        if (updateOptions['_self'] && partial == this.options.partial && this.delegate.partialEl) {
          selector = updateOptions['_self'];
          selectedEl = [this.delegate.partialEl];
        } else {
          selectedEl = resolveSelectorResponse(selector, '[data-ajax-partial="' + partial + '"]');
        }

        selectedEl.forEach(function (el) {
          if (isUpdating) {
            el.setAttribute('data-ajax-updating', '');
          } else {
            el.removeAttribute('data-ajax-updating');
          }
        });
      }
    } // Custom function, handle any application specific response values
    // Using a promissory object here in case injected assets need time to load

  }, {
    key: "handleUpdateResponse",
    value: function handleUpdateResponse(data, responseCode, xhr) {
      var _this5 = this;

      var updateOptions = this.options.update || {},
          updatePromise = new _util_deferred__WEBPACK_IMPORTED_MODULE_1__.Deferred(); // Update partials and finish request

      updatePromise.done(function () {
        var _loop = function _loop() {
          // If a partial has been supplied on the client side that matches the server supplied key, look up
          // it's selector and use that. If not, we assume it is an explicit selector reference.
          var selector = updateOptions[partial] || partial;
          var selectedEl = []; // If the update options has a _self, values like true and '^' will resolve to the partial element,
          // these values are also used to make AJAX partial handlers available without performing an update

          if (updateOptions['_self'] && partial == _this5.options.partial && _this5.delegate.partialEl) {
            selector = updateOptions['_self'];
            selectedEl = [_this5.delegate.partialEl];
          } else {
            selectedEl = resolveSelectorResponse(selector, '[data-ajax-partial="' + partial + '"]');
          }

          selectedEl.forEach(function (el) {
            var updateMode = getSelectorUpdateMode(selector, el); // Replace With

            if (updateMode === ActionsUpdateMode.replaceWith) {
              var parentNode = el.parentNode;
              el.insertAdjacentHTML('afterEnd', data[partial]);
              parentNode.removeChild(el);
              runScriptsOnFragment(parentNode, data[partial]);
            } // Append
            else if (updateMode === ActionsUpdateMode.append) {
              el.insertAdjacentHTML('beforeEnd', data[partial]);
              runScriptsOnFragment(el, data[partial]);
            } // Prepend
            else if (updateMode === ActionsUpdateMode.prepend) {
              el.insertAdjacentHTML('afterBegin', data[partial]);
              runScriptsOnFragment(el, data[partial]);
            } // Insert
            else {
              _this5.delegate.notifyApplicationBeforeReplace(el);

              el.innerHTML = data[partial];
              runScriptsOnElement(el);
            }

            _this5.delegate.notifyApplicationAjaxUpdate(el, data, responseCode, xhr);
          });
        };

        for (var partial in data) {
          _loop();
        } // Wait for update method to finish rendering from partial updates


        setTimeout(function () {
          _this5.delegate.notifyApplicationUpdateComplete(data, responseCode, xhr);

          _this5.invoke('afterUpdate', [data, responseCode, xhr]);

          _this5.invokeFunc('afterUpdateFunc', data);
        }, 0);
      }); // Handle redirect

      if (data['X_OCTOBER_REDIRECT']) {
        this.delegate.toggleRedirect(data['X_OCTOBER_REDIRECT']);
      }

      if (this.delegate.isRedirect) {
        this.invoke('handleRedirectResponse', [this.delegate.options.redirect]);
      } // Handle validation


      if (data['X_OCTOBER_ERROR_FIELDS']) {
        this.invoke('handleValidationMessage', [data['X_OCTOBER_ERROR_MESSAGE'], data['X_OCTOBER_ERROR_FIELDS']]);
      } // Handle asset injection


      if (data['X_OCTOBER_ASSETS']) {
        _asset_manager__WEBPACK_IMPORTED_MODULE_0__.AssetManager.load(data['X_OCTOBER_ASSETS'], function () {
          return updatePromise.resolve();
        });
      } else {
        updatePromise.resolve();
      }

      return updatePromise;
    } // Custom function, download a file response from the server

  }, {
    key: "handleFileDownload",
    value: function handleFileDownload(data, xhr) {
      if (this.options.browserTarget) {
        window.open(window.URL.createObjectURL(data), this.options.browserTarget);
        return;
      }

      var fileName = typeof this.options.download === 'string' ? this.options.download : getFilenameFromHttpResponse(xhr);

      if (!fileName) {
        return;
      }

      var anchor = document.createElement('a');
      anchor.href = window.URL.createObjectURL(data);
      anchor.download = fileName;
      anchor.target = '_blank';
      anchor.click();
      window.URL.revokeObjectURL(anchor.href);
    } // Custom function, adds query data to the current URL

  }, {
    key: "applyQueryToUrl",
    value: function applyQueryToUrl(queryData) {
      var searchParams = new URLSearchParams(window.location.search);

      var _loop2 = function _loop2() {
        var key = _Object$keys[_i];
        var value = queryData[key];

        if (Array.isArray(value)) {
          searchParams["delete"](key);
          searchParams["delete"]("".concat(key, "[]"));
          value.forEach(function (val) {
            return searchParams.append("".concat(key, "[]"), val);
          });
        } else if (value === null) {
          searchParams["delete"](key);
          searchParams["delete"]("".concat(key, "[]"));
        } else {
          searchParams.set(key, value);
        }
      };

      for (var _i = 0, _Object$keys = Object.keys(queryData); _i < _Object$keys.length; _i++) {
        _loop2();
      }

      var newUrl = window.location.pathname,
          queryStr = searchParams.toString();

      if (queryStr) {
        newUrl += '?' + queryStr.replaceAll('%5B%5D=', '[]=');
      }

      if (oc.useTurbo && oc.useTurbo()) {
        oc.visit(newUrl, {
          action: 'swap',
          scroll: false
        });
      } else {
        history.replaceState(null, '', newUrl); // Tracking referrer since document.referrer will not update

        localStorage.setItem('ocPushStateReferrer', newUrl);
      }
    }
  }]);

  return Actions;
}();

function resolveSelectorResponse(selector, partialSelector) {
  // Look for AJAX partial selectors
  if (selector === true) {
    return document.querySelectorAll(partialSelector);
  } // Selector is DOM element


  if (typeof selector !== 'string') {
    return [selector];
  } // Invalid selector


  if (['#', '.', '@', '^', '!', '='].indexOf(selector.charAt(0)) === -1) {
    return [];
  } // Append, prepend, replace with or custom selector


  if (['@', '^', '!', '='].indexOf(selector.charAt(0)) !== -1) {
    selector = selector.substring(1);
  } // Empty selector remains


  if (!selector) {
    selector = partialSelector;
  }

  return document.querySelectorAll(selector);
}

function getSelectorUpdateMode(selector, el) {
  // Look at selector prefix
  if (typeof selector === 'string') {
    if (selector.charAt(0) === '!') {
      return ActionsUpdateMode.replaceWith;
    }

    if (selector.charAt(0) === '@') {
      return ActionsUpdateMode.append;
    }

    if (selector.charAt(0) === '^') {
      return ActionsUpdateMode.prepend;
    }
  } // Look at element dataset


  if (el.dataset.ajaxUpdateMode !== undefined) {
    return el.dataset.ajaxUpdateMode;
  } // Default mode


  return ActionsUpdateMode.update;
} // Replaces blocked scripts with fresh nodes


function runScriptsOnElement(el) {
  Array.from(el.querySelectorAll('script')).forEach(function (oldScript) {
    var newScript = document.createElement('script');
    Array.from(oldScript.attributes).forEach(function (attr) {
      return newScript.setAttribute(attr.name, attr.value);
    });
    newScript.appendChild(document.createTextNode(oldScript.innerHTML));
    oldScript.parentNode.replaceChild(newScript, oldScript);
  });
} // Runs scripts on a fragment inside a container


function runScriptsOnFragment(container, html) {
  var div = document.createElement('div');
  div.innerHTML = html;
  Array.from(div.querySelectorAll('script')).forEach(function (oldScript) {
    var newScript = document.createElement('script');
    Array.from(oldScript.attributes).forEach(function (attr) {
      return newScript.setAttribute(attr.name, attr.value);
    });
    newScript.appendChild(document.createTextNode(oldScript.innerHTML));
    container.appendChild(newScript);
    container.removeChild(newScript);
  });
}

function getFilenameFromHttpResponse(xhr) {
  var contentDisposition = xhr.getResponseHeader('Content-Disposition');

  if (!contentDisposition) {
    return null;
  }

  var filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/g;
  var match = null;
  var tmpMatch = null;

  while ((tmpMatch = filenameRegex.exec(contentDisposition)) !== null) {
    match = tmpMatch;
  }

  if (match !== null && match[1]) {
    // Decide ASCII or UTF-8 file name
    return /filename[^;*=\n]*\*=[^']*''/.exec(match[0]) === null ? match[1].replace(/['"]/g, '') : decodeURIComponent(match[1].substring(match[1].indexOf("''") + 2));
  }

  return null;
}

/***/ }),

/***/ "./src/request/asset-manager.js":
/*!**************************************!*\
  !*** ./src/request/asset-manager.js ***!
  \**************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "AssetManager": () => (/* binding */ AssetManager)
/* harmony export */ });
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }

var AssetManager = /*#__PURE__*/function () {
  function AssetManager() {
    _classCallCheck(this, AssetManager);
  }

  _createClass(AssetManager, [{
    key: "loadCollection",
    value: function loadCollection(collection, callback) {
      var self = this,
          jsList = collection.js ? collection.js : [],
          cssList = collection.css ? collection.css : [],
          imgList = collection.img ? collection.img : [];
      jsList = assGrep(jsList, function (item) {
        return !document.querySelector('head script[src="' + item + '"]');
      });
      cssList = assGrep(cssList, function (item) {
        return !document.querySelector('head link[href="' + item + '"]');
      });
      var cssCounter = 0,
          jsLoaded = false,
          imgLoaded = false;

      if (jsList.length === 0 && cssList.length === 0 && imgList.length === 0) {
        callback && callback();
        return;
      }

      this.loadJavaScript(jsList, function () {
        jsLoaded = true;
        checkLoaded();
      });
      cssList.forEach(function (source) {
        self.loadStyleSheet(source, function () {
          cssCounter++;
          checkLoaded();
        });
      });
      this.loadImage(imgList, function () {
        imgLoaded = true;
        checkLoaded();
      });

      function checkLoaded() {
        if (!imgLoaded) {
          return false;
        }

        if (!jsLoaded) {
          return false;
        }

        if (cssCounter < cssList.length) {
          return false;
        }

        callback && callback();
      }
    } // Loads StyleSheet files

  }, {
    key: "loadStyleSheet",
    value: function loadStyleSheet(source, callback) {
      var cssElement = document.createElement('link');
      cssElement.setAttribute('rel', 'stylesheet');
      cssElement.setAttribute('type', 'text/css');
      cssElement.setAttribute('href', source);
      cssElement.addEventListener('load', callback, false);

      if (typeof cssElement != 'undefined') {
        document.getElementsByTagName('head')[0].appendChild(cssElement);
      }

      return cssElement;
    } // Loads JavaScript files in sequence

  }, {
    key: "loadJavaScript",
    value: function loadJavaScript(sources, callback) {
      if (sources.length <= 0) {
        return callback();
      }

      var self = this,
          source = sources.shift(),
          jsElement = document.createElement('script');
      jsElement.setAttribute('type', 'text/javascript');
      jsElement.setAttribute('src', source);
      jsElement.addEventListener('load', function () {
        self.loadJavaScript(sources, callback);
      }, false);

      if (typeof jsElement != 'undefined') {
        document.getElementsByTagName('head')[0].appendChild(jsElement);
      }
    } // Loads Image files

  }, {
    key: "loadImage",
    value: function loadImage(sources, callback) {
      if (sources.length <= 0) {
        return callback();
      }

      var loaded = 0;
      sources.forEach(function (source) {
        var img = new Image();

        img.onload = function () {
          if (++loaded == sources.length && callback) {
            callback();
          }
        };

        img.src = source;
      });
    }
  }], [{
    key: "load",
    value: function load(collection, callback) {
      return new AssetManager().loadCollection(collection, callback);
    }
  }]);

  return AssetManager;
}();

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

/***/ }),

/***/ "./src/request/data.js":
/*!*****************************!*\
  !*** ./src/request/data.js ***!
  \*****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Data": () => (/* binding */ Data)
/* harmony export */ });
/* harmony import */ var _util_form_serializer__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../util/form-serializer */ "./src/util/form-serializer.js");
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }


var Data = /*#__PURE__*/function () {
  function Data(userData, targetEl, formEl) {
    _classCallCheck(this, Data);

    this.userData = userData || {};
    this.targetEl = targetEl;
    this.formEl = formEl;
  } // Public


  _createClass(Data, [{
    key: "getRequestData",
    value: function getRequestData() {
      var requestData; // Serialize form

      if (this.formEl) {
        requestData = new FormData(this.formEl);
      } else {
        requestData = new FormData();
      } // Add single input data


      this.appendSingleInputElement(requestData);
      return requestData;
    }
  }, {
    key: "getAsFormData",
    value: function getAsFormData() {
      return this.appendJsonToFormData(this.getRequestData(), this.userData);
    }
  }, {
    key: "getAsQueryString",
    value: function getAsQueryString() {
      return this.convertFormDataToQuery(this.getAsFormData());
    }
  }, {
    key: "getAsJsonData",
    value: function getAsJsonData() {
      return JSON.stringify(this.convertFormDataToJson(this.getAsFormData()));
    } // Private

  }, {
    key: "appendSingleInputElement",
    value: function appendSingleInputElement(requestData) {
      // Has a form, no target element, or not a singular input
      if (this.formEl || !this.targetEl || !isElementInput(this.targetEl)) {
        return;
      } // No name or supplied by user data already


      var inputName = this.targetEl.name;

      if (!inputName || this.userData[inputName] !== undefined) {
        return;
      } // Include files, if they are any


      if (this.targetEl.type === 'file') {
        this.targetEl.files.forEach(function (value) {
          requestData.append(inputName, value);
        });
      } else {
        requestData.append(inputName, this.targetEl.value);
      }
    }
  }, {
    key: "appendJsonToFormData",
    value: function appendJsonToFormData(formData, useJson, parentKey) {
      var self = this;

      for (var key in useJson) {
        var fieldKey = key;

        if (parentKey) {
          fieldKey = parentKey + '[' + key + ']';
        }

        var value = useJson[key]; // Object

        if (value && value.constructor === {}.constructor) {
          this.appendJsonToFormData(formData, value, fieldKey);
        } // Array
        else if (value && value.constructor === [].constructor) {
          value.forEach(function (v, i) {
            if (v.constructor === {}.constructor || v.constructor === [].constructor) {
              self.appendJsonToFormData(formData, v, fieldKey + '[' + i + ']');
            } else {
              formData.append(fieldKey + '[]', self.castJsonToFormData(v));
            }
          });
        } // Mixed
        else {
          formData.append(fieldKey, this.castJsonToFormData(value));
        }
      }

      return formData;
    }
  }, {
    key: "convertFormDataToQuery",
    value: function convertFormDataToQuery(formData) {
      // Process to a flat object with array values
      var flatData = this.formDataToArray(formData); // Process HTML names to a query string

      return Object.keys(flatData).map(function (key) {
        if (key.endsWith('[]')) {
          return flatData[key].map(function (val) {
            return encodeURIComponent(key) + '=' + encodeURIComponent(val);
          }).join('&');
        } else {
          return encodeURIComponent(key) + '=' + encodeURIComponent(flatData[key]);
        }
      }).join('&');
    }
  }, {
    key: "convertFormDataToJson",
    value: function convertFormDataToJson(formData) {
      // Process to a flat object with array values
      var flatData = this.formDataToArray(formData); // Process HTML names to a nested object

      var jsonData = {};

      for (var key in flatData) {
        _util_form_serializer__WEBPACK_IMPORTED_MODULE_0__.FormSerializer.assignToObj(jsonData, key, flatData[key]);
      }

      return jsonData;
    }
  }, {
    key: "formDataToArray",
    value: function formDataToArray(formData) {
      return Object.fromEntries(Array.from(formData.keys()).map(function (key) {
        return [key, key.endsWith('[]') ? formData.getAll(key) : formData.getAll(key).pop()];
      }));
    }
  }, {
    key: "castJsonToFormData",
    value: function castJsonToFormData(val) {
      if (val === null) {
        return '';
      }

      if (val === true) {
        return '1';
      }

      if (val === false) {
        return '0';
      }

      return val;
    }
  }]);

  return Data;
}();

function isElementInput(el) {
  return ['input', 'select', 'textarea'].includes((el.tagName || '').toLowerCase());
}

/***/ }),

/***/ "./src/request/index.js":
/*!******************************!*\
  !*** ./src/request/index.js ***!
  \******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _asset_manager__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./asset-manager */ "./src/request/asset-manager.js");
/* harmony import */ var _namespace__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./namespace */ "./src/request/namespace.js");


/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (_namespace__WEBPACK_IMPORTED_MODULE_1__["default"]);

if (!window.oc) {
  window.oc = {};
}

if (!window.oc.AjaxRequest) {
  // Namespace
  window.oc.AjaxRequest = _namespace__WEBPACK_IMPORTED_MODULE_1__["default"]; // Asset manager

  window.oc.AssetManager = _asset_manager__WEBPACK_IMPORTED_MODULE_0__.AssetManager; // Request without element

  window.oc.ajax = _namespace__WEBPACK_IMPORTED_MODULE_1__["default"].send; // Request on element (framework can override)

  if (!window.oc.request) {
    window.oc.request = _namespace__WEBPACK_IMPORTED_MODULE_1__["default"].sendElement;
  }
}

/***/ }),

/***/ "./src/request/namespace.js":
/*!**********************************!*\
  !*** ./src/request/namespace.js ***!
  \**********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _request__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./request */ "./src/request/request.js");

/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (_request__WEBPACK_IMPORTED_MODULE_0__.Request);

/***/ }),

/***/ "./src/request/options.js":
/*!********************************!*\
  !*** ./src/request/options.js ***!
  \********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Options": () => (/* binding */ Options)
/* harmony export */ });
function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }

var Options = /*#__PURE__*/function () {
  function Options(handler, options) {
    _classCallCheck(this, Options);

    if (!handler) {
      throw new Error('The request handler name is not specified.');
    }

    if (!handler.match(/^(?:\w+\:{2})?on*/)) {
      throw new Error('Invalid handler name. The correct handler name format is: "onEvent".');
    }

    if (typeof FormData === 'undefined') {
      throw new Error('The browser does not support the FormData interface.');
    }

    this.options = options;
    this.handler = handler;
  }

  _createClass(Options, [{
    key: "getRequestOptions",
    value: // Public
    function getRequestOptions() {
      return {
        method: 'POST',
        url: this.options.url ? this.options.url : window.location.href,
        headers: this.buildHeaders(),
        responseType: this.options.download === false ? '' : 'blob'
      };
    } // Private

  }, {
    key: "buildHeaders",
    value: function buildHeaders() {
      var handler = this.handler,
          options = this.options;
      var headers = {
        'X-Requested-With': 'XMLHttpRequest',
        'X-OCTOBER-REQUEST-HANDLER': handler
      };

      if (!options.files) {
        headers['Content-Type'] = options.bulk ? 'application/json' : 'application/x-www-form-urlencoded';
      }

      if (options.flash) {
        headers['X-OCTOBER-REQUEST-FLASH'] = 1;
      }

      if (options.partial) {
        headers['X-OCTOBER-REQUEST-PARTIAL'] = options.partial;
      }

      var partials = this.extractPartials(options.update, options.partial);

      if (partials) {
        headers['X-OCTOBER-REQUEST-PARTIALS'] = partials;
      }

      var xsrfToken = this.getXSRFToken();

      if (xsrfToken) {
        headers['X-XSRF-TOKEN'] = xsrfToken;
      }

      var csrfToken = this.getCSRFToken();

      if (csrfToken) {
        headers['X-CSRF-TOKEN'] = csrfToken;
      }

      if (options.headers && options.headers.constructor === {}.constructor) {
        Object.assign(headers, options.headers);
      }

      return headers;
    }
  }, {
    key: "extractPartials",
    value: function extractPartials() {
      var update = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      var selfPartial = arguments.length > 1 ? arguments[1] : undefined;
      var result = [];

      if (update) {
        if (_typeof(update) !== 'object') {
          throw new Error('Invalid update value. The correct format is an object ({...})');
        }

        for (var partial in update) {
          if (partial === '_self' && selfPartial) {
            result.push(selfPartial);
          } else {
            result.push(partial);
          }
        }
      }

      return result.join('&');
    }
  }, {
    key: "getCSRFToken",
    value: function getCSRFToken() {
      var tag = document.querySelector('meta[name="csrf-token"]');
      return tag ? tag.getAttribute('content') : null;
    }
  }, {
    key: "getXSRFToken",
    value: function getXSRFToken() {
      var cookieValue = null;

      if (document.cookie && document.cookie != '') {
        var cookies = document.cookie.split(';');

        for (var i = 0; i < cookies.length; i++) {
          var cookie = cookies[i].replace(/^([\s]*)|([\s]*)$/g, '');

          if (cookie.substring(0, 11) == 'XSRF-TOKEN' + '=') {
            cookieValue = decodeURIComponent(cookie.substring(11));
            break;
          }
        }
      }

      return cookieValue;
    }
  }], [{
    key: "fetch",
    value: function fetch(handler, options) {
      return new this(handler, options).getRequestOptions();
    }
  }]);

  return Options;
}();

/***/ }),

/***/ "./src/request/request.js":
/*!********************************!*\
  !*** ./src/request/request.js ***!
  \********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Request": () => (/* binding */ Request)
/* harmony export */ });
/* harmony import */ var _options__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./options */ "./src/request/options.js");
/* harmony import */ var _actions__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./actions */ "./src/request/actions.js");
/* harmony import */ var _data__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./data */ "./src/request/data.js");
/* harmony import */ var _util_http_request__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../util/http-request */ "./src/util/http-request.js");
/* harmony import */ var _util_deferred__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../util/deferred */ "./src/util/deferred.js");
/* harmony import */ var _extras_progress_bar__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../extras/progress-bar */ "./src/extras/progress-bar.js");
/* harmony import */ var _util__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../util */ "./src/util/index.js");
function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }








var Request = /*#__PURE__*/function () {
  function Request(element, handler, options) {
    var _this = this;

    _classCallCheck(this, Request);

    this.el = element;
    this.handler = handler;
    this.options = _objectSpread(_objectSpread({}, this.constructor.DEFAULTS), options || {});
    this.context = {
      el: element,
      handler: handler,
      options: this.options
    };
    this.progressBar = new _extras_progress_bar__WEBPACK_IMPORTED_MODULE_5__.ProgressBar();

    this.showProgressBar = function () {
      _this.progressBar.show({
        cssClass: 'is-ajax'
      });
    };
  }

  _createClass(Request, [{
    key: "start",
    value: function start() {
      // Setup
      if (!this.applicationAllowsSetup()) {
        return;
      }

      this.initOtherElements();
      this.preprocessOptions(); // Prepare actions

      this.actions = new _actions__WEBPACK_IMPORTED_MODULE_1__.Actions(this, this.context, this.options);

      if (!this.validateClientSideForm() || !this.applicationAllowsRequest()) {
        return;
      } // Confirm before sending


      if (this.options.confirm && !this.actions.invoke('handleConfirmMessage', [this.options.confirm])) {
        return;
      } // Send request


      this.sendInternal();
      return this.options.async ? this.wrapInAsyncPromise(this.promise) : this.promise;
    }
  }, {
    key: "sendInternal",
    value: function sendInternal() {
      var _this2 = this;

      // Prepare data
      var dataObj = new _data__WEBPACK_IMPORTED_MODULE_2__.Data(this.options.data, this.el, this.formEl);
      var data;

      if (this.options.files) {
        data = dataObj.getAsFormData();
      } else if (this.options.bulk) {
        data = dataObj.getAsJsonData();
      } else {
        data = dataObj.getAsQueryString();
      } // Prepare query


      if (this.options.query) {
        this.actions.invoke('applyQueryToUrl', [this.options.query !== true ? this.options.query : JSON.parse(dataObj.getAsJsonData())]);
      } // Prepare request


      var _Options$fetch = _options__WEBPACK_IMPORTED_MODULE_0__.Options.fetch(this.handler, this.options),
          url = _Options$fetch.url,
          headers = _Options$fetch.headers,
          method = _Options$fetch.method,
          responseType = _Options$fetch.responseType;

      this.request = new _util_http_request__WEBPACK_IMPORTED_MODULE_3__.HttpRequest(this, url, {
        method: method,
        headers: headers,
        responseType: responseType,
        data: data,
        trackAbort: true
      });
      this.promise = new _util_deferred__WEBPACK_IMPORTED_MODULE_4__.Deferred({
        delegate: this.request
      });
      this.isRedirect = this.options.redirect && this.options.redirect.length > 0; // Lifecycle events

      this.notifyApplicationBeforeSend();
      this.notifyApplicationAjaxPromise();
      this.promise.fail(function (data, responseCode, xhr) {
        if (!_this2.isRedirect) {
          _this2.notifyApplicationAjaxFail(data, responseCode, xhr);
        }
      }).done(function (data, responseCode, xhr) {
        if (!_this2.isRedirect) {
          _this2.notifyApplicationAjaxDone(data, responseCode, xhr);
        }
      }).always(function (data, responseCode, xhr) {
        _this2.notifyApplicationAjaxAlways(data, responseCode, xhr);
      });
      this.request.send();
    }
  }, {
    key: "toggleRedirect",
    value: function toggleRedirect(redirectUrl) {
      if (!redirectUrl) {
        this.options.redirect = null;
        this.isRedirect = false;
      } else {
        this.options.redirect = redirectUrl;
        this.isRedirect = true;
      }
    }
  }, {
    key: "applicationAllowsSetup",
    value: function applicationAllowsSetup() {
      var event = this.notifyApplicationAjaxSetup();
      return !event.defaultPrevented;
    }
  }, {
    key: "applicationAllowsRequest",
    value: function applicationAllowsRequest() {
      var event = this.notifyApplicationBeforeRequest();
      return !event.defaultPrevented;
    }
  }, {
    key: "applicationAllowsUpdate",
    value: function applicationAllowsUpdate(data, responseCode, xhr) {
      var event = this.notifyApplicationBeforeUpdate(data, responseCode, xhr);
      return !event.defaultPrevented;
    }
  }, {
    key: "applicationAllowsError",
    value: function applicationAllowsError(message, responseCode, xhr) {
      var event = this.notifyApplicationRequestError(message, responseCode, xhr);
      return !event.defaultPrevented;
    } // Application events

  }, {
    key: "notifyApplicationAjaxSetup",
    value: function notifyApplicationAjaxSetup() {
      return (0,_util__WEBPACK_IMPORTED_MODULE_6__.dispatch)('ajax:setup', {
        target: this.el,
        detail: {
          context: this.context
        }
      });
    }
  }, {
    key: "notifyApplicationAjaxPromise",
    value: function notifyApplicationAjaxPromise() {
      return (0,_util__WEBPACK_IMPORTED_MODULE_6__.dispatch)('ajax:promise', {
        target: this.el,
        detail: {
          context: this.context
        }
      });
    }
  }, {
    key: "notifyApplicationAjaxFail",
    value: function notifyApplicationAjaxFail(data, responseCode, xhr) {
      return (0,_util__WEBPACK_IMPORTED_MODULE_6__.dispatch)('ajax:fail', {
        target: this.el,
        detail: {
          context: this.context,
          data: data,
          responseCode: responseCode,
          xhr: xhr
        }
      });
    }
  }, {
    key: "notifyApplicationAjaxDone",
    value: function notifyApplicationAjaxDone(data, responseCode, xhr) {
      return (0,_util__WEBPACK_IMPORTED_MODULE_6__.dispatch)('ajax:done', {
        target: this.el,
        detail: {
          context: this.context,
          data: data,
          responseCode: responseCode,
          xhr: xhr
        }
      });
    }
  }, {
    key: "notifyApplicationAjaxAlways",
    value: function notifyApplicationAjaxAlways(data, responseCode, xhr) {
      return (0,_util__WEBPACK_IMPORTED_MODULE_6__.dispatch)('ajax:always', {
        target: this.el,
        detail: {
          context: this.context,
          data: data,
          responseCode: responseCode,
          xhr: xhr
        }
      });
    }
  }, {
    key: "notifyApplicationAjaxUpdate",
    value: function notifyApplicationAjaxUpdate(target, data, responseCode, xhr) {
      return (0,_util__WEBPACK_IMPORTED_MODULE_6__.dispatch)('ajax:update', {
        target: target,
        detail: {
          context: this.context,
          data: data,
          responseCode: responseCode,
          xhr: xhr
        }
      });
    }
  }, {
    key: "notifyApplicationBeforeRedirect",
    value: function notifyApplicationBeforeRedirect() {
      return (0,_util__WEBPACK_IMPORTED_MODULE_6__.dispatch)('ajax:before-redirect', {
        target: this.el
      });
    }
  }, {
    key: "notifyApplicationBeforeRequest",
    value: function notifyApplicationBeforeRequest() {
      return (0,_util__WEBPACK_IMPORTED_MODULE_6__.dispatch)('ajax:before-request', {
        target: this.triggerEl,
        detail: {
          context: this.context
        }
      });
    }
  }, {
    key: "notifyApplicationBeforeUpdate",
    value: function notifyApplicationBeforeUpdate(data, responseCode, xhr) {
      return (0,_util__WEBPACK_IMPORTED_MODULE_6__.dispatch)('ajax:before-update', {
        target: this.triggerEl,
        detail: {
          context: this.context,
          data: data,
          responseCode: responseCode,
          xhr: xhr
        }
      });
    }
  }, {
    key: "notifyApplicationRequestSuccess",
    value: function notifyApplicationRequestSuccess(data, responseCode, xhr) {
      return (0,_util__WEBPACK_IMPORTED_MODULE_6__.dispatch)('ajax:request-success', {
        target: this.triggerEl,
        detail: {
          context: this.context,
          data: data,
          responseCode: responseCode,
          xhr: xhr
        }
      });
    }
  }, {
    key: "notifyApplicationRequestError",
    value: function notifyApplicationRequestError(message, responseCode, xhr) {
      return (0,_util__WEBPACK_IMPORTED_MODULE_6__.dispatch)('ajax:request-error', {
        target: this.triggerEl,
        detail: {
          context: this.context,
          message: message,
          responseCode: responseCode,
          xhr: xhr
        }
      });
    }
  }, {
    key: "notifyApplicationRequestComplete",
    value: function notifyApplicationRequestComplete(data, responseCode, xhr) {
      return (0,_util__WEBPACK_IMPORTED_MODULE_6__.dispatch)('ajax:request-complete', {
        target: this.triggerEl,
        detail: {
          context: this.context,
          data: data,
          responseCode: responseCode,
          xhr: xhr
        }
      });
    }
  }, {
    key: "notifyApplicationBeforeValidate",
    value: function notifyApplicationBeforeValidate(message, fields) {
      return (0,_util__WEBPACK_IMPORTED_MODULE_6__.dispatch)('ajax:before-validate', {
        target: this.triggerEl,
        detail: {
          context: this.context,
          message: message,
          fields: fields
        }
      });
    }
  }, {
    key: "notifyApplicationBeforeReplace",
    value: function notifyApplicationBeforeReplace(target) {
      return (0,_util__WEBPACK_IMPORTED_MODULE_6__.dispatch)('ajax:before-replace', {
        target: target
      });
    } // Window-based events

  }, {
    key: "notifyApplicationBeforeSend",
    value: function notifyApplicationBeforeSend() {
      return (0,_util__WEBPACK_IMPORTED_MODULE_6__.dispatch)('ajax:before-send', {
        target: window,
        detail: {
          context: this.context
        }
      });
    }
  }, {
    key: "notifyApplicationUpdateComplete",
    value: function notifyApplicationUpdateComplete(data, responseCode, xhr) {
      return (0,_util__WEBPACK_IMPORTED_MODULE_6__.dispatch)('ajax:update-complete', {
        target: window,
        detail: {
          context: this.context,
          data: data,
          responseCode: responseCode,
          xhr: xhr
        }
      });
    }
  }, {
    key: "notifyApplicationFieldInvalid",
    value: function notifyApplicationFieldInvalid(element, fieldName, errorMsg, isFirst) {
      return (0,_util__WEBPACK_IMPORTED_MODULE_6__.dispatch)('ajax:invalid-field', {
        target: window,
        detail: {
          element: element,
          fieldName: fieldName,
          errorMsg: errorMsg,
          isFirst: isFirst
        }
      });
    }
  }, {
    key: "notifyApplicationConfirmMessage",
    value: function notifyApplicationConfirmMessage(message, promise) {
      return (0,_util__WEBPACK_IMPORTED_MODULE_6__.dispatch)('ajax:confirm-message', {
        target: window,
        detail: {
          message: message,
          promise: promise
        }
      });
    }
  }, {
    key: "notifyApplicationErrorMessage",
    value: function notifyApplicationErrorMessage(message) {
      return (0,_util__WEBPACK_IMPORTED_MODULE_6__.dispatch)('ajax:error-message', {
        target: window,
        detail: {
          message: message
        }
      });
    }
  }, {
    key: "notifyApplicationCustomEvent",
    value: function notifyApplicationCustomEvent(name, data) {
      return (0,_util__WEBPACK_IMPORTED_MODULE_6__.dispatch)(name, {
        target: this.el,
        detail: data
      });
    } // HTTP request delegate

  }, {
    key: "requestStarted",
    value: function requestStarted() {
      this.markAsProgress(true);
      this.toggleLoadingElement(true);

      if (this.options.progressBar) {
        this.showProgressBarAfterDelay();
      }

      this.actions.invoke('start', [this.request.xhr]);
    }
  }, {
    key: "requestProgressed",
    value: function requestProgressed(progress) {
      this.promise.notify(progress);
    }
  }, {
    key: "requestCompletedWithResponse",
    value: function requestCompletedWithResponse(response, statusCode) {
      this.actions.invoke('success', [response, statusCode, this.request.xhr]);
      this.actions.invoke('complete', [response, statusCode, this.request.xhr]);
      this.promise.resolve(response, statusCode, this.request.xhr);
    }
  }, {
    key: "requestFailedWithStatusCode",
    value: function requestFailedWithStatusCode(statusCode, response) {
      if (statusCode == _util_http_request__WEBPACK_IMPORTED_MODULE_3__.SystemStatusCode.userAborted) {
        this.actions.invoke('cancel', []);
      } else {
        this.actions.invoke('error', [response, statusCode, this.request.xhr]);
      }

      this.actions.invoke('complete', [response, statusCode, this.request.xhr]);
      this.promise.reject(response, statusCode, this.request.xhr);
    }
  }, {
    key: "requestFinished",
    value: function requestFinished() {
      this.markAsProgress(false);
      this.toggleLoadingElement(false);

      if (this.options.progressBar) {
        this.hideProgressBar();
      }
    } // Private

  }, {
    key: "initOtherElements",
    value: function initOtherElements() {
      if (typeof this.options.form === 'string') {
        this.formEl = document.querySelector(this.options.form);
      } else if (this.options.form) {
        this.formEl = this.options.form;
      } else {
        this.formEl = this.el && this.el !== document ? this.el.closest('form') : null;
      }

      this.triggerEl = this.formEl ? this.formEl : this.el;
      this.partialEl = this.el && this.el !== document ? this.el.closest('[data-ajax-partial]') : null;
      this.loadingEl = typeof this.options.loading === 'string' ? document.querySelector(this.options.loading) : this.options.loading;
    }
  }, {
    key: "preprocessOptions",
    value: function preprocessOptions() {
      // Partial mode
      if (this.options.partial === undefined && this.partialEl && this.partialEl.dataset.ajaxPartial !== undefined) {
        this.options.partial = this.partialEl.dataset.ajaxPartial || true;
      }
    }
  }, {
    key: "validateClientSideForm",
    value: function validateClientSideForm() {
      if (this.options.browserValidate && typeof document.createElement('input').reportValidity === 'function' && this.formEl && !this.formEl.checkValidity()) {
        this.formEl.reportValidity();
        return false;
      }

      return true;
    }
  }, {
    key: "toggleLoadingElement",
    value: function toggleLoadingElement(isLoading) {
      if (!this.loadingEl) {
        return;
      }

      if (typeof this.loadingEl.show !== 'function' || typeof this.loadingEl.hide !== 'function') {
        this.loadingEl.style.display = isLoading ? 'block' : 'none';
        return;
      }

      if (isLoading) {
        this.loadingEl.show();
      } else {
        this.loadingEl.hide();
      }
    }
  }, {
    key: "showProgressBarAfterDelay",
    value: function showProgressBarAfterDelay() {
      this.progressBar.setValue(0);
      this.progressBarTimeout = window.setTimeout(this.showProgressBar, this.options.progressBarDelay);
    }
  }, {
    key: "hideProgressBar",
    value: function hideProgressBar() {
      this.progressBar.setValue(100);
      this.progressBar.hide();

      if (this.progressBarTimeout != null) {
        window.clearTimeout(this.progressBarTimeout);
        delete this.progressBarTimeout;
      }
    }
  }, {
    key: "markAsProgress",
    value: function markAsProgress(isLoading) {
      if (isLoading) {
        document.documentElement.setAttribute('data-ajax-progress', '');

        if (this.formEl) {
          this.formEl.setAttribute('data-ajax-progress', this.handler);
        }
      } else {
        document.documentElement.removeAttribute('data-ajax-progress');

        if (this.formEl) {
          this.formEl.removeAttribute('data-ajax-progress');
        }
      }
    } // @todo v2: this needs to pass more than just "data"
    // perhaps { data, responseCode, headers }

  }, {
    key: "wrapInAsyncPromise",
    value: function wrapInAsyncPromise(requestPromise) {
      return new Promise(function (resolve, reject, onCancel) {
        requestPromise.fail(function (data) {
          reject(data);
        }).done(function (data) {
          resolve(data);
        });

        if (onCancel) {
          onCancel(function () {
            requestPromise.abort();
          });
        }
      });
    }
  }], [{
    key: "DEFAULTS",
    get: function get() {
      return {
        handler: null,
        update: {},
        files: false,
        bulk: false,
        download: false,
        browserTarget: null,
        browserValidate: false,
        browserRedirectBack: false,
        progressBarDelay: 500,
        progressBar: null
      };
    }
  }, {
    key: "send",
    value: function send(handler, options) {
      return new Request(document, handler, options).start();
    }
  }, {
    key: "sendElement",
    value: function sendElement(element, handler, options) {
      if (typeof element === 'string') {
        element = document.querySelector(element);
      }

      return new Request(element, handler, options).start();
    }
  }]);

  return Request;
}();

/***/ }),

/***/ "./src/turbo/browser-adapter.js":
/*!**************************************!*\
  !*** ./src/turbo/browser-adapter.js ***!
  \**************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "BrowserAdapter": () => (/* binding */ BrowserAdapter)
/* harmony export */ });
/* harmony import */ var _util_http_request__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../util/http-request */ "./src/util/http-request.js");
/* harmony import */ var _extras_progress_bar__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../extras/progress-bar */ "./src/extras/progress-bar.js");
/* harmony import */ var _util__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../util */ "./src/util/index.js");
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }




var BrowserAdapter = /*#__PURE__*/function () {
  function BrowserAdapter(controller) {
    var _this = this;

    _classCallCheck(this, BrowserAdapter);

    this.progressBar = new _extras_progress_bar__WEBPACK_IMPORTED_MODULE_1__.ProgressBar();

    this.showProgressBar = function () {
      _this.progressBar.show({
        cssClass: 'is-turbo'
      });
    };

    this.controller = controller;
  }

  _createClass(BrowserAdapter, [{
    key: "visitProposedToLocationWithAction",
    value: function visitProposedToLocationWithAction(location, action) {
      var restorationIdentifier = (0,_util__WEBPACK_IMPORTED_MODULE_2__.uuid)();
      this.controller.startVisitToLocationWithAction(location, action, restorationIdentifier);
    }
  }, {
    key: "visitStarted",
    value: function visitStarted(visit) {
      visit.issueRequest();
      visit.changeHistory();
      visit.goToSamePageAnchor();
      visit.loadCachedSnapshot();
    }
  }, {
    key: "visitRequestStarted",
    value: function visitRequestStarted(visit) {
      this.progressBar.setValue(0);

      if (visit.hasCachedSnapshot() || visit.action != 'restore') {
        this.showProgressBarAfterDelay();
      } else {
        this.showProgressBar();
      }
    }
  }, {
    key: "visitRequestProgressed",
    value: function visitRequestProgressed(visit) {
      this.progressBar.setValue(visit.progress);
    }
  }, {
    key: "visitRequestCompleted",
    value: function visitRequestCompleted(visit) {
      visit.loadResponse();
    }
  }, {
    key: "visitRequestFailedWithStatusCode",
    value: function visitRequestFailedWithStatusCode(visit, statusCode) {
      switch (statusCode) {
        case _util_http_request__WEBPACK_IMPORTED_MODULE_0__.SystemStatusCode.networkFailure:
        case _util_http_request__WEBPACK_IMPORTED_MODULE_0__.SystemStatusCode.timeoutFailure:
        case _util_http_request__WEBPACK_IMPORTED_MODULE_0__.SystemStatusCode.contentTypeMismatch:
        case _util_http_request__WEBPACK_IMPORTED_MODULE_0__.SystemStatusCode.userAborted:
          return this.reload();

        default:
          return visit.loadResponse();
      }
    }
  }, {
    key: "visitRequestFinished",
    value: function visitRequestFinished(visit) {
      this.hideProgressBar();
    }
  }, {
    key: "visitCompleted",
    value: function visitCompleted(visit) {
      visit.followRedirect();
    }
  }, {
    key: "pageInvalidated",
    value: function pageInvalidated() {
      this.reload();
    }
  }, {
    key: "visitFailed",
    value: function visitFailed(visit) {}
  }, {
    key: "visitRendered",
    value: function visitRendered(visit) {} // Private

  }, {
    key: "showProgressBarAfterDelay",
    value: function showProgressBarAfterDelay() {
      if (this.controller.progressBarVisible) {
        this.progressBarTimeout = window.setTimeout(this.showProgressBar, this.controller.progressBarDelay);
      }
    }
  }, {
    key: "hideProgressBar",
    value: function hideProgressBar() {
      if (this.controller.progressBarVisible) {
        this.progressBar.hide();

        if (this.progressBarTimeout !== null) {
          window.clearTimeout(this.progressBarTimeout);
          delete this.progressBarTimeout;
        }
      }
    }
  }, {
    key: "reload",
    value: function reload() {
      window.location.reload();
    }
  }]);

  return BrowserAdapter;
}();

/***/ }),

/***/ "./src/turbo/controller.js":
/*!*********************************!*\
  !*** ./src/turbo/controller.js ***!
  \*********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Controller": () => (/* binding */ Controller)
/* harmony export */ });
/* harmony import */ var _browser_adapter__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./browser-adapter */ "./src/turbo/browser-adapter.js");
/* harmony import */ var _history__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./history */ "./src/turbo/history.js");
/* harmony import */ var _location__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./location */ "./src/turbo/location.js");
/* harmony import */ var _scroll_manager__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./scroll-manager */ "./src/turbo/scroll-manager.js");
/* harmony import */ var _snapshot_cache__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./snapshot-cache */ "./src/turbo/snapshot-cache.js");
/* harmony import */ var _util__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../util */ "./src/util/index.js");
/* harmony import */ var _view__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./view */ "./src/turbo/view.js");
/* harmony import */ var _visit__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./visit */ "./src/turbo/visit.js");
function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }









var Controller = /*#__PURE__*/function () {
  function Controller() {
    var _this = this;

    _classCallCheck(this, Controller);

    this.adapter = new _browser_adapter__WEBPACK_IMPORTED_MODULE_0__.BrowserAdapter(this);
    this.history = new _history__WEBPACK_IMPORTED_MODULE_1__.History(this);
    this.restorationData = {};
    this.scrollManager = new _scroll_manager__WEBPACK_IMPORTED_MODULE_3__.ScrollManager(this);
    this.useScroll = true;
    this.view = new _view__WEBPACK_IMPORTED_MODULE_6__.View(this);
    this.cache = new _snapshot_cache__WEBPACK_IMPORTED_MODULE_4__.SnapshotCache(10);
    this.enabled = true;
    this.pendingAssets = 0;
    this.progressBarDelay = 500;
    this.progressBarVisible = true;
    this.started = false;
    this.uniqueInlineScripts = [];
    this.currentVisit = null;
    this.historyVisit = null;
    this.pageIsReady = false; // Event handlers

    this.pageLoaded = function () {
      _this.pageIsReady = true;
      _this.lastRenderedLocation = _this.location;

      _this.notifyApplicationAfterPageLoad();

      _this.notifyApplicationAfterPageAndScriptsLoad();

      _this.observeInlineScripts();
    };

    this.clickCaptured = function () {
      removeEventListener('click', _this.clickBubbled, false);
      addEventListener('click', _this.clickBubbled, false);
    };

    this.clickBubbled = function (event) {
      if (_this.enabled && _this.clickEventIsSignificant(event)) {
        var link = _this.getVisitableLinkForTarget(event.target);

        if (link) {
          var location = _this.getVisitableLocationForLink(link);

          if (location && _this.applicationAllowsFollowingLinkToLocation(link, location)) {
            event.preventDefault();

            var action = _this.getActionForLink(link);

            var scroll = _this.useScrollForLink(link);

            _this.visit(location, {
              action: action,
              scroll: scroll
            });
          }
        }
      }
    };
  }

  _createClass(Controller, [{
    key: "start",
    value: function start() {
      if (Controller.supported && !this.started) {
        addEventListener('click', this.clickCaptured, true);
        addEventListener('DOMContentLoaded', this.pageLoaded, false);
        this.scrollManager.start();
        this.startHistory();
        this.started = true;
        this.enabled = this.documentIsEnabled();
      }
    }
  }, {
    key: "disable",
    value: function disable() {
      this.enabled = false;
    }
  }, {
    key: "stop",
    value: function stop() {
      if (this.started) {
        removeEventListener('click', this.clickCaptured, true);
        removeEventListener('DOMContentLoaded', this.pageLoaded, false);
        this.scrollManager.stop();
        this.stopHistory();
        this.started = false;
      }
    }
  }, {
    key: "isEnabled",
    value: function isEnabled() {
      return this.started && this.enabled;
    }
  }, {
    key: "pageReady",
    value: function pageReady() {
      var _this2 = this;

      return new Promise(function (resolve) {
        if (!_this2.pageIsReady) {
          addEventListener('render', function () {
            return resolve();
          }, {
            once: true
          });
        } else {
          resolve();
        }
      });
    }
  }, {
    key: "clearCache",
    value: function clearCache() {
      this.cache = new _snapshot_cache__WEBPACK_IMPORTED_MODULE_4__.SnapshotCache(10);
    }
  }, {
    key: "visit",
    value: function visit(location) {
      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      location = _location__WEBPACK_IMPORTED_MODULE_2__.Location.wrap(location);
      var action = options.action || 'advance';

      if (this.applicationAllowsVisitingLocation(location, action)) {
        if (this.locationIsVisitable(location)) {
          this.useScroll = options.scroll !== false;
          this.adapter.visitProposedToLocationWithAction(location, action);
        } else {
          window.location.href = location.toString();
        }
      }
    }
  }, {
    key: "startVisitToLocationWithAction",
    value: function startVisitToLocationWithAction(location, action, restorationIdentifier) {
      if (Controller.supported) {
        var restorationData = this.getRestorationDataForIdentifier(restorationIdentifier);
        this.startVisit(_location__WEBPACK_IMPORTED_MODULE_2__.Location.wrap(location), action, {
          restorationData: restorationData
        });
      } else {
        window.location.href = location.toString();
      }
    }
  }, {
    key: "setProgressBarVisible",
    value: function setProgressBarVisible(value) {
      this.progressBarVisible = value;
    }
  }, {
    key: "setProgressBarDelay",
    value: function setProgressBarDelay(delay) {
      this.progressBarDelay = delay;
    } // History

  }, {
    key: "startHistory",
    value: function startHistory() {
      this.location = _location__WEBPACK_IMPORTED_MODULE_2__.Location.currentLocation;
      this.restorationIdentifier = (0,_util__WEBPACK_IMPORTED_MODULE_5__.uuid)();
      this.history.start();
      this.history.replace(this.location, this.restorationIdentifier);
    }
  }, {
    key: "stopHistory",
    value: function stopHistory() {
      this.history.stop();
    }
  }, {
    key: "getLastVisitUrl",
    value: function getLastVisitUrl() {
      if (this.historyVisit) {
        return this.historyVisit.referrer.absoluteURL;
      }
    }
  }, {
    key: "pushHistoryWithLocationAndRestorationIdentifier",
    value: function pushHistoryWithLocationAndRestorationIdentifier(locatable, restorationIdentifier) {
      this.historyVisit = this.currentVisit;
      this.location = _location__WEBPACK_IMPORTED_MODULE_2__.Location.wrap(locatable);
      this.restorationIdentifier = restorationIdentifier;
      this.history.push(this.location, this.restorationIdentifier);
    }
  }, {
    key: "replaceHistoryWithLocationAndRestorationIdentifier",
    value: function replaceHistoryWithLocationAndRestorationIdentifier(locatable, restorationIdentifier) {
      this.location = _location__WEBPACK_IMPORTED_MODULE_2__.Location.wrap(locatable);
      this.restorationIdentifier = restorationIdentifier;
      this.history.replace(this.location, this.restorationIdentifier);
    } // History delegate

  }, {
    key: "historyPoppedToLocationWithRestorationIdentifier",
    value: function historyPoppedToLocationWithRestorationIdentifier(location, restorationIdentifier) {
      if (this.enabled) {
        this.location = location;
        this.restorationIdentifier = restorationIdentifier;
        var restorationData = this.getRestorationDataForIdentifier(restorationIdentifier);
        this.startVisit(location, 'restore', {
          restorationIdentifier: restorationIdentifier,
          restorationData: restorationData,
          historyChanged: true
        });
      } else {
        this.adapter.pageInvalidated();
      }
    } // Snapshot cache

  }, {
    key: "getCachedSnapshotForLocation",
    value: function getCachedSnapshotForLocation(location) {
      var snapshot = this.cache.get(location);
      return snapshot ? snapshot.clone() : snapshot;
    }
  }, {
    key: "shouldCacheSnapshot",
    value: function shouldCacheSnapshot() {
      return this.view.getSnapshot().isCacheable();
    }
  }, {
    key: "cacheSnapshot",
    value: function cacheSnapshot() {
      var _this3 = this;

      if (this.shouldCacheSnapshot()) {
        this.notifyApplicationBeforeCachingSnapshot();
        var snapshot = this.view.getSnapshot();
        var location = this.lastRenderedLocation || _location__WEBPACK_IMPORTED_MODULE_2__.Location.currentLocation;
        (0,_util__WEBPACK_IMPORTED_MODULE_5__.defer)(function () {
          return _this3.cache.put(location, snapshot.clone());
        });
      }
    } // Scrolling

  }, {
    key: "scrollToAnchor",
    value: function scrollToAnchor(anchor) {
      var element = this.view.getElementForAnchor(anchor);

      if (element) {
        this.scrollToElement(element);
      } else {
        this.scrollToPosition({
          x: 0,
          y: 0
        });
      }
    }
  }, {
    key: "scrollToElement",
    value: function scrollToElement(element) {
      this.scrollManager.scrollToElement(element);
    }
  }, {
    key: "scrollToPosition",
    value: function scrollToPosition(position) {
      this.scrollManager.scrollToPosition(position);
    } // Scroll manager delegate

  }, {
    key: "scrollPositionChanged",
    value: function scrollPositionChanged(position) {
      var restorationData = this.getCurrentRestorationData();
      restorationData.scrollPosition = position;
    } // Pending asset management

  }, {
    key: "incrementPendingAsset",
    value: function incrementPendingAsset() {
      this.pendingAssets++;
    }
  }, {
    key: "decrementPendingAsset",
    value: function decrementPendingAsset() {
      this.pendingAssets--;

      if (this.pendingAssets === 0) {
        this.pageIsReady = true;
        this.notifyApplicationAfterPageAndScriptsLoad();
        this.notifyApplicationAfterLoadScripts();
      }
    } // View

  }, {
    key: "render",
    value: function render(options, callback) {
      this.view.render(options, callback);
    }
  }, {
    key: "viewInvalidated",
    value: function viewInvalidated() {
      this.adapter.pageInvalidated();
    }
  }, {
    key: "viewAllowsImmediateRender",
    value: function viewAllowsImmediateRender(newBody, options) {
      this.pageIsReady = false;
      this.notifyApplicationUnload();
      var event = this.notifyApplicationBeforeRender(newBody, options);
      return !event.defaultPrevented;
    }
  }, {
    key: "viewRendered",
    value: function viewRendered() {
      this.lastRenderedLocation = this.currentVisit.location;
      this.notifyApplicationAfterRender();
    } // Inline script monitoring

  }, {
    key: "observeInlineScripts",
    value: function observeInlineScripts() {
      var _this4 = this;

      document.documentElement.querySelectorAll('script[data-turbo-eval-once]').forEach(function (el) {
        return _this4.applicationHasSeenInlineScript(el);
      });
    }
  }, {
    key: "applicationHasSeenInlineScript",
    value: function applicationHasSeenInlineScript(element) {
      var uid = element.getAttribute('data-turbo-eval-once');

      if (!uid) {
        return false;
      }

      var hasSeen = !!this.uniqueInlineScripts[uid];
      this.uniqueInlineScripts[uid] = true;
      return hasSeen;
    } // Application events

  }, {
    key: "applicationAllowsFollowingLinkToLocation",
    value: function applicationAllowsFollowingLinkToLocation(link, location) {
      var event = this.notifyApplicationAfterClickingLinkToLocation(link, location);
      return !event.defaultPrevented;
    }
  }, {
    key: "applicationAllowsVisitingLocation",
    value: function applicationAllowsVisitingLocation(location, action) {
      var event = this.notifyApplicationBeforeVisitingLocation(location, action);
      return !event.defaultPrevented;
    }
  }, {
    key: "notifyApplicationAfterClickingLinkToLocation",
    value: function notifyApplicationAfterClickingLinkToLocation(link, location) {
      return (0,_util__WEBPACK_IMPORTED_MODULE_5__.dispatch)('page:click', {
        target: link,
        detail: {
          url: location.absoluteURL
        }
      });
    }
  }, {
    key: "notifyApplicationBeforeVisitingLocation",
    value: function notifyApplicationBeforeVisitingLocation(location, action) {
      return (0,_util__WEBPACK_IMPORTED_MODULE_5__.dispatch)('page:before-visit', {
        detail: {
          url: location.absoluteURL,
          action: action
        }
      });
    }
  }, {
    key: "notifyApplicationAfterVisitingLocation",
    value: function notifyApplicationAfterVisitingLocation(location) {
      return (0,_util__WEBPACK_IMPORTED_MODULE_5__.dispatch)('page:visit', {
        detail: {
          url: location.absoluteURL
        },
        cancelable: false
      });
    }
  }, {
    key: "notifyApplicationBeforeCachingSnapshot",
    value: function notifyApplicationBeforeCachingSnapshot() {
      return (0,_util__WEBPACK_IMPORTED_MODULE_5__.dispatch)('page:before-cache', {
        cancelable: false
      });
    }
  }, {
    key: "notifyApplicationBeforeRender",
    value: function notifyApplicationBeforeRender(newBody, options) {
      return (0,_util__WEBPACK_IMPORTED_MODULE_5__.dispatch)('page:before-render', {
        detail: _objectSpread({
          newBody: newBody
        }, options)
      });
    }
  }, {
    key: "notifyApplicationAfterRender",
    value: function notifyApplicationAfterRender() {
      return (0,_util__WEBPACK_IMPORTED_MODULE_5__.dispatch)('page:render', {
        cancelable: false
      });
    }
  }, {
    key: "notifyApplicationAfterPageLoad",
    value: function notifyApplicationAfterPageLoad() {
      var timing = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      return (0,_util__WEBPACK_IMPORTED_MODULE_5__.dispatch)('page:load', {
        detail: {
          url: this.location.absoluteURL,
          timing: timing
        },
        cancelable: false
      });
    }
  }, {
    key: "notifyApplicationAfterPageAndScriptsLoad",
    value: function notifyApplicationAfterPageAndScriptsLoad() {
      return (0,_util__WEBPACK_IMPORTED_MODULE_5__.dispatch)('page:loaded', {
        cancelable: false
      });
    }
  }, {
    key: "notifyApplicationAfterLoadScripts",
    value: function notifyApplicationAfterLoadScripts() {
      return (0,_util__WEBPACK_IMPORTED_MODULE_5__.dispatch)('page:updated', {
        cancelable: false
      });
    }
  }, {
    key: "notifyApplicationUnload",
    value: function notifyApplicationUnload() {
      return (0,_util__WEBPACK_IMPORTED_MODULE_5__.dispatch)('page:unload', {
        cancelable: false
      });
    } // Private

  }, {
    key: "startVisit",
    value: function startVisit(location, action, properties) {
      if (this.currentVisit) {
        this.currentVisit.cancel();
      }

      this.currentVisit = this.createVisit(location, action, properties);
      this.currentVisit.scrolled = !this.useScroll;
      this.currentVisit.start();
      this.notifyApplicationAfterVisitingLocation(location);
    }
  }, {
    key: "createVisit",
    value: function createVisit(location, action, properties) {
      var visit = new _visit__WEBPACK_IMPORTED_MODULE_7__.Visit(this, location, action, properties.restorationIdentifier);
      visit.restorationData = Object.assign({}, properties.restorationData || {});
      visit.historyChanged = !!properties.historyChanged;
      visit.referrer = this.location;
      return visit;
    }
  }, {
    key: "visitCompleted",
    value: function visitCompleted(visit) {
      this.notifyApplicationAfterPageLoad(visit.getTimingMetrics());

      if (this.pendingAssets === 0) {
        this.pageIsReady = true;
        this.notifyApplicationAfterPageAndScriptsLoad();
        this.notifyApplicationAfterLoadScripts();
      }
    }
  }, {
    key: "clickEventIsSignificant",
    value: function clickEventIsSignificant(event) {
      return !(event.target && event.target.isContentEditable || event.defaultPrevented || event.which > 1 || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey);
    }
  }, {
    key: "getVisitableLinkForTarget",
    value: function getVisitableLinkForTarget(target) {
      if (target instanceof Element && this.elementIsVisitable(target)) {
        var container = target.closest('a[href]:not([download])');

        if (container && container.getAttribute('target') && container.getAttribute('target') != '_self') {
          return null;
        }

        return container;
      }
    }
  }, {
    key: "getVisitableLocationForLink",
    value: function getVisitableLocationForLink(link) {
      var location = new _location__WEBPACK_IMPORTED_MODULE_2__.Location(link.getAttribute('href') || '');

      if (this.locationIsVisitable(location)) {
        return location;
      }
    }
  }, {
    key: "getActionForLink",
    value: function getActionForLink(link) {
      var action = link.getAttribute('data-turbo-action');
      return this.isAction(action) ? action : 'advance';
    }
  }, {
    key: "useScrollForLink",
    value: function useScrollForLink(link) {
      return link.getAttribute('data-turbo-no-scroll') === null;
    }
  }, {
    key: "isAction",
    value: function isAction(action) {
      return action == 'advance' || action == 'replace' || action == 'restore' || action == 'swap';
    }
  }, {
    key: "documentIsEnabled",
    value: function documentIsEnabled() {
      var meta = document.documentElement.querySelector('head meta[name="turbo-visit-control"]');

      if (meta) {
        return meta.getAttribute('content') != 'disable';
      }

      return true;
    }
  }, {
    key: "elementIsVisitable",
    value: function elementIsVisitable(element) {
      var container = element.closest('[data-turbo]');

      if (container) {
        return container.getAttribute('data-turbo') != 'false';
      } else {
        return true;
      }
    }
  }, {
    key: "locationIsVisitable",
    value: function locationIsVisitable(location) {
      return location.isPrefixedBy(this.view.getRootLocation()) && location.isHTML();
    }
  }, {
    key: "locationIsSamePageAnchor",
    value: function locationIsSamePageAnchor(location) {
      return typeof location.anchor != 'undefined' && location.requestURL == this.location.requestURL;
    }
  }, {
    key: "getCurrentRestorationData",
    value: function getCurrentRestorationData() {
      return this.getRestorationDataForIdentifier(this.restorationIdentifier);
    }
  }, {
    key: "getRestorationDataForIdentifier",
    value: function getRestorationDataForIdentifier(identifier) {
      if (!(identifier in this.restorationData)) {
        this.restorationData[identifier] = {};
      }

      return this.restorationData[identifier];
    }
  }]);

  return Controller;
}();
Controller.supported = !!(window.history.pushState && window.requestAnimationFrame && window.addEventListener);

/***/ }),

/***/ "./src/turbo/error-renderer.js":
/*!*************************************!*\
  !*** ./src/turbo/error-renderer.js ***!
  \*************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "ErrorRenderer": () => (/* binding */ ErrorRenderer)
/* harmony export */ });
/* harmony import */ var _renderer__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./renderer */ "./src/turbo/renderer.js");
/* harmony import */ var _util__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../util */ "./src/util/index.js");
function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }

function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); Object.defineProperty(subClass, "prototype", { writable: false }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } else if (call !== void 0) { throw new TypeError("Derived constructors may only return object or undefined"); } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }



var ErrorRenderer = /*#__PURE__*/function (_Renderer) {
  _inherits(ErrorRenderer, _Renderer);

  var _super = _createSuper(ErrorRenderer);

  function ErrorRenderer(delegate, html) {
    var _this;

    _classCallCheck(this, ErrorRenderer);

    _this = _super.call(this);
    _this.delegate = delegate;

    _this.htmlElement = function () {
      var htmlElement = document.createElement('html');
      htmlElement.innerHTML = html;
      return htmlElement;
    }();

    _this.newHead = _this.htmlElement.querySelector('head') || document.createElement('head');
    _this.newBody = _this.htmlElement.querySelector('body') || document.createElement('body');
    return _this;
  }

  _createClass(ErrorRenderer, [{
    key: "render",
    value: function render(callback) {
      var _this2 = this;

      this.renderView(function () {
        _this2.replaceHeadAndBody();

        _this2.activateBodyScriptElements();

        callback();
      });
    }
  }, {
    key: "replaceHeadAndBody",
    value: function replaceHeadAndBody() {
      var _document = document,
          documentElement = _document.documentElement,
          head = _document.head,
          body = _document.body;
      documentElement.replaceChild(this.newHead, head);
      documentElement.replaceChild(this.newBody, body);
    }
  }, {
    key: "activateBodyScriptElements",
    value: function activateBodyScriptElements() {
      var _iterator = _createForOfIteratorHelper(this.getScriptElements()),
          _step;

      try {
        for (_iterator.s(); !(_step = _iterator.n()).done;) {
          var replaceableElement = _step.value;
          var parentNode = replaceableElement.parentNode;

          if (parentNode) {
            var element = this.createScriptElement(replaceableElement);
            parentNode.replaceChild(element, replaceableElement);
          }
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }
    }
  }, {
    key: "getScriptElements",
    value: function getScriptElements() {
      return (0,_util__WEBPACK_IMPORTED_MODULE_1__.array)(document.documentElement.querySelectorAll('script'));
    }
  }], [{
    key: "render",
    value: function render(delegate, callback, html) {
      return new this(delegate, html).render(callback);
    }
  }]);

  return ErrorRenderer;
}(_renderer__WEBPACK_IMPORTED_MODULE_0__.Renderer);

/***/ }),

/***/ "./src/turbo/head-details.js":
/*!***********************************!*\
  !*** ./src/turbo/head-details.js ***!
  \***********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "HeadDetails": () => (/* binding */ HeadDetails)
/* harmony export */ });
/* harmony import */ var _util__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../util */ "./src/util/index.js");
function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _iterableToArrayLimit(arr, i) { var _i = arr == null ? null : typeof Symbol !== "undefined" && arr[Symbol.iterator] || arr["@@iterator"]; if (_i == null) return; var _arr = []; var _n = true; var _d = false; var _s, _e; try { for (_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }


var HeadDetails = /*#__PURE__*/function () {
  function HeadDetails(children) {
    _classCallCheck(this, HeadDetails);

    this.detailsByOuterHTML = children.reduce(function (result, element) {
      var outerHTML = element.outerHTML;
      var details = outerHTML in result ? result[outerHTML] : {
        type: elementType(element),
        tracked: elementIsTracked(element),
        elements: []
      };
      return Object.assign(Object.assign({}, result), _defineProperty({}, outerHTML, Object.assign(Object.assign({}, details), {
        elements: [].concat(_toConsumableArray(details.elements), [element])
      })));
    }, {});
  }

  _createClass(HeadDetails, [{
    key: "getTrackedElementSignature",
    value: function getTrackedElementSignature() {
      var _this = this;

      return Object.keys(this.detailsByOuterHTML).filter(function (outerHTML) {
        return _this.detailsByOuterHTML[outerHTML].tracked;
      }).join("");
    }
  }, {
    key: "getScriptElementsNotInDetails",
    value: function getScriptElementsNotInDetails(headDetails) {
      return this.getElementsMatchingTypeNotInDetails('script', headDetails);
    }
  }, {
    key: "getStylesheetElementsNotInDetails",
    value: function getStylesheetElementsNotInDetails(headDetails) {
      return this.getElementsMatchingTypeNotInDetails('stylesheet', headDetails);
    }
  }, {
    key: "getElementsMatchingTypeNotInDetails",
    value: function getElementsMatchingTypeNotInDetails(matchedType, headDetails) {
      var _this2 = this;

      return Object.keys(this.detailsByOuterHTML).filter(function (outerHTML) {
        return !(outerHTML in headDetails.detailsByOuterHTML);
      }).map(function (outerHTML) {
        return _this2.detailsByOuterHTML[outerHTML];
      }).filter(function (_ref) {
        var type = _ref.type;
        return type == matchedType;
      }).map(function (_ref2) {
        var _ref2$elements = _slicedToArray(_ref2.elements, 1),
            element = _ref2$elements[0];

        return element;
      });
    }
  }, {
    key: "getProvisionalElements",
    value: function getProvisionalElements() {
      var _this3 = this;

      return Object.keys(this.detailsByOuterHTML).reduce(function (result, outerHTML) {
        var _this3$detailsByOuter = _this3.detailsByOuterHTML[outerHTML],
            type = _this3$detailsByOuter.type,
            tracked = _this3$detailsByOuter.tracked,
            elements = _this3$detailsByOuter.elements;

        if (type == null && !tracked) {
          return [].concat(_toConsumableArray(result), _toConsumableArray(elements));
        } else if (elements.length > 1) {
          return [].concat(_toConsumableArray(result), _toConsumableArray(elements.slice(1)));
        } else {
          return result;
        }
      }, []);
    }
  }, {
    key: "getMetaValue",
    value: function getMetaValue(name) {
      var element = this.findMetaElementByName(name);
      return element ? element.getAttribute('content') : null;
    }
  }, {
    key: "findMetaElementByName",
    value: function findMetaElementByName(name) {
      var _this4 = this;

      return Object.keys(this.detailsByOuterHTML).reduce(function (result, outerHTML) {
        var _this4$detailsByOuter = _slicedToArray(_this4.detailsByOuterHTML[outerHTML].elements, 1),
            element = _this4$detailsByOuter[0];

        return elementIsMetaElementWithName(element, name) ? element : result;
      }, undefined);
    }
  }], [{
    key: "fromHeadElement",
    value: function fromHeadElement(headElement) {
      var children = headElement ? (0,_util__WEBPACK_IMPORTED_MODULE_0__.array)(headElement.children) : [];
      return new this(children);
    }
  }]);

  return HeadDetails;
}();

function elementType(element) {
  if (elementIsScript(element)) {
    return 'script';
  } else if (elementIsStylesheet(element)) {
    return 'stylesheet';
  }
}

function elementIsTracked(element) {
  return element.getAttribute('data-turbo-track') == 'reload';
}

function elementIsScript(element) {
  var tagName = element.tagName.toLowerCase();
  return tagName == 'script';
}

function elementIsStylesheet(element) {
  var tagName = element.tagName.toLowerCase();
  return tagName == 'style' || tagName == 'link' && element.getAttribute('rel') == 'stylesheet';
}

function elementIsMetaElementWithName(element, name) {
  var tagName = element.tagName.toLowerCase();
  return tagName == 'meta' && element.getAttribute('name') == name;
}

/***/ }),

/***/ "./src/turbo/history.js":
/*!******************************!*\
  !*** ./src/turbo/history.js ***!
  \******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "History": () => (/* binding */ History)
/* harmony export */ });
/* harmony import */ var _location__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./location */ "./src/turbo/location.js");
/* harmony import */ var _util__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../util */ "./src/util/index.js");
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }



var History = /*#__PURE__*/function () {
  function History(delegate) {
    var _this = this;

    _classCallCheck(this, History);

    this.started = false;
    this.pageLoaded = false; // Event handlers

    this.onPopState = function (event) {
      if (!_this.shouldHandlePopState()) {
        return;
      }

      if (!event.state || !event.state.ajaxTurbo) {
        return;
      }

      var ajaxTurbo = event.state.ajaxTurbo;
      var location = _location__WEBPACK_IMPORTED_MODULE_0__.Location.currentLocation;
      var restorationIdentifier = ajaxTurbo.restorationIdentifier;

      _this.delegate.historyPoppedToLocationWithRestorationIdentifier(location, restorationIdentifier);
    };

    this.onPageLoad = function (event) {
      (0,_util__WEBPACK_IMPORTED_MODULE_1__.defer)(function () {
        _this.pageLoaded = true;
      });
    };

    this.delegate = delegate;
  }

  _createClass(History, [{
    key: "start",
    value: function start() {
      if (!this.started) {
        addEventListener('popstate', this.onPopState, false);
        addEventListener('load', this.onPageLoad, false);
        this.started = true;
      }
    }
  }, {
    key: "stop",
    value: function stop() {
      if (this.started) {
        removeEventListener('popstate', this.onPopState, false);
        removeEventListener('load', this.onPageLoad, false);
        this.started = false;
      }
    }
  }, {
    key: "push",
    value: function push(location, restorationIdentifier) {
      this.update(history.pushState, location, restorationIdentifier);
    }
  }, {
    key: "replace",
    value: function replace(location, restorationIdentifier) {
      this.update(history.replaceState, location, restorationIdentifier);
    } // Private

  }, {
    key: "shouldHandlePopState",
    value: function shouldHandlePopState() {
      // Safari dispatches a popstate event after window's load event, ignore it
      return this.pageIsLoaded();
    }
  }, {
    key: "pageIsLoaded",
    value: function pageIsLoaded() {
      return this.pageLoaded || document.readyState == 'complete';
    }
  }, {
    key: "update",
    value: function update(method, location, restorationIdentifier) {
      var state = {
        ajaxTurbo: {
          restorationIdentifier: restorationIdentifier
        }
      };
      method.call(history, state, '', location.absoluteURL);
    }
  }]);

  return History;
}();

/***/ }),

/***/ "./src/turbo/index.js":
/*!****************************!*\
  !*** ./src/turbo/index.js ***!
  \****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _namespace__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./namespace */ "./src/turbo/namespace.js");
function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }


/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (_namespace__WEBPACK_IMPORTED_MODULE_0__["default"]);

if (!window.oc) {
  window.oc = {};
}

if (!window.oc.AjaxTurbo) {
  // Namespace
  window.oc.AjaxTurbo = _namespace__WEBPACK_IMPORTED_MODULE_0__["default"]; // Visit helper

  window.oc.visit = _namespace__WEBPACK_IMPORTED_MODULE_0__["default"].visit; // Enabled helper

  window.oc.useTurbo = _namespace__WEBPACK_IMPORTED_MODULE_0__["default"].isEnabled; // Page ready helper

  window.oc.pageReady = _namespace__WEBPACK_IMPORTED_MODULE_0__["default"].pageReady; // Boot controller

  if (!isAMD() && !isCommonJS()) {
    _namespace__WEBPACK_IMPORTED_MODULE_0__["default"].start();
  }
}

function isAMD() {
  return typeof define == "function" && __webpack_require__.amdO;
}

function isCommonJS() {
  return (typeof exports === "undefined" ? "undefined" : _typeof(exports)) == "object" && "object" != "undefined";
}

/***/ }),

/***/ "./src/turbo/location.js":
/*!*******************************!*\
  !*** ./src/turbo/location.js ***!
  \*******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Location": () => (/* binding */ Location)
/* harmony export */ });
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }

var Location = /*#__PURE__*/function () {
  function Location(url) {
    _classCallCheck(this, Location);

    var linkWithAnchor = document.createElement('a');
    linkWithAnchor.href = url;
    this.absoluteURL = linkWithAnchor.href;
    var anchorLength = linkWithAnchor.hash.length;

    if (anchorLength < 2) {
      this.requestURL = this.absoluteURL;
    } else {
      this.requestURL = this.absoluteURL.slice(0, -anchorLength);
      this.anchor = linkWithAnchor.hash.slice(1);
    }
  }

  _createClass(Location, [{
    key: "getOrigin",
    value: function getOrigin() {
      return this.absoluteURL.split("/", 3).join("/");
    }
  }, {
    key: "getPath",
    value: function getPath() {
      return (this.requestURL.match(/\/\/[^/]*(\/[^?;]*)/) || [])[1] || "/";
    }
  }, {
    key: "getPathComponents",
    value: function getPathComponents() {
      return this.getPath().split("/").slice(1);
    }
  }, {
    key: "getLastPathComponent",
    value: function getLastPathComponent() {
      return this.getPathComponents().slice(-1)[0];
    }
  }, {
    key: "getExtension",
    value: function getExtension() {
      return (this.getLastPathComponent().match(/\.[^.]*$/) || [])[0] || "";
    }
  }, {
    key: "isHTML",
    value: function isHTML() {
      return this.getExtension().match(/^(?:|\.(?:htm|html|xhtml))$/);
    }
  }, {
    key: "isPrefixedBy",
    value: function isPrefixedBy(location) {
      var prefixURL = getPrefixURL(location);
      return this.isEqualTo(location) || stringStartsWith(this.absoluteURL, prefixURL);
    }
  }, {
    key: "isEqualTo",
    value: function isEqualTo(location) {
      return location && this.absoluteURL === location.absoluteURL;
    }
  }, {
    key: "toCacheKey",
    value: function toCacheKey() {
      return this.requestURL;
    }
  }, {
    key: "toJSON",
    value: function toJSON() {
      return this.absoluteURL;
    }
  }, {
    key: "toString",
    value: function toString() {
      return this.absoluteURL;
    }
  }, {
    key: "valueOf",
    value: function valueOf() {
      return this.absoluteURL;
    }
  }], [{
    key: "currentLocation",
    get: function get() {
      return this.wrap(window.location.toString());
    }
  }, {
    key: "wrap",
    value: function wrap(locatable) {
      if (typeof locatable == 'string') {
        return new Location(locatable);
      } else if (locatable != null) {
        return locatable;
      }
    }
  }]);

  return Location;
}();

function getPrefixURL(location) {
  return addTrailingSlash(location.getOrigin() + location.getPath());
}

function addTrailingSlash(url) {
  return stringEndsWith(url, "/") ? url : url + "/";
}

function stringStartsWith(string, prefix) {
  return string.slice(0, prefix.length) === prefix;
}

function stringEndsWith(string, suffix) {
  return string.slice(-suffix.length) === suffix;
}

/***/ }),

/***/ "./src/turbo/namespace.js":
/*!********************************!*\
  !*** ./src/turbo/namespace.js ***!
  \********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _controller__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./controller */ "./src/turbo/controller.js");

var controller = new _controller__WEBPACK_IMPORTED_MODULE_0__.Controller();
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({
  get supported() {
    return _controller__WEBPACK_IMPORTED_MODULE_0__.Controller.supported;
  },

  controller: controller,
  visit: function visit(location, options) {
    controller.visit(location, options);
  },
  clearCache: function clearCache() {
    controller.clearCache();
  },
  setProgressBarVisible: function setProgressBarVisible(value) {
    controller.setProgressBarVisible(value);
  },
  setProgressBarDelay: function setProgressBarDelay(delay) {
    controller.setProgressBarDelay(delay);
  },
  start: function start() {
    controller.start();
  },
  isEnabled: function isEnabled() {
    return controller.isEnabled();
  },
  pageReady: function pageReady() {
    return controller.pageReady();
  }
});

/***/ }),

/***/ "./src/turbo/renderer.js":
/*!*******************************!*\
  !*** ./src/turbo/renderer.js ***!
  \*******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Renderer": () => (/* binding */ Renderer)
/* harmony export */ });
/* harmony import */ var _util__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../util */ "./src/util/index.js");
function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }


var Renderer = /*#__PURE__*/function () {
  function Renderer() {
    _classCallCheck(this, Renderer);
  }

  _createClass(Renderer, [{
    key: "renderView",
    value: function renderView(callback) {
      var _this = this;

      var renderInterception = function renderInterception() {
        callback();

        _this.delegate.viewRendered(_this.newBody);
      };

      var options = {
        resume: renderInterception
      };
      var immediateRender = this.delegate.viewAllowsImmediateRender(this.newBody, options);

      if (immediateRender) {
        renderInterception();
      }
    }
  }, {
    key: "invalidateView",
    value: function invalidateView() {
      this.delegate.viewInvalidated();
    }
  }, {
    key: "createScriptElement",
    value: function createScriptElement(element) {
      if (element.getAttribute('data-turbo-eval') === 'false' || this.delegate.applicationHasSeenInlineScript(element)) {
        return element;
      }

      var createdScriptElement = document.createElement('script');
      createdScriptElement.textContent = element.textContent;
      createdScriptElement.async = false;
      copyElementAttributes(createdScriptElement, element);
      return createdScriptElement;
    }
  }]);

  return Renderer;
}();

function copyElementAttributes(destinationElement, sourceElement) {
  var _iterator = _createForOfIteratorHelper((0,_util__WEBPACK_IMPORTED_MODULE_0__.array)(sourceElement.attributes)),
      _step;

  try {
    for (_iterator.s(); !(_step = _iterator.n()).done;) {
      var _step$value = _step.value,
          name = _step$value.name,
          value = _step$value.value;
      destinationElement.setAttribute(name, value);
    }
  } catch (err) {
    _iterator.e(err);
  } finally {
    _iterator.f();
  }
}

/***/ }),

/***/ "./src/turbo/scroll-manager.js":
/*!*************************************!*\
  !*** ./src/turbo/scroll-manager.js ***!
  \*************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "ScrollManager": () => (/* binding */ ScrollManager)
/* harmony export */ });
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }

var ScrollManager = /*#__PURE__*/function () {
  function ScrollManager(delegate) {
    var _this = this;

    _classCallCheck(this, ScrollManager);

    this.started = false;

    this.onScroll = function () {
      _this.updatePosition({
        x: window.pageXOffset,
        y: window.pageYOffset
      });
    };

    this.delegate = delegate;
  }

  _createClass(ScrollManager, [{
    key: "start",
    value: function start() {
      if (!this.started) {
        addEventListener('scroll', this.onScroll, false);
        this.onScroll();
        this.started = true;
      }
    }
  }, {
    key: "stop",
    value: function stop() {
      if (this.started) {
        removeEventListener('scroll', this.onScroll, false);
        this.started = false;
      }
    }
  }, {
    key: "scrollToElement",
    value: function scrollToElement(element) {
      element.scrollIntoView();
    }
  }, {
    key: "scrollToPosition",
    value: function scrollToPosition(_ref) {
      var x = _ref.x,
          y = _ref.y;
      window.scrollTo(x, y);
    } // Private

  }, {
    key: "updatePosition",
    value: function updatePosition(position) {
      this.delegate.scrollPositionChanged(position);
    }
  }]);

  return ScrollManager;
}();

/***/ }),

/***/ "./src/turbo/snapshot-cache.js":
/*!*************************************!*\
  !*** ./src/turbo/snapshot-cache.js ***!
  \*************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "SnapshotCache": () => (/* binding */ SnapshotCache)
/* harmony export */ });
function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }

var SnapshotCache = /*#__PURE__*/function () {
  function SnapshotCache(size) {
    _classCallCheck(this, SnapshotCache);

    this.keys = [];
    this.snapshots = {};
    this.size = size;
  }

  _createClass(SnapshotCache, [{
    key: "has",
    value: function has(location) {
      return location.toCacheKey() in this.snapshots;
    }
  }, {
    key: "get",
    value: function get(location) {
      if (this.has(location)) {
        var snapshot = this.read(location);
        this.touch(location);
        return snapshot;
      }
    }
  }, {
    key: "put",
    value: function put(location, snapshot) {
      this.write(location, snapshot);
      this.touch(location);
      return snapshot;
    } // Private

  }, {
    key: "read",
    value: function read(location) {
      return this.snapshots[location.toCacheKey()];
    }
  }, {
    key: "write",
    value: function write(location, snapshot) {
      this.snapshots[location.toCacheKey()] = snapshot;
    }
  }, {
    key: "touch",
    value: function touch(location) {
      var key = location.toCacheKey();
      var index = this.keys.indexOf(key);
      if (index > -1) this.keys.splice(index, 1);
      this.keys.unshift(key);
      this.trim();
    }
  }, {
    key: "trim",
    value: function trim() {
      var _iterator = _createForOfIteratorHelper(this.keys.splice(this.size)),
          _step;

      try {
        for (_iterator.s(); !(_step = _iterator.n()).done;) {
          var key = _step.value;
          delete this.snapshots[key];
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }
    }
  }]);

  return SnapshotCache;
}();

/***/ }),

/***/ "./src/turbo/snapshot-renderer.js":
/*!****************************************!*\
  !*** ./src/turbo/snapshot-renderer.js ***!
  \****************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "SnapshotRenderer": () => (/* binding */ SnapshotRenderer)
/* harmony export */ });
/* harmony import */ var _renderer__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./renderer */ "./src/turbo/renderer.js");
/* harmony import */ var _util__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../util */ "./src/util/index.js");
function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }

function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); Object.defineProperty(subClass, "prototype", { writable: false }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } else if (call !== void 0) { throw new TypeError("Derived constructors may only return object or undefined"); } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }



var SnapshotRenderer = /*#__PURE__*/function (_Renderer) {
  _inherits(SnapshotRenderer, _Renderer);

  var _super = _createSuper(SnapshotRenderer);

  function SnapshotRenderer(delegate, currentSnapshot, newSnapshot, isPreview) {
    var _this;

    _classCallCheck(this, SnapshotRenderer);

    _this = _super.call(this);
    _this.delegate = delegate;
    _this.currentSnapshot = currentSnapshot;
    _this.currentHeadDetails = currentSnapshot.headDetails;
    _this.newSnapshot = newSnapshot;
    _this.newHeadDetails = newSnapshot.headDetails;
    _this.newBody = newSnapshot.bodyElement;
    _this.isPreview = isPreview;
    return _this;
  }

  _createClass(SnapshotRenderer, [{
    key: "render",
    value: function render(callback) {
      var _this2 = this;

      if (this.shouldRender()) {
        this.mergeHead();
        this.renderView(function () {
          _this2.replaceBody();

          if (!_this2.isPreview) {
            _this2.focusFirstAutofocusableElement();
          }

          callback();
        });
      } else {
        this.invalidateView();
      }
    }
  }, {
    key: "mergeHead",
    value: function mergeHead() {
      this.copyNewHeadStylesheetElements();
      this.copyNewHeadScriptElements();
      this.removeCurrentHeadProvisionalElements();
      this.copyNewHeadProvisionalElements();
    }
  }, {
    key: "replaceBody",
    value: function replaceBody() {
      var placeholders = this.relocateCurrentBodyPermanentElements();
      this.activateNewBodyScriptElements();
      this.assignNewBody();
      this.replacePlaceholderElementsWithClonedPermanentElements(placeholders);
    }
  }, {
    key: "shouldRender",
    value: function shouldRender() {
      return this.currentSnapshot.isEnabled() && this.newSnapshot.isVisitable() && this.trackedElementsAreIdentical();
    }
  }, {
    key: "trackedElementsAreIdentical",
    value: function trackedElementsAreIdentical() {
      return this.currentHeadDetails.getTrackedElementSignature() == this.newHeadDetails.getTrackedElementSignature();
    }
  }, {
    key: "copyNewHeadStylesheetElements",
    value: function copyNewHeadStylesheetElements() {
      var _iterator = _createForOfIteratorHelper(this.getNewHeadStylesheetElements()),
          _step;

      try {
        for (_iterator.s(); !(_step = _iterator.n()).done;) {
          var element = _step.value;
          document.head.appendChild(element);
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }
    }
  }, {
    key: "copyNewHeadScriptElements",
    value: function copyNewHeadScriptElements() {
      var _iterator2 = _createForOfIteratorHelper(this.getNewHeadScriptElements()),
          _step2;

      try {
        for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
          var element = _step2.value;
          document.head.appendChild(this.bindPendingAssetLoadedEventOnce(this.createScriptElement(element)));
        }
      } catch (err) {
        _iterator2.e(err);
      } finally {
        _iterator2.f();
      }
    }
  }, {
    key: "bindPendingAssetLoadedEventOnce",
    value: function bindPendingAssetLoadedEventOnce(element) {
      if (!element.hasAttribute('src')) {
        return element;
      }

      var self = this,
          loadEvent = function loadEvent() {
        self.delegate.decrementPendingAsset();
        element.removeEventListener('load', loadEvent);
      };

      element.addEventListener('load', loadEvent);
      this.delegate.incrementPendingAsset();
      return element;
    }
  }, {
    key: "removeCurrentHeadProvisionalElements",
    value: function removeCurrentHeadProvisionalElements() {
      var _iterator3 = _createForOfIteratorHelper(this.getCurrentHeadProvisionalElements()),
          _step3;

      try {
        for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
          var element = _step3.value;
          document.head.removeChild(element);
        }
      } catch (err) {
        _iterator3.e(err);
      } finally {
        _iterator3.f();
      }
    }
  }, {
    key: "copyNewHeadProvisionalElements",
    value: function copyNewHeadProvisionalElements() {
      var _iterator4 = _createForOfIteratorHelper(this.getNewHeadProvisionalElements()),
          _step4;

      try {
        for (_iterator4.s(); !(_step4 = _iterator4.n()).done;) {
          var element = _step4.value;
          document.head.appendChild(element);
        }
      } catch (err) {
        _iterator4.e(err);
      } finally {
        _iterator4.f();
      }
    }
  }, {
    key: "relocateCurrentBodyPermanentElements",
    value: function relocateCurrentBodyPermanentElements() {
      var _this3 = this;

      return this.getCurrentBodyPermanentElements().reduce(function (placeholders, permanentElement) {
        var newElement = _this3.newSnapshot.getPermanentElementById(permanentElement.id);

        if (newElement) {
          var placeholder = createPlaceholderForPermanentElement(permanentElement);
          replaceElementWithElement(permanentElement, placeholder.element);
          replaceElementWithElement(newElement, permanentElement);
          return [].concat(_toConsumableArray(placeholders), [placeholder]);
        } else {
          return placeholders;
        }
      }, []);
    }
  }, {
    key: "replacePlaceholderElementsWithClonedPermanentElements",
    value: function replacePlaceholderElementsWithClonedPermanentElements(placeholders) {
      var _iterator5 = _createForOfIteratorHelper(placeholders),
          _step5;

      try {
        for (_iterator5.s(); !(_step5 = _iterator5.n()).done;) {
          var _step5$value = _step5.value,
              element = _step5$value.element,
              permanentElement = _step5$value.permanentElement;
          var clonedElement = permanentElement.cloneNode(true);
          replaceElementWithElement(element, clonedElement);
        }
      } catch (err) {
        _iterator5.e(err);
      } finally {
        _iterator5.f();
      }
    }
  }, {
    key: "activateNewBodyScriptElements",
    value: function activateNewBodyScriptElements() {
      var _iterator6 = _createForOfIteratorHelper(this.getNewBodyScriptElements()),
          _step6;

      try {
        for (_iterator6.s(); !(_step6 = _iterator6.n()).done;) {
          var inertScriptElement = _step6.value;
          var activatedScriptElement = this.createScriptElement(inertScriptElement);
          replaceElementWithElement(inertScriptElement, activatedScriptElement);
        }
      } catch (err) {
        _iterator6.e(err);
      } finally {
        _iterator6.f();
      }
    }
  }, {
    key: "assignNewBody",
    value: function assignNewBody() {
      replaceElementWithElement(document.body, this.newBody);
    }
  }, {
    key: "focusFirstAutofocusableElement",
    value: function focusFirstAutofocusableElement() {
      var element = this.newSnapshot.findFirstAutofocusableElement();

      if (elementIsFocusable(element)) {
        element.focus();
      }
    }
  }, {
    key: "getNewHeadStylesheetElements",
    value: function getNewHeadStylesheetElements() {
      return this.newHeadDetails.getStylesheetElementsNotInDetails(this.currentHeadDetails);
    }
  }, {
    key: "getNewHeadScriptElements",
    value: function getNewHeadScriptElements() {
      return this.newHeadDetails.getScriptElementsNotInDetails(this.currentHeadDetails);
    }
  }, {
    key: "getCurrentHeadProvisionalElements",
    value: function getCurrentHeadProvisionalElements() {
      return this.currentHeadDetails.getProvisionalElements();
    }
  }, {
    key: "getNewHeadProvisionalElements",
    value: function getNewHeadProvisionalElements() {
      return this.newHeadDetails.getProvisionalElements();
    }
  }, {
    key: "getCurrentBodyPermanentElements",
    value: function getCurrentBodyPermanentElements() {
      return this.currentSnapshot.getPermanentElementsPresentInSnapshot(this.newSnapshot);
    }
  }, {
    key: "getNewBodyScriptElements",
    value: function getNewBodyScriptElements() {
      return (0,_util__WEBPACK_IMPORTED_MODULE_1__.array)(this.newBody.querySelectorAll('script'));
    }
  }], [{
    key: "render",
    value: function render(delegate, callback, currentSnapshot, newSnapshot, isPreview) {
      return new this(delegate, currentSnapshot, newSnapshot, isPreview).render(callback);
    }
  }]);

  return SnapshotRenderer;
}(_renderer__WEBPACK_IMPORTED_MODULE_0__.Renderer);

function createPlaceholderForPermanentElement(permanentElement) {
  var element = document.createElement('meta');
  element.setAttribute('name', 'turbo-permanent-placeholder');
  element.setAttribute('content', permanentElement.id);
  return {
    element: element,
    permanentElement: permanentElement
  };
}

function replaceElementWithElement(fromElement, toElement) {
  var parentElement = fromElement.parentElement;

  if (parentElement) {
    return parentElement.replaceChild(toElement, fromElement);
  }
}

function elementIsFocusable(element) {
  return element && typeof element.focus == 'function';
}

/***/ }),

/***/ "./src/turbo/snapshot.js":
/*!*******************************!*\
  !*** ./src/turbo/snapshot.js ***!
  \*******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Snapshot": () => (/* binding */ Snapshot)
/* harmony export */ });
/* harmony import */ var _head_details__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./head-details */ "./src/turbo/head-details.js");
/* harmony import */ var _location__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./location */ "./src/turbo/location.js");
/* harmony import */ var _util__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../util */ "./src/util/index.js");
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }




var Snapshot = /*#__PURE__*/function () {
  function Snapshot(headDetails, bodyElement) {
    _classCallCheck(this, Snapshot);

    this.headDetails = headDetails;
    this.bodyElement = bodyElement;
  }

  _createClass(Snapshot, [{
    key: "clone",
    value: function clone() {
      return new Snapshot(this.headDetails, this.bodyElement.cloneNode(true));
    }
  }, {
    key: "getRootLocation",
    value: function getRootLocation() {
      var root = this.getSetting('root', '/');
      return new _location__WEBPACK_IMPORTED_MODULE_1__.Location(root);
    }
  }, {
    key: "getCacheControlValue",
    value: function getCacheControlValue() {
      return this.getSetting('cache-control');
    }
  }, {
    key: "getElementForAnchor",
    value: function getElementForAnchor(anchor) {
      try {
        return this.bodyElement.querySelector("[id='".concat(anchor, "'], a[name='").concat(anchor, "']"));
      } catch (e) {
        return null;
      }
    }
  }, {
    key: "getPermanentElements",
    value: function getPermanentElements() {
      return (0,_util__WEBPACK_IMPORTED_MODULE_2__.array)(this.bodyElement.querySelectorAll('[id][data-turbo-permanent]'));
    }
  }, {
    key: "getPermanentElementById",
    value: function getPermanentElementById(id) {
      return this.bodyElement.querySelector("#".concat(id, "[data-turbo-permanent]"));
    }
  }, {
    key: "getPermanentElementsPresentInSnapshot",
    value: function getPermanentElementsPresentInSnapshot(snapshot) {
      return this.getPermanentElements().filter(function (_ref) {
        var id = _ref.id;
        return snapshot.getPermanentElementById(id);
      });
    }
  }, {
    key: "findFirstAutofocusableElement",
    value: function findFirstAutofocusableElement() {
      return this.bodyElement.querySelector('[autofocus]');
    }
  }, {
    key: "hasAnchor",
    value: function hasAnchor(anchor) {
      return this.getElementForAnchor(anchor) != null;
    }
  }, {
    key: "isPreviewable",
    value: function isPreviewable() {
      return this.getCacheControlValue() != 'no-preview';
    }
  }, {
    key: "isCacheable",
    value: function isCacheable() {
      return this.getCacheControlValue() != 'no-cache';
    }
  }, {
    key: "isNativeError",
    value: function isNativeError() {
      return this.getSetting('visit-control', false) != false;
    }
  }, {
    key: "isEnabled",
    value: function isEnabled() {
      return this.getSetting('visit-control') != 'disable';
    }
  }, {
    key: "isVisitable",
    value: function isVisitable() {
      return this.isEnabled() && this.getSetting('visit-control') != 'reload';
    }
  }, {
    key: "getSetting",
    value: function getSetting(name, defaultValue) {
      var value = this.headDetails.getMetaValue("turbo-".concat(name));
      return value == null ? defaultValue : value;
    }
  }], [{
    key: "wrap",
    value: function wrap(value) {
      if (value instanceof this) {
        return value;
      } else if (typeof value == 'string') {
        return this.fromHTMLString(value);
      } else {
        return this.fromHTMLElement(value);
      }
    }
  }, {
    key: "fromHTMLString",
    value: function fromHTMLString(html) {
      var element = document.createElement('html');
      element.innerHTML = html;
      return this.fromHTMLElement(element);
    }
  }, {
    key: "fromHTMLElement",
    value: function fromHTMLElement(htmlElement) {
      var headElement = htmlElement.querySelector('head');
      var bodyElement = htmlElement.querySelector('body') || document.createElement('body');
      var headDetails = _head_details__WEBPACK_IMPORTED_MODULE_0__.HeadDetails.fromHeadElement(headElement);
      return new this(headDetails, bodyElement);
    }
  }]);

  return Snapshot;
}();

/***/ }),

/***/ "./src/turbo/view.js":
/*!***************************!*\
  !*** ./src/turbo/view.js ***!
  \***************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "View": () => (/* binding */ View)
/* harmony export */ });
/* harmony import */ var _error_renderer__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./error-renderer */ "./src/turbo/error-renderer.js");
/* harmony import */ var _snapshot__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./snapshot */ "./src/turbo/snapshot.js");
/* harmony import */ var _snapshot_renderer__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./snapshot-renderer */ "./src/turbo/snapshot-renderer.js");
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }




var View = /*#__PURE__*/function () {
  function View(delegate) {
    _classCallCheck(this, View);

    this.htmlElement = document.documentElement;
    this.delegate = delegate;
  }

  _createClass(View, [{
    key: "getRootLocation",
    value: function getRootLocation() {
      return this.getSnapshot().getRootLocation();
    }
  }, {
    key: "getElementForAnchor",
    value: function getElementForAnchor(anchor) {
      return this.getSnapshot().getElementForAnchor(anchor);
    }
  }, {
    key: "getSnapshot",
    value: function getSnapshot() {
      return _snapshot__WEBPACK_IMPORTED_MODULE_1__.Snapshot.fromHTMLElement(this.htmlElement);
    }
  }, {
    key: "render",
    value: function render(_ref, callback) {
      var snapshot = _ref.snapshot,
          error = _ref.error,
          isPreview = _ref.isPreview;
      this.markAsPreview(isPreview);

      if (snapshot) {
        this.renderSnapshot(snapshot, isPreview, callback);
      } else {
        this.renderError(error, callback);
      }
    } // Private

  }, {
    key: "markAsPreview",
    value: function markAsPreview(isPreview) {
      if (isPreview) {
        this.htmlElement.setAttribute('data-turbo-preview', '');
      } else {
        this.htmlElement.removeAttribute('data-turbo-preview');
      }
    }
  }, {
    key: "renderSnapshot",
    value: function renderSnapshot(snapshot, isPreview, callback) {
      _snapshot_renderer__WEBPACK_IMPORTED_MODULE_2__.SnapshotRenderer.render(this.delegate, callback, this.getSnapshot(), snapshot, isPreview || false);
    }
  }, {
    key: "renderError",
    value: function renderError(error, callback) {
      _error_renderer__WEBPACK_IMPORTED_MODULE_0__.ErrorRenderer.render(this.delegate, callback, error || '');
    }
  }]);

  return View;
}();

/***/ }),

/***/ "./src/turbo/visit.js":
/*!****************************!*\
  !*** ./src/turbo/visit.js ***!
  \****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "TimingMetric": () => (/* binding */ TimingMetric),
/* harmony export */   "Visit": () => (/* binding */ Visit),
/* harmony export */   "VisitState": () => (/* binding */ VisitState)
/* harmony export */ });
/* harmony import */ var _util_http_request__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../util/http-request */ "./src/util/http-request.js");
/* harmony import */ var _location__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./location */ "./src/turbo/location.js");
/* harmony import */ var _snapshot__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./snapshot */ "./src/turbo/snapshot.js");
/* harmony import */ var _util__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../util */ "./src/util/index.js");
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }





var TimingMetric = {
  visitStart: 'visitStart',
  requestStart: 'requestStart',
  requestEnd: 'requestEnd',
  visitEnd: 'visitEnd'
};
var VisitState = {
  initialized: 'initialized',
  started: 'started',
  canceled: 'canceled',
  failed: 'failed',
  completed: 'completed'
};
var Visit = /*#__PURE__*/function () {
  function Visit(controller, location, action) {
    var _this = this;

    var restorationIdentifier = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : (0,_util__WEBPACK_IMPORTED_MODULE_3__.uuid)();

    _classCallCheck(this, Visit);

    this.identifier = (0,_util__WEBPACK_IMPORTED_MODULE_3__.uuid)();
    this.timingMetrics = {};
    this.followedRedirect = false;
    this.historyChanged = false;
    this.progress = 0;
    this.scrolled = false;
    this.snapshotCached = action === 'swap';
    this.state = VisitState.initialized; // Scrolling

    this.performScroll = function () {
      if (!_this.scrolled) {
        if (_this.action == 'restore') {
          _this.scrollToRestoredPosition() || _this.scrollToTop();
        } else {
          _this.scrollToAnchor() || _this.scrollToTop();
        }

        _this.scrolled = true;
      }
    };

    this.controller = controller;
    this.location = location;
    this.action = action;
    this.adapter = controller.adapter;
    this.restorationIdentifier = restorationIdentifier;
    this.isSamePage = this.locationChangeIsSamePage();
  }

  _createClass(Visit, [{
    key: "start",
    value: function start() {
      if (this.state == VisitState.initialized) {
        this.recordTimingMetric(TimingMetric.visitStart);
        this.state = VisitState.started;
        this.adapter.visitStarted(this);
      }
    }
  }, {
    key: "cancel",
    value: function cancel() {
      if (this.state == VisitState.started) {
        if (this.request) {
          this.request.abort();
        }

        this.cancelRender();
        this.state = VisitState.canceled;
      }
    }
  }, {
    key: "complete",
    value: function complete() {
      if (this.state == VisitState.started) {
        this.recordTimingMetric(TimingMetric.visitEnd);
        this.state = VisitState.completed;
        this.adapter.visitCompleted(this);
        this.controller.visitCompleted(this);
      }
    }
  }, {
    key: "fail",
    value: function fail() {
      if (this.state == VisitState.started) {
        this.state = VisitState.failed;
        this.adapter.visitFailed(this);
      }
    }
  }, {
    key: "changeHistory",
    value: function changeHistory() {
      if (!this.historyChanged) {
        var actionForHistory = this.location.isEqualTo(this.referrer) ? 'replace' : this.action;
        var method = this.getHistoryMethodForAction(actionForHistory);
        method.call(this.controller, this.location, this.restorationIdentifier);
        this.historyChanged = true;
      }
    }
  }, {
    key: "issueRequest",
    value: function issueRequest() {
      if (this.shouldIssueRequest() && !this.request) {
        var url = _location__WEBPACK_IMPORTED_MODULE_1__.Location.wrap(this.location).absoluteURL;
        var options = {
          method: 'GET',
          headers: {},
          htmlOnly: true,
          timeout: 240
        };
        options.headers['Accept'] = 'text/html, application/xhtml+xml';
        options.headers['X-PJAX'] = 1;

        if (this.hasCachedSnapshot()) {
          options.headers['X-PJAX-CACHED'] = 1;
        }

        if (this.referrer) {
          options.headers['X-PJAX-REFERRER'] = _location__WEBPACK_IMPORTED_MODULE_1__.Location.wrap(this.referrer).absoluteURL;
        }

        this.progress = 0;
        this.request = new _util_http_request__WEBPACK_IMPORTED_MODULE_0__.HttpRequest(this, url, options);
        this.request.send();
      }
    }
  }, {
    key: "getCachedSnapshot",
    value: function getCachedSnapshot() {
      var snapshot = this.controller.getCachedSnapshotForLocation(this.location);

      if (snapshot && (!this.location.anchor || snapshot.hasAnchor(this.location.anchor))) {
        if (this.action == 'restore' || snapshot.isPreviewable()) {
          return snapshot;
        }
      }
    }
  }, {
    key: "hasCachedSnapshot",
    value: function hasCachedSnapshot() {
      return this.getCachedSnapshot() != null;
    }
  }, {
    key: "loadCachedSnapshot",
    value: function loadCachedSnapshot() {
      var _this2 = this;

      var snapshot = this.getCachedSnapshot();

      if (snapshot) {
        var isPreview = this.shouldIssueRequest();
        this.render(function () {
          _this2.cacheSnapshot();

          if (_this2.isSamePage) {
            _this2.performScroll();

            _this2.adapter.visitRendered(_this2);
          } else {
            _this2.controller.render({
              snapshot: snapshot,
              isPreview: isPreview
            }, _this2.performScroll);

            _this2.adapter.visitRendered(_this2);

            if (!isPreview) {
              _this2.complete();
            }
          }
        });
      }
    }
  }, {
    key: "loadResponse",
    value: function loadResponse() {
      var _this3 = this;

      var request = this.request,
          response = this.response;

      if (request && response) {
        this.render(function () {
          var snapshot = _snapshot__WEBPACK_IMPORTED_MODULE_2__.Snapshot.fromHTMLString(response);

          _this3.cacheSnapshot();

          if (request.failed && !snapshot.isNativeError()) {
            _this3.controller.render({
              error: response
            }, _this3.performScroll);

            _this3.adapter.visitRendered(_this3);

            _this3.fail();
          } else {
            _this3.controller.render({
              snapshot: snapshot
            }, _this3.performScroll);

            _this3.adapter.visitRendered(_this3);

            _this3.complete();
          }
        });
      }
    }
  }, {
    key: "followRedirect",
    value: function followRedirect() {
      if (this.redirectedToLocation && !this.followedRedirect) {
        this.location = this.redirectedToLocation;
        this.controller.replaceHistoryWithLocationAndRestorationIdentifier(this.redirectedToLocation, this.restorationIdentifier);
        this.followedRedirect = true;
      }
    }
  }, {
    key: "goToSamePageAnchor",
    value: function goToSamePageAnchor() {
      var _this4 = this;

      if (this.isSamePage) {
        this.render(function () {
          _this4.cacheSnapshot();

          _this4.performScroll();

          _this4.adapter.visitRendered(_this4);
        });
      }
    } // HTTP request delegate

  }, {
    key: "requestStarted",
    value: function requestStarted() {
      this.recordTimingMetric(TimingMetric.requestStart);
      this.adapter.visitRequestStarted(this);
    }
  }, {
    key: "requestProgressed",
    value: function requestProgressed(progress) {
      this.progress = progress;

      if (this.adapter.visitRequestProgressed) {
        this.adapter.visitRequestProgressed(this);
      }
    }
  }, {
    key: "requestCompletedWithResponse",
    value: function requestCompletedWithResponse(response, statusCode, redirectedToLocation) {
      this.response = response;
      this.redirectedToLocation = _location__WEBPACK_IMPORTED_MODULE_1__.Location.wrap(redirectedToLocation);
      this.adapter.visitRequestCompleted(this);
    }
  }, {
    key: "requestFailedWithStatusCode",
    value: function requestFailedWithStatusCode(statusCode, response) {
      this.response = response;
      this.adapter.visitRequestFailedWithStatusCode(this, statusCode);
    }
  }, {
    key: "requestFinished",
    value: function requestFinished() {
      this.recordTimingMetric(TimingMetric.requestEnd);
      this.adapter.visitRequestFinished(this);
    }
  }, {
    key: "scrollToRestoredPosition",
    value: function scrollToRestoredPosition() {
      var position = this.restorationData ? this.restorationData.scrollPosition : undefined;

      if (position) {
        this.controller.scrollToPosition(position);
        return true;
      }
    }
  }, {
    key: "scrollToAnchor",
    value: function scrollToAnchor() {
      if (this.location.anchor != null) {
        this.controller.scrollToAnchor(this.location.anchor);
        return true;
      }
    }
  }, {
    key: "scrollToTop",
    value: function scrollToTop() {
      this.controller.scrollToPosition({
        x: 0,
        y: 0
      });
    } // Instrumentation

  }, {
    key: "recordTimingMetric",
    value: function recordTimingMetric(metric) {
      this.timingMetrics[metric] = new Date().getTime();
    }
  }, {
    key: "getTimingMetrics",
    value: function getTimingMetrics() {
      return Object.assign({}, this.timingMetrics);
    } // Private

  }, {
    key: "getHistoryMethodForAction",
    value: function getHistoryMethodForAction(action) {
      switch (action) {
        case 'swap':
        case 'replace':
          return this.controller.replaceHistoryWithLocationAndRestorationIdentifier;

        case 'advance':
        case 'restore':
          return this.controller.pushHistoryWithLocationAndRestorationIdentifier;
      }
    }
  }, {
    key: "shouldIssueRequest",
    value: function shouldIssueRequest() {
      if (this.action == 'restore') {
        return !this.hasCachedSnapshot();
      } else if (this.isSamePage) {
        return false;
      } else {
        return true;
      }
    }
  }, {
    key: "locationChangeIsSamePage",
    value: function locationChangeIsSamePage() {
      if (this.action == 'swap') {
        return true;
      }

      var lastLocation = this.action == 'restore' && this.controller.lastRenderedLocation;
      return this.controller.locationIsSamePageAnchor(lastLocation || this.location);
    }
  }, {
    key: "cacheSnapshot",
    value: function cacheSnapshot() {
      if (!this.snapshotCached) {
        this.controller.cacheSnapshot();
        this.snapshotCached = true;
      }
    }
  }, {
    key: "render",
    value: function render(callback) {
      var _this5 = this;

      this.cancelRender();
      this.frame = requestAnimationFrame(function () {
        delete _this5.frame;
        callback.call(_this5);
      });
    }
  }, {
    key: "cancelRender",
    value: function cancelRender() {
      if (this.frame) {
        cancelAnimationFrame(this.frame);
        delete this.frame;
      }
    }
  }]);

  return Visit;
}();

/***/ }),

/***/ "./src/util/deferred.js":
/*!******************************!*\
  !*** ./src/util/deferred.js ***!
  \******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Deferred": () => (/* binding */ Deferred),
/* harmony export */   "DeferredState": () => (/* binding */ DeferredState)
/* harmony export */ });
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }

var DeferredState = {
  pending: 'pending',
  rejected: 'rejected',
  resolved: 'resolved'
};
var Deferred = /*#__PURE__*/function () {
  function Deferred(options) {
    _classCallCheck(this, Deferred);

    this.options = options || {};
    this.stateStr = DeferredState.pending;
    this.successFuncs = [];
    this.failureFuncs = [];
    this.progressFuncs = [];
    this.resolveArgs = [];
    this.rejectArgs = [];
    this.progressArgs = [];
    this.isProgressNotified = false;
  } // Public


  _createClass(Deferred, [{
    key: "resolve",
    value: function resolve() {
      if (this.stateStr === DeferredState.pending) {
        this.resolveArgs = arguments;
        this.callFunction.call(this, this.successFuncs, this.resolveArgs);
        this.stateStr = DeferredState.resolved;
      }

      return this;
    }
  }, {
    key: "reject",
    value: function reject() {
      if (this.stateStr === DeferredState.pending) {
        this.rejectArgs = arguments;
        this.callFunction.call(this, this.failureFuncs, this.rejectArgs);
        this.stateStr = DeferredState.rejected;
      }

      return this;
    }
  }, {
    key: "notify",
    value: function notify() {
      if (this.stateStr === DeferredState.pending) {
        this.progressArgs = arguments;
        this.callFunction.call(this, this.progressFuncs, this.progressArgs);
        this.isProgressNotified = true;
      }

      return this;
    }
  }, {
    key: "abort",
    value: function abort() {
      this.options.delegate && this.options.delegate.abort();
    }
  }, {
    key: "done",
    value: function done() {
      var argumentsArray = Array.prototype.slice.call(arguments);
      this.successFuncs = this.successFuncs.concat(argumentsArray);

      if (this.stateStr === DeferredState.resolved) {
        this.callFunction.call(this, argumentsArray, this.resolveArgs);
      }

      return this;
    }
  }, {
    key: "fail",
    value: function fail() {
      var argumentsArray = Array.prototype.slice.call(arguments);
      this.failureFuncs = this.failureFuncs.concat(argumentsArray);

      if (this.stateStr === DeferredState.rejected) {
        this.callFunction.call(this, argumentsArray, this.rejectArgs);
      }

      return this;
    }
  }, {
    key: "progress",
    value: function progress() {
      var argumentsArray = Array.prototype.slice.call(arguments);
      this.progressFuncs = this.progressFuncs.concat(argumentsArray);

      if (this.stateStr === DeferredState.pending && this.isProgressNotified) {
        this.callFunction.call(this, argumentsArray, this.progressArgs);
      }

      return this;
    }
  }, {
    key: "always",
    value: function always() {
      var argumentsArray = Array.prototype.slice.call(arguments);
      this.successFuncs = this.successFuncs.concat(argumentsArray);
      this.failureFuncs = this.failureFuncs.concat(argumentsArray);

      if (this.stateStr !== DeferredState.pending) {
        this.callFunction.call(this, argumentsArray, this.resolveArgs || this.rejectArgs);
      }

      return this;
    }
  }, {
    key: "then",
    value: function then() {
      var tempArgs = [];

      for (var index in arguments) {
        var itemToPush;

        if (Array.isArray(arguments[index])) {
          itemToPush = arguments[index];
        } else {
          itemToPush = [arguments[index]];
        }

        tempArgs.push(itemToPush);
      }

      this.done.apply(this, tempArgs[0]);
      this.fail.apply(this, tempArgs[1]);
      this.progress.apply(this, tempArgs[2]);
      return this;
    }
  }, {
    key: "promise",
    value: function promise() {
      var protectedNames = ['resolve', 'reject', 'promise', 'notify'];
      var result = {};

      for (var key in this) {
        if (protectedNames.indexOf(key) === -1) {
          result[key] = this[key];
        }
      }

      return result;
    }
  }, {
    key: "state",
    value: function state() {
      if (arguments.length > 0) {
        stateStr = arguments[0];
      }

      return stateStr;
    } // Private

  }, {
    key: "callFunction",
    value: function callFunction(functionDefinitionArray, functionArgumentArray, options) {
      options = options || {};
      var scope = options.scope || this;

      for (var index in functionDefinitionArray) {
        var item = functionDefinitionArray[index];

        if (typeof item === 'function') {
          item.apply(scope, functionArgumentArray);
        }
      }
    }
  }]);

  return Deferred;
}();

/***/ }),

/***/ "./src/util/events.js":
/*!****************************!*\
  !*** ./src/util/events.js ***!
  \****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Events": () => (/* binding */ Events)
/* harmony export */ });
/* harmony import */ var _index__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./index */ "./src/util/index.js");
function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e2) { throw _e2; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e3) { didErr = true; err = _e3; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _iterableToArrayLimit(arr, i) { var _i = arr == null ? null : typeof Symbol !== "undefined" && arr[Symbol.iterator] || arr["@@iterator"]; if (_i == null) return; var _arr = []; var _n = true; var _d = false; var _s, _e; try { for (_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }


/**
 * Constants
 */

var namespaceRegex = /[^.]*(?=\..*)\.|.*/;
var stripNameRegex = /\..*/;
var stripUidRegex = /::\d+$/;
var eventRegistry = {}; // Events storage

var uidEvent = 1;
var customEvents = {
  mouseenter: 'mouseover',
  mouseleave: 'mouseout'
};
var nativeEvents = new Set(['click', 'dblclick', 'mouseup', 'mousedown', 'contextmenu', 'mousewheel', 'DOMMouseScroll', 'mouseover', 'mouseout', 'mousemove', 'selectstart', 'selectend', 'keydown', 'keypress', 'keyup', 'orientationchange', 'touchstart', 'touchmove', 'touchend', 'touchcancel', 'pointerdown', 'pointermove', 'pointerup', 'pointerleave', 'pointercancel', 'gesturestart', 'gesturechange', 'gestureend', 'focus', 'blur', 'change', 'reset', 'select', 'submit', 'focusin', 'focusout', 'load', 'unload', 'beforeunload', 'resize', 'move', 'DOMContentLoaded', 'readystatechange', 'error', 'abort', 'scroll']);
var Events = /*#__PURE__*/function () {
  function Events() {
    _classCallCheck(this, Events);
  }

  _createClass(Events, null, [{
    key: "on",
    value: function on(element, event, handler, delegationFunction, options) {
      addHandler(element, event, handler, delegationFunction, options, false);
    }
  }, {
    key: "one",
    value: function one(element, event, handler, delegationFunction, options) {
      addHandler(element, event, handler, delegationFunction, options, true);
    }
  }, {
    key: "off",
    value: function off(element, originalTypeEvent, handler, delegationFunction, options) {
      if (typeof originalTypeEvent !== 'string' || !element) {
        return;
      }

      var _normalizeParameters = normalizeParameters(originalTypeEvent, handler, delegationFunction, options),
          _normalizeParameters2 = _slicedToArray(_normalizeParameters, 4),
          isDelegated = _normalizeParameters2[0],
          callable = _normalizeParameters2[1],
          typeEvent = _normalizeParameters2[2],
          opts = _normalizeParameters2[3];

      var inNamespace = typeEvent !== originalTypeEvent;
      var events = getElementEvents(element);
      var storeElementEvent = events[typeEvent] || {};
      var isNamespace = originalTypeEvent.startsWith('.');

      if (typeof callable !== 'undefined') {
        // Simplest case: handler is passed, remove that listener ONLY.
        if (!storeElementEvent) {
          return;
        }

        removeHandler(element, events, typeEvent, callable, isDelegated ? handler : null, opts);
        return;
      }

      if (isNamespace) {
        for (var _i2 = 0, _Object$keys = Object.keys(events); _i2 < _Object$keys.length; _i2++) {
          var elementEvent = _Object$keys[_i2];
          removeNamespacedHandlers(element, events, elementEvent, originalTypeEvent.slice(1));
        }
      }

      for (var _i3 = 0, _Object$keys2 = Object.keys(storeElementEvent); _i3 < _Object$keys2.length; _i3++) {
        var keyHandlers = _Object$keys2[_i3];
        var handlerKey = keyHandlers.replace(stripUidRegex, '');

        if (!inNamespace || originalTypeEvent.includes(handlerKey)) {
          var event = storeElementEvent[keyHandlers];
          removeHandler(element, events, typeEvent, event.callable, event.delegationSelector, opts);
        }
      }
    }
  }, {
    key: "dispatch",
    value: function dispatch(eventName) {
      var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
          _ref$target = _ref.target,
          target = _ref$target === void 0 ? document : _ref$target,
          _ref$detail = _ref.detail,
          detail = _ref$detail === void 0 ? {} : _ref$detail,
          _ref$bubbles = _ref.bubbles,
          bubbles = _ref$bubbles === void 0 ? true : _ref$bubbles,
          _ref$cancelable = _ref.cancelable,
          cancelable = _ref$cancelable === void 0 ? true : _ref$cancelable;

      return (0,_index__WEBPACK_IMPORTED_MODULE_0__.dispatch)(eventName, {
        target: target,
        detail: detail,
        bubbles: bubbles,
        cancelable: cancelable
      });
    }
  }]);

  return Events;
}();
/**
 * Private methods
 */

function makeEventUid(element, uid) {
  return uid && "".concat(uid, "::").concat(uidEvent++) || element.uidEvent || uidEvent++;
}

function getElementEvents(element) {
  var uid = makeEventUid(element);
  element.uidEvent = uid;
  eventRegistry[uid] = eventRegistry[uid] || {};
  return eventRegistry[uid];
}

function findHandler(events, callable) {
  var delegationSelector = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
  return Object.values(events).find(function (event) {
    return event.callable === callable && event.delegationSelector === delegationSelector;
  });
}

function normalizeParameters(originalTypeEvent, handler, delegationFunction, options) {
  var isDelegated = typeof handler === 'string';
  var callable = isDelegated ? delegationFunction : handler;
  var opts = isDelegated ? options : delegationFunction;
  var typeEvent = getTypeEvent(originalTypeEvent);

  if (!nativeEvents.has(typeEvent)) {
    typeEvent = originalTypeEvent;
  }

  return [isDelegated, callable, typeEvent, opts];
}

function addHandler(element, originalTypeEvent, handler, delegationFunction, options, oneOff) {
  if (typeof originalTypeEvent !== 'string' || !element) {
    return;
  }

  var _normalizeParameters3 = normalizeParameters(originalTypeEvent, handler, delegationFunction, options),
      _normalizeParameters4 = _slicedToArray(_normalizeParameters3, 4),
      isDelegated = _normalizeParameters4[0],
      callable = _normalizeParameters4[1],
      typeEvent = _normalizeParameters4[2],
      opts = _normalizeParameters4[3]; // in case of mouseenter or mouseleave wrap the handler within a function that checks for its DOM position
  // this prevents the handler from being dispatched the same way as mouseover or mouseout does


  if (originalTypeEvent in customEvents) {
    var wrapFunction = function wrapFunction(fn) {
      return function (event) {
        if (!event.relatedTarget || event.relatedTarget !== event.delegateTarget && !event.delegateTarget.contains(event.relatedTarget)) {
          return fn.call(this, event);
        }
      };
    };

    callable = wrapFunction(callable);
  }

  var events = getElementEvents(element);
  var handlers = events[typeEvent] || (events[typeEvent] = {});
  var previousFunction = findHandler(handlers, callable, isDelegated ? handler : null);

  if (previousFunction) {
    previousFunction.oneOff = previousFunction.oneOff && oneOff;
    return;
  }

  var uid = makeEventUid(callable, originalTypeEvent.replace(namespaceRegex, ''));
  var fn = isDelegated ? internalDelegationHandler(element, handler, callable) : internalHandler(element, callable);
  fn.delegationSelector = isDelegated ? handler : null;
  fn.callable = callable;
  fn.oneOff = oneOff;
  fn.uidEvent = uid;
  handlers[uid] = fn;
  element.addEventListener(typeEvent, fn, opts);
}

function removeHandler(element, events, typeEvent, handler, delegationSelector, options) {
  var fn = findHandler(events[typeEvent], handler, delegationSelector);

  if (!fn) {
    return;
  }

  element.removeEventListener(typeEvent, fn, options);
  delete events[typeEvent][fn.uidEvent];
}

function internalHandler(element, fn) {
  return function handler(event) {
    event.delegateTarget = element;

    if (handler.oneOff) {
      Events.off(element, event.type, fn);
    }

    return fn.apply(element, [event]);
  };
}

function internalDelegationHandler(element, selector, fn) {
  return function handler(event) {
    var domElements = element.querySelectorAll(selector);

    for (var target = event.target; target && target !== this; target = target.parentNode) {
      var _iterator = _createForOfIteratorHelper(domElements),
          _step;

      try {
        for (_iterator.s(); !(_step = _iterator.n()).done;) {
          var domElement = _step.value;

          if (domElement !== target) {
            continue;
          }

          event.delegateTarget = target;

          if (handler.oneOff) {
            Events.off(element, event.type, selector, fn);
          }

          return fn.apply(target, [event]);
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }
    }
  };
}

function removeNamespacedHandlers(element, events, typeEvent, namespace) {
  var storeElementEvent = events[typeEvent] || {};

  for (var _i4 = 0, _Object$keys3 = Object.keys(storeElementEvent); _i4 < _Object$keys3.length; _i4++) {
    var handlerKey = _Object$keys3[_i4];

    if (handlerKey.includes(namespace)) {
      var event = storeElementEvent[handlerKey];
      removeHandler(element, events, typeEvent, event.callable, event.delegationSelector);
    }
  }
} // Allow to get the native events from namespaced events ('click.bs.button' --> 'click')


function getTypeEvent(event) {
  event = event.replace(stripNameRegex, '');
  return customEvents[event] || event;
}

/***/ }),

/***/ "./src/util/form-serializer.js":
/*!*************************************!*\
  !*** ./src/util/form-serializer.js ***!
  \*************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "FormSerializer": () => (/* binding */ FormSerializer)
/* harmony export */ });
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }

// FormSerializer serializes input elements to JSON
var FormSerializer = /*#__PURE__*/function () {
  function FormSerializer() {
    _classCallCheck(this, FormSerializer);
  }

  _createClass(FormSerializer, [{
    key: "parseContainer",
    value: // Private
    function parseContainer(element) {
      var _this = this;

      var jsonData = {};
      element.querySelectorAll('input, textarea, select').forEach(function (field) {
        if (!field.name || field.disabled || ['file', 'reset', 'submit', 'button'].indexOf(field.type) > -1) {
          return;
        }

        if (['checkbox', 'radio'].indexOf(field.type) > -1 && !field.checked) {
          return;
        }

        if (field.type === 'select-multiple') {
          var arr = [];
          Array.from(field.options).forEach(function (option) {
            if (option.selected) {
              arr.push({
                name: field.name,
                value: option.value
              });
            }
          });

          _this.assignObjectInternal(jsonData, field.name, arr);

          return;
        }

        _this.assignObjectInternal(jsonData, field.name, field.value);
      });
      return jsonData;
    }
  }, {
    key: "assignObjectInternal",
    value: function assignObjectInternal(obj, fieldName, fieldValue) {
      this.assignObjectNested(obj, this.nameToArray(fieldName), fieldValue, fieldName.endsWith('[]'));
    }
  }, {
    key: "assignObjectNested",
    value: function assignObjectNested(obj, fieldArr, fieldValue, isArray) {
      var currentTarget = obj,
          lastIndex = fieldArr.length - 1;
      fieldArr.forEach(function (prop, index) {
        if (isArray && index === lastIndex) {
          if (!Array.isArray(currentTarget[prop])) {
            currentTarget[prop] = [];
          }

          currentTarget[prop].push(fieldValue);
        } else {
          if (currentTarget[prop] === undefined || currentTarget[prop].constructor !== {}.constructor) {
            currentTarget[prop] = {};
          }

          if (index === lastIndex) {
            currentTarget[prop] = fieldValue;
          }

          currentTarget = currentTarget[prop];
        }
      });
    }
  }, {
    key: "nameToArray",
    value: function nameToArray(fieldName) {
      var expression = /([^\]\[]+)/g,
          elements = [],
          searchResult;

      while (searchResult = expression.exec(fieldName)) {
        elements.push(searchResult[0]);
      }

      return elements;
    }
  }], [{
    key: "assignToObj",
    value: // Public
    function assignToObj(obj, name, value) {
      new FormSerializer().assignObjectInternal(obj, name, value);
    }
  }, {
    key: "serializeJSON",
    value: function serializeJSON(element) {
      return new FormSerializer().parseContainer(element);
    }
  }]);

  return FormSerializer;
}();

/***/ }),

/***/ "./src/util/http-request.js":
/*!**********************************!*\
  !*** ./src/util/http-request.js ***!
  \**********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "HttpRequest": () => (/* binding */ HttpRequest),
/* harmony export */   "SystemStatusCode": () => (/* binding */ SystemStatusCode)
/* harmony export */ });
/* harmony import */ var _events__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./events */ "./src/util/events.js");
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }


var SystemStatusCode = {
  networkFailure: 0,
  timeoutFailure: -1,
  contentTypeMismatch: -2,
  userAborted: -3
};
var HttpRequest = /*#__PURE__*/function () {
  function HttpRequest(delegate, url, options) {
    var _this = this;

    _classCallCheck(this, HttpRequest);

    this.failed = false;
    this.progress = 0;
    this.sent = false;
    this.delegate = delegate;
    this.url = url;
    this.options = options;
    this.headers = options.headers || {};
    this.method = options.method || 'GET';
    this.responseType = options.responseType || '';
    this.data = options.data;
    this.timeout = options.timeout || 0; // XMLHttpRequest events

    this.requestProgressed = function (event) {
      if (event.lengthComputable) {
        _this.setProgress(event.loaded / event.total);
      }
    };

    this.requestLoaded = function () {
      _this.endRequest(function (xhr) {
        _this.processResponseData(xhr, function (xhr, data) {
          var contentType = xhr.getResponseHeader('Content-Type');
          var responseData = contentTypeIsJSON(contentType) ? JSON.parse(data) : data;

          if (_this.options.htmlOnly && !contentTypeIsHTML(contentType)) {
            _this.failed = true;

            _this.delegate.requestFailedWithStatusCode(SystemStatusCode.contentTypeMismatch);

            return;
          }

          if (xhr.status >= 200 && xhr.status < 300) {
            _this.delegate.requestCompletedWithResponse(responseData, xhr.status, contentResponseIsRedirect(xhr, _this.url));
          } else {
            _this.failed = true;

            _this.delegate.requestFailedWithStatusCode(xhr.status, responseData);
          }
        });
      });
    };

    this.requestFailed = function () {
      _this.endRequest(function () {
        _this.failed = true;

        _this.delegate.requestFailedWithStatusCode(SystemStatusCode.networkFailure);
      });
    };

    this.requestTimedOut = function () {
      _this.endRequest(function () {
        _this.failed = true;

        _this.delegate.requestFailedWithStatusCode(SystemStatusCode.timeoutFailure);
      });
    };

    this.requestCanceled = function () {
      if (_this.options.trackAbort) {
        _this.endRequest(function () {
          _this.failed = true;

          _this.delegate.requestFailedWithStatusCode(SystemStatusCode.userAborted);
        });
      } else {
        _this.endRequest();
      }
    };

    this.createXHR();
  }

  _createClass(HttpRequest, [{
    key: "send",
    value: function send() {
      if (this.xhr && !this.sent) {
        this.notifyApplicationBeforeRequestStart();
        this.setProgress(0);
        this.xhr.send(this.data || null);
        this.sent = true;
        this.delegate.requestStarted();
      }
    }
  }, {
    key: "abort",
    value: function abort() {
      if (this.xhr && this.sent) {
        this.xhr.abort();
      }
    } // Application events

  }, {
    key: "notifyApplicationBeforeRequestStart",
    value: function notifyApplicationBeforeRequestStart() {
      _events__WEBPACK_IMPORTED_MODULE_0__.Events.dispatch('ajax:request-start', {
        detail: {
          url: this.url,
          xhr: this.xhr
        },
        cancelable: false
      });
    }
  }, {
    key: "notifyApplicationAfterRequestEnd",
    value: function notifyApplicationAfterRequestEnd() {
      _events__WEBPACK_IMPORTED_MODULE_0__.Events.dispatch('ajax:request-end', {
        detail: {
          url: this.url,
          xhr: this.xhr
        },
        cancelable: false
      });
    } // Private

  }, {
    key: "createXHR",
    value: function createXHR() {
      var xhr = this.xhr = new XMLHttpRequest();
      xhr.open(this.method, this.url, true);
      xhr.responseType = this.responseType;
      xhr.onprogress = this.requestProgressed;
      xhr.onload = this.requestLoaded;
      xhr.onerror = this.requestFailed;
      xhr.ontimeout = this.requestTimedOut;
      xhr.onabort = this.requestCanceled;

      if (this.timeout) {
        xhr.timeout = this.timeout * 1000;
      }

      for (var i in this.headers) {
        xhr.setRequestHeader(i, this.headers[i]);
      }

      return xhr;
    }
  }, {
    key: "endRequest",
    value: function endRequest() {
      var callback = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : function () {};

      if (this.xhr) {
        this.notifyApplicationAfterRequestEnd();
        callback(this.xhr);
        this.destroy();
      }
    }
  }, {
    key: "setProgress",
    value: function setProgress(progress) {
      this.progress = progress;
      this.delegate.requestProgressed(progress);
    }
  }, {
    key: "destroy",
    value: function destroy() {
      this.setProgress(1);
      this.delegate.requestFinished();
    }
  }, {
    key: "processResponseData",
    value: function processResponseData(xhr, callback) {
      if (this.responseType !== 'blob') {
        callback(xhr, xhr.responseText);
        return;
      } // Confirm response is a download


      var contentDisposition = xhr.getResponseHeader('Content-Disposition') || '';

      if (contentDisposition.indexOf('attachment') === 0 || contentDisposition.indexOf('inline') === 0) {
        callback(xhr, xhr.response);
        return;
      } // Convert blob to text


      var reader = new FileReader();
      reader.addEventListener('load', function () {
        callback(xhr, reader.result);
      });
      reader.readAsText(xhr.response);
    }
  }]);

  return HttpRequest;
}();

function contentResponseIsRedirect(xhr, url) {
  if (xhr.getResponseHeader('X-OCTOBER-LOCATION')) {
    return xhr.getResponseHeader('X-OCTOBER-LOCATION');
  }

  var anchorMatch = url.match(/^(.*)#/),
      wantUrl = anchorMatch ? anchorMatch[1] : url;
  return wantUrl !== xhr.responseURL ? xhr.responseURL : null;
}

function contentTypeIsHTML(contentType) {
  return (contentType || '').match(/^text\/html|^application\/xhtml\+xml/);
}

function contentTypeIsJSON(contentType) {
  return (contentType || '').includes('application/json');
}

/***/ }),

/***/ "./src/util/index.js":
/*!***************************!*\
  !*** ./src/util/index.js ***!
  \***************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "array": () => (/* binding */ array),
/* harmony export */   "defer": () => (/* binding */ defer),
/* harmony export */   "dispatch": () => (/* binding */ dispatch),
/* harmony export */   "unindent": () => (/* binding */ unindent),
/* harmony export */   "uuid": () => (/* binding */ uuid)
/* harmony export */ });
function dispatch(eventName) {
  var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
      _ref$target = _ref.target,
      target = _ref$target === void 0 ? document : _ref$target,
      _ref$detail = _ref.detail,
      detail = _ref$detail === void 0 ? {} : _ref$detail,
      _ref$bubbles = _ref.bubbles,
      bubbles = _ref$bubbles === void 0 ? true : _ref$bubbles,
      _ref$cancelable = _ref.cancelable,
      cancelable = _ref$cancelable === void 0 ? true : _ref$cancelable;

  var event = new CustomEvent(eventName, {
    detail: detail,
    bubbles: bubbles,
    cancelable: cancelable
  });
  target.dispatchEvent(event);
  return event;
}
function defer(callback) {
  setTimeout(callback, 1);
}
function unindent(strings) {
  for (var _len = arguments.length, values = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    values[_key - 1] = arguments[_key];
  }

  var lines = trimLeft(interpolate(strings, values)).split("\n");
  var match = lines[0].match(/^\s+/);
  var indent = match ? match[0].length : 0;
  return lines.map(function (line) {
    return line.slice(indent);
  }).join("\n");
}

function trimLeft(string) {
  return string.replace(/^\n/, "");
}

function interpolate(strings, values) {
  return strings.reduce(function (result, string, i) {
    var value = values[i] == undefined ? "" : values[i];
    return result + string + value;
  }, "");
}

function array(values) {
  return Array.prototype.slice.call(values);
}
function uuid() {
  return Array.apply(null, {
    length: 36
  }).map(function (_, i) {
    if (i == 8 || i == 13 || i == 18 || i == 23) {
      return "-";
    } else if (i == 14) {
      return "4";
    } else if (i == 19) {
      return (Math.floor(Math.random() * 4) + 8).toString(16);
    } else {
      return Math.floor(Math.random() * 15).toString(16);
    }
  }).join("");
}

/***/ }),

/***/ "./src/util/json-parser.js":
/*!*********************************!*\
  !*** ./src/util/json-parser.js ***!
  \*********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "JsonParser": () => (/* binding */ JsonParser)
/* harmony export */ });
function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }

// JsonParser serializes JS-syntax to JSON without using eval
var JsonParser = /*#__PURE__*/function () {
  function JsonParser() {
    _classCallCheck(this, JsonParser);
  }

  _createClass(JsonParser, [{
    key: "parseString",
    value: // Private
    function parseString(str) {
      str = str.trim();

      if (!str.length) {
        throw new Error("Broken JSON object.");
      }

      var result = "";
      /*
       * the mistake ','
       */

      while (str && str[0] === ",") {
        str = str.substr(1);
      }
      /*
       * string
       */


      if (str[0] === "\"" || str[0] === "'") {
        if (str[str.length - 1] !== str[0]) {
          throw new Error("Invalid string JSON object.");
        }

        var body = "\"";

        for (var i = 1; i < str.length; i++) {
          if (str[i] === "\\") {
            if (str[i + 1] === "'") {
              body += str[i + 1];
            } else {
              body += str[i];
              body += str[i + 1];
            }

            i++;
          } else if (str[i] === str[0]) {
            body += "\"";
            return body;
          } else if (str[i] === "\"") {
            body += "\\\"";
          } else body += str[i];
        }

        throw new Error("Invalid string JSON object.");
      }
      /*
       * boolean
       */


      if (str === "true" || str === "false") {
        return str;
      }
      /*
       * null
       */


      if (str === "null") {
        return "null";
      }
      /*
       * number
       */


      var num = parseFloat(str);

      if (!isNaN(num)) {
        return num.toString();
      }
      /*
       * object
       */


      if (str[0] === "{") {
        var type = "needKey";
        var result = "{";

        for (var i = 1; i < str.length; i++) {
          if (this.isBlankChar(str[i])) {
            continue;
          } else if (type === "needKey" && (str[i] === "\"" || str[i] === "'")) {
            var key = this.parseKey(str, i + 1, str[i]);
            result += "\"" + key + "\"";
            i += key.length;
            i += 1;
            type = "afterKey";
          } else if (type === "needKey" && this.canBeKeyHead(str[i])) {
            var key = this.parseKey(str, i);
            result += "\"";
            result += key;
            result += "\"";
            i += key.length - 1;
            type = "afterKey";
          } else if (type === "afterKey" && str[i] === ":") {
            result += ":";
            type = ":";
          } else if (type === ":") {
            var body = this.getBody(str, i);
            i = i + body.originLength - 1;
            result += this.parseString(body.body);
            type = "afterBody";
          } else if (type === "afterBody" || type === "needKey") {
            var last = i;

            while (str[last] === "," || this.isBlankChar(str[last])) {
              last++;
            }

            if (str[last] === "}" && last === str.length - 1) {
              while (result[result.length - 1] === ",") {
                result = result.substr(0, result.length - 1);
              }

              result += "}";
              return result;
            } else if (last !== i && result !== "{") {
              result += ",";
              type = "needKey";
              i = last - 1;
            }
          }
        }

        throw new Error("Broken JSON object near " + result);
      }
      /*
       * array
       */


      if (str[0] === "[") {
        var result = "[";
        var type = "needBody";

        for (var i = 1; i < str.length; i++) {
          if (" " === str[i] || "\n" === str[i] || "\t" === str[i]) {
            continue;
          } else if (type === "needBody") {
            if (str[i] === ",") {
              result += "null,";
              continue;
            }

            if (str[i] === "]" && i === str.length - 1) {
              if (result[result.length - 1] === ",") result = result.substr(0, result.length - 1);
              result += "]";
              return result;
            }

            var body = this.getBody(str, i);
            i = i + body.originLength - 1;
            result += this.parseString(body.body);
            type = "afterBody";
          } else if (type === "afterBody") {
            if (str[i] === ",") {
              result += ",";
              type = "needBody"; // deal with mistake ","

              while (str[i + 1] === "," || this.isBlankChar(str[i + 1])) {
                if (str[i + 1] === ",") result += "null,";
                i++;
              }
            } else if (str[i] === "]" && i === str.length - 1) {
              result += "]";
              return result;
            }
          }
        }

        throw new Error("Broken JSON array near " + result);
      }
    }
  }, {
    key: "parseKey",
    value: function parseKey(str, pos, quote) {
      var key = "";

      for (var i = pos; i < str.length; i++) {
        if (quote && quote === str[i]) {
          return key;
        } else if (!quote && (str[i] === " " || str[i] === ":")) {
          return key;
        }

        key += str[i];

        if (str[i] === "\\" && i + 1 < str.length) {
          key += str[i + 1];
          i++;
        }
      }

      throw new Error("Broken JSON syntax near " + key);
    }
  }, {
    key: "getBody",
    value: function getBody(str, pos) {
      // parse string body
      if (str[pos] === "\"" || str[pos] === "'") {
        var body = str[pos];

        for (var i = pos + 1; i < str.length; i++) {
          if (str[i] === "\\") {
            body += str[i];
            if (i + 1 < str.length) body += str[i + 1];
            i++;
          } else if (str[i] === str[pos]) {
            body += str[pos];
            return {
              originLength: body.length,
              body: body
            };
          } else body += str[i];
        }

        throw new Error("Broken JSON string body near " + body);
      } // parse true / false


      if (str[pos] === "t") {
        if (str.indexOf("true", pos) === pos) {
          return {
            originLength: "true".length,
            body: "true"
          };
        }

        throw new Error("Broken JSON boolean body near " + str.substr(0, pos + 10));
      }

      if (str[pos] === "f") {
        if (str.indexOf("f", pos) === pos) {
          return {
            originLength: "false".length,
            body: "false"
          };
        }

        throw new Error("Broken JSON boolean body near " + str.substr(0, pos + 10));
      } // parse null


      if (str[pos] === "n") {
        if (str.indexOf("null", pos) === pos) {
          return {
            originLength: "null".length,
            body: "null"
          };
        }

        throw new Error("Broken JSON boolean body near " + str.substr(0, pos + 10));
      } // parse number


      if (str[pos] === "-" || str[pos] === "+" || str[pos] === "." || str[pos] >= "0" && str[pos] <= "9") {
        var body = "";

        for (var i = pos; i < str.length; i++) {
          if (str[i] === "-" || str[i] === "+" || str[i] === "." || str[i] >= "0" && str[i] <= "9") {
            body += str[i];
          } else {
            return {
              originLength: body.length,
              body: body
            };
          }
        }

        throw new Error("Broken JSON number body near " + body);
      } // parse object


      if (str[pos] === "{" || str[pos] === "[") {
        var stack = [str[pos]];
        var body = str[pos];

        for (var i = pos + 1; i < str.length; i++) {
          body += str[i];

          if (str[i] === "\\") {
            if (i + 1 < str.length) body += str[i + 1];
            i++;
          } else if (str[i] === "\"") {
            if (stack[stack.length - 1] === "\"") {
              stack.pop();
            } else if (stack[stack.length - 1] !== "'") {
              stack.push(str[i]);
            }
          } else if (str[i] === "'") {
            if (stack[stack.length - 1] === "'") {
              stack.pop();
            } else if (stack[stack.length - 1] !== "\"") {
              stack.push(str[i]);
            }
          } else if (stack[stack.length - 1] !== "\"" && stack[stack.length - 1] !== "'") {
            if (str[i] === "{") {
              stack.push("{");
            } else if (str[i] === "}") {
              if (stack[stack.length - 1] === "{") {
                stack.pop();
              } else {
                throw new Error("Broken JSON " + (str[pos] === "{" ? "object" : "array") + " body near " + body);
              }
            } else if (str[i] === "[") {
              stack.push("[");
            } else if (str[i] === "]") {
              if (stack[stack.length - 1] === "[") {
                stack.pop();
              } else {
                throw new Error("Broken JSON " + (str[pos] === "{" ? "object" : "array") + " body near " + body);
              }
            }
          }

          if (!stack.length) {
            return {
              originLength: i - pos,
              body: body
            };
          }
        }

        throw new Error("Broken JSON " + (str[pos] === "{" ? "object" : "array") + " body near " + body);
      }

      throw new Error("Broken JSON body near " + str.substr(pos - 5 >= 0 ? pos - 5 : 0, 50));
    }
  }, {
    key: "canBeKeyHead",
    value: function canBeKeyHead(ch) {
      if (ch[0] === "\\") return false;
      if (ch[0] >= 'a' && ch[0] <= 'z' || ch[0] >= 'A' && ch[0] <= 'Z' || ch[0] === '_') return true;
      if (ch[0] >= '0' && ch[0] <= '9') return true;
      if (ch[0] === '$') return true;
      if (ch.charCodeAt(0) > 255) return true;
      return false;
    }
  }, {
    key: "isBlankChar",
    value: function isBlankChar(ch) {
      return ch === " " || ch === "\n" || ch === "\t";
    }
  }], [{
    key: "paramToObj",
    value: // Public
    function paramToObj(name, value) {
      if (value === undefined) {
        value = '';
      }

      if (_typeof(value) === 'object') {
        return value;
      }

      if (value.charAt(0) !== '{') {
        value = "{" + value + "}";
      }

      try {
        return this.parseJSON(value);
      } catch (e) {
        throw new Error('Error parsing the ' + name + ' attribute value. ' + e);
      }
    }
  }, {
    key: "parseJSON",
    value: function parseJSON(json) {
      return JSON.parse(new JsonParser().parseString(json));
    }
  }]);

  return JsonParser;
}();

/***/ }),

/***/ "./src/util/referrer.js":
/*!******************************!*\
  !*** ./src/util/referrer.js ***!
  \******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "getReferrerUrl": () => (/* binding */ getReferrerUrl)
/* harmony export */ });
/**
 * getReferrerUrl returns the last visited URL
 */
function getReferrerUrl() {
  var url = oc.useTurbo && oc.useTurbo() ? oc.AjaxTurbo.controller.getLastVisitUrl() : getReferrerFromSameOrigin();

  if (!url || isSameBaseUrl(url)) {
    return null;
  }

  return url;
}

function getReferrerFromSameOrigin() {
  if (!document.referrer) {
    return null;
  } // Fallback when turbo router is not activated


  try {
    var referrer = new URL(document.referrer);

    if (referrer.origin !== location.origin) {
      return null;
    }

    var pushReferrer = localStorage.getItem('ocPushStateReferrer');

    if (pushReferrer && pushReferrer.indexOf(referrer.pathname) === 0) {
      return pushReferrer;
    }

    return document.referrer;
  } catch (e) {}
}

function isSameBaseUrl(url) {
  var givenUrl = new URL(url, window.location.origin),
      currentUrl = new URL(window.location.href);
  return givenUrl.origin === currentUrl.origin && givenUrl.pathname === currentUrl.pathname;
}

/***/ }),

/***/ "./src/util/wait.js":
/*!**************************!*\
  !*** ./src/util/wait.js ***!
  \**************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "domReady": () => (/* binding */ domReady),
/* harmony export */   "waitFor": () => (/* binding */ waitFor)
/* harmony export */ });
/**
 * Function to wait for predicates.
 * @param {function() : Boolean} predicate - A function that returns a bool
 * @param {Number} [timeout] - Optional maximum waiting time in ms after rejected
 */
function waitFor(predicate, timeout) {
  return new Promise(function (resolve, reject) {
    var check = function check() {
      if (!predicate()) {
        return;
      }

      clearInterval(interval);
      resolve();
    };

    var interval = setInterval(check, 100);
    check();

    if (!timeout) {
      return;
    }

    setTimeout(function () {
      clearInterval(interval);
      reject();
    }, timeout);
  });
}
/**
 * Function to wait for the DOM to be ready, if not already
 */

function domReady() {
  return new Promise(function (resolve) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () {
        return resolve();
      });
    } else {
      resolve();
    }
  });
}

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/amd options */
/******/ 	(() => {
/******/ 		__webpack_require__.amdO = {};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
/*!********************************!*\
  !*** ./src/framework-turbo.js ***!
  \********************************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _request__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./request */ "./src/request/index.js");
/* harmony import */ var _core__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./core */ "./src/core/index.js");
/* harmony import */ var _turbo__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./turbo */ "./src/turbo/index.js");
/**
 * --------------------------------------------------------------------------
 * October CMS: Frontend JavaScript Framework
 * https://octobercms.com
 * --------------------------------------------------------------------------
 * Copyright 2013-2023 Alexey Bobkov, Samuel Georges
 * --------------------------------------------------------------------------
 */



})();

/******/ })()
;