define(
    [
        'jquery',
        'underscore',
        'backbone',
        'module',
        'views/Base',
        'models/shared/ClassicURL',
        'app/views/tours/Tours',
        'app/views/tours/image/Editor',
        'app/views/tours/interactive/Editor',
        'app/views/tours/Iframe',
        'views/shared/tour/ImageTour/Master',
        'splunk.util',
        'uri/route',
        'app/contrib/dom.outline'
    ],
    function(
        $, 
        _,
        backbone, 
        module,
        BaseView,
        ClassicURL,
        ToursView,
        ImageTourEditor,
        InteractiveTourEditor,
        IFrame,
        ImageTour,
        splunkUtils,
        route,
        tourscss,
        outline
    ){
        return BaseView.extend({
            moduleId: module.id,
            initialize: function() {
                BaseView.prototype.initialize.apply(this, arguments);

                this.model.classicurl = new ClassicURL();
                this.model.classicurl.fetch();

                var queryProps = splunkUtils.queryStringToProp(window.location.search);
                if (queryProps && queryProps.t) {
                    this.editTour = this.collection.tours.getTourModel(queryProps.t);
                    this.model.tour = this.editTour;
                    if (!this.model.tour) {
                        this.model.classicurl.unset('t');
                        this.model.classicurl.save({}, {replaceState: true});
                    }
                }

                this.activate({deep: true});
            },

            startListening: function() {
                this.listenTo(this.collection.tours, 'new', function(tour) {
                    this.model.tour = tour;
                    this.renderEditPage();
                });
                this.listenTo(this.collection.tours, 'update', function(tour) {
                    this.collection.tours.fetch({
                        data: {
                            app: 'tour_makr',
                            owner: this.model.application.get('owner'),
                            count: -1
                        }
                    });
                });
                this.listenTo(this.collection.tours, 'new-interactive', function(tour) {
                    this.model.tour = tour;
                    this.editInteractiveTour();
                });
            },

            editInteractiveTour: function(tourModel) {
                var tourPage = this.model.tour.entry.content.get('tourPage') || 'search';

                this.children.interactiveEditor = new InteractiveTourEditor({
                    model: {
                        application: this.model.application,
                        tour: this.model.tour
                    },
                    collection: {
                        tours: this.collection.tours
                    }
                });

                this.listenTo(this.children.interactiveEditor, 'int-menu-closed', function() {
                    this.refreshTours();
                    this.killIframe();
                });

                $('body').append(this.children.interactiveEditor.render().el);
                setTimeout(function() {
                    // strictly for aestetics sliding the menus simultaneously
                    $('body').addClass('open-right');
                    $(this.children.interactiveEditor.el).addClass('open');
                    $('header').addClass('hidden');
                }.bind(this), 50);

                this.activateIframe();
            },

            runInteractiveTour: function(tourName) {
                var app = this.model.tour.entry.content.get('other-app') || 'search',
                    tourPage = this.model.tour.getTourPage() || 'search',
                    data = splunkUtils.queryStringToProp(this.model.tour.getTourURLData() || '');

                data.tour = tourName;
                var tourUrl = route.page(
                    this.model.application.get('root'),
                    this.model.application.get('locale'),
                    app,
                    tourPage,
                    { data: data }
                );
                window.location.href = tourUrl;
            },

            runTour: function(tourName) {
                if (this.model.tour) {
                    this.children.tour = new ImageTour({
                        model: {
                            tour: this.model.tour,
                            application: this.model.application
                        },
                        onHiddenRemove: true,
                        backdrop: 'static'
                    });
                    $('body').append('<div class="splunk-components image-tour"></div>');
                    $('.image-tour').append(this.children.tour.render().el);
                    this.children.tour.show();
                }
            },

            renderTours: function() {
                this.children.toursView = new ToursView({
                    model: {
                        application: this.model.application
                    },
                    collection: {
                        tours: this.collection.tours,
                        appLocals: this.collection.appLocals
                    }
                });

                this.listenTo(this.children.toursView, 'edit', function(tourName) {
                    this.model.tour = this.collection.tours.getTourModel(tourName);
                    this.renderEditPage();
                });
                this.listenTo(this.children.toursView, 'edit-interactive', function(tourName) {
                    this.model.tour = this.collection.tours.getTourModel(tourName);
                    this.editInteractiveTour();
                });
                this.listenTo(this.children.toursView, 'run', function(tourName) {
                    this.runTour(tourName);
                });
                this.listenTo(this.children.toursView, 'run-interactive', function(tourName) {
                    this.model.tour = this.collection.tours.getTourModel(tourName);
                    this.runInteractiveTour(tourName);
                });

                this.$('.tours-container').html(this.children.toursView.render().el);
            },

            renderEditPage: function() {
                var tourName = this.model.tour.entry.get('name');
                this.model.classicurl.set({'t': tourName});
                this.model.classicurl.save({}, {replaceState: true});

                this.children.tourEditPage = new ImageTourEditor({
                    model: {
                        application: this.model.application,
                        tour: this.model.tour
                    },
                    collection: {
                        tours: this.collection.tours,
                        appLocals: this.collection.appLocals
                    }
                });

                this.$el.html(this.template);
                this.$('.tours-container').append(this.children.tourEditPage.render().el);

                this.listenTo(this.children.tourEditPage, "back", function() {
                    this.model.classicurl.unset('t');
                    this.model.classicurl.save({}, {replaceState: true});
                    this.editTour = null;
                    this.refreshTours();
                });
            },

            refreshTours: function() {
                this.collection.tours.fetch({
                    data: {
                        app: 'tour_makr',
                        owner: this.model.application.get('owner'),
                        count: -1
                    },
                    success: function(collection, response) {
                        this.renderTours();
                        this.children.toursView.delegateEvents();
                    }.bind(this)
                });
            },

            activateIframe: function() {
                var qsObj = {},
                    tourApp = this.model.tour.entry.content.get('other-app') || 'search',
                    tourPage = this.model.tour.getTourPage() || 'search',
                    urlData = this.model.tour.getTourURLData(),
                    qs, iFrameURL;

                    if (urlData) {
                        var decodedQS = decodeURIComponent(urlData);
                        qs = decodedQS.substring(decodedQS.indexOf('?'), decodedQS.length);
                        qsObj = splunkUtils.queryStringToProp(qs);
                    }

                iFrameURL = splunkUtils.make_full_url('app/' + tourApp + '/' + tourPage, qsObj);

                this.children.iframe = new IFrame({
                    src: iFrameURL
                });

                this.$('.iframe-container').fadeIn();

                setTimeout(function() {
                    this.$('.iframe-container').append(this.children.iframe.render().el);
                    setTimeout(function() {
                        var $iframe = $('iframe');
                        $iframe.ready(function() {
                            var domoutline = eval(DomOutline),
                                domoutlineScript = 'var DomOutline = ' + domoutline;

                            var myIframe = document.getElementById('iframefoo')
                            var script = myIframe.contentWindow.document.createElement("script");
                            script.type = "text/javascript";
                            script.text = domoutlineScript;
                            myIframe.contentWindow.document.body.appendChild(script);
                        });
                    }, 500);
                }.bind(this), 500);
            },

            editURL: function() {
                console.log('EDIT URL')
            },

            killIframe: function() {
                this.$('.iframe-container').fadeOut(function() {
                    this.$('.iframe-container').empty();
                }.bind(this));
            },

            render: function() {
                this.$el.html(this.template);
                if (this.editTour) {
                    this.renderEditPage();
                } else {
                    this.renderTours();
                }
                return this;
            },

            template: '\
                <div class="tours-container" />\
                <div class="iframe-container" />\
            '
        });
    }
);
