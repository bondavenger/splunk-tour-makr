define([
    'underscore',
    'views/shared/Modal',
    'views/shared/controls/ControlGroup',
    'app/views/tours/image/FileUpload',
    'views/shared/FlashMessages',
], function(
    _,
    Modal,
    ControlGroup,
    TourFileUploader,
    FlashMessage
) {
    return class NewImageModal extends Modal {
        initialize(options) {
            super.initialize(options);

            this.children.flashMessage = new FlashMessage({ model: this.model.inmem });
            this.imgNum = this.options.imgNum || this.options.order;
            this.isEdit = this.options.isEdit || false;
            this.modalTitle = (this.isEdit) ? _('Edit Slide').t() : _('New Slide').t();

            this.children.titleField = new ControlGroup({
                controlType: 'Textarea',
                controlOptions: {
                    modelAttribute: 'imageCaption' + this.imgNum,
                    model: this.model.tour.entry.content,
                },
                label: _('Caption Text').t(),
            });

            this.children.tourFileUpload = new TourFileUploader({
                imageAttr: 'imageData' + this.imgNum,
                imageAttrName: 'imageName' + this.imgNum,
                model: this.model,
            });
        }

        events() {
            return $.extend({}, Modal.prototype.events, {
                'click .btn-primary': 'save',
                'click .cancel': 'cancel',
            });
        }

        save(e) {
            e.preventDefault();

            this.model.tour.save()
            .done(() => {
                this.hide();
            });
        }

        cancel(e) {
            e.preventDefault();
            this.model.tour.entry.content.unset('imageCaption' + this.imgNum);
            this.model.tour.entry.content.unset('imageName' + this.imgNum);
        }

        render() {
            this.$el.html(Modal.TEMPLATE);
            this.$(Modal.HEADER_TITLE_SELECTOR).html(_(this.modalTitle).t());

            this.children.flashMessage.render().prependTo(this.$(Modal.BODY_SELECTOR));

            this.$(Modal.BODY_SELECTOR).append(Modal.FORM_HORIZONTAL);
            this.$(Modal.BODY_SELECTOR).append(this.children.tourFileUpload.render().el);
            this.$(Modal.BODY_SELECTOR).append('<div class="caption-text"></div>');
            this.$('.caption-text').append(this.children.titleField.render().el);

            this.$(Modal.FOOTER_SELECTOR).append(Modal.BUTTON_CANCEL);
            this.$(Modal.FOOTER_SELECTOR).append(Modal.BUTTON_SAVE);

            return this;
        }
    }
});
