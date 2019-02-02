import cherrypy
import os
import imghdr

import splunk.appserver.mrsparkle.controllers as controllers
from splunk.appserver.mrsparkle.lib.decorators import expose_page
from splunk.appserver.mrsparkle.lib.routes import route
from splunk.appserver.mrsparkle.lib import util
from shutil import copyfileobj

class UploadController(controllers.BaseController):

    @route('/', methods=['POST','GET'])
    @expose_page(must_login=True,verify_session=False)
    def upload(self, **kargs):
        if cherrypy.request.method == 'GET':
            return self.render_template('upload_image:upload.html', {})

        image = kargs.get('image', None)
        tour_name = kargs.get('tourName', None)
        filename = kargs.get('filename', None)

        # Make sure the file is an actual image and one that we accept
        # Note that files that are not image files at all will return None
        if imghdr.what(image.file) not in ['gif', 'jpeg', 'bmp', 'png']:
            raise cherrypy.HTTPError(403, 'The type of file is not allowed; must be gif, jpeg, bmp, or png')

        if image is not None :
            try:
                tempPath = util.make_splunkhome_path(['etc', 'apps', app, 'appserver', 'static', 'img', tour_name])
                if not os.path.exists(tempPath):
                    os.makedirs(tempPath)


                if filename.find('/')>-1 or filename.find('\\')>-1 or filename.startswith('.'):
                    return 'Filename cannot contain / or \\ character or start with . filename="%s"' % filename

                newPath = os.path.join(tempPath, filename)
                with open(newPath, 'wb') as newFile:
                    copyfileobj(image.file,newFile)

                return "Successfully stored %s" % filename
            except Exception, e:
                #raise cherrypy.HTTPError(200, 'Failed to upload the file %s. Exception %s' % (filename, str(e)))
                return 'Failed to upload the file %s. Exception %s' % (filename, str(e))
        else:
            raise cherrypy.HTTPError(400, 'No image provided.')