define([
    'underscore',
    'views/shared/Modal',
    'views/shared/controls/ControlGroup',
    'views/shared/FlashMessages',
], function(
    _,
    Modal,
    ControlGroup,
    FlashMessage
) {
    return class LabelEditor extends Modal {
        initialize(options) {
            super.initialize(options);

            this.originalLabel = this.model.tour.getLabel();

            this.children.flashMessage = new FlashMessage({ model: this.model.inmem });

            this.children.titleField = new ControlGroup({
                controlType: 'Text',
                controlOptions: {
                    modelAttribute: 'label',
                    model: this.model.tour.entry.content,
                    placeholder: this.originalLabel,
                },
                label: _('Label').t(),
                required: true,
                validate: true,
            });

            this.activate();
        }

        events() {
            return $.extend({}, Modal.prototype.events, {
                'click .btn-primary': 'save',
                'click .cancel': 'cancel',
            });
        }

        save(e) {
            e.preventDefault();

            this.model.tour.save({}, {
                validate: true,
            }).done(() => {
                this.hide();
            });
        }

        cancel(e) {
            e.preventDefault();
            this.model.tour.entry.content.set('label', this.originalLabel);
        }

        render() {
            this.$el.html(Modal.TEMPLATE);
            this.$(Modal.HEADER_TITLE_SELECTOR).html(_('Edit Label').t());

            this.children.flashMessage.render().prependTo(this.$(Modal.BODY_SELECTOR));

            this.$(Modal.BODY_SELECTOR).append(Modal.FORM_HORIZONTAL);

            this.children.titleField.render().appendTo(this.$(Modal.BODY_FORM_SELECTOR));

            this.$(Modal.FOOTER_SELECTOR).append(Modal.BUTTON_CANCEL);
            this.$(Modal.FOOTER_SELECTOR).append(Modal.BUTTON_SAVE);

            return this;
        }
    }
});
