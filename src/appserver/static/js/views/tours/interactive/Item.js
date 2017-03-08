define(
    [
        'jquery',
        'underscore',
        'backbone',
        'module',
        'views/Base',
        'splunk.util'
    ],
    function(
        $, 
        _,
        backbone, 
        module,
        BaseView,
        splunkUtil
    ){
        return BaseView.extend({
            moduleId: module.id,
            className: 'tour-tile interactive-tour-tile',
            initialize: function() {
                BaseView.prototype.initialize.apply(this, arguments);
                this.activate();
            },

            attributes: function() {
                return {
                    "data-name": this.model.tour.entry.get('name')
                };
            },

            startListening: function() {
                this.listenTo(this.model.tour.entry.content, 'change', function() {
                    this.debouncedRender()
                });
            },

            makeTourLabel: function() {
                if (this.model.tour.getLabel()) {
                    return this.model.tour.getLabel();
                } else {
                    var name = this.model.tour.entry.get('name'),
                        names = name.split('-');
                        _.each(names, function(name, i){
                            var capName = name.charAt(0).toUpperCase() + name.substring(1);
                            names[i] = capName;
                        });

                    return names.join(' ');
                }
            },

            tourURL: function() {
                var qsObj = {},
                    urlData = this.model.tour.getTourURLData(),
                    tourApp = this.model.tour.entry.content.get('other-app') || 'search',
                    tourPage = this.model.tour.getTourPage() || 'search',
                    qs;

                    if (urlData) {
                        var decodedQS = decodeURIComponent(urlData);
                        qs = decodedQS.substring(decodedQS.indexOf('?'), decodedQS.length);
                        qsObj = splunkUtil.queryStringToProp(qs);
                    }

                    qsObj.tour = this.model.tour.getName();

                return splunkUtil.make_full_url('app/' + tourApp + '/' + tourPage, qsObj);
            },

            render: function() {
                this.$el.html(this.compiledTemplate({
                    label: this.makeTourLabel(),
                    tourID: this.model.tour.getName(),
                    tourURL: this.tourURL(),
                    tourPage: this.model.tour.getTourPage() || 'search',
                    tourApp: this.model.tour.entry.content.get('other-app') || 'search',
                    tourQs: this.model.tour.getTourURLData()
                }));

                return this;
            },

            template: '\
                <div class="interactive-tour-item-container">\
                    <h3><%- label %> <a href="<%- tourURL %>" class="external" target="_blank"><%- _("Run Tour").t() %></a></h3>\
                    <div class="interactive-tour-action-items">\
                        <p class="interactive-tour-id"><%- _("ID").t() %>: <%- tourID %></p>\
                        <p class="interactive-tour-url"><%- _("Destination").t() %>: <span><%- tourApp %>/<%- tourPage %></span></p>\
                        <a class="edit btn btn-primary"><%- _("Edit Steps").t() %></a>\
                        <a class="edit-url btn btn-primary"><%- _("Edit Page").t() %></a>\
                        <a class="remove btn btn-secondary"><%- _("Delete").t() %></a>\
                    </div>\
                </div>\
            '
        });
    }
);
