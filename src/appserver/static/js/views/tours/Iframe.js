define(
    [
        'module',
        'views/Base'
    ],
    function(module, BaseView) {
        return BaseView.extend({
            moduleId: module.id,
            className: 'int-tour-iframe',
            tagName: 'iframe',
            id: 'iframefoo',
            attributes: {
                scrolling: 'yes',
                allowtransparency: 'true',
                marginheight: '0',
                marginwidth: '0',
                frameborder: '0',
                src: 'about:blank',
                width: '100%',
                height: '100%'
            },
            render: function() {
                var url = this.options.src;
                if (url) {
                    this.el.src = url;
                }
                return this;
            }
        });
    }
);