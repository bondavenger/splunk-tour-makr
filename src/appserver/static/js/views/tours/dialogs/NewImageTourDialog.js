define([
    'underscore',
    'views/shared/Modal',
    'views/shared/controls/ControlGroup',
    'views/shared/FlashMessages',
    'models/services/data/ui/Tour',
    'app/views/tours/Utils',
], function(
    _,
    Modal,
    ControlGroup,
    FlashMessage,
    TourModel,
    Utils
) {
    return class NewImageTourModal extends Modal {
        initialize(options) {
            super.initialize(options);

            this.model.tour = new TourModel();

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

            this.activate();
        }

        events() {
            return $.extend({}, Modal.prototype.events, {
                'click .btn-primary': 'save',
            });
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
            const pattern = new RegExp(/[~`!#$%\^&*+=\[\]\\';,/{}|\\":<>\?]/);

            if (!label) {
                this.showError(_(`Text name can't be empty`).t());
                valid = false;
            } else if (pattern.test(label)) {
                this.showError(_(`Text name can't contain special characters`).t());
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
            this.model.tour.entry.content.set('name', tourName);
            this.model.tour.entry.content.set('type', 'image');
            this.model.tour.entry.content.set('context', 'tour_makr');
            this.model.tour.entry.content.set('imgPath', '/' + tourName);

            this.model.tour.save({}, {
                data: {
                    app: 'tour_makr',
                    owner: 'nobody',
                }
            }).done(() => {
                this.hide();
                this.collection.tours.trigger('new', this.model.tour);
            }).fail(response => {
                if (response.status === 409) {
                    this.showError(_(`A tour with the id '${this.model.tour.entry.content.get('name')}' already exists.`).t());
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

            this.$(Modal.FOOTER_SELECTOR).append(Modal.BUTTON_CANCEL);
            this.$(Modal.FOOTER_SELECTOR).append(Modal.BUTTON_SAVE);

            return this;
        }
    }
});
