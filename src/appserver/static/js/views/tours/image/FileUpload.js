define([
    'jquery',
    'underscore',
    'views/Base',
    'views/shared/FlashMessages',
    'views/shared/FlashMessagesLegacy',
    'collections/shared/FlashMessages',
    'models/services/data/inputs/Upload',
    'uri/route',
    'splunk.util',
    'contrib/text!app/views/tours/image/FileUpload.html',
    'jquery.fileupload',
], function (
    $,
    _,
    BaseView,
    FlashMessagesView,
    FlashMessagesLegacyView,
    FlashMessagesCollection,
    UploadModel,
    route,
    splunkUtil,
    template
) {
    const MAX_FILE_SIZE = 20 * 1024 * 1024;

    return class FileUploadView extends BaseView {
        initialize(options) {
            super.initialize(options);

            this.model.input = new UploadModel();
            this.filename = this.model.tour.entry.content.get(this.options.imageAttrName) || false;
            this.fileData = this.model.tour.entry.content.get(this.options.imageAttr) || false;
            this.app = this.model.tour.getTourApp();
            this.tourName = this.model.tour.entry.get('name');
            this.imgDest = splunkUtil.make_url(`static/app/${this.app}/img/${this.tourName}`);

            this.collection = {};
            // Use this flashmessage for input model
            this.children.flashMessages = new FlashMessagesView({
                model: {
                    input: this.model.input,
                }
            });

            // Use this flashmessages is for front end errors
            this.collection.flashMessages = new FlashMessagesCollection();
            this.children.flashMessagesLegacy = new FlashMessagesLegacyView({
                collection: this.collection.flashMessages,
            });
        }

        events() {
            return {
                'click .upload-file-button': e => {
                    e.preventDefault();
                    this.$('#inputReference').click();
                }
            }
        }

        render() {
            //remove any old fileReferences
            this.$('#inputReference').remove();

            const helpLinkUpload = route.docHelp(
                this.model.application.get('root'),
                this.model.application.get('locale'),
                'learnmore.adddata.upload'
            );

            const helpLinkBrowser = route.docHelp(
                this.model.application.get('root'),
                this.model.application.get('locale'),
                'learnmore.adddata.browser'
            );

            const template = _.template(this.templateMain(), {
                inputMode: 0,
                helpLinkUpload: helpLinkUpload,
                helpLinkBrowser: helpLinkBrowser,
                maxFileSize:  Math.floor(MAX_FILE_SIZE/1024/1024),
            });
            this.$el.html(template);

            if (this.filename) {
                this.model.input.set('ui.name', this.filename);
                this.updateSelectedFileLabel();
                this.updatePreviewBG(this.filename);
            }

            this.$('.shared-flashmessages')
                .html(this.children.flashMessages.render().el)
                .append(this.children.flashMessagesLegacy.render().el);

            this.renderUpload.call(this);

            return this;
        }

        renderUpload() {
            const $dropzone = this.$('.dropzone');
            const $inputReference = this.$('#inputReference');

            this.updateSelectedFileLabel();

            $inputReference
                .on('change', e => {
                    const file = e.target.files[0];
                    if (file && this.isInputValid(file)) {
                        this.setImage(file);
                    }
                });

            $dropzone
                .on('drop', e => {
                    e.preventDefault();
                    const files = e.originalEvent.dataTransfer.files;
                    const file = files[0];

                    // check file amount
                    if (files.length > 1) {
                        this.collection.flashMessages.reset([{
                            key: 'tooManyFiles',
                            type: 'error',
                            html: _('Too many files. Just one, please and thanks.').t()
                        }]);

                        return false;
                    }

                    if (file && this.isInputValid(file)) {
                        this.setImage(file);
                    }
                })
                .on('dragover', e => {
                    e.preventDefault();
                });
        }

        setImage(file) {
            const newFileName = file.name.split(' ').join('_');

            this.collection.flashMessages.reset();
            this.model.input.set('ui.name', newFileName);
            this.updateSelectedFileLabel();
            this.updatePreview(file, newFileName);
            this.startUploading(file, newFileName);
        }

        updatePreview(file, filename) {
            const reader = new FileReader();

            this.model.tour.entry.content.set(this.options.imageAttrName, filename);
            reader.readAsDataURL(file);
        }

        startUploading(file, filename) {
            if (window.FormData) {
                const formdata = new FormData();
                formdata.append('image', file);
                formdata.append('filename', filename);
                formdata.append('tourName', this.tourName);
                formdata.append('app', this.model.tour.getTourApp());

                $.ajax({
                    url: '/en-US/custom/tour_makr/upload/',
                    type: 'POST',
                    data: formdata,
                    processData: false,
                    contentType: false,
                }).done(() => {
                    this.updatePreviewBG(filename);
                });
            }
        }

        isInputValid(file) {
            // check file size
            if (file.size > MAX_FILE_SIZE) {
                const maxFileSizeMb = Math.floor(MAX_FILE_SIZE/1024/1024);
                const fileSizeMb = file.size/1024/1024;
                const fileSizeMbFixed = fileSizeMb.toFixed(2);

                this.collection.flashMessages.reset([{
                    key: 'fileTooLarge',
                    type: 'error',
                    html: splunkUtil.sprintf(
                        _('File too large. The file selected is %sMb. Maximum file size is %sMb').t(),
                        fileSizeMbFixed,
                        maxFileSizeMb
                    ),
                }]);

                return false;
            }

            // check if it's an image
            if (file.type.indexOf('image') == -1) {
                this.collection.flashMessages.reset([{
                    key: 'notAnImage',
                    type: 'error',
                    html: _('This file is not an image!').t(),
                }]);

                return false;
            }

            return true;
        }

        resetProgressBar() {
            this.finished = false;
            this.updateProgressBar();
            this.$('.progress').hide();
        }

        updateProgressBar(progress = 0, text = '', spin = false) {
            if (progress === 100 && this.finished === false) {
                text = _('Generating data preview...').t();
                spin = true;
            }
            const $bar = this.$('.progress-bar').css('width', progress+'%');
            $bar.find('.sr-only').html(text);

            if (spin === true) {
                $bar.addClass('progress-striped active');
            } else if (spin === false) {
                $bar.removeClass('progress-striped active');
            }
        }

        updateSelectedFileLabel() {
            const filename = this.model.input.get('ui.name');
            if (filename) {
                this.$('.source-label').text(filename);
            } else {
                this.$('.source-label').text(_('No file selected').t());
            }
        }

        updatePreviewBG(imgName) {
            this.$('.preview-tile').text('').css('background', 'url(' + this.imgDest + '/' + imgName + ')');
        }

        templateMain() {
            return template;
        }
    }
});
