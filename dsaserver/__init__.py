from pyramid.config import Configurator
from .backend import master_controller
from pyramid.renderers import JSON
import atexit
import datetime


def main(global_config, **settings):
    """ This function returns a Pyramid WSGI application.
    """
    config = Configurator(settings=settings)
    config.include('pyramid_chameleon')
    config.add_static_view('static', 'static', cache_max_age=3600)
    config.add_route('index', '/')
    config.add_route('getFileList', '/file/getFileList')
    config.add_route('searchFiles', '/file/searchFiles')
    config.add_route('downloadFile', '/file/downloadFile')
    config.add_route('uploadFile', '/file/uploadFile')
    config.add_route('deleteFile', 'file/deleteFile')
    config.add_route('renameFile', 'file/renameFile')
    config.add_route('moveFile', 'file/moveFile')
    config.add_route('getSpaceAvailable', 'data/getSpaceAvailable')
    config.add_route('getTotalSpace', 'data/getTotalSpace')
    config.add_route('getFolderHierarchy', 'folder/getFolderHierarchy')
    config.add_route('getFilesInFolder', 'folder/getFilesInFolder')
    config.add_route('getLostFilesInFolder', 'folder/getLostFilesInFolder')
    config.add_route('newFolder', 'folder/newFolder')
    config.add_route('moveFolder', 'folder/moveFolder')
    config.add_route('renameFolder', 'folder/renameFolder')
    config.add_route('deleteFolder', 'folder/deleteFolder')

    config.scan()

    # initialize the backend
    master_controller.instance = master_controller.Master()
    master_controller.instance.listen_for_commands()

    # json serialization
    json_renderer = JSON()

    def datetime_adapter(obj, request):
        return obj.isoformat()

    def class_adapter(obj, request):
        return obj.__dict__

    json_renderer.add_adapter(datetime.datetime, datetime_adapter)
    json_renderer.add_adapter(master_controller.File, class_adapter)
    json_renderer.add_adapter(master_controller.Folder, class_adapter)
    config.add_renderer('json', json_renderer)

    return config.make_wsgi_app()


