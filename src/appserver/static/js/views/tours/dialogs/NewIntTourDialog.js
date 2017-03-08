define([
        'underscore',
        'backbone',
        'module',
        'views/shared/Modal',
        'views/shared/controls/ControlGroup',
        'views/shared/FlashMessages',
        'models/services/data/ui/Tour',
        'uri/route',
        'util/splunkd_utils'
    ],
    function(
        _,
        Backbone,
        module,
        Modal,
        ControlGroup,
        FlashMessage,
        TourModel,
        route,
        splunkd_utils
        ) {
        return Modal.extend({
            moduleId: module.id,
            initialize: function(options) {
                Modal.prototype.initialize.apply(this, arguments);
                this.isNew = this.model.tour.isNew();
                this.children.flashMessage = new FlashMessage({ model: this.model.inmem });

                this.children.titleField = new ControlGroup({
                    controlType: (this.isNew) ? 'Text' : 'Label',
                    controlOptions: {
                        modelAttribute: 'label',
                        model: this.model.tour.entry.content
                    },
                    label: _('Tour name').t()
                });

                var apps = this.collection.appLocals,
                    appsList =[];

                 appsList.push({label: _('-- Select App --').t(), value:''});
                _.each(apps.models, function(app) {
                    var label = app.entry.content.get('label'),
                        id = app.entry.get('name');

                    appsList.push({label: label, value: id});
                }.bind(this));

                this.children.apps = new ControlGroup({
                    className: 'apps-control-group',
                    controlType: 'SyntheticSelect',
                    controlClass: 'controls-block',
                    controlOptions: {
                        modelAttribute: 'other-app',
                        model: this.model.tour.entry.content,
                        items: appsList,
                        className: 'btn-group',
                        toggleClassName: 'btn'
                    },
                    label: _('App').t(),
                    tooltip: _('Select the app for this tour. Defaults to search.').t()
                });

                this.children.viewField = new ControlGroup({
                    controlType: 'Text',
                    controlOptions: {
                        modelAttribute: 'tourPage',
                        model: this.model.tour.entry.content
                    },
                    label: _('View').t(),
                    tooltip: _('The view/landing page of the tour.').t()
                });

                this.children.qs = new ControlGroup({
                    controlType: 'Text',
                    controlOptions: {
                        modelAttribute: 'urlData',
                        model: this.model.tour.entry.content
                    },
                    label: _('Querystring').t(),
                    tooltip: _('Optional. ex) ?s=foosearch&other=data').t()
                });
            },

            events: $.extend({}, Modal.prototype.events, {
                'click .btn-primary': function(e) {

                    e.preventDefault();
                    var tourName = this.createTourName(this.model.tour.entry.content.get('label')),
                        data = {};

                    this.model.tour.entry.content.set('name', tourName);
                    this.model.tour.entry.set('name', tourName);
                    this.model.tour.entry.content.set('type', 'interactive');
                    this.model.tour.entry.content.set('context', 'tour_makr');

                    if (this.isNew) {
                        data = { app: 'tour_makr', owner: 'nobody' }
                    }

                    if (tourName) {
                        this.model.tour.save({}, {
                            data: data,
                            success: function(model, response) {
                                this.hide();
                                if (this.isNew) {
                                    this.collection.tours.add(this.model.tour);
                                    this.collection.tours.trigger('new-interactive', this.model.tour);
                                }
                            }.bind(this),
                            error: function(err, response) {
                                if (response.status === 409) {
                                    console.log('already exists')
                                }
                            }.bind(this)
                        });
                    }
                }
            }),

            createTourName: function(label) {
                var name = (label) ? label.split(' ').join('_').replace(/[;:'",/\\]+/g, '').toLowerCase() : '';
                return name;
            },

            render : function() {
                this.$el.html(Modal.TEMPLATE);
                var modalHeaderText = (this.isNew) ? _("New Interactive Tour").t() : _("Edit Tour Page").t()
                this.$(Modal.HEADER_TITLE_SELECTOR).text(modalHeaderText);

                this.children.flashMessage.render().prependTo(this.$(Modal.BODY_SELECTOR));
                this.$(Modal.BODY_SELECTOR).append(Modal.FORM_HORIZONTAL);
                this.children.titleField.render().appendTo(this.$(Modal.BODY_FORM_SELECTOR));

                this.children.apps.render().appendTo(this.$(Modal.BODY_FORM_SELECTOR));
                this.children.viewField.render().appendTo(this.$(Modal.BODY_FORM_SELECTOR));
                this.children.qs.render().appendTo(this.$(Modal.BODY_FORM_SELECTOR));

                this.$(Modal.FOOTER_SELECTOR).append(Modal.BUTTON_CANCEL);
                this.$(Modal.FOOTER_SELECTOR).append(Modal.BUTTON_SAVE);

                return this;
            }
        });
    });
