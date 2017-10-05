define([
    'jquery',
    'underscore',
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
], function(
    $,
    _,
    BaseView,
    ClassicURL,
    ToursView,
    ImageTourEditor,
    InteractiveTourEditor,
    IFrame,
    ImageTour,
    splunkUtils,
    route,
    outline
) {
    return class ToursMasterView extends BaseView {
        initialize() {
            super.initialize(...arguments);
            this.model.classicurl = new ClassicURL();
            this.model.classicurl.fetch();

            const queryProps = splunkUtils.queryStringToProp(window.location.search);
            if (queryProps && queryProps.t) {
                this.editTour = this.collection.tours.getTourModel(queryProps.t);
                this.model.tour = this.editTour;
                if (!this.model.tour) {
                    this.model.classicurl.unset('t');
                    this.model.classicurl.save({}, {replaceState: true});
                }
            }

            this.activate({ deep: true });
        }

        startListening() {
            this.listenTo(this.collection.tours, 'update', tour => {
                this.collection.tours.fetch({
                    data: {
                        count: -1,
                    }
                });
            });

            this.listenTo(this.collection.tours, 'new', this.renderEditPage);
            this.listenTo(this.collection.tours, 'new-interactive', this.editInteractiveTour);
        }

        editInteractiveTour(tourModel = null) {
            this.model.tour = (tourModel) ? tourModel : this.model.tour;

            const tourPage = this.model.tour.entry.content.get('tourPage') || 'search';

            this.children.interactiveEditor = new InteractiveTourEditor({
                model: {
                    application: this.model.application,
                    tour: this.model.tour
                },
                collection: {
                    tours: this.collection.tours
                }
            });

            this.listenTo(this.children.interactiveEditor, 'int-menu-closed', () => {
                this.refreshTours();
                this.killIframe();
            });

            $('body').append(this.children.interactiveEditor.render().el);
            setTimeout(() => {
                // strictly for aestetics sliding the menus simultaneously
                $('body').addClass('open-right');
                $(this.children.interactiveEditor.el).addClass('open');
                $('header').addClass('hidden');
            }, 50);

            this.activateIframe();
        }

        runInteractiveTour(tourName) {
            const app = this.model.tour.entry.content.get('other-app') || 'search';
            const tourPage = this.model.tour.getTourPage() || 'search';
            const data = splunkUtils.queryStringToProp(this.model.tour.getTourURLData() || '');

            data.tour = tourName;
            const tourUrl = route.page(
                this.model.application.get('root'),
                this.model.application.get('locale'),
                app,
                tourPage,
                { data: data }
            );
            window.location.href = tourUrl;
        }

        runTour(tourName) {
            if (this.model.tour) {
                this.children.tour = new ImageTour({
                    model: {
                        tour: this.model.tour,
                        application: this.model.application,
                    },
                    onHiddenRemove: true,
                    backdrop: 'static',
                });

                $('body').append('<div class="splunk-components image-tour"></div>');
                $('.image-tour').append(this.children.tour.render().el);
                this.children.tour.show();
            }
        }

        renderTours() {
            this.children.toursView = new ToursView({
                model: {
                    application: this.model.application,
                    serverInfo: this.model.serverInfo,
                },
                collection: {
                    tours: this.collection.tours,
                    appLocals: this.collection.appLocals,
                }
            });

            this.listenTo(this.children.toursView, 'edit', tourName => {
                const model = this.collection.tours.getTourModel(tourName);
                this.renderEditPage(model);
            });
            this.listenTo(this.children.toursView, 'edit-interactive', tourName => {
                const model = this.collection.tours.getTourModel(tourName);
                this.editInteractiveTour(model);
            });
            this.listenTo(this.children.toursView, 'run', tourName => {
                this.model.tour = this.collection.tours.getTourModel(tourName);
                this.runTour(tourName);
            });
            this.listenTo(this.children.toursView, 'run-interactive', tourName => {
                this.model.tour = this.collection.tours.getTourModel(tourName);
                this.runInteractiveTour(tourName);
            });

            this.$('.tours-container').html(this.children.toursView.render().el);
        }

        renderEditPage(tourModel = null) {
            this.model.tour = (tourModel) ? tourModel : this.model.tour;
            const tourName = this.model.tour.entry.get('name');
            this.model.classicurl.set({'t': tourName});
            this.model.classicurl.save({}, {replaceState: true});

            this.children.tourEditPage = new ImageTourEditor({
                model: {
                    application: this.model.application,
                    tour: this.model.tour,
                    serverInfo: this.model.serverInfo,
                }
            });

            this.$el.html(this.mainTemplate());
            this.$('.tours-container').append(this.children.tourEditPage.render().el);

            this.listenTo(this.children.tourEditPage, 'back', () => {
                this.model.classicurl.unset('t');
                this.model.classicurl.save({}, { replaceState: true });
                this.editTour = null;

                $('.header-extra').empty();
                this.refreshTours();
            });
        }

        refreshTours() {
            this.collection.tours.fetch({
                data: {
                    count: -1
                }
            }).done(() => {
                this.renderTours();
                this.children.toursView.delegateEvents();
            });
        }

        activateIframe() {
            const tourApp = this.model.tour.entry.content.get('other-app') || 'search';
            const tourPage = this.model.tour.getTourPage() || 'search';
            const urlData = this.model.tour.getTourURLData();
            let qsObj = {};

            if (urlData) {
                const decodedQS = decodeURIComponent(urlData);
                const qs = decodedQS.substring(decodedQS.indexOf('?'), decodedQS.length);
                qsObj = splunkUtils.queryStringToProp(qs);
            }

            const iFrameURL = splunkUtils.make_full_url('app/' + tourApp + '/' + tourPage, qsObj);

            this.children.iframe = new IFrame({
                src: iFrameURL,
                id: 'tourIframe',
            });

            this.$('.iframe-container').fadeIn();

            setTimeout(() => {
                this.$('.iframe-container').append(this.children.iframe.render().el);
                setTimeout(() => {
                    const $iframe = $('iframe');
                    $iframe.ready(() => {
                        const domoutline = eval(DomOutline);
                        const domoutlineScript = 'var DomOutline = ' + domoutline;
                        const myIframe = document.getElementById('tourIframe');
                        const script = myIframe.contentWindow.document.createElement('script');
                        script.type = 'text/javascript';
                        script.text = domoutlineScript;
                        myIframe.contentWindow.document.body.appendChild(script);
                    });
                }, 500);
            }, 500);
        }

        killIframe() {
            this.$('.iframe-container').fadeOut(() => {
                this.$('.iframe-container').empty();
            });
        }

        render() {
            $('<span class="header-extra" />').appendTo($('.dashboard-header h2'));
            $('<span class="header-extra tourname" />').appendTo($('.dashboard-header h2'));
            this.$el.html(this.mainTemplate);
            if (this.editTour) {
                this.renderEditPage();
            } else {
                this.renderTours();
            }

            return this;
        }

        mainTemplate() {
            return `
                <div class="tours-container" />
                <div class="iframe-container" />
            `
        }
    }
});
