define([
    'views/Base'
], function(
    BaseView
) {
    return class Iframe extends BaseView {
        className() {
            return 'int-tour-iframe';
        }

        tagName() {
            return 'iframe';
        }

        attributes() {
            return {
                scrolling: 'yes',
                allowtransparency: 'true',
                marginheight: '0',
                marginwidth: '0',
                frameborder: '0',
                src: 'about:blank',
                width: '100%',
                height: '100%',
            }
        }

        render() {
            const url = this.options.src;

            if (url) {
                this.el.src = url;
            }

            return this;
        }
    }
});