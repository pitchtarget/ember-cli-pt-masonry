import Ember from 'ember';

export default Ember.Component.extend({
  classNames: ['ptMasonry'],
  items: [],

  _getOptions: function (keys) {
    var properties = this.getProperties(keys);

    Ember.keys(properties).forEach(function (key) {
      if (Ember.isBlank(properties[key])) {
        delete properties[key];
      }
    });

    return properties;
  },

  _buildMasonryOptions: function() {
    return Ember.merge({
      // default options
      itemSelector: '.ptMasonry--item'
    }, this._getOptions([
      'containerStyle',
      'columnWidth',
      'gutter',
      'hiddenStyle',
      'isFitWidth',
      'isInitLayout',
      'isOriginLeft',
      'isOriginTop',
      'isResizeBound',
      'itemSelector',
      'stamp',
      'transitionDuration',
      'visibleStyle'
    ]));
  },

  _destroyMasonry: function(restoreMargins) {
    if (this.$() && this.get('_initializedMasonry')) {
      if (restoreMargins && this.get('isFitWidth')) {
        this.$().css({
          marginLeft: this.get('originalMarginLeft'),
          marginRight: this.get('originalMarginRight')
        });
      }

      this.$().masonry('destroy');
      this.set('_initializedMasonry', false);
    }
  },

  _initializeMasonry: function () {
    Ember.run.scheduleOnce('afterRender', this, function() {
      if (this.$()) {
        this.$().masonry(this.get('masonryOptions'));
        this.set('_initializedMasonry', true);

        this.$().imagesLoaded(function() {
          this._reloadMasonryLayout();
        }.bind(this));

        if (this.get('isFitWidth')) {
          this.$().css({
            marginLeft: 'auto',
            marginRight: 'auto'
          });
        }

        this.sendAction('onLoaded');
        this.sendAction('onDrawn');
      }
    });
  },

  _reloadMasonryLayout: function() {
    Ember.run.scheduleOnce('afterRender', this, function() {
      if (Ember.isBlank(this.$())) { return; }

      var api = this.$().data('masonry');

      if (api) {
        this.$().css({height: 'auto'});

        api.reloadItems();
        // disable transition
        var transitionDuration = api.options.transitionDuration;
        api.options.transitionDuration = 0;
        api.layout();
        // reset transition
        api.options.transitionDuration = transitionDuration;

        this.sendAction('onDrawn');
      }
    });
  },

  didInsertElement: function() {
    this._super();

    if (this.get('isFitWidth')) {
      this.set('originalMarginLeft', this.$().css('marginLeft'));
      this.set('originalMarginRight', this.$().css('marginRight'));
    }

    this.set('masonryOptions', this._buildMasonryOptions());
    this._initializeMasonry();
  },

  willDestroyElement: function() {
    this._super();
    this._destroyMasonry(true);
  },

  itemsDidChange: function() {
    Ember.run.scheduleOnce('afterRender', this, function() {
      this._reloadMasonryLayout();
      if (!this.$()) { return; }

      this.$().imagesLoaded(function() {
        this._reloadMasonryLayout();
      }.bind(this));
    });
  }.observes('items.length'),

  toggleReloadDidChange: function() {
    if (this.get('toggleReload')) {
      this._reloadMasonryLayout();
      this.set('toggleReload', undefined);
    }
  }.observes('toggleReload')
});
