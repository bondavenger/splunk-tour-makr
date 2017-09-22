define([
    'jquery',
    'underscore',
    'views/shared/Modal',
], function(
    $,
    _,
    Modal
) {
    return class ConfirmModal extends Modal {
        constructor(options = {}) {
            const defaults = {
                saving: _('Saving...').t(),
                waitOnOk: false,
            };

            Object.assign(defaults, options);
            super(defaults);
        }

        events() {
            return $.extend({}, super.events, {
                'click .btn-primary:not(.disabled)': 'confirm',
            });
        }

        confirm(e) {
            e.preventDefault();
            this.trigger('ok');
            if (this.options.waitOnOk) {
                // Assumes user waiting for an endpoint post and need a visual for syncing
                $(e.currentTarget).text(this.options.saving).addClass('disabled');
            }
        }

        render() {
            this.$el.html(Modal.TEMPLATE);
            this.$(Modal.HEADER_TITLE_SELECTOR).text(_('Confirm').t());
            this.$(Modal.BODY_SELECTOR).text(_('Are you sure?').t());
            this.$(Modal.FOOTER_SELECTOR).append(Modal.BUTTON_CANCEL);
            const $ok = $(Modal.BUTTON_OK);
            this.$(Modal.FOOTER_SELECTOR).append($ok);

            if (this.options.waitOnOk) {
                $ok.removeAttr('data-dismiss');
            }
        }
    };
});