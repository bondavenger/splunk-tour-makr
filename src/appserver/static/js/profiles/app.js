var config = {
    baseUrl: $C.MRSPARKLE_ROOT_PATH + "/" + $C.LOCALE + "/static/js",
    //wrapShim: true,
    shim: {
        'bootstrap': {
            deps: ['jquery']
        },
        'select2': {
            deps: ['jquery']
        },
        'bootstrapValidator': {
            deps: ['jquery']
        },
        'jquery.cookie':{
            deps:['jquery']
        }
    },
    paths: {
        'app': '../app/tour_makr/js',
        'app-css': '../app/tour_makr/css',
    },
    enforceDefine: false
};

require.config(config);
