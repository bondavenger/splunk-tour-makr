define([
    'underscore',
    'jquery',
    'routers/Base',
    'collections/services/data/ui/Tours',
    'collections/services/AppLocals',
    'app/views/tours/Master',
], function(
    _,
    $,
    BaseRouter,
    ToursCollection,
    AppLocalsCollection,
    ToursView
) {
    return class ToursRouter extends BaseRouter {
        initialize() {
            super.initialize(...arguments);

            this.deferreds = {
                tour: $.Deferred(),
                localApps: $.Deferred(),
            }

            this.collection.tours = new ToursCollection();
            this.collection.tours.fetch({
                data: {
                    count: -1,
                }
            }).done(() => {
                this.initializeAndRenderViews();
            });

            //fetch all apps in one shot filtering out launcher on success
            this.collection.appLocals.fetch({
                data: {
                    sort_key: 'name',
                    sort_dir: 'asc',
                    app: '-' ,
                    owner: this.model.application.get('owner'),
                    search: 'disabled=0',
                    count: -1,
                },
            }).done(collection => {
                // This collection includes visible and hidden apps
                this.collection.appLocalsUnfilteredAll.set(collection.models);

                // Filter out the invisible apps
                const onlyVisibleAppsCollection = new AppLocalsCollection();
                onlyVisibleAppsCollection.set(this.collection.appLocals.filter(app => {
                    const visibleFlag = app.entry.content.get('visible');
                    let res = true;

                    if (visibleFlag == false || (_.isString(visibleFlag) && visibleFlag.toLowerCase() === 'false')) {
                        res = false;
                    }

                    return res;
                }));

                // Set the appLocals collection to only show visible apps and remove launcher app
                this.collection.appLocals.set(onlyVisibleAppsCollection.models);
                this.collection.appLocals.remove(this.collection.appLocals.get('/servicesNS/nobody/system/apps/local/launcher'));//remove launcher

                // Set unfiltered so that it only shows visible apps
                this.collection.appLocalsUnfiltered.set(onlyVisibleAppsCollection.models);
                this.deferreds.localApps.resolve();
            }).fail(() => {
                this.deferreds.localApps.resolve();
            });
        }

        initializeAndRenderViews() {
            this.deferreds.localApps.done(() => {
                this.toursView = new ToursView({
                    model: {
                        application: this.model.application,
                        serverInfo: this.model.serverInfo,
                    },
                    collection: {
                        tours: this.collection.tours,
                        appLocals: this.collection.appLocalsUnfiltered,
                    }
                });
                this.toursView.render().replaceContentsOf($('.tours-body'));
            });
        }
    }
});