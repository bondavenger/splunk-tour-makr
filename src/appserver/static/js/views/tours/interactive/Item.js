define([
    'jquery',
    'underscore',
    'backbone',
    'module',
    'views/Base',
    'app/views/tours/Utils',
    'app/views/tours/dialogs/ConfirmModal',
    'splunk.util'
], function(
    $,
    _,
    backbone,
    module,
    BaseView,
    Utils,
    ConfirmModal,
    splunkUtil
) {
    return class IntTourItem extends BaseView {
        className() {
            return 'tour-tile interactive-tour-tile';
        }

        initialize() {
            super.initialize(...arguments);
            this.activate();
        }

        attributes() {
            return {
                'data-name': this.model.tour.entry.get('name'),
            };
        }

        events() {
            return {
                'click .remove': 'removeConfirm',
            }
        }

        startListening() {
            this.listenTo(this.model.tour.entry.content, 'change', this.debouncedRender);
        }

        tourURL() {
            let qsObj = {};
            const urlData = this.model.tour.getTourURLData();
            const tourApp = this.model.tour.entry.content.get('other-app') || 'search';
            const tourPage = this.model.tour.getTourPage() || 'search';

            if (urlData) {
                const decodedQS = decodeURIComponent(urlData);
                const qs = decodedQS.substring(decodedQS.indexOf('?'), decodedQS.length);
                qsObj = splunkUtil.queryStringToProp(qs);
            }

            qsObj.tour = this.model.tour.getName();

            return splunkUtil.make_full_url('app/' + tourApp + '/' + tourPage, qsObj);
        }

        removeTour() {
            this.model.tour.destroy({ silent: true, wait: true })
            .done(() => {
                this.$el.fadeOut(1000, () => {
                    this.$el.remove();
                });
            });
        }

        removeConfirm(e) {
            e.preventDefault();
            this.confirm = new ConfirmModal();
            this.confirm.render().appendTo($('body'));
            this.confirm.show();
            this.listenTo(this.confirm, 'ok', this.removeTour);
        }

        render() {
            this.$el.html(_.template(this.templateMain(), {
                label: Utils.makeTourLabel(this.model.tour),
                tourID: this.model.tour.getName(),
                tourURL: this.tourURL(),
                tourPage: this.model.tour.getTourPage() || 'search',
                tourApp: this.model.tour.entry.content.get('other-app') || 'search',
                tourQs: this.model.tour.getTourURLData(),
            }));

            return this;
        }

        templateMain() {
            return `
                <div class="interactive-tour-item-container">
                <h3><%- label %> <a href="<%- tourURL %>" class="external" target="_blank"><%- _('Run Tour').t() %></a></h3>
                <div class="interactive-tour-action-items">
                    <p class="interactive-tour-id"><%- _('ID').t() %>: <%- tourID %></p>
                    <p class="interactive-tour-url"><%- _('Destination').t() %>: <span><%- tourApp %>/<%- tourPage %></span></p>
                    <a class="edit btn btn-primary"><%- _('Edit Steps').t() %></a>
                    <a class="edit-url btn btn-primary"><%- _('Edit Page').t() %></a>
                    <a class="remove btn btn-secondary"><%- _('Delete').t() %></a>
                </div>
            </div>
            `
        }
    }
});
