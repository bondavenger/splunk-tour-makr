define(
    [
        'jquery',
        'underscore',
        'views/Base',
        'models/services/data/ui/Tour',
        'app/views/tours/interactive/Step',
        'splunk.util',
        'app/contrib/dom.outline',
        'jquery.ui.sortable',
    ],
    function(
        $,
        _,
        BaseView,
        TourModel,
        InteractiveStep,
        splunk_util,
        outline
    ) {
    
    return class ImageItem extends BaseView {
        className() {
            return 'interactive-menu';
        }

        initialize(options) {
            super.initialize(options);

            if (!this.model.tour) {
                this.model.tour = new TourModel();
                this.model.tour.entry.content.set('type', 'interactive');
            }

            this.numSteps = this.model.tour.getNumSteps();
            this.curStep = 0;
            this.imgUrl = splunk_util.make_url('/static/img');
        }

        events() {
            return {
                'click .run-tour': 'runTour',
                'click .back': 'closeMenu',
                'click .close': 'closeMenu',
                'click .add-step': e => {
                    e.preventDefault();
                    this.addNewStep();
                }
            }
        }

        reorder() {
            const sortableOptions = {
                tolerance: 'pointer',
                items: '.step',
                scroll: true,
                delay: 5,
                helper: 'clone',
                appendTo: 'body',
                placeholder: 'step-placeholder',
                handle: '.drag-handle',
                opacity: 0.5,
                stop: e => {
                    this.resetModelOrder();
                }
            };

            this.$('.steps').sortable(sortableOptions)
                .sortable('enable')
                .toggleClass('sorting');
        }

        runTour(e) {
            e.preventDefault();
            let qsObj = {};
            const urlData = this.model.tour.getTourURLData();
            const tourApp = this.model.tour.entry.content.get('other-app') || 'search';
            const tourPage = this.model.tour.getTourPage() || 'search';

            if (urlData) {
                const decodedQS = decodeURIComponent(urlData);
                const qs = decodedQS.substring(decodedQS.indexOf('?'), decodedQS.length);
                qsObj = splunk_util.queryStringToProp(qs);
            }

            qsObj.tour = this.model.tour.getName();

            const tourRunPage = splunk_util.make_full_url('app/' + tourApp + '/' + tourPage, qsObj);

            window.open(tourRunPage, '_blank');
        }

        addStep(step) {
            this.curStep++;

            const newStep = this.children['step_' + this.curStep] = new InteractiveStep({
                model: {
                    tour: this.model.tour,
                },
                caption: $(step.intro).text(),
                element: step.element,
                stepNum: this.curStep,
            });

            newStep.render().appendTo(this.$('.steps'));
            this.addListeners(newStep);
        }

        addNewStep() {
            this.numSteps++;

            const step = this.children['step_' + this.numSteps] = new InteractiveStep({
                model: {
                    tour: this.model.tour,
                },
                stepNum: this.numSteps,
            });

            step.render().appendTo(this.$('.steps'));
            this.addListeners(step);
        }

        removeStep(step) {
            for (let i = step.stepNum; i < this.numSteps + 1; i++) {
                if (i === this.numSteps) {
                    this.model.tour.entry.content.unset('stepText' + i);
                    this.model.tour.entry.content.unset('stepElement' + i);
                } else {
                    this._doTheTimeWarp(i);
                }
            }

            // Here we have to clone, destroy, and recreate the tour
            // to preserve the integrity of how attributes are set.
            const newModel = this.model.tour.clone();
            newModel.unset('id');
            newModel.entry.content.set({
                name: newModel.entry.get('name')
            });

            this.model.tour.destroy({ silent: true })
                .done(() => {
                    this.model.tour = newModel;
                    this.model.tour.save({}, {
                        data: {
                            app: 'tour_makr',
                            owner: 'nobody',
                        }
                    }).done(() => {
                        this.numSteps--;
                        this.curStep = 0;
                        this.$('.step').remove();
                        this.renderSteps(true);
                    });
                });
        }

        _doTheTimeWarp(i) {
            const newCaption = this.model.tour.entry.content.get('stepText' + (i + 1));
            const newEl = this.model.tour.entry.content.get('stepElement' + (i + 1));

            this.model.tour.entry.content.set('stepText' + i, newCaption);
            this.model.tour.entry.content.set('stepElement' + i, newEl);
        }

        resetModelOrder() {
            const $elementList = $('.step');
            const stepTotal = $elementList.length;
            const tourContent = this.model.tour.entry.content;
            const elements = $('.step-element .input-label').map((key, el) => {
                return $(el).text();
            });
            const captions = $('.step-caption-input').map((key, el) => {
                return $(el).val();
            });

            for (let i = 0; i < stepTotal; i++) {
                const curOrder = i + 1;

                tourContent.set('stepText' + curOrder, captions[i]);
                tourContent.set('stepElement' + curOrder, elements[i]);
            };

            this.model.tour.save()
                .done(() => {
                    this.removeSteps();
                    this.renderSteps();
                });
        }

        addListeners(step) {
            this.listenTo(step, 'getElement', () => {
                this.startHighlight(step);
            });
            this.listenTo(step, 'removeStep', () => {
                this.removeStep(step);
            });
        }

        removeSteps() {
            this.$('.step').remove();
            this.curStep = 0;
        }

        renderSteps(timeWarped) {
            if (this.numSteps > 0) {
                const steps = this.model.tour.getSteps();
                steps.forEach((step, index) => {
                    if (timeWarped && (index >= this.numSteps)) {
                        if (index === 0) {
                            this.addNewStep();
                        } else {
                            return false;
                        }
                    } else {
                        this.addStep(step);
                    }
                });
            } else {
                this.addNewStep();
            }
        }

        startHighlight(step) {
            const elClick = el => {
                let classList = '';
                for (let i = 0; i < el.classList.length; i++) {
                    classList += '.' + el.classList[i];
                }

                const clickedItem = el.tagName + classList;
                const element = clickedItem.toLowerCase();
                step.setStepElement(element);
            };

            this.myDomOutline = $('iframe')[0].contentWindow.DomOutline({ onClick: elClick });
            this.myDomOutline.start();
            this.showHighlightMessage();
        }

        closeMenu(e) {
            e.preventDefault();
            $('body').removeClass('open-right');
            $('header').removeClass('hidden');
            this.$el.removeClass('open');
            if (this.myDomOutline) {
                this.myDomOutline.stop();
            }
            this.trigger('int-menu-closed');
        }

        showHighlightMessage() {
            const $template = $(this.templateHighlightMessage());
            this.$el.append($template[0]);

            $('.highlight-message').fadeIn(500, () => {
                $('.highlight-message').fadeOut(500, () => {
                    $('.highlight-message').remove();
                });
            });
        }

        render() {
            this.$el.html(_.template(this.templateMain(), {
                tourId: this.model.tour.getName(),
                tourLabel: this.model.tour.getLabel()
            }));
            this.renderSteps();
            this.reorder();
            return this;
        }

        templateMain() {
            return `
                <div class="interactive-tour-container">
                    <h3>Interactive Tour Builder <a href="#" class="close">Close</a></h3>
                    <div class="steps-container">
                        <h4 class="tour-label-head"><%- tourLabel %></h4>
                        <p>tour id: <span class="tour-id"><%- tourId %></span> | <a href="#" class="run-tour">Run tour in new tab</a></p>
                        <div class="steps"></div>
                        <a href="#" class="btn btn-primary add-step">+ Add Step</a>
                        <a href="#" class="back">Back to tour manager >></a>
                    </div>
                </div>
            `;
        }

        templateHighlightMessage() {
            return `
                <div class="highlight-message">Outline Mode Active</div>
            `;
        }
    }
});