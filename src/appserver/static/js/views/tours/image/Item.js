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
            // TODO useTour is updated
            // const isAuto = this.model.tour.entry.content.get('otherAuto');
            // const name = this.model.tour.getName();
            this.model.tour.destroy({ silent: true, wait: true })
            .done(() => {
                // TODO useTour is updated
                // if (isAuto) {
                //     this.removeAutoTours(name);
                // }
                this.$el.fadeOut(1000, () => {
                    this.$el.remove();
                });
            });
        }

        // TODO useTour is updated
        // removeAutoTours(name) {
        //     const entTour = this.collection.tours.find(model => {
        //         return (model.getName() === `${name}:enterprise`);
        //     });
        //     const lightTour = this.collection.tours.find(model => {
        //         return (model.getName() === `${name}:lite`);
        //     });

        //     if (entTour) {
        //         entTour.destroy({ silent: true, wait: true });
        //     }
        //     if (lightTour) {
        //         lightTour.destroy({ silent: true, wait: true });
        //     }
        // }

        removeConfirm(e) {
            e.preventDefault();
            this.confirm = new ConfirmModal();
            this.confirm.render().appendTo($('body'));
            this.confirm.show();
            this.listenTo(this.confirm, 'ok', this.removeTour);
        }

        render() {
            const tourName = this.model.tour.getName();
            const imgDest = splunkUtil.make_url(splunkUtil.sprintf('static/app/tour_makr/img/%s', tourName));

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
                        <p class="tour-id"><%- _('id').t() %>: <%- tourID %></p>
                    </div>
                </div>
            `;
        }
    }
});
