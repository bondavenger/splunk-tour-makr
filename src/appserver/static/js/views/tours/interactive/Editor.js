define(
    [
        'jquery',
        'underscore',
        'module',
        'backbone',
        'views/Base',
        'models/services/data/ui/Tour',
        'app/views/tours/interactive/Step',
        'views/shared/tour/InteractiveTour',
        'uri/route',
        'splunk.util',
        'util/url',
        'app/contrib/dom.outline'
    ],
    function(
        $,
        _,
        module,
        Backbone,
        BaseView,
        TourModel,
        InteractiveStep,
        InteractiveTour,
        route,
        splunk_util,
        url_util,
        outline
    ) {
    
        return BaseView.extend({
            moduleId: module.id,
            className: 'interactive-menu',
            initialize: function(options) {
                BaseView.prototype.initialize.call(this, options);

                if (!this.model.tour) {
                    this.model.tour = new TourModel();
                    this.model.tour.entry.content.set('type', 'interactive');
                }

                this.numSteps = this.model.tour.getNumSteps();
                this.curStep = 0;
                this.imgUrl = splunk_util.make_url('/static/img');
            },

            events: {
                'click .run-tour': function(e) {
                    e.preventDefault();
                    this.runTour();
                },
                'click .back': function(e) {
                    e.preventDefault();
                    this.closeMenu();
                },
                'click .close': function(e) {
                    e.preventDefault();
                    this.closeMenu();
                },
                'click .add-step': function(e) {
                    e.preventDefault();
                    this.addNewStep();
                }
            },

            createTourName: function(label) {
                var name = label.split(' ').join('_').replace(/[;:'",/\\]+/g, '').toLowerCase();
                return name;
            },

            runTour: function() {
                var qsObj = {},
                    urlData = this.model.tour.getTourURLData(),
                    tourApp = this.model.tour.entry.content.get('other-app') || 'search',
                    tourPage = this.model.tour.getTourPage() || 'search',
                    qs, tourRunPage;

                    if (urlData) {
                        var decodedQS = decodeURIComponent(urlData);
                        qs = decodedQS.substring(decodedQS.indexOf('?'), decodedQS.length);
                        qsObj = splunk_util.queryStringToProp(qs);
                    }

                    qsObj.tour = this.model.tour.getName();

                tourRunPage = splunk_util.make_full_url('app/' + tourApp + '/' + tourPage, qsObj);

                window.open(tourRunPage, '_blank');
            },

            addStep: function(step) {
                this.curStep++;
                var newStep = this.children['step_' + this.curStep] = new InteractiveStep({
                    model: {
                        tour: this.model.tour
                    },
                    caption: $(step.intro).text(),
                    element: step.element,
                    stepNum: this.curStep
                });
                this.addListeners(newStep);
                newStep.render().appendTo(this.$('.steps'));
            },

            addNewStep: function() {
                this.numSteps++;

                var step = this.children['step_' + this.numSteps] = new InteractiveStep({
                    model: {
                        tour: this.model.tour
                    },
                    stepNum: this.numSteps
                });
                this.addListeners(step);
                step.render().appendTo(this.$('.steps'));
            },

            removeStep: function(step) {
                for(var i = step.stepNum; i < this.numSteps + 1; i++) {
                    var curStep = this.children['step_' + i];
                    if (i == this.numSteps) {
                        this.model.tour.entry.content.set('stepText' + i, '');
                        this.model.tour.entry.content.set('stepElement' + i, '');
                    } else if (curStep) {
                        this._doTheTimeWarp(i);
                    }
                }

                // Here we have to clone, destroy, and recreate the tour
                // to preserve the integrity of how attributes are set.
                var newModel = this.model.tour.clone();
                newModel.unset('id');
                newModel.entry.content.set({
                    name: newModel.entry.get('name')
                });

                this.model.tour.destroy({
                    success: function(e) {
                        this.model.tour = newModel;
                        this.model.tour.save({}, {
                            data: {
                                app: 'tour_makr',
                                owner: 'nobody'
                            },
                            success: function() {
                                this.numSteps--;
                                this.curStep = 0;
                                this.$('.step').remove();
                                this.renderSteps(true);
                            }.bind(this)
                        });
                    }.bind(this),
                    error: function(err) {
                        console.log('Server Error')
                    }
                });
            },

            _doTheTimeWarp: function(i) {
                var newCaption = this.model.tour.entry.content.get('stepText' + (i + 1)),
                    newEl = this.model.tour.entry.content.get('stepElement' + (i + 1));

                this.model.tour.entry.content.set('stepText' + i, newCaption);
                this.model.tour.entry.content.set('stepElement' + i, newEl);
            },

            addListeners: function(step) {
                this.listenTo(step, 'getElement', function() {
                    this.startHighlight(step);
                });
                this.listenTo(step, 'removeStep', function() {
                    this.removeStep(step);
                });
            },

            renderSteps: function(timeWarped) {
                if (this.numSteps > 0) {
                    var steps = this.model.tour.getSteps();
                    _.each(steps, function(step, index) {
                        if (timeWarped && (index >= this.numSteps)) {
                            if (index === 0) {
                                this.addNewStep();
                            } else {
                                return false;
                            }
                        } else {
                            this.addStep(step);
                        }
                    }, this);
                } else {
                    this.addNewStep();
                }
            },

            startHighlight: function(step) {
                var elClick = function (el) {
                    var classList = '';
                    for (var i = 0; i < el.classList.length; i++) {
                        classList += '.' + el.classList[i];
                    }
                    var clickedItem = el.tagName + classList,
                        element = clickedItem.toLowerCase();

                    console.log('Clicked element:', element);
                    step.setStepElement(element);
                }.bind(this);

                this.myDomOutline = $('iframe')[0].contentWindow.DomOutline({ onClick: elClick });
                this.myDomOutline.start();
                this.showHighlightMessage();
            },

            closeMenu: function() {
                $('body').removeClass('open-right');
                $('header').removeClass('hidden');
                this.$el.removeClass('open');
                if (this.myDomOutline) {
                    this.myDomOutline.stop();
                }
                this.trigger('int-menu-closed');
            },

            showHighlightMessage: function() {
                var $template = $(this.templateHighlightMessage);
                this.$el.append($template[0]);

                $('.highlight-message').fadeIn(500, function() {
                    $('.highlight-message').fadeOut(500, function() {
                        $('.highlight-message').remove();
                    });
                });
            },

            render: function() {
                this.$el.html(this.compiledTemplate({
                    tourId: this.model.tour.getName(),
                    tourLabel: this.model.tour.getLabel()
                }));
                this.renderSteps();

                return this;
            },

            template: '\
                <div class="interactive-tour-container">\
                    <h3>Interactive Tour Builder <a href="#" class="close">Close</a></h3>\
                    <div class="steps-container">\
                        <h4 class="tour-label-head"><%- tourLabel %></h4>\
                        <p>tour id: <span class="tour-id"><%- tourId %></span> | <a href="#" class="run-tour">Run tour in new tab</a></p>\
                        <div class="steps"></div>\
                        <a href="#" class="btn btn-primary add-step">+ Add Step</a>\
                        <a href="#" class="back">Back to tour manager >></a>\
                    </div>\
                </div>\
            ',

            templateHighlightMessage: '\
                <div class="highlight-message">Outline Mode Active</div>\
            '
        });
    }
);