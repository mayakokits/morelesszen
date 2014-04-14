/*
 * TODOs
 * - use more classes in corresponding css for fullheight, shift,
 * - shiftAside cross browser
 * - use transitions and tranformations for browsers who understand them
 *   use js fallback otherwise
 */
(function ( $, M ) {
  'use strict';
  $.fn.mobilemenu = function( options ) {

    var settings = $.extend({}, $.fn.mobilemenu.defaults, options );
    var mobileQuery = window.matchMedia('(min-width: ' + (settings.breakpoint - 1) + 'px)');
    var hasModernizr = typeof M !== 'undefined',
        hasHammer = typeof Hammer !== 'undefined';
    var $menu = $(this),
        $body = $('body'),
        $iconContainer = $(settings.iconContainer),
        $closeContainer = $(settings.closeContainer),
        $dim = $(settings.dimElement),
        onFallback = false,
        throttled,
        $icon,
        $close;
    // placeholder used to determine original position of moveable $menu
    var $menuPlaceholder = $('<span id="mobile-menu-placeholder"></span>');
    // move $menu, when we slide it (i.e. not when collapsible)
    if (!settings.collapsibleMenu) {
      $menu.after($menuPlaceholder);
      $body.addClass(settings.mobileMenuSlidingClass);
      // when no collapsibleMenu, we are sliding
      $body.addClass(settings.mobileMenuDirectionClassPrefix + settings.animationFromDirection)
    }

    $body.addClass(settings.mobileMenuEnabledClass);

    // ignore shiftBodyAside on browser which do not support CSS3
    // transformations
    if (!hasModernizr || !M.csstransforms) {
      settings.shiftBodyAside = false;
      settings.needTransformsFallback = true;
      onFallback = true;
      $body.addClass(settings.mobileMenuFallbackClass);
    }

    // generate buttons or use elements/containers from settings
    // default: before icon to menu, append close to menu
    if (settings.createIcon) {
      $icon = $('<a href="#">' + settings.iconText + '</a>').attr(settings.iconAttributes);
      if ($iconContainer.length > 0) {
        $iconContainer.append($icon);
      } else {
        $menu.before($icon);
      }
    } else {
      $icon = $(settings.iconElement);
    }
    if (settings.createIcon) {
      $close = $('<a href="#">' + settings.closeText + '</a>').attr(settings.closeAttributes);
      if ($closeContainer.length > 0) {
        $closeContainer.append($close);
      } else {
        $menu.append($close);
      }
    } else {
      $close = $(settings.closeElement);
    }

    // collapsible links/submenus in mobilemenu
    // if the link clicked has a ul.menu sibling (i.e. a submenu)
    // we want to show the submenu
    if (settings.collapsibleSubMenus) {
      $('html').on('click', '.mobile-menu-open #main-menu li a', function(e) {
        var $a =$(this);
        var $li = $a.closest('li');

        var $ul = $a.siblings('ul');
        if ($ul.length > 0) {
          if ($ul.is(':visible')) {
            $ul.hide();
            $li.removeClass('submenu-open');
          } else {
            $ul.show();
            $li.addClass('submenu-open');
          }

          // lose focus
          $a.blur();
          // stop propagation - we do not want to follow link when it could
          // reveal a submenu
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
      });
    }

    // gets called when switched to mobile
    // sets up the classes, ...
    var switchToMobile = function(mql) {
      // $menu.hide();
      // $icon.show();
      // $close.show();
      $body.addClass(settings.mobileMenuClass);

      if (!settings.collapsibleMenu) {
        $menu.prependTo($body);
      }

      if (settings.collapsibleSubMenus) {
        $('ul ul', $menu).css('display', '');
      }

      // callback
      settings.onSwitchToMobile.call($menu, settings, mql);
    }

    // gets called when switched to desktop
    var switchToDesktop = function(mql) {
      // $icon.hide();
      // $close.hide();
      if (!settings.collapsibeMenu) {
        $menuPlaceholder.before($menu);
      }
      $body.removeClass(settings.mobileMenuClass);
      // close any open mobile menu
      if ($body.hasClass(settings.mobileMenuOpenClass)) {
        // @TODO menuClose animation cannot deal with "jump" in layout
        // so no animation --> remains sync
        if (!onFallback) {
          menuClose();
        } else {
          $body.css(settings.animationFromDirection, '');
          afterClose();
        }
        if (settings.adaptFullHeightOnResize) {
          setMenuMinHeight(0);
        }
      }

      if (settings.collapsibleSubMenus) {
        $('ul ul', $menu).hide();
      }

      // callback
      settings.onSwitchToDesktop.call($menu, settings, mql);
    }

    var setMenu = function (mql) {
      if (mql.matches) {
        switchToDesktop(mql);
      } else {
        switchToMobile(mql);
      }
    }

    var initMenu = function (mql) {
      if (mql.matches) {
        // $icon.hide();
        // $close.hide();
        $body.removeClass(settings.mobileMenuClass);
      } else {
        switchToMobile(mql);
      }
    }

    var setMenuMinHeight = function (pixel) {
      var paddingTop = parseInt($menu.css('padding-top'), 10);
      var paddingBottom = parseInt($menu.css('padding-bottom'), 10);
      $menu.css({minHeight: (pixel - paddingTop - paddingBottom) + 'px', maxHeight: (pixel - paddingTop - paddingBottom) + 'px', overflow: 'auto'});
    }

    // menu events
    var beforeOpen = function () {
      if (settings.dimBackground) {
        $dim.show();
      }

      settings.beforeOpen.call($menu, settings);
    }
    var afterOpen = function () {
      settings.afterOpen.call($menu, settings);
    }
    var beforeClose = function () {
      settings.beforeClose.call($menu, settings);
    }
    var afterClose = function () {
      // if (mobileQuery.matches) {
      //   $menu.show();
      // } else {
      //   $menu.hide();
      // }
      $body.removeClass(settings.mobileMenuOpenClass);

      if (settings.dimBackground) {
        $dim.hide();
      }

      settings.afterClose.call($menu, settings);
    }
    var menuOpen = function () {
      $body.addClass(settings.mobileMenuOpenClass);

      if (!onFallback) {
        if (settings.shiftBodyAside) {
          $body.addClass(settings.mobileMenuShiftAsideClassPrefix + settings.animationFromDirection);
        }
        afterOpen();
      } else {
        var animation = {};
        animation[settings.animationFromDirection] = '0px';
        $menu.animate(animation, settings.animationDuration, afterOpen);
        // reset to prevent unexpected reuse of former values
        animation = {};
      }

      if (settings.adaptFullHeightOnResize) {
        setMenuMinHeight($body.innerHeight());
      }
    };

    var menuClose = function () {
      if (!onFallback) {
        if (settings.shiftBodyAside) {
          $body.removeClass(settings.mobileMenuShiftAsideClassPrefix + settings.animationFromDirection);
        }
      } else {
        var animation = {};
        animation[settings.animationFromDirection] = '-' + settings.width + 'px';
        $menu.animate(animation, settings.animationDuration, afterClose);

        // reset to prevent unexpected reuse of former values
        animation = {};
      }

      afterClose();

      $dim.hide();
    };

    // throttled resize handler
    var resizeHandler = function () {
      if (throttled) {
        return;
      }

      throttled = true;

      setTimeout(function() {
        throttled = false;
      }, settings.interval);

      // throttled from here on

      if (!mobileQuery.matches && $body.hasClass(settings.mobileMenuOpenClass)) {
        var position = [];

        // % on padding will change the main-menu size --> recalc
        if (settings.adaptFullHeightOnResize) {
          setMenuMinHeight($body.innerHeight());
        }

        // if (settings.shiftBodyAside) {
        //   position[settings.animationFromDirection] = settings.width + 'px';
        //   $body.css(position);
        //   position[settings.animationFromDirection] = '-' + settings.width + 'px';
        //   $menu.css(position);
        // }
      }
    }

    var menuHandler = function (e, action) {
      if (action) {
        if (action === 'open' && !$body.hasClass(settings.mobileMenuOpenClass)) {
          beforeOpen();
          menuOpen();
        } else if (action === 'close' && $body.hasClass(settings.mobileMenuOpenClass)) {
          beforeClose();
          menuClose();
        }
      } else {
        if ($body.hasClass(settings.mobileMenuOpenClass)) {
          beforeClose();
          menuClose();
        } else {
          beforeOpen();
          menuOpen();
        }
      }

      $(this).blur();
      e.preventDefault();
      return false;
    }

    // use Hammer.js if available and we are running on a touch
    // capable device
    if (hasHammer && hasModernizr && M.touch) {
      Hammer(document).on('swiperight', function(e) {
        menuHandler(e, 'open');
      });
      Hammer(document).on('swipeleft', function(e) {
        menuHandler(e, 'close');
      });
    }
    // bind click handler 
    if ($icon.length > 0) {
      $icon.on('click.mobilemenu', menuHandler);
    }
    if ($close.length > 0) {
      $close.on('click.mobilemenu', menuHandler);
    }

    // add breakpoint listener and do inital call
    mobileQuery.addListener(function(mql) {
      setMenu(mql);
    });

    // resize handler
    $(window).on('resize.mobilemenu', resizeHandler);

    // initialize
    setTimeout(function() { initMenu(mobileQuery); }, 1);
    // init callback
    settings.init.call($menu, settings);

    // be a nice jQuery plugin and return myself
    return this;
  }


  $.fn.mobilemenu.defaults = {
    // These are the defaults.
    breakpoint: 780,
    width: 300,
    createIcon: true,
    iconText: 'Menu',
    iconContainer: '',
    iconElement: undefined,
    iconAttributes: { id: 'mobile-menu-icon' },
    createClose: true,
    closeText: 'close',
    closeContainer: '',
    closeElement: undefined,
    closeAttributes: { id: 'mobile-menu-close' },
    mobileMenuClass: 'gone-mobile',
    mobileMenuEnabledClass: 'with-mobile-menu',
    mobileMenuOpenClass: 'mobile-menu-open',
    mobileMenuShiftAsideClassPrefix: 'mobile-menu-shift-aside-',
    mobileMenuDirectionClassPrefix: 'mobile-menu-from-',
    mobileMenuSlidingClass: 'mobile-menu-sliding',
    mobileMenuFallbackClass: 'mobile-menu-fallback',
    adaptFullHeightOnResize: false, // TODO
    animationDuration: 300,
    animationFromDirection: 'left',
    shiftBodyAside: false,
    collapsibleMenu: false, // TODO
    createDim: false, // TODO
    dimBackground: true,
    dimElement: '',
    interval: 100,
    collapseSubMenus: true,
    collapsibleSubMenus: true, // TODO
    needTransformsFallback: false,
    init: function() {},
    beforeOpen: function() {},
    beforeClose: function() {},
    afterOpen: function() {},
    afterClose: function() {},
    onSwitchToMobile: function() {},
    onSwitchToDesktop: function() {}
  }
}( jQuery, Modernizr ));
