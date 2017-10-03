define([
    'underscore',
    'views/shared/Modal',
    'views/shared/controls/ControlGroup',
    'views/shared/FlashMessages',
    'app/views/tours/Utils',
], function(
    _,
    Modal,
    ControlGroup,
    FlashMessage,
    Utils
) {
    return class NewIntTourModal extends Modal {
        initialize(options) {
            super.initialize(options);

            this.isNew = this.model.tour.isNew();
            this.children.flashMessage = new FlashMessage({ model: this.model.inmem });

            this.children.titleField = new ControlGroup({
                controlType: (this.isNew) ? 'Text' : 'Label',
                controlOptions: {
                    modelAttribute: 'label',
                    model: this.model.tour.entry.content
                },
                label: _('Tour name').t(),
            });

            const apps = this.collection.appLocals;
            const appsList =[];

            apps.models.forEach(app => {
                const label = app.entry.content.get('label');
                const id = app.entry.get('name');

                appsList.push({ label: label, value: id });
            });

            this.model.tour.entry.content.set('other-app', 'search');
            this.children.apps = new ControlGroup({
                className: 'apps-control-group',
                controlType: 'SyntheticSelect',
                controlClass: 'controls-block',
                controlOptions: {
                    modelAttribute: 'other-app',
                    model: this.model.tour.entry.content,
                    items: appsList,
                    className: 'btn-group',
                    toggleClassName: 'btn',
                    popdownOptions: {
                        attachDialogTo: '.modal:visible',
                        scrollContainer: '.modal:visible .modal-body:visible',
                    }
                },
                label: _('App').t(),
                tooltip: _('Select the app for this tour. Defaults to search.').t(),
            });

            this.children.viewField = new ControlGroup({
                controlType: 'Text',
                controlOptions: {
                    modelAttribute: 'tourPage',
                    model: this.model.tour.entry.content,
                },
                label: _('View').t(),
                tooltip: _('The view/landing page of the tour.').t(),
            });

            this.children.qs = new ControlGroup({
                controlType: 'Text',
                controlOptions: {
                    modelAttribute: 'urlData',
                    model: this.model.tour.entry.content,
                    placeholder:  _('Optional').t(),
                },
                label: _('Querystring').t(),
                tooltip: _('Optional. ex) ?s=foosearch&other=data').t(),
            });
        }

        events() {
            return $.extend({}, Modal.prototype.events, {
                'click .btn-primary': 'save',
            });
        }

        showError(errorMsg = 'An error occured') {
            this.$('.error-text').append(errorMsg);
            this.$('.alert-error').show();
        }

        hideError(errorMsg = 'An error occured') {
            this.$('.error-text').empty();
            this.$('.alert-error').hide();
        }

        validate() {
            let valid = true;
            const label = this.model.tour.entry.content.get('label');
            const view = this.model.tour.entry.content.get('tourPage');

            const pattern = new RegExp(/[~`!#$%\^&*+=\[\]\\';,/{}|\\":<>\?]/);

            if (!label) {
                this.showError(_(`Tour name can't be empty.`).t());
                valid = false;
            } else if (pattern.test(label)) {
                this.showError(_(`Tour name can't contain special characters.`).t());
                valid = false;
            }

            if (!view) {
                const intro = valid ? 'Y' : ' Also, y'
                this.showError(_(`${intro}ou really should add a view name.`).t());
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
            const tourName = Utils.createTourName(this.model.tour.entry.content.get('label'));
            const data = {};

            this.model.tour.entry.content.set('name', tourName);
            this.model.tour.entry.set('name', tourName);
            this.model.tour.entry.content.set('type', 'interactive');
            this.model.tour.entry.content.set('context', 'tour_makr');

            if (this.isNew) {
                data.app = 'tour_makr';
                data.owner = 'nobody';
            }

            if (tourName) {
                this.model.tour.save({}, {
                    data: data,
                }).done(() => {
                    if (this.isNew) {
                        this.collection.tours.add(this.model.tour);
                        this.collection.tours.trigger('new-interactive', this.model.tour);
                    }
                    this.hide();
                }).fail(response => {
                    if (response.status === 409) {
                        this.showError(_(`A tour with the id '${this.model.tour.entry.content.get('name')}' already exists.`).t());
                    }
                });
            }
        }

        render() {
            this.$el.html(Modal.TEMPLATE);
            const modalHeaderText = (this.isNew) ? _('New Interactive Tour').t() : _('Edit Tour Page').t()
            this.$(Modal.HEADER_TITLE_SELECTOR).text(modalHeaderText);

            this.children.flashMessage.render().prependTo(this.$(Modal.BODY_SELECTOR));
            this.$(Modal.BODY_SELECTOR).append(Modal.FORM_HORIZONTAL);
            $('<div class="alert alert-error"><i class="icon-alert" /><span class="error-text" /></div>').appendTo(this.$(Modal.BODY_FORM_SELECTOR));
            this.children.titleField.render().appendTo(this.$(Modal.BODY_FORM_SELECTOR));

            this.children.apps.render().appendTo(this.$(Modal.BODY_FORM_SELECTOR));
            this.children.viewField.render().appendTo(this.$(Modal.BODY_FORM_SELECTOR));
            this.children.qs.render().appendTo(this.$(Modal.BODY_FORM_SELECTOR));

            this.$(Modal.FOOTER_SELECTOR).append(Modal.BUTTON_CANCEL);
            this.$(Modal.FOOTER_SELECTOR).append(Modal.BUTTON_SAVE);

            return this;
        }
    }
});
