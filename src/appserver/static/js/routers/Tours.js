define(
    [
        'underscore',
        'jquery',
        'routers/Base',
        'collections/services/data/ui/Tours',
        'collections/services/AppLocals',
        'app/views/tours/Master'
    ],
    function(
        _,
        $,
        BaseRouter,
        ToursCollection,
        AppLocalsCollection,
        ToursView
    ) {
        return BaseRouter.extend({
            initialize: function() {
                BaseRouter.prototype.initialize.apply(this, arguments);

                this.deferreds = {}
                this.deferreds.tour = $.Deferred();
                this.deferreds.localApps  = $.Deferred();

                this.collection.tours = new ToursCollection();
                this.collection.tours.fetch({
                    data: {
                        app: 'tour_makr',
                        owner: this.model.application.get('owner'),
                        count: -1
                    },
                    success: function(collection, response) {
                        this.initializeAndRenderViews();
                    }.bind(this)
                });

                this.collection.appLocals.fetch({ //fetch all apps in one shot filtering out launcher on success
                    data: {
                        sort_key: 'name',
                        sort_dir: 'asc',
                        app: '-' ,
                        owner: this.model.application.get('owner'),
                        search: 'disabled=0',
                        count: -1
                    },
                    success: function(collection, response) {
                        //This collection includes visible and hidden apps
                        this.collection.appLocalsUnfilteredAll.set(collection.models);

                        //Filter out the invisible apps
                        var onlyVisibleAppsCollection = new AppLocalsCollection();
                        onlyVisibleAppsCollection.set(collection.filter(function(app) {
                            var visibleFlag = app.entry.content.get("visible"), res = true;
                            if(visibleFlag == false || (_.isString(visibleFlag) && visibleFlag.toLowerCase() === "false")){
                                res = false;
                            }

                            return res;
                        }));

                        //Set the appLocals collection to only show visible apps and remove launcher app
                        collection.set(onlyVisibleAppsCollection.models);
                        collection.remove(this.collection.appLocals.get('/servicesNS/nobody/system/apps/local/launcher'));//remove launcher

                        //Set unfiltered so that it only shows visible apps
                        this.collection.appLocalsUnfiltered.set(onlyVisibleAppsCollection.models);
                        this.deferreds.localApps.resolve();
                    }.bind(this),
                    error: function(collection, response) {
                        this.deferreds.localApps.resolve();
                    }.bind(this)
                });
            },

            initializeAndRenderViews: function() {
                $.when(this.deferreds.localApps).then(function() {
                    this.toursView = new ToursView({
                        model: {
                            application: this.model.application
                        },
                        collection: {
                            tours: this.collection.tours,
                            appLocals: this.collection.appLocalsUnfiltered
                        }
                    });
                    this.toursView.render().replaceContentsOf($('.tours-body'));
                }.bind(this));
            }
        });
    }
);
