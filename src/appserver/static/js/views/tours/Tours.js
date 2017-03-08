define(
    [
        'jquery',
        'underscore',
        'backbone',
        'module',
        'models/services/data/ui/Tour',
        'views/Base',
        'app/views/tours/image/Item',
        'app/views/tours/interactive/Item',
        'app/views/tours/dialogs/NewImageTourDialog',
        'app/views/tours/dialogs/NewIntTourDialog',
        'splunk.util',
        'uri/route'
    ],
    function(
        $, 
        _,
        backbone, 
        module,
        TourModel,
        BaseView,
        ImageTourItem,
        InteractiveTourItem,
        NewTourDialog,
        NewIntDialog,
        splunkUtil,
        route
    ){
        return BaseView.extend({
            moduleId: module.id,
            events: {
                'click .remove': function(e) {
                    e.preventDefault();
                    if (confirm('Are you sure?')) {
                        var $tile = $(e.currentTarget).parents('.tour-tile');
                        $tile.remove();
                        this.removeTour($tile.data('name'));
                    }
                },
                'click .user-image-tours .tour-tile .edit': function(e) {
                    e.preventDefault();
                    this.trigger('edit', $(e.currentTarget).parents('.tour-tile').data('name'));
                },
                'click .user-image-tours .tour-tile .run': function(e) {
                    e.preventDefault();
                    this.trigger('run', $(e.currentTarget).parents('.tour-tile').data('name'));
                },
                'click .add-tour-img': function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    this.children.newImgTour = new NewTourDialog({
                        model: {
                            tour: new TourModel(),
                            application: this.model.application
                        },
                        collection: {
                            tours: this.collection.tours
                        }
                    });
                    this.children.newImgTour.render().appendTo($('body')).show();
                },
                'click .add-tour-int': function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    this.newEditIntTour(true);
                },
                'click .user-interactive-tours .interactive-tour-tile .edit': function(e) {
                    e.preventDefault();
                    this.trigger('edit-interactive', $(e.currentTarget).parents('.interactive-tour-tile').data('name'));
                },
                'click .user-interactive-tours .interactive-tour-tile .run': function(e) {
                    e.preventDefault();
                    this.trigger('run-interactive', $(e.currentTarget).parents('.interactive-tour-tile').data('name'));
                },
                'click .user-interactive-tours .interactive-tour-tile .edit-url': function(e) {
                    e.preventDefault();
                    var tourName = $(e.currentTarget).parents('.interactive-tour-tile').data('name');
                    this.model.tour = this.collection.tours.getTourModel(tourName);
                    this.newEditIntTour();
                }
            },

            newEditIntTour: function(isNew) {
                this.model.tour = (isNew) ? new TourModel() : this.model.tour;

                this.children.newTour = new NewIntDialog({
                    model: {
                        tour: this.model.tour,
                        application: this.model.application
                    },
                    collection: {
                        tours: this.collection.tours,
                        appLocals: this.collection.appLocals
                    }
                });
                this.children.newTour.render().appendTo($('body')).show();
            },

            removeTour: function(tourName) {
                this.model.tour = this.collection.tours.getTourModel(tourName);
                if (this.model.tour) {
                    this.model.tour.destroy();
                    this.model.tour.clear({silent: true});
                }
            },

            render: function() {
                this.$el.html(this.compiledTemplate());
                if (this.collection.tours) {
                    _.each(this.collection.tours.models, function(tour) {
                        var tourName = tour.entry.get('name');
                        if (tourName.indexOf(':') == -1 && tour.getImageContext() != 'system') {
                            var newItem;
                            var tourType = tour.entry.content.get('type');
                            if (tourType === 'interactive') {
                                newItem = new InteractiveTourItem({
                                    model: {
                                        tour: tour
                                    }
                                });
                            } else {
                                newItem = new ImageTourItem({
                                    model: {
                                        tour: tour
                                    }
                                });
                            }

                            if (tour.entry.content.has('spl')) {
                                this.$('.splunk-tours').append(newItem.render().el);
                            } else {
                                this.$('.user-' + tourType + '-tours').append(newItem.render().el);
                            }
                        }
                    }.bind(this));
                }

                this.$('.user-interactive-tours').append(this.add_interactive_template);
                this.$('.user-image-tours').append(this.add_image_template);
                return this;
            },

            template: '\
                <div class="touromatic">\
                    <h3 class="section-title"><%- _("Image Tours").t() %></h3>\
                    <div class="tour-section">\
                        <div class="user-image-tours tours"></div>\
                    </div>\
                    <h3 class="section-title"><%- _("Interactive Tours").t() %></h3>\
                    <div class="tour-section">\
                        <div class="user-interactive-tours tours"></div>\
                    </div>\
                </div>\
            ',

            add_image_template: '\
                <div class="add-tour-img">\
                    <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:sketch="http://www.bohemiancoding.com/sketch/ns" width="75px" height="75px" viewBox="0 0 36 36" version="1.1">\
                        <g>\
                            <path d="M17,17 L17,0 L19,0 L19,17 L36,17 L36,19 L19,19 L19,36 L17,36 L17,19 L0,19 L1.2246468e-16,17 L17,17 Z"></path>\
                        </g>\
                    </svg>\
                    <p class="add-tour-text">Create New Image Tour</p>\
                </div>\
            ',

            add_interactive_template: '\
                <div class="add-tour-int">\
                    <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:sketch="http://www.bohemiancoding.com/sketch/ns" width="75px" height="75px" viewBox="0 0 36 36" version="1.1">\
                        <g>\
                            <path d="M17,17 L17,0 L19,0 L19,17 L36,17 L36,19 L19,19 L19,36 L17,36 L17,19 L0,19 L1.2246468e-16,17 L17,17 Z"></path>\
                        </g>\
                    </svg>\
                </div>\
            '
        });
    }
);
