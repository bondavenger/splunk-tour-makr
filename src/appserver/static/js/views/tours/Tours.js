define([
    'jquery',
    'underscore',
    'views/Base',
    'models/services/data/ui/Tour',
    'app/views/tours/image/Item',
    'app/views/tours/interactive/Item',
    'app/views/tours/dialogs/NewImageTourDialog',
    'app/views/tours/dialogs/NewIntTourDialog',
], function(
    $,
    _,
    BaseView,
    TourModel,
    ImageTourItem,
    InteractiveTourItem,
    NewImageTourDialog,
    NewIntDialog
) {
    return class ToursView extends BaseView {
        className() {
            return 'tours-list';
        }

        events() {
            return {
                'click .user-image-tours .tour-tile .edit': e => {
                    e.preventDefault();
                    this.trigger('edit', $(e.currentTarget).parents('.tour-tile').data('name'));
                },
                'click .user-image-tours .tour-tile .run': e => {
                    e.preventDefault();
                    this.trigger('run', $(e.currentTarget).parents('.tour-tile').data('name'));
                },
                'click .add-tour-img': e => {
                    e.preventDefault();
                    this.children.newImgTour = new NewImageTourDialog({
                        model: {
                            tour: new TourModel(),
                            application: this.model.application,
                            serverInfo: this.model.serverInfo,
                        },
                        collection: {
                            tours: this.collection.tours,
                            appLocals: this.collection.appLocals,
                        }
                    });
                    this.children.newImgTour.render().appendTo($('body')).show();
                },
                'click .add-tour-int': e => {
                    e.preventDefault();
                    this.newEditIntTour(true);
                },
                'click .user-interactive-tours .interactive-tour-tile .edit': e => {
                    e.preventDefault();
                    this.trigger('edit-interactive', $(e.currentTarget).parents('.interactive-tour-tile').data('name'));
                },
                'click .user-interactive-tours .interactive-tour-tile .run': e => {
                    e.preventDefault();
                    this.trigger('run-interactive', $(e.currentTarget).parents('.interactive-tour-tile').data('name'));
                },
                'click .user-interactive-tours .interactive-tour-tile .edit-url': e => {
                    e.preventDefault();
                    const tourName = $(e.currentTarget).parents('.interactive-tour-tile').data('name');
                    this.model.tour = this.collection.tours.getTourModel(tourName);
                    this.newEditIntTour();
                }
            }
        }

        newEditIntTour(isNew) {
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
        }

        render() {
            this.$el.html(_.template(this.mainTemplate()));

            if (this.collection.tours) {
                this.collection.tours.each(tour => {
                    const tourName = tour.entry.get('name');
                    if (tour.getImageContext() != 'system') {
                        const tourType = tour.entry.content.get('type');
                        const NewItem = (tourType === 'interactive') ? InteractiveTourItem : ImageTourItem;
                        const newItem = new NewItem({
                            model: {
                                tour: tour
                            },
                            collection: {
                                tours: this.collection.tours,
                            },
                        });

                        if (tour.entry.content.has('spl')) {
                            this.$('.splunk-tours').append(newItem.render().el);
                        } else {
                            this.$(`.user-${tourType}-tours`).append(newItem.render().el);
                        }
                    }
                });
            }

            this.$('.user-interactive-tours').append(this.addInteractiveTemplate());
            this.$('.user-image-tours').append(this.addImageTemplate());
            return this;
        }

        mainTemplate() {
            return `
                <div class="touromatic">
                    <h3 class="section-title"><%- _('Image Tours').t() %></h3>
                    <div class="tour-section">
                        <div class="user-image-tours tours"></div>
                    </div>
                    <h3 class="section-title"><%- _('Interactive Tours').t() %></h3>
                    <div class="tour-section">
                        <div class="user-interactive-tours tours"></div>
                    </div>
                </div>
            `;
        }

        addImageTemplate() {
            return `
                <div class="add-tour-img">
                    <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:sketch="http://www.bohemiancoding.com/sketch/ns" width="75px" height="75px" viewBox="0 0 36 36" version="1.1">
                        <g>
                            <path d="M17,17 L17,0 L19,0 L19,17 L36,17 L36,19 L19,19 L19,36 L17,36 L17,19 L0,19 L1.2246468e-16,17 L17,17 Z"></path>
                        </g>
                    </svg>
                    <p class="add-tour-text">Create New Image Tour</p>
                </div>
            `;
        }

        addInteractiveTemplate() {
            return `
                <div class="add-tour-int">
                    <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:sketch="http://www.bohemiancoding.com/sketch/ns" width="75px" height="75px" viewBox="0 0 36 36" version="1.1">
                        <g>
                            <path d="M17,17 L17,0 L19,0 L19,17 L36,17 L36,19 L19,19 L19,36 L17,36 L17,19 L0,19 L1.2246468e-16,17 L17,17 Z"></path>
                        </g>
                    </svg>
                </div>
            `;
        }
    };
});
