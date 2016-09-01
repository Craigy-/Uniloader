/*!
 * Uniloader
 * Shows mouse or overlay loaders (with a modal window optionally)
 *
 * @requires jQuery v1.4.3 or newer
 *
 * @author Grigory Zarubin (http://craigy.ru/)
 * @version 1.0.3
 * @date 31.08.2016
 *
 * Dual licensed under the MIT or GPL licenses:
 * http://www.opensource.org/licenses/mit-license.php
 * http://www.gnu.org/licenses/gpl.html
 */

(function($) {
  var uniloader = {
    mouseCoords: {
      x: 0,
      y: 0
    },

    APNGSupported: false,

    init: function() {
      // Remember coordinates of the last mouse click
      $(window).on('click.uniloader', function(e) {
        uniloader.mouseCoords.x = e.pageX - 15;
        uniloader.mouseCoords.y = e.pageY - 15;
      });

      this._checkAPNGSupport();
    },

    // Check browser supported APNG or not
    _checkAPNGSupport: function() {
      var APNGTest = new Image(),
          cv = document.createElement('canvas');
      APNGTest.onload = function() {
        if(cv.getContext) {
          var ctx = cv.getContext('2d');
          ctx.drawImage(APNGTest, 0, 0);
          uniloader.APNGSupported = (ctx.getImageData(0, 0, 1, 1).data[3] === 0);
        }
      };
      APNGTest.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACGFjVEwAAAABAAAAAcMq2TYAAAANSURBVAiZY2BgYPgPAAEEAQB9ssjfAAAAGmZjVEwAAAAAAAAAAQAAAAEAAAAAAAAAAAD6A+gBAbNU+2sAAAARZmRBVAAAAAEImWNgYGBgAAAABQAB6MzFdgAAAABJRU5ErkJggg==';
    },

    // Centering node in the browser window
    _centerNode: function(node) {
      var w = node.outerWidth(),
          h = node.outerHeight(),
          x = $(window).scrollLeft() + Math.ceil(($(window)[0].innerWidth || $(window).width()) / 2),
          y = $(window).scrollTop() + Math.ceil(($(window)[0].innerHeight || $(window).height()) / 2);

      return {
        'left' : (x - w / 2) < 0 ? 0 : (x - w / 2) + 'px',
        'top'  : (y - h / 2) < 0 ? 0 : (y - h / 2) + 'px'
      };
    },

    defaults: {
      hideSelector: '.modal-close',
      effectSpeed:  200,
      onStart: $.noop,
      onShow:  $.noop,
      onHide:  $.noop
    }
  };

  // Mouse loader
  $.mouseLoader = function(state, options) {
    var $node = $('#uniloader-mouse');
    var opts = $.extend(true, {}, uniloader.defaults, options);

    if(!uniloader.mouseCoords.x) {
      uniloader.mouseCoords.x = Math.ceil(($(window)[0].innerWidth || $(window).width()) / 2);
    }
    if(!uniloader.mouseCoords.y) {
      uniloader.mouseCoords.y = Math.ceil(($(window)[0].innerHeight || $(window).height()) / 2);
    }

    if(state) { // show loader

      if(!$node.length) { // create node
        $node = $('<div id="uniloader-mouse" />').data('uniloader-mousemove', function(e) {
          $node.css({
            'left' : e.pageX - 15,
            'top'  : e.pageY - 15
          });
        });
        $(document.body).append($node);
        if(uniloader.APNGSupported) {
          $node.css('backgroundImage', $node.css('backgroundImage').replace(/ajax\.gif/gi, 'ajax.png'));
        }
      }

      // Show node
      if($node.is(':visible')) {
        return;
      }

      opts.onStart();
      $node.data('uniloader-onHide', opts.onHide).css({
        'left' : uniloader.mouseCoords.x - 15,
        'top'  : uniloader.mouseCoords.y - 15
      });
      $node.show(opts.effectSpeed, function() {
        opts.onShow();
      });
      $(document.body).on('mousemove.uniloader scroll.uniloader', $node.data('uniloader-mousemove'));

    } else {

      // Hide node
      $node.hide(opts.effectSpeed, function() {
        $node.data('uniloader-onHide')();
      });
      $(document.body).off('mousemove.uniloader scroll.uniloader', $node.data('uniloader-mousemove'));

    }
  };

  // Overlay loader
  $.overlayLoader = function(state, options) {
    var $overlay = $('#uniloader-overlay'),
        $node = $('#uniloader-overlay-content'),
        isModal = false;

    if(options && options.node) {
      $node = $(options.node);
      isModal = true;
      delete options.node;
    }

    var opts = $.extend(true, {}, uniloader.defaults, options);

    var resizer = 'resize';
    if('throttledresize' in jQuery.event.special) {
      resizer = 'throttledresize';
    }

    if(state) { // show node

      if(!$overlay.length) { // create node
        $overlay = $('<div id="uniloader-overlay" />');
        $(document.body).append($overlay);
      }

      // Show node
      if($overlay.is(':visible')) {
        return;
      }

      opts.onStart();
      if(isModal) {
        $overlay.on('click.uniloader', function() {
          $.overlayLoader(false, {
            node: $overlay.data('uniloader-node')
          });
        });

        $(document.body).on('keypress.uniloader', function(e) {
          if(e.keyCode == 27) {
            $.overlayLoader(false, {
              node: $overlay.data('uniloader-node')
            });
          }
        });

        $node.find(opts.hideSelector).on('click.uniloader', function(e) {
          e.preventDefault();
          $.overlayLoader(false, {
            node: $overlay.data('uniloader-node')
          });
        });
      }
      if(!$node.length) {
        $node = $('<div id="uniloader-overlay-content"><div class="uniloader-overlay-content-text"></div></div>');
      }
      $(window).on(resizer + '.uniloader gestureend.uniloader', function() {
        var coords = uniloader._centerNode($node);
        $node.css({
          'left' : coords.left,
          'top'  : coords.top
        });
      });
      $overlay.data({
        'uniloader-node': $node,
        'uniloader-onHide': opts.onHide
      }).fadeTo(opts.effectSpeed, .5, function() {
        $(document.body).addClass('uniloader-overlay-body').append($node);
        var coords = uniloader._centerNode($node);
        $node.css({
          'left' : coords.left,
          'top'  : coords.top
        }).show(opts.effectSpeed, function() {
          opts.onShow();
        });
      });

    } else {

      // Hide node
      if(isModal) {
        $overlay.off('.uniloader');
        $(document.body).off('keypress.uniloader');
      }
      $(window).off(resizer + '.uniloader gestureend.uniloader');
      $overlay.fadeOut(opts.effectSpeed, function() {
        $node.hide(opts.effectSpeed, function() {
          $overlay.hide();
          $(document.body).removeClass('uniloader-overlay-body');
          $overlay.data('uniloader-onHide')();
        });
      });

    }
  };

  uniloader.init();

})(jQuery);