/*!
 * Uniloader
 * Shows mouse or overlay loaders (with a modal window optionally)
 *
 * @requires jQuery v1.4.3 or newer
 *
 * @author Grigory Zarubin (http://craigy.ru/)
 * @version 1.0.1
 * @date 07.12.2014
 *
 * Dual licensed under the MIT or GPL licenses:
 * http://www.opensource.org/licenses/mit-license.php
 * http://www.gnu.org/licenses/gpl.html
 */

(function($) {
  var loader = {
    mouseCoords: {
      x: 0,
      y: 0
    },

    APNGSupported: false,

    init: function() {
      // Remember coordinates of the last mouse click
      $(window).on('click.loader', function(e) {
        loader.mouseCoords.x = e.pageX - 15;
        loader.mouseCoords.y = e.pageY - 15;
      });

      // Check browser supported APNG or not
      loader._checkAPNGSupport();
    },

    _checkAPNGSupport: function() {
      var APNGTest = new Image(),
          cv = document.createElement('canvas');
      APNGTest.onload = function() {
        if(cv.getContext) {
          var ctx = cv.getContext('2d');
          ctx.drawImage(APNGTest, 0, 0);
          loader.APNGSupported = (ctx.getImageData(0, 0, 1, 1).data[3] === 0);
        }
      };
      APNGTest.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACGFjVEwAAAABAAAAAcMq2TYAAAANSURBVAiZY2BgYPgPAAEEAQB9ssjfAAAAGmZjVEwAAAAAAAAAAQAAAAEAAAAAAAAAAAD6A+gBAbNU+2sAAAARZmRBVAAAAAEImWNgYGBgAAAABQAB6MzFdgAAAABJRU5ErkJggg==';
    },

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
      onClick: $.noop,
      onShow:  $.noop,
      onHide:  $.noop
    }
  };

  // Mouse Loader
  $.mouseLoader = function(state, options) {
    var $node = $('#loader-mouse');
    var opts = $.extend(true, {}, loader.defaults, options);

    if(!loader.mouseCoords.x) {
      loader.mouseCoords.x = Math.ceil($(window).width() / 2);
    }
    if(!loader.mouseCoords.y) {
      loader.mouseCoords.y = Math.ceil($(window).height() / 2);
    }

    if(state) { // show loader
      if(!$node.length) { // create node
        $node = $('<div id="loader-mouse" />').data('moveHandler', function(e) {
          $node.css({
            'left' : e.pageX - 15,
            'top'  : e.pageY - 15
          });
        });
        $(document.body).append($node);
        if(loader.APNGSupported) {
          $node.css('backgroundImage', $node.css('backgroundImage').replace(/ajax\.gif/gi, 'ajax.png'));
        }
        $node.data('depth', 0);
      }

      if(!$node.data('depth')) { // show node
        $node.data('mouseOnHide', opts.onHide).css({
          'left' : loader.mouseCoords.x - 15,
          'top'  : loader.mouseCoords.y - 15
        });
        $node.show(200, function() {
          opts.onShow();
        });
        $(document.body).on('mousemove.loader scroll.loader', $node.data('moveHandler'));
      }
      $node.data('depth', $node.data('depth') + 1);

    } else { // hide node
     $node.data('depth', $node.data('depth') - 1);
      if(!$node.data('depth')) {
        $node.hide(200, function() {
          $node.data('mouseOnHide')();
        });
        $(document.body).off('mousemove.loader scroll.loader', $node.data('moveHandler'));
      }
    }
  };

  // Overlay Loader
  $.overlayLoader = function(state, options) {
    var $overlay = $('#overlay'),
        $node = $('#loader-overlay'),
        isModal = false;

    if(options && options.node) {
      $node = $(options.node);
      isModal = true;
      delete options.node;
    }

    var opts = $.extend(true, {}, loader.defaults, options);

    var resizer = 'resize';
    if('throttledresize' in jQuery.event.special) {
      resizer = 'throttledresize';
    }

    if(state) { // show node
      if(!$overlay.length) { // create node
        $overlay = $('<div id="overlay" />');
        $(document.body).append($overlay);
        $overlay.data('depth', 0);
      }

      if(!$overlay.data('depth')) { // show node
        opts.onClick();
        if(isModal) {
          $overlay.on('click.overlay', function() {
            $.overlayLoader(false, {
              node: $overlay.data('loaderNode')
            });
          });

          $(document.body).on('keypress.overlay', function(e) {
            if(e.keyCode == 27) {
              $.overlayLoader(false, {
                node: $overlay.data('loaderNode')
              });
            }
          });
        }
        if(!$node.length) {
          $node = $('<div id="loader-overlay"><div class="loader-overlay-text"></div></div>');
        }
        $(window).on(resizer + '.overlay gestureend.overlay', function() {
          var coords = loader._centerNode($node);
          $node.css({
            'left' : coords.left,
            'top'  : coords.top
          });
        });
        $overlay.data({
          'loaderNode': $node,
          'loaderOnHide': opts.onHide
        }).fadeTo(200, .5, function() {
          $(document.body).addClass('overlay-body').append($node);
          var coords = loader._centerNode($node);
          $node.css({
            'left' : coords.left,
            'top'  : coords.top
          }).show(200, function() {
            opts.onShow();
          });
        });
      }
      $overlay.data('depth', $overlay.data('depth') + 1);

    } else if($overlay.data('depth')) { // hide node
      $overlay.data('depth', $overlay.data('depth') - 1);
      if(!$overlay.data('depth')) {
        if(isModal) {
          $overlay.off('click.overlay');
          $(document.body).off('keypress.overlay');
        }
        $(window).off(resizer + '.overlay gestureend.overlay');
        $overlay.fadeOut(200, function() {
          $node.hide(200, function() {
            $overlay.hide();
            $(document.body).removeClass('overlay-body');
            $overlay.data('loaderOnHide')();
          });
        });
      }
    }
  };

  loader.init();

})(jQuery);