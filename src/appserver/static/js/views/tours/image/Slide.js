define([
    'jquery',
    'underscore',
    'views/Base',
    'splunk.util',
], function(
    $,
    _,
    BaseView,
    splunkUtil
) {
    return class ImageSlide extends BaseView {
        className() {
            return 'image-tile';
        }

        events() {
            return {
                'mouseenter .image-container': 'toggleActive',
                'mouseleave .image-container': 'toggleActive',
            }
        }

        toggleActive(e) {
            $(e.currentTarget).find('.info-container').toggleClass('active');
        }

        render() {
            const imgDest = splunkUtil.make_url(`static/app/${this.options.app}/img/${this.options.tourName}`);

            this.$el.html(_.template(this.templateMain(), {
                imageName: this.options.imageName,
                imageCaption: this.options.imageCaption,
                imageOrder: this.options.imageOrder,
                imgDest: imgDest,
            }));

            return this;
        }

        templateMain() {
            return `
                 <div class="image-container" data-filename="<%- imageName %>" data-order="<%- imageOrder %>" style="background-image: url(<%- imgDest %>/<%- imageName %>);">
                    <div class="info-container">
                        <p class="image-caption"><%- imageCaption %></p>
                        <p class="filename">
                            <%- _('Filename').t() %>: <%- imageName %>
                        </p>

                        <br /><br />
                        <a class="edit-img action-button"><%- _('Edit').t() %></a>
                        <br /><br />
                        <a class="remove-img action-button"><%- _('Remove').t() %></a>
                    </div>
                </div>
            `;
        }
    }
});
