define([
    'jquery',
    'underscore',
    'backbone',
    'module',
    'views/Base',
    'app/views/tours/Utils',
    'app/views/tours/dialogs/ConfirmModal',
    'splunk.util',
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
    return class ImageItem extends BaseView {
        className() {
            return 'tour-tile image-tour-tile';
        }

        attributes() {
            return {
                'data-name': this.model.tour.getName(),
            };
        }

        events() {
            return {
                'mouseenter .tour-item-container': 'toggleActive',
                'mouseleave .tour-item-container': 'toggleActive',
                'click .remove': 'removeConfirm',
            }
        }

        toggleActive(e) {
            $(e.currentTarget).find('.info-container').toggleClass('active');
        }

        removeTour() {
            this.model.tour.destroy({ silent: true, wait: true })
            .done(() => {
                this.$el.fadeOut(500, () => {
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
            const tourName = this.model.tour.getName();
            const app = this.model.tour.getTourApp();
            const imgDest = splunkUtil.make_url(`static/app/${app}/img/${tourName}`);

            this.$el.html(_.template(this.templateMain(), {
                label: Utils.makeTourLabel(this.model.tour),
                imageName: this.model.tour.getImageName(1),
                imgDest: imgDest,
                tourID: tourName,
            }));

            return this;
        }

        templateMain() {
            return `
                <div class="tour-item-container" <% if (imageName) { %>style="background-image: url(<%- imgDest %>/<%- imageName %>);<% } %>">
                    <h3>
                        <%- label %> <br>
                    </h3>
                    <div class="info-container">
                        <br>
                        <a class="run action-button"><%- _('Run Tour').t() %></a>
                        <br>
                        <a class="edit action-button"><%- _('Edit').t() %></a>
                        <br>
                        <a class="remove action-button"><%- _('Remove').t() %></a>
                        <p class="tour-id"><%- tourID %></p>
                    </div>
                </div>
            `;
        }
    }
});
