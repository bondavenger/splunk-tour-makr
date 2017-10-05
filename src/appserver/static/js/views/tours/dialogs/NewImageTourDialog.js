define([
    'underscore',
    'backbone',
    'views/shared/Modal',
    'views/shared/controls/ControlGroup',
    'views/shared/FlashMessages',
    'collections/services/data/ui/Views',
    'collections/services/data/ui/Managers',
    'models/services/data/ui/Tour',
    'app/views/tours/Utils',
    'splunk.util',
], function(
    _,
    Backbone,
    Modal,
    ControlGroup,
    FlashMessage,
    ViewsCollection,
    Managers,
    TourModel,
    Utils,
    splunkUtils
) {
    return class NewImageTourModal extends Modal {
        initialize(options) {
            super.initialize(options);

            this.model.tour = new TourModel();
            this.model.tour.entry.content.set('otherAuto', false);
            this.model.state = new Backbone.Model({
                app: 'search',
                view: null,
            });

            this.children.flashMessage = new FlashMessage({ model: this.model.inmem });

            this.children.titleField = new ControlGroup({
                controlType: 'Text',
                controlOptions: {
                    type: 'Text',
                    modelAttribute: 'label',
                    model: this.model.tour.entry.content,
                },
                label: _('Tour Name').t(),
            });

            this.children.autoTour = new ControlGroup({
                controlType: 'SyntheticCheckbox',
                controlOptions: {
                    modelAttribute: 'otherAuto',
                    model: this.model.tour.entry.content,
                },
                label: _('Auto tour').t(),
                tooltip: _('Sets the tour to auto run for users on a specific view.').t(),
            });

            const appsList = [];

            this.collection.appLocals.models.forEach(app => {
                const label = app.entry.content.get('label');
                const id = app.entry.get('name');

                appsList.push({ label: label, value: id });
            });
            // Tours dont work on manager pages yet
            // appsList.push({ value: 'manager', label: 'manager' });

            this.children.apps = new ControlGroup({
                className: 'apps-control-group',
                controlType: 'SyntheticSelect',
                controlClass: 'controls-block',
                controlOptions: {
                    modelAttribute: 'app',
                    model: this.model.state,
                    items: appsList,
                    className: 'btn-group',
                    toggleClassName: 'btn',
                    popdownOptions: {
                        attachDialogTo: '.modal:visible',
                        scrollContainer: '.modal:visible .modal-body:visible',
                    }
                },
                label: _('App').t(),
                tooltip: _('Select the app for page scope (defaults to search).').t(),
            });

            this.activate();
        }

        startListening() {
            this.listenTo(this.model.tour.entry.content, 'change:otherAuto', this.toggeAutoOptions);
            this.listenTo(this.model.state, 'change:app', this.populateViews);
        }

        events() {
            return $.extend({}, Modal.prototype.events, {
                'click .btn-primary': 'save',
            });
        }

        updateViews(viewItems) {
            this.children.views.remove();
            this.model.state.set('view', viewItems[0].value);
            this.children.views = new ControlGroup({
                className: 'views-control-group',
                controlType: 'SyntheticSelect',
                controlClass: 'controls-block',
                controlOptions: {
                    modelAttribute: 'view',
                    model: this.model.state,
                    items: viewItems,
                    className: 'btn-group',
                    toggleClassName: 'btn',
                    popdownOptions: {
                        attachDialogTo: '.modal:visible',
                        scrollContainer: '.modal:visible .modal-body:visible',
                    }
                },
                label: _('Page').t(),
                tooltip: _('The specific page the tour will auto run on. (includes dashboards)').t(),
            });
            this.children.views.render().appendTo(this.$('.auto-options'));
        }

        populateViews() {
            if (this.children.views) {
                this.children.views.remove();
            }

            this.model.state.set('view', _('Loading...').t());
            this.children.views = new ControlGroup({
                controlType: 'Label',
                controlOptions: {
                    modelAttribute: 'view',
                    model: this.model.state,
                },
                label: _('Page').t(),
                tooltip: _('The specific page the tour will auto run on. (includes dashboards)').t(),
            });
            this.children.views.render().appendTo(this.$('.auto-options'));

            const app = this.model.state.get('app');
            const owner = this.model.application.get('owner') || 'admin';
            let data = {
                app: app,
                owner: owner,
                search: 'isVisible=1',
                count: -1,
            }
            this.views = new ViewsCollection();

            // Manager pages don't work yet
            // if (app === 'manager') {
            //     this.views = new Managers();
            //     data = {
            //         count: -1,
            //     };
            // } else {
            //     this.views = new ViewsCollection();
            // }

            this.views.fetch({ data: data }).done(views => {
                const viewItems = this.views
                    .filter(view => {
                        const name = view.entry.get('name');
                        return (name !== 'live_tail');
                    })
                    .map(view => {
                        const name = view.entry.get('name');
                        const label = view.entry.content.get('label') || name;
                        return { value: name, label: name };
                    });

                setTimeout(() => {
                    this.updateViews(viewItems)
                }, 500);
            });
        }

        toggeAutoOptions() {
            const autoOptions = this.model.tour.entry.content.get('otherAuto');
            if (autoOptions) {
                this.$('.auto-options').fadeIn();
                this.populateViews();
            } else {
                this.$('.auto-options').fadeOut();
            }
        }

        showError(errorMsg = 'An error occured') {
            this.$('.error-text').text(errorMsg);
            this.$('.alert-error').show();
        }

        hideError(errorMsg = 'An error occured') {
            this.$('.error-text').empty();
            this.$('.alert-error').hide();
        }

        validate() {
            let valid = true;
            const label = this.model.tour.entry.content.get('label');
            const pattern = new RegExp(/[~`#$%\^*+=\[\]\\;,/{}|\\<>]/);

            if (!label) {
                this.showError(_(`Tour name can't be empty`).t());
                valid = false;
            } else if (pattern.test(label)) {
                this.showError(_(`Tour name can't contain special characters`).t());
                valid = false;
            }

            return valid;
        }

        save(e) {
            e.preventDefault();

            this.hideError();
            if (!this.validate()) {
                return;
            }

            const isAutoTour = splunkUtils.normalizeBoolean(this.model.tour.entry.content.get('otherAuto'));
            let tourName = Utils.createTourName(this.model.tour.entry.content.get('label'));
            let app = (isAutoTour) ? this.model.state.get('app') : 'tour_makr';

            if (isAutoTour) {
                const view = this.model.state.get('view');
                const env = (this.model.serverInfo.isLite()) ? 'lite' : 'enterprise';
                // Tours don't work on manager pages yet
                // if (app === 'manager') {
                //     this.model.tour.entry.content.set('managerPage', true);
                //     app = 'search';
                // }
                tourName = `${view}-tour:${env}`;
            }

            this.model.tour.entry.content.set('name', tourName);
            this.model.tour.entry.content.set('type', 'image');
            this.model.tour.entry.content.set('context', app);
            this.model.tour.entry.content.set('imgPath', '/' + tourName);

            this.model.tour.save({}, {
                data: {
                    app: app,
                    owner: 'nobody',
                }
            }).done(() => {
                this.hide();
                this.collection.tours.trigger('new', this.model.tour);
            }).fail(response => {
                if (response.status === 409) {
                    if (isAutoTour) {
                        this.showError(_(`A tour with the id '${this.model.tour.entry.content.get('name')}' already exists. This is an auto tour so there may be a tour already created for this page.)`).t());
                    } else {
                        this.showError(_(`A tour with the id '${this.model.tour.entry.content.get('name')}' already exists.`).t());
                    }
                }
            });
        }

        render() {
            this.$el.html(Modal.TEMPLATE);
            this.$(Modal.HEADER_TITLE_SELECTOR).html(_('New Image Tour').t());

            this.children.flashMessage.render().prependTo(this.$(Modal.BODY_SELECTOR));

            this.$(Modal.BODY_SELECTOR).append(Modal.FORM_HORIZONTAL);
            $('<div class="alert alert-error"><i class="icon-alert" /><span class="error-text" /></div>').appendTo(this.$(Modal.BODY_FORM_SELECTOR));
            this.children.titleField.render().appendTo(this.$(Modal.BODY_FORM_SELECTOR));

            this.children.autoTour.render().appendTo(this.$(Modal.BODY_FORM_SELECTOR));
            $('<div class="auto-options control-group" />').appendTo(this.$(Modal.BODY_FORM_SELECTOR));
            this.children.apps.render().appendTo(this.$('.auto-options'));

            this.$(Modal.FOOTER_SELECTOR).append(Modal.BUTTON_CANCEL);
            this.$(Modal.FOOTER_SELECTOR).append(Modal.BUTTON_SAVE);

            return this;
        }
    }
});
